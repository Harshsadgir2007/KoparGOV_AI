"""Unit tests for the Google OR-Tools Resource Optimizer."""

import pytest
from app.core.optimizer import ResourceOptimizer
from app.models.civic_issue import CivicIssue, PriorityLevel
from app.models.decision import MCDAFactorScores, MCDAScoreResult
from app.models.resources import MunicipalResources


@pytest.fixture
def optimizer():
    """Fixture providing a ResourceOptimizer instance."""
    return ResourceOptimizer()


def create_dummy_mcda_result(issue_id: str, score: float) -> MCDAScoreResult:
    """Helper to construct an MCDAScoreResult with given score."""
    priority = (
        PriorityLevel.CRITICAL
        if score >= 80.0
        else PriorityLevel.HIGH
        if score >= 60.0
        else PriorityLevel.MEDIUM
        if score >= 40.0
        else PriorityLevel.LOW
    )
    return MCDAScoreResult(
        issue_id=issue_id,
        composite_score=score,
        priority_level=priority,
        factor_scores=MCDAFactorScores(
            normalized_severity=score,
            normalized_urgency=score,
            normalized_population_affected=score,
            normalized_health_safety_impact=score,
            normalized_location_sensitivity=score,
            normalized_complaint_age=score,
            factor_weights={},
            weighted_contributions={},
        ),
    )


def test_optimizer_exact_prompt_scenario(optimizer):
    """Test the exact scenario from specification:
    Resources:
        budget = 10000, workers = 5, vehicles = 2, time_capacity_hours = 8

    Issues:
        A: priority = 90, cost = 5000, workers = 2, vehicles = 1, time = 4
        B: priority = 80, cost = 4000, workers = 3, vehicles = 1, time = 3
        C: priority = 70, cost = 3000, workers = 2, vehicles = 1, time = 2

    Expected optimal solution:
        Select A + B: Total Priority = 170
        Cost = 9000 <= 10000
        Workers = 5 <= 5
        Vehicles = 2 <= 2
        Time = 7 <= 8
        Defer C
    """
    resources = MunicipalResources(
        budget=10000.0,
        workers=5,
        vehicles=2,
        time_capacity_hours=8.0,
    )

    issues = [
        CivicIssue(
            id="A",
            title="Issue A",
            estimated_cost=5000.0,
            required_workers=2,
            required_vehicles=1,
            required_time_hours=4.0,
        ),
        CivicIssue(
            id="B",
            title="Issue B",
            estimated_cost=4000.0,
            required_workers=3,
            required_vehicles=1,
            required_time_hours=3.0,
        ),
        CivicIssue(
            id="C",
            title="Issue C",
            estimated_cost=3000.0,
            required_workers=2,
            required_vehicles=1,
            required_time_hours=2.0,
        ),
    ]

    mcda_results = [
        create_dummy_mcda_result("A", 90.0),
        create_dummy_mcda_result("B", 80.0),
        create_dummy_mcda_result("C", 70.0),
    ]

    plan = optimizer.optimize_allocation(issues, mcda_results, resources)

    assert set(plan.selected_issue_ids) == {"A", "B"}
    assert plan.deferred_issue_ids == ["C"]
    assert plan.total_benefit_score == 170.0

    # Resource usage checks
    usage = plan.resource_usage
    assert usage.allocated_budget == 9000.0
    assert usage.remaining_budget == 1000.0
    assert usage.allocated_workers == 5
    assert usage.remaining_workers == 0
    assert usage.allocated_vehicles == 2
    assert usage.remaining_vehicles == 0
    assert usage.allocated_time_hours == 7.0
    assert usage.remaining_time_hours == 1.0


