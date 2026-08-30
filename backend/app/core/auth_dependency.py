"""FastAPI Authentication and Authorization Dependencies for KoparGov AI.

Implements:
1. Strict Firebase ID Token Verification using Firebase Admin SDK.
2. Strict Firestore Officer Registry check: `officers/{firebase_uid}`.
3. Real RBAC Hierarchy: WARD_OFFICER, DEPARTMENT_OFFICER, CMO, TAHSILDAR.
4. Test-mode isolation: Mock token authentication is strictly disabled unless
   AUTH_TEST_MODE=true is explicitly set in the environment.

SECURITY RULES:
- Firebase ID tokens are the ONLY authentication mechanism in production/demo.
- X-Officer-Role and X-Officer-Id headers NEVER grant authentication or authorization.
- NEVER trust role information from request body, headers, localStorage, or email domain alone.
- Officer status is granted ONLY if Firestore `officers/{uid}` exists, `verified==True`, and `active==True`.
"""

import os
from typing import Any, Callable, Dict, List, Optional
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.models.auth import AuthenticatedUser, OfficerHierarchyRole, OfficerRecord, normalize_hierarchy_role
from app.services.db_service import DatabaseService

try:
    import firebase_admin
    from firebase_admin import auth as firebase_auth
    FIREBASE_AUTH_AVAILABLE = True
except ImportError:
    FIREBASE_AUTH_AVAILABLE = False

security_bearer = HTTPBearer(auto_error=False)
db_service = DatabaseService()


def is_auth_test_mode() -> bool:
    """Check if test authentication mode is explicitly enabled via environment variable.
    
    Default is strictly False in production and standard runs.
    """
    return os.getenv("AUTH_TEST_MODE", "false").lower() in ("true", "1", "yes")


def verify_firebase_id_token(token: str) -> Dict[str, Any]:
    """Verify Firebase ID Token using Firebase Admin SDK.
    
    In production mode (AUTH_TEST_MODE=false), only cryptographically signed,
    unexpired Firebase ID tokens verified by Firebase Admin are accepted.
    
    In test mode (AUTH_TEST_MODE=true), mock tokens are permitted for automated pytest suites.
    
    Args:
        token: Raw Bearer JWT from Authorization header.
        
    Returns:
        Decoded token payload containing at least 'uid' and optional 'email'.
        
    Raises:
        HTTPException(401): If token is missing, invalid, expired, or unverified.
    """
    if not token or not str(token).strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials. Bearer token required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    clean_token = str(token).strip()

    # 1. Live Production Firebase ID Token Verification
    if not is_auth_test_mode():
        if FIREBASE_AUTH_AVAILABLE and firebase_admin._apps:
            try:
                decoded = firebase_auth.verify_id_token(clean_token)
                return decoded
            except firebase_auth.ExpiredIdTokenError:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Firebase authentication token has expired.",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            except firebase_auth.InvalidIdTokenError:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or malformed Firebase ID token.",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Firebase token verification failed: {str(e)}",
                    headers={"WWW-Authenticate": "Bearer"},
                )
        else:
            # Firebase Admin is not configured and test mode is false -> strictly reject
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Firebase authentication is not configured or token verification failed.",
                headers={"WWW-Authenticate": "Bearer"},
            )

    # 2. Automated Test Mode (Explicitly requires AUTH_TEST_MODE=true)
    if is_auth_test_mode():
        # Reject invalid/malformed test tokens
        if clean_token.startswith("invalid") or "malformed" in clean_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid test authentication token.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if (
            clean_token.startswith("mock-token-")
            or clean_token.startswith("kpg-token-")
            or clean_token.startswith("officer-token-")
            or clean_token.startswith("citizen-token-")
            or clean_token.startswith("test-token-")
            or clean_token.startswith("mock-firebase-")
        ):
            uid = clean_token.split("-", 2)[-1] if len(clean_token.split("-")) >= 3 else clean_token
            return {
                "uid": uid,
                "email": f"{uid.lower()}@kopargaon.gov.in" if "officer" in clean_token.lower() else f"{uid.lower()}@example.com",
                "firebase": {"sign_in_provider": "password"},
            }

        if ":" in clean_token and not clean_token.startswith("http"):
            parts = clean_token.split(":", 1)
            return {"uid": parts[0], "email": parts[1]}

        # Check if user session was registered in db service
        for u in db_service._mock_db.get("users", {}).values():
            if u.get("token") == clean_token:
                return {
                    "uid": u.get("uid") or u.get("id"),
                    "email": u.get("email"),
                }

        # If it's a test UID string in test mode
        if len(clean_token) >= 3:
            return {"uid": clean_token, "email": f"{clean_token}@test.local"}

    # If neither live verification succeeded nor test mode is active -> Reject
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid, expired, or unverified Firebase ID token.",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security_bearer),
) -> Optional[AuthenticatedUser]:
    """Resolve authenticated user context strictly from Firebase Bearer token.
    
    Security Guarantee:
    - X-Officer-Role and X-Officer-Id headers NEVER grant authentication.
    - Officer authorization is determined solely by checking Firestore `officers/{UID}`.
    """
    raw_token = credentials.credentials if credentials else None

    if not raw_token:
        return None

    # Verify Firebase ID token
    decoded = verify_firebase_id_token(raw_token)
    uid = decoded.get("uid")
    email = decoded.get("email")

    if not uid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing valid Firebase UID.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # STRICT OFFICER REGISTRY LOOKUP: officers/{uid}
    officer_doc = db_service.get_officer(uid)

    is_officer = bool(
        officer_doc
        and officer_doc.get("verified") is True
        and officer_doc.get("active") is True
    )

    officer_profile = OfficerRecord(**officer_doc) if is_officer and officer_doc else None
    hierarchy_role = officer_profile.hierarchy_role if officer_profile else None
    role = "officer" if is_officer else "citizen"

    return AuthenticatedUser(
        uid=uid,
        email=email,
        role=role,
        hierarchy_role=hierarchy_role,
        is_officer=is_officer,
        officer_profile=officer_profile,
        token=raw_token,
    )


