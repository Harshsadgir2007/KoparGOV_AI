"""Data models for What-If municipal resource scenario analysis."""

from typing import List, Optional
from pydantic import BaseModel, Field

from .civic_issue import CivicIssue
from .decision import MCDAScoreResult, OptimizationAllocationPlan
from .resources import MunicipalResources


class CIEScenarioRequest(BaseModel):
    """Request payload for comparing baseline vs what-if scenario resource allocations."""
    issues: List[CivicIssue] = Field(
        default_factory=list,
        description="Batch of civic issues to evaluate"
    )
    baseline_resources: MunicipalResources = Field(
        ...,
        description="Current/baseline municipal resource constraints"
    )
    scenario_resources: MunicipalResources = Field(
        ...,
        description="Hypothetical/what-if municipal resource constraints"
    )


class AllocationDiff(BaseModel):
    """Differential analysis of selected and deferred issues between baseline and scenario."""
    newly_selected_issue_ids: List[str] = Field(
        default_factory=list,
        description="Issues selected in scenario but deferred in baseline"
    )
    newly_deferred_issue_ids: List[str] = Field(
        default_factory=list,
        description="Issues deferred in scenario but selected in baseline"
    )
    unchanged_selected_issue_ids: List[str] = Field(
        default_factory=list,
        description="Issues selected in both baseline and scenario"
    )
    unchanged_deferred_issue_ids: List[str] = Field(
        default_factory=list,
        description="Issues deferred in both baseline and scenario"
    )
    unchanged_issue_ids: List[str] = Field(
        default_factory=list,
        description="All issues whose recommendation status did not change"
    )


class ImpactComparison(BaseModel):
    """Aggregate public benefit and selection count comparison."""
    baseline_total_benefit: float = Field(..., description="Total MCDA benefit score under baseline constraints")
    scenario_total_benefit: float = Field(..., description="Total MCDA benefit score under scenario constraints")
    benefit_delta: float = Field(..., description="Change in total benefit (scenario - baseline)")
    baseline_selected_count: int = Field(..., description="Number of issues selected in baseline")
    scenario_selected_count: int = Field(..., description="Number of issues selected in scenario")
    selected_count_delta: int = Field(..., description="Change in selected issue count (scenario - baseline)")


class ResourceConstraintDelta(BaseModel):
    """Difference in input resource limits (scenario - baseline)."""
    budget_delta: float = Field(..., description="Change in available budget")
    workers_delta: int = Field(..., description="Change in available workforce")
    vehicles_delta: int = Field(..., description="Change in available vehicles")
    time_capacity_hours_delta: Optional[float] = Field(
        None,
        description="Change in available work hours capacity (if specified)"
    )


class CIEScenarioResponse(BaseModel):
    """Complete response bundle for a What-If scenario simulation."""
    mcda_rankings: List[MCDAScoreResult] = Field(
        default_factory=list,
        description="MCDA scores (identical for both baseline and scenario)"
    )
    baseline_plan: OptimizationAllocationPlan = Field(
        ...,
        description="Optimal OR-Tools allocation plan under baseline resources"
    )
    scenario_plan: OptimizationAllocationPlan = Field(
        ...,
        description="Optimal OR-Tools allocation plan under scenario resources"
    )
    allocation_diff: AllocationDiff = Field(
        ...,
        description="Differences in selected and deferred issue recommendations"
    )
    impact_comparison: ImpactComparison = Field(
        ...,
        description="Public benefit score and count comparisons"
    )
    resource_delta: ResourceConstraintDelta = Field(
        ...,
        description="Difference between scenario and baseline resource constraints"
    )
    explanations: List[str] = Field(
        default_factory=list,
        description="Deterministic, rule-based explanations of allocation changes"
    )
    status: str = Field(
        "SUCCESS",
        description="Execution status outcome (e.g. 'SUCCESS', 'NO_FEASIBLE_ISSUES')"
    )
