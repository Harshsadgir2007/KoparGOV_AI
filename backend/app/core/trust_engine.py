"""Deterministic Civic Trust & Verification Engine for KoparGov AI.

Provides rule-based, auditable evaluation of civic complaint authenticity signals:
- SIMILAR_REPORTS: Jaccard token similarity across existing complaint texts
- SUBMISSION_BURST: Rapid duplicate submissions within a short time window
- LOCATION_CLUSTER: Geographic/ward clustering of similar complaints
- EVIDENCE_PRESENT: Verification of photo evidence and geolocation completeness
- INDEPENDENT_CONFIRMATION: Cross-corroboration by distinct citizen reporters

Guarantees:
- Fully deterministic calculations without probabilistic ML or LLM decision-makers.
- Missing evidence never marks a complaint as false.
- Produces transparent, human-readable rationale for municipal officer review.
"""

import math
import re
from datetime import datetime, timezone
from typing import Dict, List, Optional, Set, Tuple

from app.models.civic_issue import CivicIssue
from app.models.verification import (
    SignalSeverity,
    VerificationResult,
    VerificationSignal,
    VerificationStatus,
)

# Common English grammatical stopwords to ignore during tokenization
STOPWORDS: Set[str] = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
    "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being",
    "below", "between", "both", "but", "by", "can", "can't", "cannot", "could",
    "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down",
    "during", "each", "few", "for", "from", "further", "had", "hadn't", "has",
    "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her",
    "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's",
    "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it",
    "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my",
    "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other",
    "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan't",
    "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such",
    "than", "that", "that's", "the", "their", "theirs", "them", "themselves",
    "then", "there", "there's", "these", "they", "they'd", "they'll", "they're",
    "they've", "this", "those", "through", "to", "too", "under", "until", "up",
    "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were",
    "weren't", "what", "what's", "when", "when's", "where", "where's", "which",
    "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would",
    "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours",
    "yourself", "yourselves",
}


