"""Authentication & Role-Based Access Control (RBAC) Router for KoparGov AI.

Implements:
- Officer Verification & Profile Resolution (`GET /api/auth/me`)
- Verified Officer Check (`POST /api/auth/verify-officer`)
- Role Presets Discovery (`GET /api/auth/roles`)
- Citizen Registration & Login
- Pre-provisioned Demo Officer Registry Seeding
"""

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field

from app.core.auth_dependency import get_current_user, require_authenticated_user, require_officer
from app.models.auth import AuthenticatedUser, OfficerAuthResponse, OfficerRecord, UserProfile
from app.services.db_service import DatabaseService

router = APIRouter(prefix="/api/auth", tags=["Authentication & RBAC"])
db_service = DatabaseService()


# ------------------------------------------------------------------------------
# Models
# ------------------------------------------------------------------------------

class RolePreset(BaseModel):
    """Pre-configured municipal officer or citizen role."""
    role: str
    title: str
    name: str
    designation: str
    department: str
    ward_number: Optional[int] = None
    sanction_limit: str
    email: str
    permissions: List[str]


class LoginRequest(BaseModel):
    """Login request payload."""
    role: Optional[str] = Field(default="CITIZEN", description="Role identifier")
    officer_id: Optional[str] = Field(default=None, description="Officer ID or full name")
    phone: Optional[str] = Field(default=None, description="Citizen phone number")
    email: Optional[str] = Field(default=None, description="Officer/Citizen email")
    password: Optional[str] = Field(default=None, description="Citizen/Officer password (handled by Firebase in production)")


class LoginResponse(BaseModel):
    """Login session response."""
    token: str
    role: str
    name: str
    designation: str
    department: str
    ward_number: Optional[int] = None
    sanction_limit: str
    permissions: List[str]
    is_officer: bool = False


class CitizenRegisterRequest(BaseModel):
    """Citizen registration request."""
    name: str
    phone: str
    ward: str
    ward_number: int = 5
    email: Optional[str] = None
    address: Optional[str] = None


class PreProvisionOfficerRequest(BaseModel):
    """Admin / Setup request to pre-provision an officer in Firestore officers/{uid}."""
    uid: str = Field(..., description="Firebase Authentication UID")
    name: str = Field(..., description="Officer name")
    employeeId: str = Field(..., description="Employee ID e.g. KOP-DEMO-001")
    designation: str = Field(..., description="Designation e.g. Ward Officer")
    department: str = Field(..., description="Department e.g. Sanitation")
    ward: Optional[str] = "Ward 5"
    email: str = Field(..., description="Officer email")
    verified: bool = True
    active: bool = True


# Pre-configured role definitions for Kopargaon Municipal Administration
MUNICIPAL_ROLES: Dict[str, RolePreset] = {
    "WARD_INCHARGE": RolePreset(
        role="WARD_INCHARGE",
        title="Ward In-Charge",
        name="Shri. Sunil Jadhav",
        designation="Junior Engineer & Ward 5 Field In-Charge",
        department="Ward 5 Field Administration",
        ward_number=5,
        sanction_limit="Up to ₹10,000 / Routine containment",
        email="sunil.jadhav@kopargaon.gov.in",
        permissions=["view_issues", "verify_site", "initial_recommendation", "view_map"],
    ),
    "DEPARTMENT_OFFICER": RolePreset(
        role="DEPARTMENT_OFFICER",
        title="Department Head",
        name="Smt. Sunita More",
        designation="Sanitation & Public Health Superintendent",
        department="Sanitation & Solid Waste Management Dept.",
        sanction_limit="Up to ₹25,000 / Departmental budget",
        email="sunita.more@kopargaon.gov.in",
        permissions=["view_issues", "technical_sanction", "assign_team", "manage_contractors", "view_map"],
    ),
    "CHIEF_OFFICER": RolePreset(
        role="CHIEF_OFFICER",
        title="Chief Municipal Officer (CMO)",
        name="Shri. Rajesh Kulkarni",
        designation="Chief Municipal Officer (CMO)",
        department="Kopargaon Municipal Council (KMC)",
        sanction_limit="Full Municipal Discretionary Ceiling (Unlimited)",
        email="rajesh.kulkarni@kopargaon.gov.in",
        permissions=["view_issues", "approve_workflow", "override_priority", "allocate_resources", "view_map", "view_analytics"],
    ),
    "TAHSILDAR_OR_RELEVANT_AUTHORITY": RolePreset(
        role="TAHSILDAR_OR_RELEVANT_AUTHORITY",
        title="Tahsildar & Taluka Magistrate",
        name="Shri. Deepak Shinde",
        designation="Tahsildar & Sub-Divisional Magistrate",
        department="Sub-Divisional Revenue & Taluka Administration",
        sanction_limit="Taluka / Inter-departmental Discretionary Relief",
        email="deepak.shinde@maharashtra.gov.in",
        permissions=["view_issues", "taluka_sanction", "inter_dept_coordination", "view_map", "view_analytics"],
    ),
    "CITIZEN": RolePreset(
        role="CITIZEN",
        title="Citizen",
        name="Rahul Patil",
        designation="Resident (Kopargaon Ward 5)",
        department="Civic Public",
        ward_number=5,
        sanction_limit="None",
        email="rahul.patil@example.com",
        permissions=["submit_issue", "view_public_issues", "track_complaint", "view_map"],
    ),
}


