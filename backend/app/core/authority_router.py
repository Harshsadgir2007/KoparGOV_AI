"""Deterministic Authority Routing and Approval Chain Engine.

Rules:
- Determines appropriate authority required to review/approve an action.
- Distributes municipal vs. inter-jurisdiction/revenue authority strictly on legal and resource scope.
- Routine municipal issues stay within municipal jurisdiction:
    - Routine minor issues (cost <= 10k, workers <= 2, low/med urgency) -> WARD_INCHARGE
    - Department-level issues (cost <= 25k, specific domain like water/drainage) -> DEPARTMENT_OFFICER
    - High-impact municipal actions (cost > 25k, critical priority, high resource needs) -> CHIEF_OFFICER
    - Land disputes, taluka disaster, or inter-governmental jurisdiction -> TAHSILDAR_OR_RELEVANT_AUTHORITY
- Configures sequential approval chains:
    - Lower officers must approve before higher officers are unlocked.
- Sets application response SLA based on priority:
    - CRITICAL = 12 Hours
    - HIGH = 24 Hours
    - MEDIUM = 48 Hours
    - LOW = 72 Hours
"""

from typing import List, Optional
from app.models.civic_issue import CivicIssue, PriorityLevel
from app.models.authority import (
    ApprovalStep,
    ApprovalStepStatus,
    AuthorityRole,
    AuthorityRoutingResult,
)


class AuthorityRoutingEngine:
    """Evaluates civic issue context and resource requirements to determine required authority and approval hierarchy."""

    @staticmethod
    def calculate_sla_hours(priority_level: PriorityLevel) -> int:
        """Return application demo SLA window based on priority."""
        if priority_level == PriorityLevel.CRITICAL:
            return 12
        elif priority_level == PriorityLevel.HIGH:
            return 24
        elif priority_level == PriorityLevel.MEDIUM:
            return 48
        else:
            return 72

    def determine_routing(
        self,
        issue: CivicIssue,
        composite_score: float,
        priority_level: PriorityLevel,
    ) -> AuthorityRoutingResult:
        """Determine required authority and sequential approval checkpoints."""
        cost = float(issue.estimated_cost or 10000)
        workers = int(issue.required_workers or 2)
        health_impact = float(issue.health_safety_impact or 50)
        category_upper = (issue.category or "").upper()
        desc_upper = (issue.description or "").upper()
        
        # Check for genuine Revenue / Land / Disaster / Inter-department flags
        is_inter_jurisdiction = any(
            k in desc_upper or k in category_upper
            for k in ["LAND DISPUTE", "REVENUE", "ENCROACHMENT", "DISASTER MANAGEMENT", "TALUKA", "RIVER FLOODING"]
        )

        reasons: List[str] = []

        if is_inter_jurisdiction:
            required_authority = AuthorityRole.TAHSILDAR_OR_RELEVANT_AUTHORITY
            authority_title = "Tahsildar & Taluka Executive Magistrate"
            reasons.append("Inter-departmental jurisdiction: involves revenue/land/taluka administration.")
            reasons.append("Requires coordination between Kopargaon Nagar Parishad and Sub-Divisional Revenue Office.")
            chain_roles = [
                AuthorityRole.WARD_INCHARGE,
                AuthorityRole.DEPARTMENT_OFFICER,
                AuthorityRole.CHIEF_OFFICER,
                AuthorityRole.TAHSILDAR_OR_RELEVANT_AUTHORITY,
            ]
        elif cost > 25000 or workers >= 4 or (priority_level == PriorityLevel.CRITICAL and health_impact >= 80):
            required_authority = AuthorityRole.CHIEF_OFFICER
            authority_title = "Chief Municipal Officer (CMO)"
            if cost > 25000:
                reasons.append(f"Financial threshold: Estimated allocation (₹{cost:,.0f}) exceeds departmental discretionary ceiling (₹25,000).")
            if priority_level == PriorityLevel.CRITICAL:
                reasons.append(f"Public safety threshold: Critical priority ({composite_score:.2f}) with severe health impact ({health_impact:.0f}/100).")
            if workers >= 4:
                reasons.append(f"Workforce deployment: Requires {workers} workers across multi-unit municipal teams.")
            reasons.append("Full municipal executive authorization required prior to fleet mobilization.")
            chain_roles = [
                AuthorityRole.WARD_INCHARGE,
                AuthorityRole.DEPARTMENT_OFFICER,
                AuthorityRole.CHIEF_OFFICER,
            ]
        elif cost > 10000 or priority_level in [PriorityLevel.HIGH, PriorityLevel.MEDIUM]:
            required_authority = AuthorityRole.DEPARTMENT_OFFICER
            authority_title = f"{issue.category or 'Departmental'} Head Officer"
            reasons.append(f"Departmental scope: Standard municipal intervention for {issue.category}.")
            reasons.append(f"Resource budget (₹{cost:,.0f}, {workers} workers) falls within departmental sanction limit.")
            chain_roles = [
                AuthorityRole.WARD_INCHARGE,
                AuthorityRole.DEPARTMENT_OFFICER,
            ]
        else:
            required_authority = AuthorityRole.WARD_INCHARGE
            authority_title = f"Ward {issue.ward_number or 5} Field In-Charge"
            reasons.append("Routine municipal maintenance: Handled locally by Ward Field In-Charge.")
            reasons.append(f"Standard operational containment (₹{cost:,.0f}, {workers} personnel).")
            chain_roles = [
                AuthorityRole.WARD_INCHARGE,
            ]

        # Build sequential approval chain
        title_map = {
            AuthorityRole.WARD_INCHARGE: f"Ward {issue.ward_number or 5} In-Charge (Field Review)",
            AuthorityRole.DEPARTMENT_OFFICER: f"{issue.category or 'Sanitation'} Department Officer",
            AuthorityRole.CHIEF_OFFICER: "Chief Municipal Officer (Final Authorization)",
            AuthorityRole.TAHSILDAR_OR_RELEVANT_AUTHORITY: "Tahsildar / Sub-Divisional Officer",
        }

        approval_chain: List[ApprovalStep] = []
        for i, role in enumerate(chain_roles):
            # First step is PENDING, all subsequent steps start LOCKED
            init_status = ApprovalStepStatus.PENDING if i == 0 else ApprovalStepStatus.LOCKED
            approval_chain.append(
                ApprovalStep(
                    role=role,
                    title=title_map.get(role, role.value),
                    status=init_status,
                )
            )

        sla_hours = self.calculate_sla_hours(priority_level)

        return AuthorityRoutingResult(
            required_authority=required_authority,
            authority_title=authority_title,
            approval_chain=approval_chain,
            routing_reasons=reasons,
            expected_response_sla_hours=sla_hours,
            is_multi_department=len(chain_roles) >= 3,
            requires_inter_jurisdiction=is_inter_jurisdiction,
        )
