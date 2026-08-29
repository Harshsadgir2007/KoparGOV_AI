"""Municipal Officer Decision Workflow Router for KoparGov AI.

Implements human-in-the-loop lifecycle state transitions:
    PENDING / RECOMMENDED → APPROVED (or REJECTED) → ASSIGNED → IN_PROGRESS → RESOLVED

Guarantees:
- Strict state-machine enforcement with clear HTTP 400 rejection on invalid transitions.
- Audit trail recording (officer_id, team assignment, approval/resolution timestamps, notes).
- Full persistence integration via DatabaseService.
"""

from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, status

from app.models.workflow import (
    ApproveWorkflowRequest,
    AssignWorkflowRequest,
    RejectWorkflowRequest,
    ResolveWorkflowRequest,
    StartWorkflowRequest,
    WorkflowRecord,
    WorkflowStatus,
)
from app.models.resilience import OperationType, OperationStatus
from app.services.db_service import DatabaseService
from app.services.resilience_service import get_resilience_service

router = APIRouter(prefix="/api/workflow", tags=["Workflow"])

# Service instance for persistent lifecycle state management
db_service = DatabaseService()
resilience_service = get_resilience_service()


def _get_or_create_workflow(issue_id: str) -> WorkflowRecord:
    """Retrieve existing workflow record or initialize a default PENDING state if issue exists."""
    record = db_service.get_workflow_record(issue_id)
    if record:
        return record

    # Check if the underlying issue exists in the database
    issue = db_service.get_issue(issue_id)
    if issue is not None:
        initial_status = WorkflowStatus.PENDING.value
        if issue.status and issue.status.upper() in [s.value for s in WorkflowStatus]:
            initial_status = issue.status.upper()
        return WorkflowRecord(issue_id=issue_id, status=initial_status)

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Issue '{issue_id}' not found.",
    )


@router.get(
    "/{issue_id}",
    response_model=WorkflowRecord,
    summary="Get workflow lifecycle state for an issue",
    status_code=status.HTTP_200_OK,
)
async def get_workflow_state(issue_id: str) -> WorkflowRecord:
    """Retrieve the current municipal workflow tracking record for a given issue ID."""
    return _get_or_create_workflow(issue_id)


@router.post(
    "/{issue_id}/approve",
    response_model=WorkflowRecord,
    summary="Approve a recommended/pending issue",
    status_code=status.HTTP_200_OK,
)
async def approve_issue(
    issue_id: str,
    request: ApproveWorkflowRequest,
) -> WorkflowRecord:
    """Approve a PENDING or RECOMMENDED civic issue for resolution."""
    workflow = _get_or_create_workflow(issue_id)

    allowed_states = [WorkflowStatus.PENDING.value, WorkflowStatus.RECOMMENDED.value]
    if workflow.status not in allowed_states:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Cannot approve issue '{issue_id}' in '{workflow.status}' status. "
                f"Only PENDING or RECOMMENDED issues can be approved."
            ),
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    workflow.status = WorkflowStatus.APPROVED.value
    workflow.officer_id = request.officer_id
    workflow.approved_at = now_iso
    if request.notes:
        workflow.notes = request.notes

    if not resilience_service.is_blackout_active():
        db_service.save_workflow_record(workflow)
        resilience_service.log_operation(
            operation_type=OperationType.OFFICER_APPROVED,
            entity_id=issue_id,
            payload=workflow.model_dump(),
            status=OperationStatus.COMMITTED,
        )
    else:
        resilience_service.log_operation(
            operation_type=OperationType.OFFICER_APPROVED,
            entity_id=issue_id,
            payload=workflow.model_dump(),
            status=OperationStatus.PENDING_RECOVERY,
        )
    return workflow


@router.post(
    "/{issue_id}/reject",
    response_model=WorkflowRecord,
    summary="Reject a recommended/pending issue",
    status_code=status.HTTP_200_OK,
)
async def reject_issue(
    issue_id: str,
    request: RejectWorkflowRequest,
) -> WorkflowRecord:
    """Reject a PENDING or RECOMMENDED civic issue with justification."""
    workflow = _get_or_create_workflow(issue_id)

    allowed_states = [WorkflowStatus.PENDING.value, WorkflowStatus.RECOMMENDED.value]
    if workflow.status not in allowed_states:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Cannot reject issue '{issue_id}' in '{workflow.status}' status. "
                f"Only PENDING or RECOMMENDED issues can be rejected."
            ),
        )

    workflow.status = WorkflowStatus.REJECTED.value
    workflow.officer_id = request.officer_id
    if request.reason:
        workflow.rejection_reason = request.reason

    if not resilience_service.is_blackout_active():
        db_service.save_workflow_record(workflow)
        resilience_service.log_operation(
            operation_type=OperationType.OFFICER_REJECTED,
            entity_id=issue_id,
            payload=workflow.model_dump(),
            status=OperationStatus.COMMITTED,
        )
    else:
        resilience_service.log_operation(
            operation_type=OperationType.OFFICER_REJECTED,
            entity_id=issue_id,
            payload=workflow.model_dump(),
            status=OperationStatus.PENDING_RECOVERY,
        )
    return workflow