def _seed_demo_officers():
    """Seed demo officer registry in DB for hackathon evaluation."""
    demo_officers = [
        {
            "uid": "DEMO-OFFICER-UID",
            "name": "Demo Municipal Officer",
            "employeeId": "KOP-DEMO-001",
            "designation": "Chief Municipal Officer (CMO)",
            "department": "Kopargaon Municipal Administration",
            "ward": "Ward 5",
            "email": "officer@kopargaon.gov.in",
            "verified": True,
            "active": True,
            "createdAt": datetime.now(timezone.utc).isoformat(),
        },
        {
            "uid": "OFFICER-SUNIL-01",
            "name": "Shri. Sunil Jadhav",
            "employeeId": "KOP-MUN-002",
            "designation": "Junior Engineer & Ward 5 Field In-Charge",
            "department": "Ward 5 Field Administration",
            "ward": "Ward 5",
            "email": "sunil.jadhav@kopargaon.gov.in",
            "verified": True,
            "active": True,
            "createdAt": datetime.now(timezone.utc).isoformat(),
        },
        {
            "uid": "OFFICER-RAJESH-CMO",
            "name": "Shri. Rajesh Kulkarni",
            "employeeId": "KOP-MUN-001",
            "designation": "Chief Municipal Officer (CMO)",
            "department": "Kopargaon Municipal Council (KMC)",
            "ward": "City-Wide",
            "email": "rajesh.kulkarni@kopargaon.gov.in",
            "verified": True,
            "active": True,
            "createdAt": datetime.now(timezone.utc).isoformat(),
        },
    ]

    for off in demo_officers:
        if not db_service.get_officer(off["uid"]):
            db_service.save_officer(off)

_seed_demo_officers()


# ------------------------------------------------------------------------------
# Endpoints
# ------------------------------------------------------------------------------

@router.get(
    "/roles",
    response_model=List[RolePreset],
    summary="List all available municipal roles and presets",
    status_code=status.HTTP_200_OK,
)
async def list_roles() -> List[RolePreset]:
    """Retrieve list of pre-configured municipal officer and citizen roles."""
    return list(MUNICIPAL_ROLES.values())


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Authenticate and initialize role session",
    status_code=status.HTTP_200_OK,
)
async def login(request: LoginRequest) -> LoginResponse:
    """Authenticate user and return profile, permission set, and token."""
    role_key = (request.role or "CITIZEN").upper()
    preset = MUNICIPAL_ROLES.get(role_key)

    if not preset:
        preset = MUNICIPAL_ROLES["CITIZEN"]

    user_name = request.officer_id or preset.name
    session_token = f"kpg-token-{uuid.uuid4().hex[:12]}"

    # Determine officer status strictly by registry check
    officer_doc = None
    for o in db_service.list_officers():
        if (
            o.get("name") == user_name
            or o.get("email") == request.email
            or o.get("employeeId") == request.officer_id
            or o.get("uid") == request.officer_id
        ):
            officer_doc = o
            break

    is_officer = bool(
        officer_doc
        and officer_doc.get("verified") is True
        and officer_doc.get("active") is True
    )

    resolved_role = "officer" if is_officer else "citizen"

    # Record user session profile
    user_record = {
        "uid": officer_doc.get("uid") if officer_doc else f"USR-{uuid.uuid4().hex[:6]}",
        "name": user_name,
        "email": request.email or preset.email,
        "role": resolved_role,
        "designation": preset.designation,
        "department": preset.department,
        "ward_number": preset.ward_number,
        "token": session_token,
    }
    db_service.save_user(user_record)

    return LoginResponse(
        token=session_token,
        role=preset.role,
        name=user_name,
        designation=preset.designation,
        department=preset.department,
        ward_number=preset.ward_number,
        sanction_limit=preset.sanction_limit,
        permissions=preset.permissions,
        is_officer=is_officer,
    )