class TrustEngine:
    """Deterministic Civic Trust & Verification Engine."""

    def __init__(
        self,
        similarity_threshold: float = 0.25,
        burst_window_seconds: int = 1800,  # 30 minutes
        burst_count_threshold: int = 3,    # 3+ similar reports in window
        verified_threshold: float = 80.0,
        needs_review_threshold: float = 50.0,
    ):
        """Configure trust engine parameters.
        
        Args:
            similarity_threshold: Minimum Jaccard similarity to consider reports similar.
            burst_window_seconds: Time window in seconds for submission burst detection.
            burst_count_threshold: Number of similar reports in time window to trigger burst.
            verified_threshold: Score cutoff for VERIFIED status (default 80.0).
            needs_review_threshold: Score cutoff for NEEDS_REVIEW status (default 50.0).
        """
        self.similarity_threshold = similarity_threshold
        self.burst_window_seconds = burst_window_seconds
        self.burst_count_threshold = burst_count_threshold
        self.verified_threshold = verified_threshold
        self.needs_review_threshold = needs_review_threshold

    @staticmethod
    def tokenize(text: Optional[str]) -> Set[str]:
        """Normalize and tokenize text into informative word set."""
        if not text:
            return set()
        clean = re.sub(r"[^\w\s]", " ", text.lower())
        words = clean.split()
        return {w for w in words if len(w) >= 2 and w not in STOPWORDS}

    @staticmethod
    def jaccard_similarity(set_a: Set[str], set_b: Set[str]) -> float:
        """Calculate Jaccard similarity index between two token sets."""
        if not set_a or not set_b:
            return 0.0
        union = set_a | set_b
        if not union:
            return 0.0
        intersection = set_a & set_b
        return len(intersection) / len(union)

    @staticmethod
    def parse_timestamp(iso_str: Optional[str]) -> Optional[datetime]:
        """Safely parse ISO timestamp string into UTC datetime object."""
        if not iso_str:
            return None
        try:
            # Handle standard ISO formats with or without Z/offset
            clean_str = str(iso_str).replace("Z", "+00:00")
            dt = datetime.fromisoformat(clean_str)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except Exception:
            return None

    def evaluate_issue(
        self,
        issue: CivicIssue,
        existing_issues: Optional[List[CivicIssue]] = None,
    ) -> VerificationResult:
        """Execute deterministic trust evaluation for a civic issue against the corpus.
        
        Args:
            issue: The target CivicIssue to evaluate.
            existing_issues: All other civic issues in the system for cross-comparison.
            
        Returns:
            VerificationResult with score, status, signals, and human-readable reasons.
        """
        existing = [i for i in (existing_issues or []) if i.id != issue.id]
        target_tokens = self.tokenize(f"{issue.title or ''} {issue.description or ''}")

        signals: List[VerificationSignal] = []
        reasons: List[str] = []

        # Baseline neutral score
        base_score = 50.0
        total_impact = 0.0

        # ----------------------------------------------------------------------
        # 1. EVIDENCE_PRESENT Signal Evaluation
        # ----------------------------------------------------------------------
        has_photo = bool(issue.before_photos and len(issue.before_photos) > 0 and issue.before_photos[0])
        has_coords = bool(
            issue.latitude is not None and issue.longitude is not None
            and not (issue.latitude == 0.0 and issue.longitude == 0.0)
        )
        has_address = bool(issue.address and len(issue.address.strip()) > 3)
        has_location = bool(issue.location or (issue.ward_number is not None and issue.ward_number > 0))

        if has_photo and has_coords and (has_address or has_location):
            photo_count = len(issue.before_photos)
            impact = 25.0
            total_impact += impact
            signals.append(
                VerificationSignal(
                    name="EVIDENCE_PRESENT",
                    severity=SignalSeverity.POSITIVE,
                    score_impact=impact,
                    details=f"Complete evidence: {photo_count} photo(s) attached with verified coordinates ({issue.latitude:.4f}, {issue.longitude:.4f}) and address.",
                )
            )
            reasons.append(f"+{impact:.0f} pts: Photographic evidence and precise geocoding verified.")
        elif has_photo:
            photo_count = len(issue.before_photos)
            impact = 15.0
            total_impact += impact
            signals.append(
                VerificationSignal(
                    name="EVIDENCE_PRESENT",
                    severity=SignalSeverity.POSITIVE,
                    score_impact=impact,
                    details=f"{photo_count} photographic evidence upload(s) verified on record.",
                )
            )
            reasons.append(f"+{impact:.0f} pts: Photo evidence attached to complaint.")
        elif has_coords and (has_address or has_location):
            impact = 10.0
            total_impact += impact
            signals.append(
                VerificationSignal(
                    name="EVIDENCE_PRESENT",
                    severity=SignalSeverity.POSITIVE,
                    score_impact=impact,
                    details=f"Geolocated coordinates ({issue.latitude:.4f}, {issue.longitude:.4f}) and area recorded. (Note: Missing photo does not invalidate civic complaint).",
                )
            )
            reasons.append(f"+{impact:.0f} pts: Precise geographic coordinates and ward jurisdiction verified.")
        else:
            # Missing evidence does NOT penalize or mark false
            signals.append(
                VerificationSignal(
                    name="EVIDENCE_PRESENT",
                    severity=SignalSeverity.INFO,
                    score_impact=0.0,
                    details="No photo evidence attached. (Note: Missing photo does not invalidate civic complaint).",
                )
            )
            reasons.append("0 pts: No photographic evidence attached (neutral - not invalidated).")

        # ----------------------------------------------------------------------
        # 2. SIMILAR_REPORTS Evaluation
        # ----------------------------------------------------------------------
        similar_reports: List[Tuple[CivicIssue, float]] = []
        if target_tokens and existing:
            for other in existing:
                other_tokens = self.tokenize(f"{other.title or ''} {other.description or ''}")
                sim = self.jaccard_similarity(target_tokens, other_tokens)
                if sim >= self.similarity_threshold:
                    similar_reports.append((other, sim))

        # Sort by highest similarity
        similar_reports.sort(key=lambda x: x[1], reverse=True)

        if similar_reports:
            sim_count = len(similar_reports)
            top_ids = [item[0].id for item in similar_reports[:3]]
            id_list_str = ", ".join(top_ids)
            signals.append(
                VerificationSignal(
                    name="SIMILAR_REPORTS",
                    severity=SignalSeverity.INFO,
                    score_impact=0.0,
                    details=f"Found {sim_count} similar civic complaint(s) in database (e.g. {id_list_str}).",
                )
            )
            reasons.append(f"Identified {sim_count} corroborating or related report(s) in historical registry.")
        else:
            signals.append(
                VerificationSignal(
                    name="SIMILAR_REPORTS",
                    severity=SignalSeverity.INFO,
                    score_impact=5.0,
                    details="Unique report description with no duplicate or conflicting submissions found.",
                )
            )
            total_impact += 5.0
            reasons.append("+5 pts: Unique report with distinct descriptive detail.")

        # ----------------------------------------------------------------------
        # 3. SUBMISSION_BURST Evaluation
        # ----------------------------------------------------------------------
        raw_target_time = getattr(issue, "created_at", None) or getattr(issue, "submitted_at", None)
        target_dt = self.parse_timestamp(raw_target_time) or datetime.now(timezone.utc)
        burst_issues: List[CivicIssue] = []

        if target_dt and similar_reports:
            for other, _ in similar_reports:
                raw_other_time = getattr(other, "created_at", None) or getattr(other, "submitted_at", None)
                other_dt = self.parse_timestamp(raw_other_time)
                if other_dt:
                    diff_seconds = abs((target_dt - other_dt).total_seconds())
                    if diff_seconds <= self.burst_window_seconds:
                        burst_issues.append(other)

        # If total similar issues within the window (including this one) >= threshold
        is_burst = (len(burst_issues) + 1) >= self.burst_count_threshold
        if is_burst:
            impact = -25.0
            total_impact += impact
            burst_count = len(burst_issues) + 1
            signals.append(
                VerificationSignal(
                    name="SUBMISSION_BURST",
                    severity=SignalSeverity.WARNING,
                    score_impact=impact,
                    details=f"Rapid submission burst: {burst_count} highly similar complaints submitted within {self.burst_window_seconds // 60} minutes.",
                )
            )
            reasons.append(f"{impact:.0f} pts: Potential submission flood/burst detected ({burst_count} reports in {self.burst_window_seconds // 60}m).")
        else:
            signals.append(
                VerificationSignal(
                    name="SUBMISSION_BURST",
                    severity=SignalSeverity.INFO,
                    score_impact=0.0,
                    details="Normal submission pacing. No automated flood or burst pattern detected.",
                )
            )

        # ----------------------------------------------------------------------
        # 4. LOCATION_CLUSTER Evaluation
        # ----------------------------------------------------------------------
        target_ward = issue.ward_number
        clustered_issues: List[CivicIssue] = []

        if similar_reports:
            for other, _ in similar_reports:
                # Same ward number or matching non-empty ward name
                if (target_ward is not None and other.ward_number == target_ward) or (
                    issue.location and other.location and issue.location.strip().lower() == other.location.strip().lower()
                ):
                    clustered_issues.append(other)

        if clustered_issues:
            cluster_count = len(clustered_issues) + 1
            impact = 10.0 if not is_burst else 0.0
            total_impact += impact
            ward_label = f"Ward {target_ward}" if target_ward else (issue.location or "same locality")
            signals.append(
                VerificationSignal(
                    name="LOCATION_CLUSTER",
                    severity=SignalSeverity.POSITIVE if not is_burst else SignalSeverity.INFO,
                    score_impact=impact,
                    details=f"Spatial clustering: {cluster_count} complaints localized within {ward_label}.",
                )
            )
            if impact > 0:
                reasons.append(f"+{impact:.0f} pts: Spatial cluster confirms multiple reports from {ward_label}.")
        else:
            signals.append(
                VerificationSignal(
                    name="LOCATION_CLUSTER",
                    severity=SignalSeverity.INFO,
                    score_impact=0.0,
                    details="No high-density geographic clustering detected for this issue.",
                )
            )

        # ----------------------------------------------------------------------
        # 5. INDEPENDENT_CONFIRMATION Evaluation
        # ----------------------------------------------------------------------
        # Corroborating reporters must have distinct non-empty phone, user_id, or name
        target_reporters: Set[str] = set()
        if issue.user_id:
            target_reporters.add(str(issue.user_id).strip().lower())
        if issue.citizen_phone:
            target_reporters.add(str(issue.citizen_phone).strip())
        if issue.citizen_name and issue.citizen_name.strip().lower() not in ["anonymous", "citizen", ""]:
            target_reporters.add(str(issue.citizen_name).strip().lower())

        independent_reporters: Set[str] = set()
        independent_issue_ids: List[str] = []

        if similar_reports:
            for other, _ in similar_reports:
                other_reporters: Set[str] = set()
                if other.user_id:
                    other_reporters.add(str(other.user_id).strip().lower())
                if other.citizen_phone:
                    other_reporters.add(str(other.citizen_phone).strip())
                if other.citizen_name and other.citizen_name.strip().lower() not in ["anonymous", "citizen", ""]:
                    other_reporters.add(str(other.citizen_name).strip().lower())

                # If other report has identifiable reporter and does not overlap with target reporter
                if other_reporters and not (target_reporters & other_reporters):
                    independent_reporters.update(other_reporters)
                    independent_issue_ids.append(other.id)

        if len(independent_reporters) >= 2 or len(independent_issue_ids) >= 2:
            impact = 25.0
            total_impact += impact
            signals.append(
                VerificationSignal(
                    name="INDEPENDENT_CONFIRMATION",
                    severity=SignalSeverity.POSITIVE,
                    score_impact=impact,
                    details=f"Independently corroborated by {len(independent_reporters)} distinct citizens ({', '.join(independent_issue_ids[:3])}).",
                )
            )
            reasons.append(f"+{impact:.0f} pts: Cross-verified by multiple independent citizen reports.")
        elif len(independent_reporters) == 1 or len(independent_issue_ids) == 1:
            impact = 15.0
            total_impact += impact
            signals.append(
                VerificationSignal(
                    name="INDEPENDENT_CONFIRMATION",
                    severity=SignalSeverity.POSITIVE,
                    score_impact=impact,
                    details=f"Corroborated by independent citizen report (#{independent_issue_ids[0]}).",
                )
            )
            reasons.append(f"+{impact:.0f} pts: Corroborated by independent citizen submission.")
        else:
            signals.append(
                VerificationSignal(
                    name="INDEPENDENT_CONFIRMATION",
                    severity=SignalSeverity.INFO,
                    score_impact=0.0,
                    details="Single source submission. Awaiting independent citizen corroboration.",
                )
            )

        # ----------------------------------------------------------------------
        # Final Score Computation & Status Assignment
        # ----------------------------------------------------------------------
        raw_score = base_score + total_impact
        # Deterministically clamp between 0.0 and 100.0 with 2 decimal places
        final_score = round(max(0.0, min(100.0, raw_score)), 2)

        # Determine verification classification
        if final_score >= self.verified_threshold and not is_burst:
            verification_status = VerificationStatus.VERIFIED
            requires_officer_review = False
        elif final_score >= self.needs_review_threshold or is_burst:
            verification_status = VerificationStatus.NEEDS_REVIEW
            requires_officer_review = True
        else:
            verification_status = VerificationStatus.UNVERIFIED
            requires_officer_review = True

        now_iso = datetime.now(timezone.utc).isoformat()

        return VerificationResult(
            issue_id=issue.id,
            trust_score=final_score,
            verification_status=verification_status,
            requires_officer_review=requires_officer_review,
            signals=signals,
            verification_reasons=reasons,
            evaluated_at=now_iso,
            manual_override=False,
            overridden_by=None,
            override_notes=None,
            override_timestamp=None,
        )
