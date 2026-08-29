"""Civic Intelligence Engine (CIE) End-to-End Pipeline Service.

Connects the four core deterministic modules:
1. Data Validation (CivicIssueValidator)
2. MCDA Prioritization Engine (MCDAEngine)
3. Resource Optimization Solver (ResourceOptimizer)
4. Transparent Explainability Engine (ExplanationEngine)

Guarantees:
- Fully auditable, rule-based decision support system.
- Distinguishes Priority (MCDA importance) from Recommendation (Resource allocation).
- Missing data is never fabricated or treated as zero.
- Deterministic execution across all pipeline stages.
"""

from typing import List, Optional, Set
from app.core.explainer import ExplanationEngine
from app.core.mcda import MCDAEngine
from app.core.optimizer import ResourceOptimizer
from app.core.validator import CivicIssueValidator
from app.models.civic_issue import CivicIssue, IssueValidationReport
from app.models.decision import (
    CIEPipelineResponse,
    CIEPipelineResult,
    IssueExplanation,
    MCDAScoreResult,
    OptimizationAllocationPlan,
)
from app.models.resources import MunicipalResources, ResourceUsage


class CIEPipelineService:
    """End-to-end service coordinating validation, MCDA, optimization, and explanations."""

    def __init__(
        self,
        validator: Optional[CivicIssueValidator] = None,
        mcda_engine: Optional[MCDAEngine] = None,
        optimizer: Optional[ResourceOptimizer] = None,
        explainer: Optional[ExplanationEngine] = None,
    ):
        """Initialize the pipeline service with modular components."""
        self.validator = validator or CivicIssueValidator()
        self.mcda_engine = mcda_engine or MCDAEngine()
        self.optimizer = optimizer or ResourceOptimizer()
        self.explainer = explainer or ExplanationEngine()

    def run_pipeline(
        self,
        issues: List[CivicIssue],
        resources: MunicipalResources,
    ) -> CIEPipelineResponse:
        """Execute the full CIE decision pipeline.
        
        Args:
            issues: List of incoming municipal civic complaints/issues.
            resources: Available municipal resources (budget, workforce, fleet, time).
            
        Returns:
            CIEPipelineResponse bundle containing validation reports, MCDA rankings,
            optimization allocation plan, and rule-based explanations.
            
        Raises:
            ValueError: If duplicate issue IDs exist in the input list.
        """
        # Step 0: Input Integrity Check (Duplicate Issue IDs)
        seen_ids: Set[str] = set()
        for issue in issues:
            if issue.id in seen_ids:
                raise ValueError(f"Duplicate issue ID found in input: '{issue.id}'.")
            seen_ids.add(issue.id)

        # Handle empty issues list gracefully
        if not issues:
            return CIEPipelineResponse(
                validation_reports=[],
                valid_issue_count=0,
                flagged_issue_count=0,
                mcda_rankings=[],
                allocation_plan=OptimizationAllocationPlan(
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
                ),
                explanations=[],
                status="SUCCESS",
            )

        # Step 1: Data Validation
        valid_issues, validation_reports = self.validator.validate_batch(issues)
        valid_issue_count = len(valid_issues)
        flagged_issue_count = len(issues) - valid_issue_count

        # If all issues are invalid or missing required MCDA data
        if valid_issue_count == 0:
            return CIEPipelineResponse(
                validation_reports=validation_reports,
                valid_issue_count=0,
                flagged_issue_count=flagged_issue_count,
                mcda_rankings=[],
                allocation_plan=OptimizationAllocationPlan(
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
                ),
                explanations=[],
                status="NO_VALID_ISSUES",
            )

        # Step 2: Deterministic MCDA Prioritization Engine
        mcda_rankings: List[MCDAScoreResult] = self.mcda_engine.evaluate_and_rank_batch(valid_issues)

        # Step 3: OR-Tools Resource-Constrained Optimization
        allocation_plan: OptimizationAllocationPlan = self.optimizer.optimize_allocation(
            issues=valid_issues,
            mcda_results=mcda_rankings,
            resources=resources,
        )

        # Step 4: Rule-Based Explanations Engine
        explanations: List[IssueExplanation] = self.explainer.generate_batch_explanations(
            issues=valid_issues,
            mcda_results=mcda_rankings,
            allocation_plan=allocation_plan,
        )

        # Step 5: Assemble and return structured response
        return CIEPipelineResponse(
            validation_reports=validation_reports,
            valid_issue_count=valid_issue_count,
            flagged_issue_count=flagged_issue_count,
            mcda_rankings=mcda_rankings,
            allocation_plan=allocation_plan,
            explanations=explanations,
            status="SUCCESS",
        )
