"""Civic Trust & Verification Router for KoparGov AI.

Provides endpoints to query deterministic trust scores, inspect verification signals,
and record authorized municipal officer verification overrides.
"""

from typing import List, Optional
from fastapi import APIRouter, Header, HTTPException, status

from app.models.verification import (
    OfficerVerificationOverrideRequest,
    VerificationResult,
)
from app.services.verification_service import get_verification_service

router = APIRouter(prefix="/api/verification", tags=["Civic Trust & Verification"])
verification_service = get_verification_service()


@router.get(
    "",
    response_model=List[VerificationResult],
    summary="List all civic verification results",
    status_code=status.HTTP_200_OK,
)
async def list_verification_results() -> List[VerificationResult]:
    """Retrieve all computed verification evaluations stored in the registry."""
    return verification_service.list_verification_results()


@router.get(
    "/{issue_id}",
    response_model=VerificationResult,
    summary="Get civic trust and verification result for an issue",
    status_code=status.HTTP_200_OK,
)
async def get_verification_result(issue_id: str) -> VerificationResult:
    """Retrieve the trust score, signals, and verification status for a specific civic complaint."""
    return verification_service.get_verification_result(issue_id)


@router.post(
    "/{issue_id}/evaluate",
    response_model=VerificationResult,
    summary="Re-evaluate civic verification signals against latest database corpus",
    status_code=status.HTTP_200_OK,
)
async def reevaluate_verification(issue_id: str) -> VerificationResult:
    """Trigger re-evaluation of verification signals and recalculate trust score."""
    from app.services.db_service import DatabaseService
    db = DatabaseService()
    issue = db.get_issue(issue_id)
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Issue '{issue_id}' not found.",
        )
    return verification_service.verify_issue(issue, persist=True)


@router.post(
    "/{issue_id}/override",
    response_model=VerificationResult,
    summary="Officer manual override of verification status",
    status_code=status.HTTP_200_OK,
)
async def override_verification_status(
    issue_id: str,
    request: OfficerVerificationOverrideRequest,
    x_officer_role: Optional[str] = Header(None, alias="X-Officer-Role"),
) -> VerificationResult:
    """Allow an authorized municipal officer to manually mark an issue as VERIFIED, UNVERIFIED, or NEEDS_REVIEW.
    
    Citizen accounts are strictly forbidden from overriding verification status.
    """
    return verification_service.override_verification(
        issue_id=issue_id,
        request=request,
        officer_role=x_officer_role,
    )
