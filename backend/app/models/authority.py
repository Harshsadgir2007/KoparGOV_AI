"""Data models for deterministic Authority Routing and Sequential Approval Chains."""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class AuthorityRole(str, Enum):
    WARD_INCHARGE = "WARD_INCHARGE"
    DEPARTMENT_OFFICER = "DEPARTMENT_OFFICER"
    CHIEF_OFFICER = "CHIEF_OFFICER"
    TAHSILDAR_OR_RELEVANT_AUTHORITY = "TAHSILDAR_OR_RELEVANT_AUTHORITY"


class ApprovalStepStatus(str, Enum):
    LOCKED = "LOCKED"
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class ApprovalStep(BaseModel):
    """A single sequential checkpoint in an approval hierarchy."""
    role: AuthorityRole
    title: str = Field(..., description="Human-readable title e.g. 'Ward In-Charge'")
    status: ApprovalStepStatus = Field(default=ApprovalStepStatus.LOCKED)
    officer_id: Optional[str] = None
    officer_name: Optional[str] = None
    action_timestamp: Optional[str] = None
    notes: Optional[str] = None


class AuthorityRoutingResult(BaseModel):
    """Deterministic routing recommendation for municipal civic issues."""
    required_authority: AuthorityRole = Field(
        ...,
        description="Highest authority required for final authorization"
    )
    authority_title: str = Field(
        ...,
        description="Human-readable authority title"
    )
    approval_chain: List[ApprovalStep] = Field(
        default_factory=list,
        description="Sequential list of approval checkpoints from lower to final authority"
    )
    routing_reasons: List[str] = Field(
        default_factory=list,
        description="Transparent rule-based rationale for the selected authority routing"
    )
    expected_response_sla_hours: int = Field(
        ...,
        description="Demo application SLA response window in hours (12h Critical, 24h High, 48h Medium, 72h Low)"
    )
    is_multi_department: bool = False
    requires_inter_jurisdiction: bool = False
