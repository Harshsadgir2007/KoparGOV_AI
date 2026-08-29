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
from app.models.resilience import OperationType, OperationStatus
from app.services.db_service import DatabaseService
from app.services.pipeline import CIEPipelineService
from app.services.resilience_service import get_resilience_service

router = APIRouter(prefix="/api/issues", tags=["Issues"])

db_service = DatabaseService()
pipeline_service = CIEPipelineService()
resilience_service = get_resilience_service()


class CreateIssuePayload(CivicIssue):
    """Payload for submitting a civic issue, with optional resources override."""
    resources: Optional[MunicipalResources] = None


class CreateIssueResponse(BaseModel):
    """Response model returned when a new citizen complaint is ingested."""
    issue: CivicIssue
    cie_result: Optional[CIEPipelineResponse] = None
    status: str = "SUCCESS"
    operation_id: Optional[str] = None
    message: Optional[str] = None


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
    - If in DEGRADED Blackout mode:
      Safely log to the resilience operation journal as PENDING_RECOVERY without performing unsafe primary writes.
    - If in NORMAL mode:
      1. Persist the issue to the database.
      2. Run the deterministic CIE Pipeline (Validation -> MCDA -> Optimization -> Explanations).
      3. Persist the evaluation result.
      4. Log operations in the resilient journal.
      5. Return the issue and CIE evaluation.
    """
    try:
        # Extract pure CivicIssue
        issue_data = payload.model_dump(exclude={"resources"})
        issue = CivicIssue(**issue_data)

        # 1. DEGRADED MODE PROTECTION:
        # If primary data store is failed/degraded, do NOT perform unsafe writes.
        # Safely buffer in the append-only resilience operation journal.
        if resilience_service.is_blackout_active():
            issue.status = "PENDING_RECOVERY"
            op = resilience_service.log_operation(
                operation_type=OperationType.COMPLAINT_CREATED,
                entity_id=issue.id,
                payload=issue.model_dump(),
                status=OperationStatus.PENDING_RECOVERY,
            )
            return CreateIssueResponse(
                issue=issue,
                cie_result=None,
                status="PENDING_RECOVERY",
                operation_id=op.operation_id,
                message="Municipal primary store in DEGRADED resilience mode. Complaint safely queued in recovery operation journal.",
            )

        # 2. NORMAL MODE: Save to primary database & evaluate
        db_service.save_issue(issue)

        # Log in resilient operation journal
        op = resilience_service.log_operation(
            operation_type=OperationType.COMPLAINT_CREATED,
            entity_id=issue.id,
            payload=issue.model_dump(),
            status=OperationStatus.COMMITTED,
        )

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

        # Log CIE evaluation in resilient journal
        resilience_service.log_operation(
            operation_type=OperationType.CIE_PRIORITY_CALCULATED,
            entity_id=issue.id,
            payload=cie_result.model_dump(),
            status=OperationStatus.COMMITTED,
        )

        return CreateIssueResponse(
            issue=issue,
            cie_result=cie_result,
            status="SUCCESS",
            operation_id=op.operation_id,
            message="Complaint successfully persisted and evaluated by CIE.",
        )
    except Exception as e:
        # If pipeline encounters an error, still return the persisted issue
        return CreateIssueResponse(
            issue=CivicIssue(**payload.model_dump(exclude={"resources"})),
            cie_result=None,
            status=f"SAVED_WITHOUT_PIPELINE: {str(e)}",
        )

