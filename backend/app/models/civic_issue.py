"""Data models for civic issues and validation reporting."""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class PriorityLevel(str, Enum):
    """MCDA Priority Classification Levels."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ValidationStatus(str, Enum):
    """Validation outcome for an ingested civic issue."""
    VALID = "VALID"
    INVALID = "INVALID"
    MISSING_DATA = "MISSING_DATA"


class CivicIssue(BaseModel):
    """Core representation of a municipal civic complaint/issue."""
    id: str = Field(..., description="Unique identifier for the civic issue")
    title: Optional[str] = Field(None, description="Brief summary of the issue")
    category: Optional[str] = Field(None, description="Department/category (e.g. Roads, Water, Sanitation)")
    description: Optional[str] = Field(None, description="Detailed description of the issue")
    location: Optional[str] = Field(None, description="Ward / Area / Geographic identifier")
    
    # 6 MCDA Factor Inputs
    severity: Optional[float] = Field(None, description="Severity rating (0-100)")
    urgency: Optional[float] = Field(None, description="Urgency rating (0-100)")
    population_affected: Optional[float] = Field(None, description="Estimated population impacted (0-100 or raw count)")
    health_safety_impact: Optional[float] = Field(None, description="Health and public safety risk (0-100)")
    location_sensitivity: Optional[float] = Field(None, description="Sensitivity of area e.g. hospitals, schools (0-100)")
    complaint_age: Optional[float] = Field(None, description="Age of complaint in days or normalized 0-100 scale")

    # Resource Requirements for OR-Tools Optimization
    estimated_cost: Optional[float] = Field(None, ge=0.0, description="Estimated budget required to resolve")
    required_workers: Optional[int] = Field(None, ge=0, description="Number of personnel/workers required")
    required_vehicles: Optional[int] = Field(None, ge=0, description="Number of municipal vehicles required")
    required_time_hours: Optional[float] = Field(None, ge=0.0, description="Estimated hours needed for resolution")

    # Geolocation, Status & Lifecycle Timestamps (Firestore & Database Integration)
    latitude: Optional[float] = Field(None, description="Geographic latitude coordinate")
    longitude: Optional[float] = Field(None, description="Geographic longitude coordinate")
    status: Optional[str] = Field("SUBMITTED", description="Current lifecycle status (SUBMITTED, EVALUATED, etc.)")
    created_at: Optional[str] = Field(None, description="ISO 8601 creation timestamp")
    updated_at: Optional[str] = Field(None, description="ISO 8601 last update timestamp")


class IssueValidationReport(BaseModel):
    """Data validation report highlighting missing or invalid civic fields."""
    issue_id: str
    is_valid: bool
    status: ValidationStatus
    missing_fields: List[str] = Field(default_factory=list)
    validation_errors: List[str] = Field(default_factory=list)
