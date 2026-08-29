"""What-If Municipal Resource Scenario Analysis Service.

Reuses the existing deterministic MCDA priority engine and Google OR-Tools
ResourceOptimizer to evaluate how changes in municipal resource envelopes
alter optimal issue selection without modifying underlying civic priority scores.
"""

from typing import Dict, List, Optional
from app.core.mcda import MCDAEngine
from app.core.optimizer import ResourceOptimizer
from app.core.validator import CivicIssueValidator
from app.models.civic_issue import CivicIssue
from app.models.decision import MCDAScoreResult, OptimizationAllocationPlan
from app.models.resources import MunicipalResources, ResourceUsage
from app.models.scenario import (
    AllocationDiff,
    CIEScenarioResponse,
    ImpactComparison,
    ResourceConstraintDelta,
)


class ScenarioService:
    """Evaluates What-If resource constraint variations against identical MCDA priorities."""

    def __init__(
        self,
        validator: Optional[CivicIssueValidator] = None,
        mcda_engine: Optional[MCDAEngine] = None,
        optimizer: Optional[ResourceOptimizer] = None,
    ):
        """Initialize scenario service with core decision components."""
        self.validator = validator or CivicIssueValidator()
        self.mcda_engine = mcda_engine or MCDAEngine()
        self.optimizer = optimizer or ResourceOptimizer()

    def run_scenario(
        self,
        issues: List[CivicIssue],
        baseline_resources: MunicipalResources,
        scenario_resources: MunicipalResources,
    ) -> CIEScenarioResponse:
        """Run What-If scenario comparison between baseline and hypothetical municipal resources.
        
        Args:
            issues: Batch of civic issues.
            baseline_resources: Current/baseline municipal resource constraints.
            scenario_resources: Proposed/scenario municipal resource constraints.
            
        Returns:
            CIEScenarioResponse containing comparative plans, allocation diffs, and explanations.
        """
        # Step 1: Duplicate check & Data Validation
        issue_ids = [issue.id for issue in issues]
        if len(issue_ids) != len(set(issue_ids)):
            seen = set()
            duplicates = set()
            for iid in issue_ids:
                if iid in seen:
                    duplicates.add(iid)
                seen.add(iid)
            raise ValueError(f"Duplicate issue IDs detected in scenario request: {sorted(list(duplicates))}")

        if not issues:
            empty_plan = OptimizationAllocationPlan(
                selected_issue_ids=[],
                deferred_issue_ids=[],
                total_benefit_score=0.0,
                resource_usage=ResourceUsage(
                    allocated_budget=0.0,
                    allocated_workers=0,
                    allocated_vehicles=0,
                    allocated_time_hours=0.0,
                    remaining_budget=float(baseline_resources.budget),
                    remaining_workers=int(baseline_resources.workers),
                    remaining_vehicles=int(baseline_resources.vehicles),
                    remaining_time_hours=(
                        float(baseline_resources.time_capacity_hours)
                        if baseline_resources.time_capacity_hours is not None
                        else 0.0
                    ),
                ),
            )
            empty_scenario_plan = OptimizationAllocationPlan(
                selected_issue_ids=[],
                deferred_issue_ids=[],
                total_benefit_score=0.0,
                resource_usage=ResourceUsage(
                    allocated_budget=0.0,
                    allocated_workers=0,
                    allocated_vehicles=0,
                    allocated_time_hours=0.0,
                    remaining_budget=float(scenario_resources.budget),
                    remaining_workers=int(scenario_resources.workers),
                    remaining_vehicles=int(scenario_resources.vehicles),
                    remaining_time_hours=(
                        float(scenario_resources.time_capacity_hours)
                        if scenario_resources.time_capacity_hours is not None
                        else 0.0
                    ),
                ),
            )
            return CIEScenarioResponse(
                mcda_rankings=[],
                baseline_plan=empty_plan,
                scenario_plan=empty_scenario_plan,
                allocation_diff=AllocationDiff(),
                impact_comparison=ImpactComparison(
                    baseline_total_benefit=0.0,
                    scenario_total_benefit=0.0,
                    benefit_delta=0.0,
                    baseline_selected_count=0,
                    scenario_selected_count=0,
                    selected_count_delta=0,
                ),
                resource_delta=self._compute_resource_delta(baseline_resources, scenario_resources),
                explanations=["No issues submitted for scenario evaluation."],
                status="SUCCESS",
            )

        # Step 2: Validate issues
        valid_issues, validation_reports = self.validator.validate_batch(issues)

        if not valid_issues:
            empty_plan = OptimizationAllocationPlan(
                selected_issue_ids=[],
                deferred_issue_ids=[issue.id for issue in issues],
                total_benefit_score=0.0,
                resource_usage=ResourceUsage(
                    allocated_budget=0.0,
                    allocated_workers=0,
                    allocated_vehicles=0,
                    allocated_time_hours=0.0,
                    remaining_budget=float(baseline_resources.budget),
                    remaining_workers=int(baseline_resources.workers),
                    remaining_vehicles=int(baseline_resources.vehicles),
                    remaining_time_hours=(
                        float(baseline_resources.time_capacity_hours)
                        if baseline_resources.time_capacity_hours is not None
                        else 0.0
                    ),
                ),
            )
            empty_scenario_plan = OptimizationAllocationPlan(
                selected_issue_ids=[],
                deferred_issue_ids=[issue.id for issue in issues],
                total_benefit_score=0.0,
                resource_usage=ResourceUsage(
                    allocated_budget=0.0,
                    allocated_workers=0,
                    allocated_vehicles=0,
                    allocated_time_hours=0.0,
                    remaining_budget=float(scenario_resources.budget),
                    remaining_workers=int(scenario_resources.workers),
                    remaining_vehicles=int(scenario_resources.vehicles),
                    remaining_time_hours=(
                        float(scenario_resources.time_capacity_hours)
                        if scenario_resources.time_capacity_hours is not None
                        else 0.0
                    ),
                ),
            )
            return CIEScenarioResponse(
                mcda_rankings=[],
                baseline_plan=empty_plan,
                scenario_plan=empty_scenario_plan,
                allocation_diff=AllocationDiff(
                    unchanged_deferred_issue_ids=[issue.id for issue in issues],
                    unchanged_issue_ids=[issue.id for issue in issues],
                ),
                impact_comparison=ImpactComparison(
                    baseline_total_benefit=0.0,
                    scenario_total_benefit=0.0,
                    benefit_delta=0.0,
                    baseline_selected_count=0,
                    scenario_selected_count=0,
                    selected_count_delta=0,
                ),
                resource_delta=self._compute_resource_delta(baseline_resources, scenario_resources),
                explanations=["No issues passed data validation; all issues deferred."],
                status="NO_VALID_ISSUES",
            )

        # Step 3: Run MCDA once (scores are intrinsic and invariant to resource constraints)
        mcda_rankings = self.mcda_engine.evaluate_and_rank_batch(valid_issues)
        mcda_map: Dict[str, MCDAScoreResult] = {res.issue_id: res for res in mcda_rankings}

        # Step 4: Run ResourceOptimizer for Baseline and Scenario
        baseline_plan = self.optimizer.optimize_allocation(
            issues=valid_issues,
            mcda_results=mcda_rankings,
            resources=baseline_resources,
        )
        scenario_plan = self.optimizer.optimize_allocation(
            issues=valid_issues,
            mcda_results=mcda_rankings,
            resources=scenario_resources,
        )

        # Step 5: Compute Allocation Differences
        baseline_selected = set(baseline_plan.selected_issue_ids)
        scenario_selected = set(scenario_plan.selected_issue_ids)
        baseline_deferred = set(baseline_plan.deferred_issue_ids)
        scenario_deferred = set(scenario_plan.deferred_issue_ids)

        newly_selected = sorted(list(scenario_selected - baseline_selected))
        newly_deferred = sorted(list(baseline_selected - scenario_selected))
        unchanged_selected = sorted(list(baseline_selected & scenario_selected))
        unchanged_deferred = sorted(list(baseline_deferred & scenario_deferred))
        unchanged_all = sorted(list(set(unchanged_selected + unchanged_deferred)))

        diff = AllocationDiff(
            newly_selected_issue_ids=newly_selected,
            newly_deferred_issue_ids=newly_deferred,
            unchanged_selected_issue_ids=unchanged_selected,
            unchanged_deferred_issue_ids=unchanged_deferred,
            unchanged_issue_ids=unchanged_all,
        )

        # Step 6: Compute Impact & Resource Deltas
        impact = ImpactComparison(
            baseline_total_benefit=round(baseline_plan.total_benefit_score, 4),
            scenario_total_benefit=round(scenario_plan.total_benefit_score, 4),
            benefit_delta=round(scenario_plan.total_benefit_score - baseline_plan.total_benefit_score, 4),
            baseline_selected_count=len(baseline_plan.selected_issue_ids),
            scenario_selected_count=len(scenario_plan.selected_issue_ids),
            selected_count_delta=len(scenario_plan.selected_issue_ids) - len(baseline_plan.selected_issue_ids),
        )
        res_delta = self._compute_resource_delta(baseline_resources, scenario_resources)

        # Step 7: Generate Deterministic Rule-Based Explanations
        explanations = self._generate_scenario_explanations(
            baseline_resources=baseline_resources,
            scenario_resources=scenario_resources,
            diff=diff,
            impact=impact,
            res_delta=res_delta,
            mcda_map=mcda_map,
        )

        return CIEScenarioResponse(
            mcda_rankings=mcda_rankings,
            baseline_plan=baseline_plan,
            scenario_plan=scenario_plan,
            allocation_diff=diff,
            impact_comparison=impact,
            resource_delta=res_delta,
            explanations=explanations,
            status="SUCCESS",
        )

    def _compute_resource_delta(
        self, baseline: MunicipalResources, scenario: MunicipalResources
    ) -> ResourceConstraintDelta:
        """Calculate numerical difference in resource limits."""
        time_delta = None
        if baseline.time_capacity_hours is not None and scenario.time_capacity_hours is not None:
            time_delta = round(scenario.time_capacity_hours - baseline.time_capacity_hours, 2)

        return ResourceConstraintDelta(
            budget_delta=round(scenario.budget - baseline.budget, 2),
            workers_delta=scenario.workers - baseline.workers,
            vehicles_delta=scenario.vehicles - baseline.vehicles,
            time_capacity_hours_delta=time_delta,
        )

    def _generate_scenario_explanations(
        self,
        baseline_resources: MunicipalResources,
        scenario_resources: MunicipalResources,
        diff: AllocationDiff,
        impact: ImpactComparison,
        res_delta: ResourceConstraintDelta,
        mcda_map: Dict[str, MCDAScoreResult],
    ) -> List[str]:
        """Construct transparent, deterministic explanations comparing the two scenarios."""
        explanations: List[str] = []

        # 1. Resource changes summary
        res_parts = [
            f"Budget: ₹{baseline_resources.budget:,.2f} → ₹{scenario_resources.budget:,.2f} (Δ {res_delta.budget_delta:+,.2f})",
            f"Workers: {baseline_resources.workers} → {scenario_resources.workers} (Δ {res_delta.workers_delta:+d})",
            f"Vehicles: {baseline_resources.vehicles} → {scenario_resources.vehicles} (Δ {res_delta.vehicles_delta:+d})",
        ]
        if baseline_resources.time_capacity_hours is not None and scenario_resources.time_capacity_hours is not None:
            res_parts.append(
                f"Time Capacity: {baseline_resources.time_capacity_hours:.1f}h → "
                f"{scenario_resources.time_capacity_hours:.1f}h (Δ {res_delta.time_capacity_hours_delta:+.1f}h)"
            )
        explanations.append(f"Resource constraints changed: {'; '.join(res_parts)}.")

        # 2. Benefit and selection count comparison
        explanations.append(
            f"Total public benefit score changed from {impact.baseline_total_benefit:.2f} to "
            f"{impact.scenario_total_benefit:.2f} (Δ {impact.benefit_delta:+.2f}). "
            f"Selected issues changed from {impact.baseline_selected_count} to "
            f"{impact.scenario_selected_count} (Δ {impact.selected_count_delta:+d})."
        )

        # 3. Newly deferred issues explanation
        for issue_id in diff.newly_deferred_issue_ids:
            mcda_res = mcda_map.get(issue_id)
            score_str = f"{mcda_res.composite_score:.2f}" if mcda_res else "N/A"
            level_str = mcda_res.priority_level.value if mcda_res else "UNKNOWN"
            explanations.append(
                f"Issue '{issue_id}' ({level_str} priority, score: {score_str}) was selected under baseline "
                f"but deferred under scenario constraints because available capacity could no longer support all actions."
            )

        # 4. Newly selected issues explanation
        for issue_id in diff.newly_selected_issue_ids:
            mcda_res = mcda_map.get(issue_id)
            score_str = f"{mcda_res.composite_score:.2f}" if mcda_res else "N/A"
            level_str = mcda_res.priority_level.value if mcda_res else "UNKNOWN"
            explanations.append(
                f"Issue '{issue_id}' ({level_str} priority, score: {score_str}) was deferred under baseline "
                f"but selected under scenario constraints due to expanded resource availability."
            )

        # 5. Core invariance confirmation
        explanations.append(
            "Underlying MCDA priority scores and rankings remained strictly unchanged; "
            "only resource-constrained optimal selection was recomputed."
        )

        return explanations
