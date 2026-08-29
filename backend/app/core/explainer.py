"""Deterministic Explanation Engine for Civic Recommendations.

Rules:
- Every recommendation must be explainable to municipal officers.
- Break down score contributions and constraint trade-offs.
- Decision support system, NOT an autonomous decision maker.
- Strictly rule-based: No LLMs, No XGBoost, No SHAP, No external APIs, No fabricated data.
- Every explanation must be traceable to input data.
"""

from typing import Dict, List, Optional, Set
from app.models.civic_issue import CivicIssue
from app.models.decision import (
    FactorContribution,
    IssueExplanation,
    MCDAScoreResult,
    OptimizationAllocationPlan,
)
from app.core.authority_router import AuthorityRoutingEngine


class ExplanationEngine:
    """Generates transparent, rule-based explanations for prioritized issues."""

    def __init__(self, authority_router: Optional[AuthorityRoutingEngine] = None):
        self.authority_router = authority_router or AuthorityRoutingEngine()

    # Human-readable display titles for MCDA criteria
    FACTOR_DISPLAY_NAMES: Dict[str, str] = {
        "severity": "Severity",
        "urgency": "Urgency",
        "population_affected": "Population affected",
        "health_safety_impact": "Health and safety impact",
        "location_sensitivity": "Location sensitivity",
        "complaint_age": "Complaint age",
    }

    def _extract_factor_contributions(
        self, mcda_result: MCDAScoreResult
    ) -> List[FactorContribution]:
        """Extract and sort all factor contributions descending by weighted contribution."""
        factors = mcda_result.factor_scores
        weights = factors.factor_weights
        weighted_contribs = factors.weighted_contributions

        normalized_values = {
            "severity": factors.normalized_severity,
            "urgency": factors.normalized_urgency,
            "population_affected": factors.normalized_population_affected,
            "health_safety_impact": factors.normalized_health_safety_impact,
            "location_sensitivity": factors.normalized_location_sensitivity,
            "complaint_age": factors.normalized_complaint_age,
        }

        contributions: List[FactorContribution] = []
        for factor_name, contrib in weighted_contribs.items():
            norm_val = normalized_values.get(factor_name, 0.0)
            weight_val = weights.get(factor_name, 0.0)
            contributions.append(
                FactorContribution(
                    factor=factor_name,
                    normalized_score=round(norm_val, 2),
                    weight=round(weight_val, 4),
                    weighted_contribution=round(contrib, 2),
                )
            )

        # Sort descending by weighted contribution, then factor name for deterministic tie-breaking
        contributions.sort(key=lambda c: (-c.weighted_contribution, c.factor))
        return contributions

    def _extract_resource_requirements(
        self, issue: CivicIssue
    ) -> Dict[str, Optional[float]]:
        """Extract resource requirements without inventing any missing values."""
        return {
            "estimated_cost": issue.estimated_cost,
            "required_workers": (
                float(issue.required_workers)
                if issue.required_workers is not None
                else None
            ),
            "required_vehicles": (
                float(issue.required_vehicles)
                if issue.required_vehicles is not None
                else None
            ),
            "required_time_hours": issue.required_time_hours,
        }

    def generate_explanation(
        self,
        issue: CivicIssue,
        mcda_result: MCDAScoreResult,
        is_selected: bool,
        allocation_plan: Optional[OptimizationAllocationPlan] = None,
    ) -> IssueExplanation:
        """Generate a structured, human-readable rationale for a civic issue.
        
        Args:
            issue: The civic issue under evaluation.
            mcda_result: Deterministic MCDA score result with factor breakdown.
            is_selected: Whether the issue was selected in the allocation plan.
            allocation_plan: Optional overall optimization allocation plan for context.
            
        Returns:
            IssueExplanation containing complete audit trail, reasons, and factor drivers.
            
        Raises:
            ValueError: If issue.id does not match mcda_result.issue_id.
        """
        if issue.id != mcda_result.issue_id:
            raise ValueError(
                f"Issue ID mismatch: issue '{issue.id}' vs MCDA result '{mcda_result.issue_id}'."
            )

        # 1. Factor contributions and attribution
        factor_contributions = self._extract_factor_contributions(mcda_result)
        resource_reqs = self._extract_resource_requirements(issue)

        # 2. Build deterministic reasons list
        reasons: List[str] = []

        # Add factor contribution reasons
        for fc in factor_contributions:
            display_name = self.FACTOR_DISPLAY_NAMES.get(
                fc.factor, fc.factor.replace("_", " ").capitalize()
            )
            reasons.append(
                f"{display_name} contributed {fc.weighted_contribution:.2f} points to the priority score."
            )

        # 3. Check completeness of resource requirements
        missing_resources = [k for k, v in resource_reqs.items() if v is None]
        has_complete_resources = len(missing_resources) == 0

        # 4. Selection and Allocation Rationale
        if is_selected:
            recommendation_status = "RECOMMENDED"
            allocation_rationale = (
                "Selected for immediate action by resource-constrained optimization: "
                "part of the feasible allocation that maximizes total MCDA priority benefit "
                "within available municipal budget, workforce, fleet, and time capacity."
            )
            reasons.append(
                "Recommended for action because it is part of the optimal feasible allocation "
                "that maximizes total MCDA priority benefit."
            )
        else:
            recommendation_status = "DEFERRED"
            if not has_complete_resources:
                allocation_rationale = (
                    f"Ineligible for optimization allocation due to incomplete resource requirements: "
                    f"missing {', '.join(missing_resources)}."
                )
                reasons.append(
                    f"Issue was ineligible for allocation because required resource information "
                    f"({', '.join(missing_resources)}) was incomplete. Missing data is never fabricated."
                )
            else:
                allocation_rationale = (
                    f"Deferred by resource-constrained optimization due to municipal resource constraints. "
                    f"Although evaluated at {mcda_result.priority_level.value} priority "
                    f"(score: {mcda_result.composite_score:.2f}), allocating resources to this issue would "
                    f"exceed available capacity or yield lower aggregate public benefit compared to the selected set."
                )
                reasons.append(
                    "Deferred by optimization allocation due to municipal resource constraints "
                    "(budget, workforce, fleet, or time limits)."
                )

        # 5. Executive summary for municipal officers
        top_driver = factor_contributions[0] if factor_contributions else None
        top_driver_str = (
            f"Top driver: {self.FACTOR_DISPLAY_NAMES.get(top_driver.factor, top_driver.factor)} ({top_driver.weighted_contribution:.2f} pts)"
            if top_driver
            else ""
        )

        if is_selected:
            summary = (
                f"Issue {issue.id} evaluated as {mcda_result.priority_level.value} priority "
                f"(composite score: {mcda_result.composite_score:.2f}). {top_driver_str}. "
                f"Status: RECOMMENDED for immediate action."
            )
        else:
            summary = (
                f"Issue {issue.id} evaluated as {mcda_result.priority_level.value} priority "
                f"(composite score: {mcda_result.composite_score:.2f}). {top_driver_str}. "
                f"Status: DEFERRED ({'incomplete resource data' if not has_complete_resources else 'resource constraints'})."
            )

        auth_routing = self.authority_router.determine_routing(
            issue=issue,
            composite_score=mcda_result.composite_score,
            priority_level=mcda_result.priority_level,
        )

        return IssueExplanation(
            issue_id=issue.id,
            priority_level=mcda_result.priority_level,
            composite_score=mcda_result.composite_score,
            top_contributing_factors=factor_contributions,
            resource_requirements=resource_reqs,
            recommendation_status=recommendation_status,
            reasons=reasons,
            is_recommended_for_allocation=is_selected,
            allocation_rationale=allocation_rationale,
            summary=summary,
            authority_routing=auth_routing,
        )

    def generate_batch_explanations(
        self,
        issues: List[CivicIssue],
        mcda_results: List[MCDAScoreResult],
        allocation_plan: OptimizationAllocationPlan,
    ) -> List[IssueExplanation]:
        """Generate explanations across all evaluated issues.
        
        Args:
            issues: List of evaluated civic complaints.
            mcda_results: List of MCDA score results corresponding to the issues.
            allocation_plan: Optimization allocation plan with selected/deferred IDs.
            
        Returns:
            List of IssueExplanation objects in the order of the input issues.
            
        Raises:
            ValueError: If an issue is missing its MCDA result.
        """
        selected_ids: Set[str] = set(allocation_plan.selected_issue_ids)
        score_map: Dict[str, MCDAScoreResult] = {res.issue_id: res for res in mcda_results}

        explanations: List[IssueExplanation] = []
        for issue in issues:
            res = score_map.get(issue.id)
            if res:
                is_selected = issue.id in selected_ids
                explanations.append(
                    self.generate_explanation(
                        issue=issue,
                        mcda_result=res,
                        is_selected=is_selected,
                        allocation_plan=allocation_plan,
                    )
                )
            else:
                raise ValueError(f"Missing MCDA score result for issue ID: '{issue.id}'.")

        return explanations
