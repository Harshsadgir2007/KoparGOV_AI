"""Resource Optimization Engine using Google OR-Tools.

Objective:
    Maximize total public-benefit priority score:
    MAXIMIZE: Σ(priority_score_i × x_i)
    where x_i ∈ {0, 1} is a binary decision variable indicating whether issue i is selected.

Resource Constraints:
    - Σ(cost_i × x_i) <= available_budget
    - Σ(workers_i × x_i) <= available_workers
    - Σ(vehicles_i × x_i) <= available_vehicles
    - Σ(time_i × x_i) <= available_time_capacity (when time_capacity_hours is specified)

Guarantees:
    - Deterministic Mixed-Integer Programming (MIP), strictly non-greedy.
    - Full input validation (duplicate checks, missing MCDA result validation).
    - Missing resource data is never invented; issues with incomplete requirements are deferred.
    - All output resource utilization metrics are non-negative and audited.
"""

from typing import Dict, List, Optional, Set
from ortools.linear_solver import pywraplp

from app.models.civic_issue import CivicIssue
from app.models.decision import MCDAScoreResult, OptimizationAllocationPlan
from app.models.resources import MunicipalResources, ResourceUsage


class ResourceOptimizer:
    """Solves multi-dimensional knapsack/MIP problem using Google OR-Tools."""

    def __init__(self, solver_name: str = "SCIP"):
        """Initialize the ResourceOptimizer with a specified solver backend.
        
        Args:
            solver_name: Name of the solver backend (e.g. 'SCIP', 'CBC', 'SAT').
        """
        self.solver_name = solver_name

    def _create_solver(self) -> pywraplp.Solver:
        """Create and return an OR-Tools linear solver instance with fallback support."""
        solver = pywraplp.Solver.CreateSolver(self.solver_name)
        if solver is None:
            # Attempt fallbacks if the primary solver is not available in the binary
            for fallback in ["SCIP", "CBC", "SAT"]:
                solver = pywraplp.Solver.CreateSolver(fallback)
                if solver is not None:
                    break

        if solver is None:
            raise RuntimeError(
                f"Could not initialize OR-Tools linear solver '{self.solver_name}'. "
                "Ensure OR-Tools is properly installed with a supported solver backend."
            )
        return solver

    def _is_eligible(self, issue: CivicIssue) -> bool:
        """Check if an issue has complete and valid resource requirements.
        
        Required fields:
            - estimated_cost
            - required_workers
            - required_vehicles
            - required_time_hours
            
        If any field is missing (None) or negative, the issue is ineligible.
        We do NOT invent values or silently treat missing values as zero.
        """
        return (
            issue.estimated_cost is not None
            and issue.estimated_cost >= 0.0
            and issue.required_workers is not None
            and issue.required_workers >= 0
            and issue.required_vehicles is not None
            and issue.required_vehicles >= 0
            and issue.required_time_hours is not None
            and issue.required_time_hours >= 0.0
        )

    def optimize_allocation(
        self,
        issues: List[CivicIssue],
        mcda_results: List[MCDAScoreResult],
        resources: MunicipalResources,
    ) -> OptimizationAllocationPlan:
        """Run constraint solver to determine the optimal set of issues to address.
        
        Args:
            issues: List of civic complaints to evaluate.
            mcda_results: Pre-computed deterministic MCDA scores for the issues.
            resources: Municipal resource constraints (budget, workforce, fleet, time).
            
        Returns:
            OptimizationAllocationPlan detailing selected issues, deferred issues,
            total public benefit score, and detailed resource usage.
            
        Raises:
            ValueError: If duplicate issue IDs exist in issues or mcda_results,
                        or if an issue is missing its corresponding MCDA result.
        """
        # Edge Case 1 & 2: Empty issue list
        if not issues:
            return OptimizationAllocationPlan(
                selected_issue_ids=[],
                deferred_issue_ids=[],
                total_benefit_score=0.0,
                resource_usage=ResourceUsage(
                    allocated_budget=0.0,
                    allocated_workers=0,
                    allocated_vehicles=0,
                    allocated_time_hours=0.0,
                    remaining_budget=float(resources.budget),
                    remaining_workers=int(resources.workers),
                    remaining_vehicles=int(resources.vehicles),
                    remaining_time_hours=(
                        float(resources.time_capacity_hours)
                        if resources.time_capacity_hours is not None
                        else 0.0
                    ),
                ),
            )

        # Integrity Check 1: Check for duplicate issue IDs in issues list
        seen_issue_ids: Set[str] = set()
        for issue in issues:
            if issue.id in seen_issue_ids:
                raise ValueError(f"Duplicate issue ID found: '{issue.id}'.")
            seen_issue_ids.add(issue.id)

        # Integrity Check 2: Check for duplicate issue IDs in MCDA results and build map
        mcda_map: Dict[str, MCDAScoreResult] = {}
        for result in mcda_results:
            if result.issue_id in mcda_map:
                raise ValueError(f"Duplicate MCDA result for issue ID: '{result.issue_id}'.")
            mcda_map[result.issue_id] = result

        # Integrity Check 3: Check that every issue has a corresponding MCDA score result
        for issue in issues:
            if issue.id not in mcda_map:
                raise ValueError(f"Missing MCDA score result for issue ID: '{issue.id}'.")

        # Feasibility filtering: Identify eligible candidate issues vs ineligible ones
        candidates: List[CivicIssue] = []
        ineligible_issue_ids: Set[str] = set()

        for issue in issues:
            if self._is_eligible(issue):
                candidates.append(issue)
            else:
                ineligible_issue_ids.add(issue.id)

        # If no candidates are eligible for optimization
        if not candidates:
            return OptimizationAllocationPlan(
                selected_issue_ids=[],
                deferred_issue_ids=[issue.id for issue in issues],
                total_benefit_score=0.0,
                resource_usage=ResourceUsage(
                    allocated_budget=0.0,
                    allocated_workers=0,
                    allocated_vehicles=0,
                    allocated_time_hours=0.0,
                    remaining_budget=float(resources.budget),
                    remaining_workers=int(resources.workers),
                    remaining_vehicles=int(resources.vehicles),
                    remaining_time_hours=(
                        float(resources.time_capacity_hours)
                        if resources.time_capacity_hours is not None
                        else 0.0
                    ),
                ),
            )

        # Initialize OR-Tools Linear/MIP Solver
        solver = self._create_solver()

        # Decision Variables: x_i in {0, 1}
        x_vars: Dict[str, pywraplp.Variable] = {}
        for issue in candidates:
            x_vars[issue.id] = solver.BoolVar(f"x_{issue.id}")

        # Objective Function: Maximize sum(priority_score_i * x_i)
        objective = solver.Objective()
        objective.SetMaximization()
        for issue in candidates:
            score = float(mcda_map[issue.id].composite_score)
            objective.SetCoefficient(x_vars[issue.id], score)

        # Constraint 1: Budget Constraint -> sum(cost_i * x_i) <= available_budget
        budget_constraint = solver.Constraint(-solver.infinity(), float(resources.budget))
        for issue in candidates:
            budget_constraint.SetCoefficient(x_vars[issue.id], float(issue.estimated_cost))

        # Constraint 2: Worker Constraint -> sum(workers_i * x_i) <= available_workers
        workers_constraint = solver.Constraint(-solver.infinity(), float(resources.workers))
        for issue in candidates:
            workers_constraint.SetCoefficient(x_vars[issue.id], float(issue.required_workers))

        # Constraint 3: Vehicle Constraint -> sum(vehicles_i * x_i) <= available_vehicles
        vehicles_constraint = solver.Constraint(-solver.infinity(), float(resources.vehicles))
        for issue in candidates:
            vehicles_constraint.SetCoefficient(x_vars[issue.id], float(issue.required_vehicles))

        # Constraint 4: Time Constraint -> sum(time_i * x_i) <= available_time_capacity (optional)
        if resources.time_capacity_hours is not None:
            time_constraint = solver.Constraint(-solver.infinity(), float(resources.time_capacity_hours))
            for issue in candidates:
                time_constraint.SetCoefficient(x_vars[issue.id], float(issue.required_time_hours))

        # Solve the Mixed-Integer Program
        solve_status = solver.Solve()

        # Collect selected issue IDs
        selected_set: Set[str] = set()
        if solve_status in (pywraplp.Solver.OPTIMAL, pywraplp.Solver.FEASIBLE):
            for issue in candidates:
                var = x_vars[issue.id]
                if var.solution_value() > 0.5:
                    selected_set.add(issue.id)

        # Build deterministic output lists maintaining input order
        selected_issue_ids = [issue.id for issue in issues if issue.id in selected_set]
        deferred_issue_ids = [issue.id for issue in issues if issue.id not in selected_set]

        # Compute resource consumption for selected issues
        selected_issues = [issue for issue in candidates if issue.id in selected_set]

        allocated_budget = round(
            sum(float(issue.estimated_cost) for issue in selected_issues), 2
        )
        allocated_workers = sum(int(issue.required_workers) for issue in selected_issues)
        allocated_vehicles = sum(int(issue.required_vehicles) for issue in selected_issues)
        allocated_time_hours = round(
            sum(float(issue.required_time_hours) for issue in selected_issues), 2
        )

        # Compute remaining resources ensuring non-negativity
        remaining_budget = round(max(0.0, float(resources.budget) - allocated_budget), 2)
        remaining_workers = max(0, int(resources.workers) - allocated_workers)
        remaining_vehicles = max(0, int(resources.vehicles) - allocated_vehicles)

        if resources.time_capacity_hours is not None:
            remaining_time_hours = round(
                max(0.0, float(resources.time_capacity_hours) - allocated_time_hours), 2
            )
        else:
            remaining_time_hours = 0.0

        # Total public-benefit priority score
        total_benefit_score = round(
            sum(float(mcda_map[issue_id].composite_score) for issue_id in selected_issue_ids), 2
        )

        resource_usage = ResourceUsage(
            allocated_budget=allocated_budget,
            allocated_workers=allocated_workers,
            allocated_vehicles=allocated_vehicles,
            allocated_time_hours=allocated_time_hours,
            remaining_budget=remaining_budget,
            remaining_workers=remaining_workers,
            remaining_vehicles=remaining_vehicles,
            remaining_time_hours=remaining_time_hours,
        )

        return OptimizationAllocationPlan(
            selected_issue_ids=selected_issue_ids,
            deferred_issue_ids=deferred_issue_ids,
            total_benefit_score=total_benefit_score,
            resource_usage=resource_usage,
        )
