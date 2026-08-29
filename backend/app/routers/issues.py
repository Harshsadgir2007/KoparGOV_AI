"""Civic Issues API Router for KoparGov AI.

Provides persistent CRUD endpoints for civic complaints and connects citizen ingestion
with the deterministic CIE evaluation pipeline.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.models.civic_issue import CivicIssue
from app.models.decision import CIEPipelineResponse
from app.models.resources import MunicipalResources
from app.services.db_service import DatabaseService
from app.services.pipeline import CIEPipelineService

router = APIRouter(prefix="/api/issues", tags=["Issues"])

db_service = DatabaseService()
pipeline_service = CIEPipelineService()


class CreateIssuePayload(CivicIssue):
    """Payload for submitting a civic issue, with optional resources override."""
    resources: Optional[MunicipalResources] = None


class CreateIssueResponse(BaseModel):
    """Response model returned when a new citizen complaint is ingested."""
    issue: CivicIssue
    cie_result: Optional[CIEPipelineResponse] = None
    status: str = "SUCCESS"


@router.get(
    "",
    response_model=List[CivicIssue],
    summary="List all civic issues",
    status_code=status.HTTP_200_OK,
)
async def list_issues() -> List[CivicIssue]:
    """Retrieve all civic issues stored in the database."""
    return db_service.list_issues()


@router.get(
    "/{issue_id}",
    response_model=CivicIssue,
    summary="Get a single civic issue by ID",
    status_code=status.HTTP_200_OK,
)
async def get_issue(issue_id: str) -> CivicIssue:
    """Retrieve a single civic issue document by ID."""
    issue = db_service.get_issue(issue_id)
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Issue '{issue_id}' not found.",
        )
    return issue


@router.post(
    "",
    response_model=CreateIssueResponse,
    summary="Ingest a new citizen complaint and evaluate with CIE",
    status_code=status.HTTP_201_CREATED,
)
async def create_issue(payload: CreateIssuePayload) -> CreateIssueResponse:
    """Ingest a new civic complaint:
    1. Persist the issue to the database.
    2. Run the deterministic CIE Pipeline (Validation -> MCDA -> Optimization -> Explanations).
    3. Persist the evaluation result.
    4. Return the issue and CIE evaluation.
    """
    try:
        # Extract pure CivicIssue
        issue_data = payload.model_dump(exclude={"resources"})
        issue = CivicIssue(**issue_data)

        # Save issue to database
        db_service.save_issue(issue)

        # Default municipal resources for immediate evaluation if not provided
        res = payload.resources or MunicipalResources(
            budget=340000.0,
            workers=18,
            vehicles=5,
            time_capacity_hours=40.0,
        )

        # Fetch current dataset to evaluate in context
        all_stored_issues = db_service.list_issues()
        if not any(i.id == issue.id for i in all_stored_issues):
            all_stored_issues.append(issue)

        cie_result = pipeline_service.run_pipeline(
            issues=all_stored_issues,
            resources=res,
        )
        db_service.save_cie_result(cie_result)

        return CreateIssueResponse(
            issue=issue,
            cie_result=cie_result,
            status="SUCCESS",
        )
    except Exception as e:
        # If pipeline encounters an error, still return the persisted issue
        return CreateIssueResponse(
            issue=CivicIssue(**payload.model_dump(exclude={"resources"})),
            cie_result=None,
            status=f"SAVED_WITHOUT_PIPELINE: {str(e)}",
        )