def test_optimizer_greedy_priority_counterexample(optimizer):
    """Test case demonstrating non-greedy multi-dimensional knapsack optimization:
    Issue A: priority=100, cost=7000, workers=4, vehicles=1, time=4
    Issue B: priority=60, cost=4000, workers=2, vehicles=1, time=2
    Issue C: priority=60, cost=4000, workers=2, vehicles=1, time=2

    Budget=10000, workers=4, vehicles=2, time=8

    Greedy by priority chooses A (benefit 100).
    Optimal MIP chooses B + C (benefit 120, cost 8000, workers 4, vehicles 2, time 4).

    The optimizer MUST choose B + C.
    """
    resources = MunicipalResources(
        budget=10000.0,
        workers=4,
        vehicles=2,
        time_capacity_hours=8.0,
    )

    issues = [
        CivicIssue(
            id="A",
            title="High Priority Expensive Issue",
            estimated_cost=7000.0,
            required_workers=4,
            required_vehicles=1,
            required_time_hours=4.0,
        ),
        CivicIssue(
            id="B",
            title="Medium Priority Issue B",
            estimated_cost=4000.0,
            required_workers=2,
            required_vehicles=1,
            required_time_hours=2.0,
        ),
        CivicIssue(
            id="C",
            title="Medium Priority Issue C",
            estimated_cost=4000.0,
            required_workers=2,
            required_vehicles=1,
            required_time_hours=2.0,
        ),
    ]

    mcda_results = [
        create_dummy_mcda_result("A", 100.0),
        create_dummy_mcda_result("B", 60.0),
        create_dummy_mcda_result("C", 60.0),
    ]

    plan = optimizer.optimize_allocation(issues, mcda_results, resources)

    assert set(plan.selected_issue_ids) == {"B", "C"}
    assert plan.deferred_issue_ids == ["A"]
    assert plan.total_benefit_score == 120.0

    usage = plan.resource_usage
    assert usage.allocated_budget == 8000.0
    assert usage.remaining_budget == 2000.0
    assert usage.allocated_workers == 4
    assert usage.remaining_workers == 0
    assert usage.allocated_vehicles == 2
    assert usage.remaining_vehicles == 0
    assert usage.allocated_time_hours == 4.0
    assert usage.remaining_time_hours == 4.0


def test_optimizer_empty_inputs(optimizer):
    """Test optimizer behavior with empty issue list."""
    resources = MunicipalResources(
        budget=5000.0,
        workers=3,
        vehicles=1,
        time_capacity_hours=10.0,
    )

    plan = optimizer.optimize_allocation([], [], resources)

    assert plan.selected_issue_ids == []
    assert plan.deferred_issue_ids == []
    assert plan.total_benefit_score == 0.0
    assert plan.resource_usage.allocated_budget == 0.0
    assert plan.resource_usage.remaining_budget == 5000.0
    assert plan.resource_usage.allocated_workers == 0
    assert plan.resource_usage.remaining_workers == 3
    assert plan.resource_usage.allocated_vehicles == 0
    assert plan.resource_usage.remaining_vehicles == 1
    assert plan.resource_usage.allocated_time_hours == 0.0
    assert plan.resource_usage.remaining_time_hours == 10.0


def test_optimizer_missing_mcda_result_raises_error(optimizer):
    """Test that missing MCDA score result for an issue raises ValueError."""
    resources = MunicipalResources(budget=10000.0, workers=5, vehicles=2)
    issues = [
        CivicIssue(
            id="ISSUE-1",
            estimated_cost=1000.0,
            required_workers=1,
            required_vehicles=1,
            required_time_hours=2.0,
        ),
        CivicIssue(
            id="ISSUE-2",
            estimated_cost=2000.0,
            required_workers=1,
            required_vehicles=1,
            required_time_hours=2.0,
        ),
    ]
    mcda_results = [
        create_dummy_mcda_result("ISSUE-1", 75.0),
        # ISSUE-2 is missing from MCDA results
    ]

    with pytest.raises(ValueError, match="Missing MCDA score result for issue ID: 'ISSUE-2'"):
        optimizer.optimize_allocation(issues, mcda_results, resources)


def test_optimizer_duplicate_issue_ids_raises_error(optimizer):
    """Test that duplicate issue IDs in the issues list raise ValueError."""
    resources = MunicipalResources(budget=10000.0, workers=5, vehicles=2)
    issues = [
        CivicIssue(
            id="DUP-1",
            estimated_cost=1000.0,
            required_workers=1,
            required_vehicles=1,
            required_time_hours=2.0,
        ),
        CivicIssue(
            id="DUP-1",
            estimated_cost=2000.0,
            required_workers=2,
            required_vehicles=1,
            required_time_hours=3.0,
        ),
    ]
    mcda_results = [
        create_dummy_mcda_result("DUP-1", 80.0),
    ]

    with pytest.raises(ValueError, match="Duplicate issue ID found: 'DUP-1'"):
        optimizer.optimize_allocation(issues, mcda_results, resources)


