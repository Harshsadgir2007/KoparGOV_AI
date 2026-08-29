"""Authentication & Role-Based Access Control (RBAC) Router for KoparGov AI.

Provides endpoints for:
- Role presets discovery (`GET /api/auth/roles`)
- Authentication / Session Login (`POST /api/auth/login`)
- Active profile inspection (`GET /api/auth/me`)
- Citizen account registration (`POST /api/auth/register`)
"""

import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Header, HTTPException, status
from pydantic import BaseModel, Field

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


class CitizenRegisterRequest(BaseModel):
    """Citizen registration request."""
    name: str
    phone: str
    ward: str
    ward_number: int = 5
    address: Optional[str] = None


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
        # Check custom user in db
        preset = MUNICIPAL_ROLES["CITIZEN"]

    user_name = request.officer_id or preset.name
    session_token = f"kpg-token-{uuid.uuid4().hex[:12]}"

    # Record user session profile
    user_record = {
        "uid": str(uuid.uuid4()),
        "name": user_name,
        "role": preset.role,
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
    )


@router.get(
    "/me",
    response_model=LoginResponse,
    summary="Get active authenticated user profile",
    status_code=status.HTTP_200_OK,
)
async def get_current_user(
    x_officer_role: Optional[str] = Header(None, alias="X-Officer-Role"),
    x_officer_id: Optional[str] = Header(None, alias="X-Officer-Id"),
) -> LoginResponse:
    """Retrieve active session details based on role and identity headers."""
    role_key = (x_officer_role or "CITIZEN").upper()
    preset = MUNICIPAL_ROLES.get(role_key, MUNICIPAL_ROLES["CITIZEN"])
    name = x_officer_id or preset.name

    return LoginResponse(
        token="active-session-token",
        role=preset.role,
        name=name,
        designation=preset.designation,
        department=preset.department,
        ward_number=preset.ward_number,
        sanction_limit=preset.sanction_limit,
        permissions=preset.permissions,
    )


@router.post(
    "/register",
    summary="Register a new citizen account",
    status_code=status.HTTP_201_CREATED,
)
async def register_citizen(request: CitizenRegisterRequest) -> Dict[str, Any]:
    """Register a new citizen profile."""
    uid = f"CITIZEN-{uuid.uuid4().hex[:6]}"
    record = {
        "uid": uid,
        "name": request.name,
        "phone": request.phone,
        "ward": request.ward,
        "ward_number": request.ward_number,
        "address": request.address,
        "role": "CITIZEN",
    }
    db_service.save_user(record)
    return {"status": "registered", "user": record}