async def require_authenticated_user(
    current_user: Optional[AuthenticatedUser] = Depends(get_current_user),
) -> AuthenticatedUser:
    """Dependency enforcing that the caller is authenticated via a valid Firebase token."""
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Firebase ID Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_user


async def require_officer(
    current_user: AuthenticatedUser = Depends(require_authenticated_user),
) -> AuthenticatedUser:
    """Dependency enforcing that the authenticated caller is an active, verified municipal officer.
    
    Raises:
        HTTPException(403): If user is not an authorized officer in the Firestore registry.
    """
    if not current_user.is_officer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Forbidden: You are not authorized as a municipal officer. "
                "Officer accounts must be pre-provisioned in the municipal officer registry."
            ),
        )
    return current_user


def require_officer_roles(allowed_hierarchy_roles: List[str]) -> Callable:
    """Factory dependency enforcing specific officer hierarchy roles (RBAC).
    
    Example:
        @router.post("/critical-sanction")
        async def sanction(officer: AuthenticatedUser = Depends(require_officer_roles(["CMO", "TAHSILDAR"]))):
            ...
    """
    normalized_allowed = [normalize_hierarchy_role(r) for r in allowed_hierarchy_roles]

    async def _role_checker(
        current_officer: AuthenticatedUser = Depends(require_officer),
    ) -> AuthenticatedUser:
        current_tier = current_officer.hierarchy_role or (
            current_officer.officer_profile.hierarchy_role if current_officer.officer_profile else None
        )
        if not current_tier or current_tier not in normalized_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Forbidden: Insufficient administrative rank. "
                    f"Required hierarchy level: {allowed_hierarchy_roles}. Current level: {current_tier}."
                ),
            )
        return current_officer

    return _role_checker


async def require_citizen(
    current_user: AuthenticatedUser = Depends(require_authenticated_user),
) -> AuthenticatedUser:
    """Dependency verifying that the caller is an authenticated user."""
    return current_user