def test_optimizer_duplicate_mcda_ids_raises_error(optimizer):
    """Test that duplicate issue IDs in mcda_results raise ValueError."""
    resources = MunicipalResources(budget=10000.0, workers=5, vehicles=2)
    issues = [
        CivicIssue(
            id="ISSUE-1",
            estimated_cost=1000.0,
            required_workers=1,
            required_vehicles=1,
            required_time_hours=2.0,
        ),
    ]
    mcda_results = [
        create_dummy_mcda_result("ISSUE-1", 80.0),
        create_dummy_mcda_result("ISSUE-1", 85.0),
    ]

    with pytest.raises(ValueError, match="Duplicate MCDA result for issue ID: 'ISSUE-1'"):
        optimizer.optimize_allocation(issues, mcda_results, resources)


def test_optimizer_missing_resource_fields_deferred_not_invented(optimizer):
    """Test that issues with missing resource requirements are marked deferred
    and never have values invented or silently treated as zero.
    """
    resources = MunicipalResources(
        budget=100000.0,
        workers=50,
        vehicles=20,
        time_capacity_hours=100.0,
    )

    issues = [
        CivicIssue(
            id="MISSING-COST",
            estimated_cost=None,  # Missing cost
            required_workers=2,
            required_vehicles=1,
            required_time_hours=3.0,
        ),
        CivicIssue(
            id="MISSING-WORKERS",
            estimated_cost=1000.0,
            required_workers=None,  # Missing workers
            required_vehicles=1,
            required_time_hours=3.0,
        ),
        CivicIssue(
            id="MISSING-VEHICLES",
            estimated_cost=1000.0,
            required_workers=2,
            required_vehicles=None,  # Missing vehicles
            required_time_hours=3.0,
        ),
        CivicIssue(
            id="MISSING-TIME",
            estimated_cost=1000.0,
            required_workers=2,
            required_vehicles=1,
            required_time_hours=None,  # Missing time
        ),
        CivicIssue(
            id="VALID-ISSUE",
            estimated_cost=2000.0,
            required_workers=2,
            required_vehicles=1,
            required_time_hours=4.0,
        ),
    ]

    mcda_results = [
        create_dummy_mcda_result("MISSING-COST", 99.0),
        create_dummy_mcda_result("MISSING-WORKERS", 98.0),
        create_dummy_mcda_result("MISSING-VEHICLES", 97.0),
        create_dummy_mcda_result("MISSING-TIME", 96.0),
        create_dummy_mcda_result("VALID-ISSUE", 50.0),
    ]

    plan = optimizer.optimize_allocation(issues, mcda_results, resources)

    # Only VALID-ISSUE should be selected despite lower priority score
    assert plan.selected_issue_ids == ["VALID-ISSUE"]
    assert set(plan.deferred_issue_ids) == {
        "MISSING-COST",
        "MISSING-WORKERS",
        "MISSING-VEHICLES",
        "MISSING-TIME",
    }
    assert plan.total_benefit_score == 50.0
    assert plan.resource_usage.allocated_budget == 2000.0
    assert plan.resource_usage.allocated_workers == 2
    assert plan.resource_usage.allocated_vehicles == 1
    assert plan.resource_usage.allocated_time_hours == 4.0


def test_optimizer_zero_capacity_resources(optimizer):
    """Test optimizer with zero budget, workers, vehicles, or time capacity."""
    issues = [
        CivicIssue(
            id="ISSUE-1",
            estimated_cost=1000.0,
            required_workers=2,
            required_vehicles=1,
            required_time_hours=3.0,
        ),
    ]
    mcda_results = [create_dummy_mcda_result("ISSUE-1", 85.0)]

    # Zero budget
    res_zero_budget = MunicipalResources(budget=0.0, workers=5, vehicles=2, time_capacity_hours=8.0)
    plan1 = optimizer.optimize_allocation(issues, mcda_results, res_zero_budget)
    assert plan1.selected_issue_ids == []
    assert plan1.deferred_issue_ids == ["ISSUE-1"]
    assert plan1.total_benefit_score == 0.0

    # Zero workers
    res_zero_workers = MunicipalResources(budget=10000.0, workers=0, vehicles=2, time_capacity_hours=8.0)
    plan2 = optimizer.optimize_allocation(issues, mcda_results, res_zero_workers)
    assert plan2.selected_issue_ids == []
    assert plan2.deferred_issue_ids == ["ISSUE-1"]

    # Zero vehicles
    res_zero_vehicles = MunicipalResources(budget=10000.0, workers=5, vehicles=0, time_capacity_hours=8.0)
    plan3 = optimizer.optimize_allocation(issues, mcda_results, res_zero_vehicles)
    assert plan3.selected_issue_ids == []
    assert plan3.deferred_issue_ids == ["ISSUE-1"]

    # Zero time capacity
    res_zero_time = MunicipalResources(budget=10000.0, workers=5, vehicles=2, time_capacity_hours=0.0)
    plan4 = optimizer.optimize_allocation(issues, mcda_results, res_zero_time)
    assert plan4.selected_issue_ids == []
    assert plan4.deferred_issue_ids == ["ISSUE-1"]