@router.get(
    "/me",
    response_model=OfficerAuthResponse,
    summary="Get active authenticated user profile and verify officer status",
    status_code=status.HTTP_200_OK,
)
async def get_current_user_profile(
    user: Optional[AuthenticatedUser] = Depends(get_current_user),
) -> OfficerAuthResponse:
    """Retrieve active session details, verifying token and checking Firestore officers/{uid}."""
    if not user:
        # Fallback anonymous guest citizen
        return OfficerAuthResponse(
            authenticated=False,
            uid="anonymous-guest",
            email=None,
            role="citizen",
            is_officer=False,
            officer=None,
            permissions=["submit_issue", "view_map"],
        )

    permissions = (
        ["view_issues", "approve_workflow", "allocate_resources", "manage_contractors", "view_analytics", "view_map"]
        if user.is_officer
        else ["submit_issue", "view_public_issues", "track_complaint", "view_map"]
    )

    return OfficerAuthResponse(
        authenticated=True,
        uid=user.uid,
        email=user.email,
        role=user.role,
        is_officer=user.is_officer,
        officer=user.officer_profile,
        permissions=permissions,
    )


@router.post(
    "/verify-officer",
    response_model=OfficerAuthResponse,
    summary="Strictly verify whether authenticated caller is an authorized officer",
    status_code=status.HTTP_200_OK,
)
async def verify_officer_endpoint(
    officer: AuthenticatedUser = Depends(require_officer),
) -> OfficerAuthResponse:
    """Enforce that caller has a valid token AND exists in officers/{uid} with verified=true, active=true.
    
    Returns HTTP 403 Forbidden if not authorized.
    """
    return OfficerAuthResponse(
        authenticated=True,
        uid=officer.uid,
        email=officer.email,
        role="officer",
        is_officer=True,
        officer=officer.officer_profile,
        permissions=["view_issues", "approve_workflow", "allocate_resources", "manage_contractors", "view_analytics", "view_map"],
    )


@router.post(
    "/register",
    summary="Register a new citizen account",
    status_code=status.HTTP_201_CREATED,
)
async def register_citizen(request: CitizenRegisterRequest) -> Dict[str, Any]:
    """Register a new citizen profile in Firestore users collection."""
    uid = f"CITIZEN-{uuid.uuid4().hex[:6]}"
    record = {
        "uid": uid,
        "name": request.name,
        "phone": request.phone,
        "email": request.email,
        "ward": request.ward,
        "ward_number": request.ward_number,
        "address": request.address,
        "role": "citizen",
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    db_service.save_user(record)
    return {"status": "registered", "user": record}


@router.post(
    "/officers/pre-provision",
    response_model=OfficerRecord,
    summary="Pre-provision a verified municipal officer in Firestore (Admin only)",
    status_code=status.HTTP_201_CREATED,
)
async def pre_provision_officer(
    request: PreProvisionOfficerRequest,
    current_officer: AuthenticatedUser = Depends(require_officer),
) -> OfficerRecord:
    """Pre-provision an officer record mapped by Firebase UID in officers/{uid}."""
    record_dict = request.model_dump()
    record_dict["createdAt"] = datetime.now(timezone.utc).isoformat()
    db_service.save_officer(record_dict)
    return OfficerRecord(**record_dict)


@router.get(
    "/officers",
    response_model=List[OfficerRecord],
    summary="List all pre-provisioned municipal officers (Officer only)",
    status_code=status.HTTP_200_OK,
)
async def list_officers_endpoint(
    current_officer: AuthenticatedUser = Depends(require_officer),
) -> List[OfficerRecord]:
    """List all registered officers in the municipal registry."""
    raw_list = db_service.list_officers()
    return [OfficerRecord(**o) for o in raw_list]
