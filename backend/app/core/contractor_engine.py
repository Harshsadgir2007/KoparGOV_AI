"""Contractor Accountability and Project Quality Inspection Engine.

Rules:
- Evaluates completed municipal public works projects for post-completion risk signals.
- Detects unusual complaint patterns, repeated defects, and safety anomalies.
- Flags projects as NORMAL, WARNING, or INSPECTION_RECOMMENDED with rule-based explanations.
- Computes auditable, transparent contractor performance scores (0-100):
    - 30% On-time delivery rate
    - 25% Inspection pass rate
    - 20% Defect and rework record
    - 15% Complaint resolution outcome
    - 10% Safety and regulatory compliance
- Tracks accountability events without automated penalties.
"""

from typing import List, Tuple
from app.models.contractor import (
    Contractor,
    ContractorAccountabilityEvent,
    ContractorAccountabilityEventType,
    ContractorPerformanceScore,
    InspectionOutcome,
    InspectionRecommendationStatus,
    MunicipalProject,
)


class ContractorAccountabilityEngine:
    """Evaluates contractor quality, project durability signals, and inspection priorities."""

    @staticmethod
    def calculate_performance_score(contractor_data: dict) -> ContractorPerformanceScore:
        """Calculate weighted, transparent contractor performance score (0-100)."""
        on_time = float(contractor_data.get("on_time_completion_rate", 100.0))
        pass_rate = float(contractor_data.get("inspection_pass_rate", 100.0))
        
        rework_count = int(contractor_data.get("rework_count", 0))
        total_complaints = int(contractor_data.get("total_complaint_count", 0))
        safety_flags = int(contractor_data.get("safety_flags_count", 0))
        completed = max(1, int(contractor_data.get("completed_projects", 1)))

        # 20% Quality Score: 100 minus 15 points per rework request per project
        quality_score = max(0.0, min(100.0, 100.0 - (rework_count / completed) * 25.0))

        # 15% Complaint Score: 100 minus penalty for excessive complaints
        complaint_score = max(0.0, min(100.0, 100.0 - (total_complaints / completed) * 10.0))

        # 10% Safety Score: 100 minus 30 points per active safety flag
        safety_score = max(0.0, min(100.0, 100.0 - (safety_flags * 30.0)))

        overall = (
            (on_time * 0.30)
            + (pass_rate * 0.25)
            + (quality_score * 0.20)
            + (complaint_score * 0.15)
            + (safety_score * 0.10)
        )
        overall = round(overall, 1)

        if overall >= 85:
            tier = "EXCELLENT"
        elif overall >= 70:
            tier = "GOOD"
        elif overall >= 55:
            tier = "MONITORING"
        else:
            tier = "REVIEW_RECOMMENDED"

        return ContractorPerformanceScore(
            overall_score=overall,
            on_time_score=round(on_time, 1),
            inspection_score=round(pass_rate, 1),
            quality_score=round(quality_score, 1),
            complaint_score=round(complaint_score, 1),
            safety_score=round(safety_score, 1),
            score_tier=tier,
        )

    def evaluate_project_signals(
        self, project: MunicipalProject
    ) -> Tuple[InspectionRecommendationStatus, List[str], str]:
        """Detect post-completion defect signals and return status, signals list, and rationale."""
        signals: List[str] = []
        is_inspection_recommended = False

        if project.post_completion_complaints >= 10:
            signals.append(f"Excessive post-completion complaints ({project.post_completion_complaints} reports on record).")
            is_inspection_recommended = True

        if project.safety_complaints >= 2:
            signals.append(f"High-hazard safety complaints ({project.safety_complaints} incidents flagged).")
            is_inspection_recommended = True

        if project.recent_complaints_last_7_days >= 3:
            signals.append(f"Recent complaint escalation ({project.recent_complaints_last_7_days} in the last 7 days).")
            is_inspection_recommended = True

        if project.rework_requests >= 1:
            signals.append(f"Prior defect rework history ({project.rework_requests} rework orders logged).")
            is_inspection_recommended = True

        if is_inspection_recommended:
            status = InspectionRecommendationStatus.INSPECTION_RECOMMENDED
            rationale = (
                f"Inspection is recommended because the completed project on {project.asset_name} "
                f"has accumulated repeated post-completion complaints ({project.post_completion_complaints} total, "
                f"{project.safety_complaints} safety-related), within a concentrated municipal location."
            )
        elif project.post_completion_complaints > 3 or project.safety_complaints > 0:
            status = InspectionRecommendationStatus.WARNING
            rationale = f"Elevated post-completion activity detected on {project.asset_name}. Enhanced monitoring advised."
        else:
            status = InspectionRecommendationStatus.NORMAL
            rationale = f"Project durability within expected operating parameters."

        return status, signals, rationale
