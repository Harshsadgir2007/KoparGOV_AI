"""Civic Trust & Verification Service for KoparGov AI.

Provides coordination between the deterministic TrustEngine, persistence via DatabaseService,
and officer audit/override capabilities.
"""

from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status

from app.core.trust_engine import TrustEngine
from app.models.civic_issue import CivicIssue
from app.models.verification import (
    OfficerVerificationOverrideRequest,
    VerificationResult,
    VerificationStatus,
)
from app.services.db_service import DatabaseService


class VerificationService:
    """Service managing civic trust evaluation, persistence, and officer verification overrides."""

    def __init__(
        self,
        db_service: Optional[DatabaseService] = None,
        trust_engine: Optional[TrustEngine] = None,
    ):
        """Initialize the verification service with database and engine dependencies."""
        self.db = db_service or DatabaseService()
        self.engine = trust_engine or TrustEngine()

    def verify_issue(
        self,
        issue: CivicIssue,
        existing_issues: Optional[List[CivicIssue]] = None,
        persist: bool = True,
    ) -> VerificationResult:
        """Run deterministic verification on a civic issue and optionally persist the result.
        
        Args:
            issue: Target CivicIssue to verify.
            existing_issues: Optional pre-fetched list of existing issues.
            persist: Whether to save the verification result to the database.
            
        Returns:
            VerificationResult instance.
        """
        corpus = existing_issues if existing_issues is not None else self.db.list_issues()
        result = self.engine.evaluate_issue(issue, corpus)

        if persist:
            self.db.save_verification_result(result)

        return result

    def get_verification_result(self, issue_id: str) -> VerificationResult:
        """Retrieve stored verification result or evaluate dynamically if not yet computed.
        
        Args:
            issue_id: Unique issue identifier.
            
        Returns:
            VerificationResult instance.
            
        Raises:
            HTTPException: If the underlying civic issue does not exist.
        """
        stored = self.db.get_verification_result(issue_id)
        if stored:
            return stored

        issue = self.db.get_issue(issue_id)
        if not issue:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Civic issue '{issue_id}' not found for verification evaluation.",
            )

        return self.verify_issue(issue, persist=True)

    def list_verification_results(self) -> List[VerificationResult]:
        """List all stored verification evaluation results."""
        return self.db.list_verification_results()

    def override_verification(
        self,
        issue_id: str,
        request: OfficerVerificationOverrideRequest,
        officer_role: Optional[str] = None,
        officer_name: Optional[str] = None,
    ) -> VerificationResult:
        """Allow an authorized municipal officer to manually verify or dispute an issue.
        
        Args:
            issue_id: Civic issue identifier.
            request: Officer verification override payload.
            officer_role: Optional role string.
            officer_name: Optional verified officer name.
            
        Returns:
            Updated VerificationResult instance.
        """
        effective_officer = officer_name or request.officer_id
        if not effective_officer or not str(effective_officer).strip():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unauthorized: Municipal officer identity required for verification override.",
            )

        current = self.get_verification_result(issue_id)
        now_iso = datetime.now(timezone.utc).isoformat()

        # Update verification attributes based on officer judgment
        current.verification_status = request.status
        current.manual_override = True
        current.overridden_by = str(effective_officer).strip()
        current.override_notes = request.notes
        current.override_timestamp = now_iso

        if request.status == VerificationStatus.VERIFIED:
            current.requires_officer_review = False
            # Ensure trust score reflects verified status (at least 85.0)
            if current.trust_score < 80.0:
                current.trust_score = 85.0
        elif request.status == VerificationStatus.UNVERIFIED:
            current.requires_officer_review = True
            # Ensure trust score reflects unverified status (at most 35.0)
            if current.trust_score > 49.0:
                current.trust_score = 35.0
        elif request.status == VerificationStatus.NEEDS_REVIEW:
            current.requires_officer_review = True

        override_audit_msg = f"Officer manual override: Status set to {request.status.value} by {effective_officer}."
        if request.notes:
            override_audit_msg += f" Note: {request.notes}"
        current.verification_reasons.append(override_audit_msg)

        self.db.save_verification_result(current)
        return current


# Default service instance
_verification_service_instance = VerificationService()


def get_verification_service() -> VerificationService:
    """Dependency provider for VerificationService."""
    return _verification_service_instance
