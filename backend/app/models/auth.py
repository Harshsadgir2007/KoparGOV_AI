"""Authentication, Officer Registry, and RBAC Data Models for KoparGov AI.

Guarantees:
- Clear separation between public Citizen profiles and pre-provisioned Officer Registry.
- Zero credential/password storage in Firestore models (handled entirely by Firebase Auth).
- Strict validation for officer active and verification flags.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class OfficerRecord(BaseModel):
    """Pre-provisioned municipal officer in Firestore collection 'officers/{firebase_uid}'."""
    uid: str = Field(..., description="Firebase Authentication UID (matches document ID)")
    name: str = Field(..., description="Officer full official name")
    employeeId: str = Field(..., description="Municipal employee identifier (e.g. KOP-DEMO-001)")
    designation: str = Field(..., description="Official designation (e.g. Ward Officer, Chief Municipal Officer)")
    department: str = Field(..., description="Department name (e.g. Sanitation, Public Works)")
    ward: Optional[str] = Field(default=None, description="Assigned ward name or number")
    email: str = Field(..., description="Government/official email address")
    verified: bool = Field(default=True, description="Whether officer credentials have been administratively verified")
    active: bool = Field(default=True, description="Whether officer account is currently active")
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class UserProfile(BaseModel):
    """User profile stored in Firestore collection 'users/{firebase_uid}'."""
    uid: str = Field(..., description="Firebase Authentication UID")
    name: str = Field(..., description="Citizen or officer display name")
    email: Optional[str] = Field(default=None, description="User email address")
    phone: Optional[str] = Field(default=None, description="Citizen phone number")
    ward: Optional[str] = Field(default=None, description="Citizen resident ward")
    ward_number: Optional[int] = Field(default=5, description="Citizen resident ward number")
    role: str = Field(default="citizen", description="Informational role tag ('citizen' or 'officer')")
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class AuthenticatedUser(BaseModel):
    """Authenticated user context resolved by backend FastAPI dependencies."""
    uid: str = Field(..., description="Firebase UID")
    email: Optional[str] = Field(default=None, description="Verified email from Firebase token")
    role: str = Field(default="citizen", description="Resolved role ('citizen' or 'officer')")
    is_officer: bool = Field(default=False, description="True if UID exists in officers/{uid} and is verified + active")
    officer_profile: Optional[OfficerRecord] = Field(default=None, description="Officer metadata if authorized")
    token: Optional[str] = Field(default=None, description="Raw Bearer token")


class OfficerAuthResponse(BaseModel):
    """Response payload for /api/auth/me and officer verification."""
    authenticated: bool = True
    uid: str
    email: Optional[str] = None
    role: str
    is_officer: bool
    officer: Optional[OfficerRecord] = None
    permissions: List[str] = Field(default_factory=list)
