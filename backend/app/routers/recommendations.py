"""Municipal Recommendations and Decision Approvals API Router."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.auth_dependency import require_officer
from app.models.auth import AuthenticatedUser
from app.models.decision import DecisionExplanation
from app.models.workflow import ApproveWorkflowRequest, WorkflowRecord
from app.routers.workflow import approve_issue
from app.services.db_service import DatabaseService
from app.services.pipeline import CIEPipelineService
from app.models.resources import MunicipalResources

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])

db_service = DatabaseService()
pipeline_service = CIEPipelineService()

DEFAULT_RESOURCES = MunicipalResources(
    budget=340000.0,
    workers=18,
    vehicles=5,
    time_capacity_hours=40.0,
)


class RecommendationItem(BaseModel):
    """Recommendation item for municipal review."""
    issue_id: str
    priority_score: float
    priority_level: str
    selected: bool
    status: str
    explanation: Optional[DecisionExplanation] = None
    recommended_action: str
    estimated_cost: float
    required_workers: int
    required_vehicles: int


@router.get(
    "",
    response_model=List[RecommendationItem],
    summary="List all municipal CIE recommendations",
    status_code=status.HTTP_200_OK,
)
async def list_recommendations() -> List[RecommendationItem]:
    """Retrieve prioritized CIE recommendations for all active civic complaints."""
    issues = db_service.list_issues()
    if not issues:
        return []

    cie_result = pipeline_service.run_pipeline(issues=issues, resources=DEFAULT_RESOURCES)

    expl_map = {e.issue_id: e for e in cie_result.explanations}
    selected_set = set(cie_result.allocation_plan.selected_issue_ids if cie_result.allocation_plan else [])
    rank_map = {r.issue_id: r for r in cie_result.mcda_rankings}

    items: List[RecommendationItem] = []
    for issue in issues:
        rank = rank_map.get(issue.id)
        score = rank.composite_score if rank else (issue.severity or 50.0)
        level = rank.priority_level if rank else "MEDIUM"
        is_selected = issue.id in selected_set

        action = (
            f"Deploy {issue.required_workers or 2} workers and {issue.required_vehicles or 1} vehicle for rapid resolution."
            if is_selected
            else "Defer to secondary batch or schedule next resource cycle."
        )

        items.append(
            RecommendationItem(
                issue_id=issue.id,
                priority_score=score,
                priority_level=level,
                selected=is_selected,
                status=issue.status or "REPORTED",
                explanation=expl_map.get(issue.id),
                recommended_action=action,
                estimated_cost=issue.estimated_cost or 0.0,
                required_workers=issue.required_workers or 1,
                required_vehicles=issue.required_vehicles or 0,
            )
        )

    items.sort(key=lambda x: x.priority_score, reverse=True)
    return items


@router.get(
    "/{issue_id}",
    response_model=RecommendationItem,
    summary="Get single CIE recommendation by issue ID",
    status_code=status.HTTP_200_OK,
)
async def get_recommendation(issue_id: str) -> RecommendationItem:
    """Retrieve CIE recommendation and explanation for a specific issue."""
    issue = db_service.get_issue(issue_id)
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Issue '{issue_id}' not found.",
        )

    issues = db_service.list_issues()
    if not any(i.id == issue.id for i in issues):
        issues.append(issue)

    cie_result = pipeline_service.run_pipeline(issues=issues, resources=DEFAULT_RESOURCES)
    expl = next((e for e in cie_result.explanations if e.issue_id == issue_id), None)
    rank = next((r for r in cie_result.mcda_rankings if r.issue_id == issue_id), None)
    is_selected = (issue_id in cie_result.allocation_plan.selected_issue_ids) if cie_result.allocation_plan else False

    return RecommendationItem(
        issue_id=issue.id,
        priority_score=rank.composite_score if rank else 50.0,
        priority_level=rank.priority_level if rank else "MEDIUM",
        selected=is_selected,
        status=issue.status or "REPORTED",
        explanation=expl,
        recommended_action=f"Deploy {issue.required_workers or 2} workers to {issue.location or issue.ward or 'Ward'}.",
        estimated_cost=issue.estimated_cost or 0.0,
        required_workers=issue.required_workers or 1,
        required_vehicles=issue.required_vehicles or 0,
    )


@router.post(
    "/{issue_id}/approve",
    response_model=WorkflowRecord,
    summary="Approve recommendation for an issue",
    status_code=status.HTTP_200_OK,
)
async def approve_recommendation_endpoint(
    issue_id: str,
    payload: Optional[ApproveWorkflowRequest] = None,
    current_officer: AuthenticatedUser = Depends(require_officer),
) -> WorkflowRecord:
    """Officer human-in-the-loop approval endpoint."""
    officer_name = (
        current_officer.officer_profile.name
        if current_officer.officer_profile
        else current_officer.uid
    )
    req = payload or ApproveWorkflowRequest(officer_id=officer_name)
    if not req.officer_id:
        req.officer_id = officer_name
    return await approve_issue(
        issue_id=issue_id,
        request=req,
        current_officer=current_officer,
    )
