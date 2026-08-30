"""Data models for Civic Trust and Verification Engine in KoparGov AI.

Provides deterministic verification signal models, trust evaluation results,
and officer review audit structures.
"""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class VerificationStatus(str, Enum):
    """Civic verification classification status."""
    VERIFIED = "VERIFIED"
    NEEDS_REVIEW = "NEEDS_REVIEW"
    UNVERIFIED = "UNVERIFIED"


class SignalSeverity(str, Enum):
    """Severity and polarity level for verification signals."""
    POSITIVE = "POSITIVE"
    INFO = "INFO"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"


class VerificationSignal(BaseModel):
    """Individual deterministic verification signal evaluated for an issue."""
    name: str = Field(..., description="Signal identifier (e.g. SIMILAR_REPORTS, SUBMISSION_BURST)")
    severity: SignalSeverity = Field(..., description="Signal classification severity")
    score_impact: float = Field(..., description="Impact on trust score (+/- points)")
    details: str = Field(..., description="Human-readable explanation of why this signal triggered")


class VerificationResult(BaseModel):
    """Complete trust evaluation output produced for a civic issue."""
    issue_id: str = Field(..., description="Target civic issue ID")
    trust_score: float = Field(..., ge=0.0, le=100.0, description="Deterministic trust score between 0 and 100")
    verification_status: VerificationStatus = Field(..., description="Computed verification status")
    requires_officer_review: bool = Field(..., description="True if officer manual verification is required")
    signals: List[VerificationSignal] = Field(default_factory=list, description="List of detected verification signals")
    verification_reasons: List[str] = Field(default_factory=list, description="Transparent, human-readable rationale list")
    evaluated_at: Optional[str] = Field(None, description="ISO 8601 evaluation timestamp")
    manual_override: bool = Field(False, description="Whether an officer manually changed the verification status")
    overridden_by: Optional[str] = Field(None, description="Officer ID or name who executed manual override")
    override_notes: Optional[str] = Field(None, description="Notes recorded during officer manual override")
    override_timestamp: Optional[str] = Field(None, description="ISO 8601 timestamp of manual override")


class OfficerVerificationOverrideRequest(BaseModel):
    """Payload for human municipal officer verification override."""
    status: VerificationStatus = Field(..., description="New verification status to assign (VERIFIED, UNVERIFIED, NEEDS_REVIEW)")
    officer_id: Optional[str] = Field(default=None, description="ID or designation of reviewing officer (defaults to authenticated officer)")
    notes: Optional[str] = Field(None, description="Officer justification or field inspection notes")