def test_optimizer_individual_exceeding_capacity(optimizer):
    """Test that issues exceeding any single resource limit are deferred."""
    resources = MunicipalResources(
        budget=5000.0,
        workers=3,
        vehicles=1,
        time_capacity_hours=4.0,
    )

    issues = [
        CivicIssue(
            id="EXCEED-BUDGET",
            estimated_cost=6000.0,
            required_workers=1,
            required_vehicles=1,
            required_time_hours=2.0,
        ),
        CivicIssue(
            id="EXCEED-WORKERS",
            estimated_cost=1000.0,
            required_workers=4,
            required_vehicles=1,
            required_time_hours=2.0,
        ),
        CivicIssue(
            id="EXCEED-VEHICLES",
            estimated_cost=1000.0,
            required_workers=1,
            required_vehicles=2,
            required_time_hours=2.0,
        ),
        CivicIssue(
            id="EXCEED-TIME",
            estimated_cost=1000.0,
            required_workers=1,
            required_vehicles=1,
            required_time_hours=5.0,
        ),
        CivicIssue(
            id="FEASIBLE",
            estimated_cost=2000.0,
            required_workers=2,
            required_vehicles=1,
            required_time_hours=3.0,
        ),
    ]

    mcda_results = [
        create_dummy_mcda_result("EXCEED-BUDGET", 95.0),
        create_dummy_mcda_result("EXCEED-WORKERS", 90.0),
        create_dummy_mcda_result("EXCEED-VEHICLES", 85.0),
        create_dummy_mcda_result("EXCEED-TIME", 80.0),
        create_dummy_mcda_result("FEASIBLE", 60.0),
    ]

    plan = optimizer.optimize_allocation(issues, mcda_results, resources)

    assert plan.selected_issue_ids == ["FEASIBLE"]
    assert set(plan.deferred_issue_ids) == {
        "EXCEED-BUDGET",
        "EXCEED-WORKERS",
        "EXCEED-VEHICLES",
        "EXCEED-TIME",
    }
    assert plan.total_benefit_score == 60.0


def test_optimizer_no_time_capacity_constraint(optimizer):
    """Test optimization when time_capacity_hours is None (no time constraint applied)."""
    resources = MunicipalResources(
        budget=10000.0,
        workers=5,
        vehicles=2,
        time_capacity_hours=None,  # No time limit
    )

    issues = [
        CivicIssue(
            id="LONG-1",
            estimated_cost=3000.0,
            required_workers=2,
            required_vehicles=1,
            required_time_hours=48.0,  # 48 hours
        ),
        CivicIssue(
            id="LONG-2",
            estimated_cost=3000.0,
            required_workers=2,
            required_vehicles=1,
            required_time_hours=72.0,  # 72 hours
        ),
    ]

    mcda_results = [
        create_dummy_mcda_result("LONG-1", 85.0),
        create_dummy_mcda_result("LONG-2", 80.0),
    ]

    plan = optimizer.optimize_allocation(issues, mcda_results, resources)

    # Both should be selected because time is unconstrained
    assert set(plan.selected_issue_ids) == {"LONG-1", "LONG-2"}
    assert plan.total_benefit_score == 165.0
    assert plan.resource_usage.allocated_time_hours == 120.0
    assert plan.resource_usage.remaining_time_hours == 0.0


