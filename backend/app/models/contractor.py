"""Data models for Contractor Accountability and Project Inspection Engine."""

from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class InspectionRecommendationStatus(str, Enum):
    NORMAL = "NORMAL"
    WARNING = "WARNING"
    INSPECTION_RECOMMENDED = "INSPECTION_RECOMMENDED"


class InspectionOutcome(str, Enum):
    PASSED = "PASSED"
    FAILED = "FAILED"
    REQUIRES_REWORK = "REQUIRES_REWORK"
    NO_ISSUE_FOUND = "NO_ISSUE_FOUND"


class ContractorAccountabilityEventType(str, Enum):
    MISSED_DEADLINE = "MISSED_DEADLINE"
    FAILED_INSPECTION = "FAILED_INSPECTION"
    REWORK_REQUIRED = "REWORK_REQUIRED"
    EXCESSIVE_COMPLAINTS = "EXCESSIVE_COMPLAINTS"
    SAFETY_FLAG = "SAFETY_FLAG"
    COMPLIANCE_FLAG = "COMPLIANCE_FLAG"
    INSPECTION_RECOMMENDED = "INSPECTION_RECOMMENDED"


class ContractorPerformanceScore(BaseModel):
    """Transparent, deterministic factor breakdown for contractor performance (0-100)."""
    overall_score: float = Field(..., ge=0.0, le=100.0)
    on_time_score: float = Field(..., ge=0.0, le=100.0, description="30% weight: On-time delivery rate")
    inspection_score: float = Field(..., ge=0.0, le=100.0, description="25% weight: Inspection pass rate")
    quality_score: float = Field(..., ge=0.0, le=100.0, description="20% weight: Defect and rework record")
    complaint_score: float = Field(..., ge=0.0, le=100.0, description="15% weight: Post-completion complaint frequency")
    safety_score: float = Field(..., ge=0.0, le=100.0, description="10% weight: Safety and compliance record")
    score_tier: str = Field(..., description="EXCELLENT, GOOD, MONITORING, REVIEW_RECOMMENDED")


class Contractor(BaseModel):
    """Contractor entity executing municipal development and maintenance works."""
    contractor_id: str
    name: str
    categories: List[str]
    wards_served: List[str]
    contact_person: str
    phone: str
    active_projects: int = 0
    completed_projects: int = 0
    on_time_completion_rate: float = 100.0
    inspection_pass_rate: float = 100.0
    rework_count: int = 0
    total_complaint_count: int = 0
    safety_flags_count: int = 0
    performance: ContractorPerformanceScore
    compliance_status: str = "COMPLIANT"


class MunicipalProject(BaseModel):
    """Public works project executed by a contractor on a municipal civic asset."""
    project_id: str
    asset_id: str
    asset_name: str
    contractor_id: str
    contractor_name: str
    category: str
    ward: str
    ward_number: int
    coordinates: List[float] = Field(..., min_length=2, max_length=2)
    start_date: str
    planned_completion_date: str
    actual_completion_date: Optional[str] = None
    contract_value: float
    status: str = "COMPLETED"  # COMPLETED, IN_PROGRESS, INSPECTION_SCHEDULED, REWORK_IN_PROGRESS
    
    # Post-completion telemetry and audit metrics
    post_completion_complaints: int = 0
    high_severity_complaints: int = 0
    safety_complaints: int = 0
    recent_complaints_last_7_days: int = 0
    rework_requests: int = 0
    last_inspection_date: Optional[str] = None
    last_inspection_outcome: Optional[InspectionOutcome] = None
    
    # CIE Inspection Signal Evaluation
    cie_inspection_status: InspectionRecommendationStatus = InspectionRecommendationStatus.NORMAL
    inspection_signals: List[str] = Field(default_factory=list)
    cie_rationale: Optional[str] = None


class ContractorAccountabilityEvent(BaseModel):
    """Recorded accountability event for audit trails and performance history."""
    event_id: str
    contractor_id: str
    project_id: str
    asset_id: str
    timestamp: str
    event_type: ContractorAccountabilityEventType
    severity: str = "MEDIUM"  # LOW, MEDIUM, HIGH, CRITICAL
    evidence_summary: str
    status: str = "ACTIVE"  # ACTIVE, RESOLVED, UNDER_REVIEW
    logged_by: str = "CIE Accountability Engine"


class RecordInspectionRequest(BaseModel):
    """Officer submission recording an on-site project inspection."""
    project_id: str
    officer_id: str
    officer_name: str
    outcome: InspectionOutcome
    inspection_notes: str
    rework_instructions: Optional[str] = None
    evidence_photos: List[str] = Field(default_factory=list)
