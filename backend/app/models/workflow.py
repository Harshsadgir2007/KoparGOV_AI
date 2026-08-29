"""Data models for municipal officer workflow and issue resolution tracking."""

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class WorkflowStatus(str, Enum):
    """Enumeration of valid workflow lifecycle states."""
    PENDING = "PENDING"
    RECOMMENDED = "RECOMMENDED"
    DEFERRED = "DEFERRED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"


class WorkflowRecord(BaseModel):
    """Lifecycle workflow tracking state for an individual civic issue."""
    issue_id: str = Field(..., description="Target civic issue ID")
    status: str = Field(
        WorkflowStatus.PENDING.value,
        description="Workflow state: PENDING, RECOMMENDED, DEFERRED, APPROVED, REJECTED, ASSIGNED, IN_PROGRESS, RESOLVED"
    )
    officer_id: Optional[str] = Field(None, description="Assigned municipal officer ID")
    assigned_team: Optional[str] = Field(None, description="Assigned field response team or department unit")
    rejection_reason: Optional[str] = Field(None, description="Reason for issue rejection")
    resolution_notes: Optional[str] = Field(None, description="Notes recorded upon issue resolution")
    notes: Optional[str] = Field(None, description="General officer remarks / audit notes")
    approved_at: Optional[str] = Field(None, description="ISO 8601 approval timestamp")
    resolved_at: Optional[str] = Field(None, description="ISO 8601 resolution timestamp")
    updated_at: Optional[str] = Field(None, description="ISO 8601 last update timestamp")


class ApproveWorkflowRequest(BaseModel):
    """Request payload for approving a civic issue."""
    officer_id: Optional[str] = Field(default="Municipal Officer", description="ID of the municipal officer granting approval")
    notes: Optional[str] = Field(None, description="Optional approval notes or directives")


class RejectWorkflowRequest(BaseModel):
    """Request payload for rejecting a civic issue."""
    officer_id: str = Field(..., description="ID of the municipal officer rejecting the issue")
    reason: Optional[str] = Field(None, description="Explanation or justification for rejection")


class AssignWorkflowRequest(BaseModel):
    """Request payload for assigning an approved issue to a response team."""
    assigned_team: str = Field(..., description="Designated field response team or department unit")
    officer_id: Optional[str] = Field(None, description="Officer ID making or updating assignment")
    notes: Optional[str] = Field(None, description="Special instructions for the assigned team")


class StartWorkflowRequest(BaseModel):
    """Request payload for commencing work on an assigned issue."""
    officer_id: Optional[str] = Field(None, description="Officer or team lead initiating field work")
    notes: Optional[str] = Field(None, description="Field startup notes")


class ResolveWorkflowRequest(BaseModel):
    """Request payload for marking an in-progress issue as resolved."""
    officer_id: Optional[str] = Field(None, description="Officer verifying work completion")
    resolution_notes: Optional[str] = Field(None, description="Summary of resolution and repairs performed")