def test_optimizer_all_issues_feasible(optimizer):
    """Test scenario where all issues are feasible within available resources."""
    resources = MunicipalResources(
        budget=50000.0,
        workers=20,
        vehicles=10,
        time_capacity_hours=100.0,
    )

    issues = [
        CivicIssue(
            id=f"ISSUE-{i}",
            estimated_cost=2000.0,
            required_workers=2,
            required_vehicles=1,
            required_time_hours=5.0,
        )
        for i in range(1, 6)
    ]

    mcda_results = [create_dummy_mcda_result(f"ISSUE-{i}", 50.0 + i * 5) for i in range(1, 6)]

    plan = optimizer.optimize_allocation(issues, mcda_results, resources)

    assert len(plan.selected_issue_ids) == 5
    assert len(plan.deferred_issue_ids) == 0
    assert plan.total_benefit_score == sum(50.0 + i * 5 for i in range(1, 6))
    assert plan.resource_usage.allocated_budget == 10000.0
    assert plan.resource_usage.remaining_budget == 40000.0


def test_optimizer_no_issues_feasible(optimizer):
    """Test scenario where no issue is feasible due to very tight constraints."""
    resources = MunicipalResources(
        budget=1000.0,
        workers=1,
        vehicles=1,
        time_capacity_hours=1.0,
    )

    issues = [
        CivicIssue(
            id="TOO-BIG-1",
            estimated_cost=5000.0,
            required_workers=3,
            required_vehicles=1,
            required_time_hours=5.0,
        ),
        CivicIssue(
            id="TOO-BIG-2",
            estimated_cost=4000.0,
            required_workers=2,
            required_vehicles=2,
            required_time_hours=4.0,
        ),
    ]

    mcda_results = [
        create_dummy_mcda_result("TOO-BIG-1", 90.0),
        create_dummy_mcda_result("TOO-BIG-2", 85.0),
    ]

    plan = optimizer.optimize_allocation(issues, mcda_results, resources)

    assert plan.selected_issue_ids == []
    assert plan.deferred_issue_ids == ["TOO-BIG-1", "TOO-BIG-2"]
    assert plan.total_benefit_score == 0.0
    assert plan.resource_usage.allocated_budget == 0.0
    assert plan.resource_usage.remaining_budget == 1000.0


def test_optimizer_float_precision_and_resource_conservation(optimizer):
    """Test precision with floating point costs/hours and verify conservation laws."""
    resources = MunicipalResources(
        budget=12345.67,
        workers=10,
        vehicles=4,
        time_capacity_hours=25.5,
    )

    issues = [
        CivicIssue(
            id="FLOAT-1",
            estimated_cost=4321.50,
            required_workers=3,
            required_vehicles=1,
            required_time_hours=8.25,
        ),
        CivicIssue(
            id="FLOAT-2",
            estimated_cost=5678.90,
            required_workers=4,
            required_vehicles=2,
            required_time_hours=10.5,
        ),
        CivicIssue(
            id="FLOAT-3",
            estimated_cost=3000.00,
            required_workers=2,
            required_vehicles=1,
            required_time_hours=5.0,
        ),
    ]

    mcda_results = [
        create_dummy_mcda_result("FLOAT-1", 85.5),
        create_dummy_mcda_result("FLOAT-2", 92.3),
        create_dummy_mcda_result("FLOAT-3", 45.0),
    ]

    plan = optimizer.optimize_allocation(issues, mcda_results, resources)

    # Cost of FLOAT-1 + FLOAT-2 = 10000.40 <= 12345.67
    # Workers = 7 <= 10
    # Vehicles = 3 <= 4
    # Time = 18.75 <= 25.5
    # Total priority = 85.5 + 92.3 = 177.8
    assert set(plan.selected_issue_ids) == {"FLOAT-1", "FLOAT-2"}
    assert plan.deferred_issue_ids == ["FLOAT-3"]
    assert plan.total_benefit_score == 177.8

    usage = plan.resource_usage
    assert abs((usage.allocated_budget + usage.remaining_budget) - resources.budget) < 0.01
    assert usage.allocated_workers + usage.remaining_workers == resources.workers
    assert usage.allocated_vehicles + usage.remaining_vehicles == resources.vehicles
    assert (
        abs((usage.allocated_time_hours + usage.remaining_time_hours) - resources.time_capacity_hours)
        < 0.01
    )

    # Non-negativity assertion
    assert usage.allocated_budget >= 0.0
    assert usage.remaining_budget >= 0.0
    assert usage.allocated_workers >= 0
    assert usage.remaining_workers >= 0
    assert usage.allocated_vehicles >= 0
    assert usage.remaining_vehicles >= 0
    assert usage.allocated_time_hours >= 0.0
    assert usage.remaining_time_hours >= 0.0