@router.post(
    "/{issue_id}/assign",
    response_model=WorkflowRecord,
    summary="Assign an approved issue to a response team",
    status_code=status.HTTP_200_OK,
)
async def assign_issue(
    issue_id: str,
    request: AssignWorkflowRequest,
) -> WorkflowRecord:
    """Assign an APPROVED civic issue to a designated field team."""
    workflow = _get_or_create_workflow(issue_id)

    allowed_states = [WorkflowStatus.APPROVED.value, WorkflowStatus.ASSIGNED.value]
    if workflow.status not in allowed_states:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Cannot assign issue '{issue_id}' in '{workflow.status}' status. "
                f"Only APPROVED issues can be assigned to a team."
            ),
        )

    workflow.status = WorkflowStatus.ASSIGNED.value
    workflow.assigned_team = request.assigned_team
    if request.officer_id:
        workflow.officer_id = request.officer_id
    if request.notes:
        workflow.notes = request.notes

    if not resilience_service.is_blackout_active():
        db_service.save_workflow_record(workflow)
        resilience_service.log_operation(
            operation_type=OperationType.ASSIGNMENT_CREATED,
            entity_id=issue_id,
            payload=workflow.model_dump(),
            status=OperationStatus.COMMITTED,
        )
    else:
        resilience_service.log_operation(
            operation_type=OperationType.ASSIGNMENT_CREATED,
            entity_id=issue_id,
            payload=workflow.model_dump(),
            status=OperationStatus.PENDING_RECOVERY,
        )
    return workflow


@router.post(
    "/{issue_id}/start",
    response_model=WorkflowRecord,
    summary="Start field work on an assigned issue",
    status_code=status.HTTP_200_OK,
)
async def start_issue_work(
    issue_id: str,
    request: Optional[StartWorkflowRequest] = None,
) -> WorkflowRecord:
    """Transition an ASSIGNED issue to IN_PROGRESS when field response begins."""
    workflow = _get_or_create_workflow(issue_id)

    if workflow.status != WorkflowStatus.ASSIGNED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Cannot start work on issue '{issue_id}' in '{workflow.status}' status. "
                f"Only ASSIGNED issues can transition to IN_PROGRESS."
            ),
        )

    workflow.status = WorkflowStatus.IN_PROGRESS.value
    if request:
        if request.officer_id:
            workflow.officer_id = request.officer_id
        if request.notes:
            workflow.notes = request.notes

    if not resilience_service.is_blackout_active():
        db_service.save_workflow_record(workflow)
        resilience_service.log_operation(
            operation_type=OperationType.WORK_STARTED,
            entity_id=issue_id,
            payload=workflow.model_dump(),
            status=OperationStatus.COMMITTED,
        )
    else:
        resilience_service.log_operation(
            operation_type=OperationType.WORK_STARTED,
            entity_id=issue_id,
            payload=workflow.model_dump(),
            status=OperationStatus.PENDING_RECOVERY,
        )
    return workflow


@router.post(
    "/{issue_id}/resolve",
    response_model=WorkflowRecord,
    summary="Mark an in-progress issue as resolved",
    status_code=status.HTTP_200_OK,
)
async def resolve_issue(
    issue_id: str,
    request: Optional[ResolveWorkflowRequest] = None,
) -> WorkflowRecord:
    """Mark an IN_PROGRESS civic issue as successfully RESOLVED."""
    workflow = _get_or_create_workflow(issue_id)

    if workflow.status != WorkflowStatus.IN_PROGRESS.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Cannot resolve issue '{issue_id}' in '{workflow.status}' status. "
                f"Only IN_PROGRESS issues can be resolved."
            ),
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    workflow.status = WorkflowStatus.RESOLVED.value
    workflow.resolved_at = now_iso
    if request:
        if request.officer_id:
            workflow.officer_id = request.officer_id
        if request.resolution_notes:
            workflow.resolution_notes = request.resolution_notes

    if not resilience_service.is_blackout_active():
        db_service.save_workflow_record(workflow)
        resilience_service.log_operation(
            operation_type=OperationType.RESOLUTION_UPDATED,
            entity_id=issue_id,
            payload=workflow.model_dump(),
            status=OperationStatus.COMMITTED,
        )
    else:
        resilience_service.log_operation(
            operation_type=OperationType.RESOLUTION_UPDATED,
            entity_id=issue_id,
            payload=workflow.model_dump(),
            status=OperationStatus.PENDING_RECOVERY,
        )
    return workflow
