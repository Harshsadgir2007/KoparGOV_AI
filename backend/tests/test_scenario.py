"""Unit and integration tests for the What-If Municipal Resource Scenario Engine."""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.civic_issue import CivicIssue
from app.models.resources import MunicipalResources
from app.services.scenario_service import ScenarioService


@pytest.fixture
def scenario_service():
    """Fixture providing a fresh ScenarioService instance."""
    return ScenarioService()


@pytest.fixture
def client():
    """Fixture providing a FastAPI TestClient."""
    return TestClient(app)


@pytest.fixture
def sample_synthetic_issues():
    """Synthetic demo civic issues for scenario benchmarking."""
    return [
        CivicIssue(
            id="DEMO-ISSUE-1",
            title="Main Water Pipeline Rupture (Synthetic)",
            category="Water Supply",
            severity=90.0,
            urgency=90.0,
            population_affected=800.0,
            health_safety_impact=85.0,
            location_sensitivity=90.0,
            complaint_age=20.0,
            estimated_cost=25000.0,
            required_workers=4,
            required_vehicles=1,
            required_time_hours=8.0,
        ),
        CivicIssue(
            id="DEMO-ISSUE-2",
            title="Market Road Pothole Cluster (Synthetic)",
            category="Roads",
            severity=75.0,
            urgency=70.0,
            population_affected=500.0,
            health_safety_impact=60.0,
            location_sensitivity=75.0,
            complaint_age=15.0,
            estimated_cost=15000.0,
            required_workers=3,
            required_vehicles=1,
            required_time_hours=6.0,
        ),
        CivicIssue(
            id="DEMO-ISSUE-3",
            title="Public Park Wall Collapse Risk (Synthetic)",
            category="Infrastructure",
            severity=65.0,
            urgency=60.0,
            population_affected=300.0,
            health_safety_impact=50.0,
            location_sensitivity=60.0,
            complaint_age=10.0,
            estimated_cost=10000.0,
            required_workers=2,
            required_vehicles=1,
            required_time_hours=4.0,
        ),
    ]


def test_baseline_scenario_identical_constraints(scenario_service, sample_synthetic_issues):
    """Test that setting identical baseline and scenario constraints yields zero difference."""
    resources = MunicipalResources(
        budget=50000.0,
        workers=10,
        vehicles=3,
        time_capacity_hours=24.0,
    )

    response = scenario_service.run_scenario(
        issues=sample_synthetic_issues,
        baseline_resources=resources,
        scenario_resources=resources,
    )

    assert response.status_code if hasattr(response, "status_code") else response.status == "SUCCESS"
    assert response.impact_comparison.benefit_delta == 0.0
    assert response.impact_comparison.selected_count_delta == 0
    assert len(response.allocation_diff.newly_selected_issue_ids) == 0
    assert len(response.allocation_diff.newly_deferred_issue_ids) == 0
    assert len(response.allocation_diff.unchanged_issue_ids) == 3


def test_reduced_resources_changes_allocation_demo_benchmark(scenario_service, sample_synthetic_issues):
    """Demonstrate the core What-If scenario:
    Baseline: ₹50,000 / 10 workers / 3 vehicles -> all 3 issues selected (Total cost ₹50,000, 9 workers, 3 vehicles).
    Scenario: ₹30,000 / 6 workers / 1 vehicle -> only 1 vehicle available, only 1 issue can be selected!
    """
    baseline_resources = MunicipalResources(
        budget=50000.0,
        workers=10,
        vehicles=3,
        time_capacity_hours=24.0,
    )
    scenario_resources = MunicipalResources(
        budget=30000.0,
        workers=6,
        vehicles=1,
        time_capacity_hours=24.0,
    )

    response = scenario_service.run_scenario(
        issues=sample_synthetic_issues,
        baseline_resources=baseline_resources,
        scenario_resources=scenario_resources,
    )

    assert response.status == "SUCCESS"

    # Baseline selected all 3
    assert set(response.baseline_plan.selected_issue_ids) == {
        "DEMO-ISSUE-1",
        "DEMO-ISSUE-2",
        "DEMO-ISSUE-3",
    }
    assert response.baseline_plan.resource_usage.allocated_budget == 50000.0
    assert response.baseline_plan.resource_usage.allocated_workers == 9
    assert response.baseline_plan.resource_usage.allocated_vehicles == 3

    # Scenario can only select at most 1 vehicle -> selects highest priority DEMO-ISSUE-1 (cost ₹25,000, 4 workers, 1 vehicle)
    assert response.scenario_plan.selected_issue_ids == ["DEMO-ISSUE-1"]
    assert set(response.scenario_plan.deferred_issue_ids) == {"DEMO-ISSUE-2", "DEMO-ISSUE-3"}
    assert response.scenario_plan.resource_usage.allocated_vehicles <= 1

    # Allocation diff assertions
    assert response.allocation_diff.newly_deferred_issue_ids == ["DEMO-ISSUE-2", "DEMO-ISSUE-3"]
    assert response.allocation_diff.newly_selected_issue_ids == []
    assert response.allocation_diff.unchanged_selected_issue_ids == ["DEMO-ISSUE-1"]

    # Impact comparison assertions
    assert response.impact_comparison.baseline_selected_count == 3
    assert response.impact_comparison.scenario_selected_count == 1
    assert response.impact_comparison.selected_count_delta == -2
    assert response.impact_comparison.benefit_delta < 0.0

    # Resource delta assertions
    assert response.resource_delta.budget_delta == -20000.0
    assert response.resource_delta.workers_delta == -4
    assert response.resource_delta.vehicles_delta == -2

    # Explanations explain newly deferred issues
    exp_text = " ".join(response.explanations)
    assert "DEMO-ISSUE-2" in exp_text
    assert "DEMO-ISSUE-3" in exp_text
    assert "deferred" in exp_text.lower()


def test_increased_resources_expands_allocation(scenario_service, sample_synthetic_issues):
    """Test that expanding resource availability enables previously deferred issues to be selected."""
    # Baseline tight: ₹20,000 / 3 workers / 1 vehicle -> selects DEMO-ISSUE-2 (cost 15k, 3 workers, 1 vehicle)
    baseline_resources = MunicipalResources(
        budget=20000.0,
        workers=3,
        vehicles=1,
    )
    # Scenario expanded: ₹60,000 / 12 workers / 4 vehicles -> selects all 3 issues
    scenario_resources = MunicipalResources(
        budget=60000.0,
        workers=12,
        vehicles=4,
    )

    response = scenario_service.run_scenario(
        issues=sample_synthetic_issues,
        baseline_resources=baseline_resources,
        scenario_resources=scenario_resources,
    )

    assert response.status == "SUCCESS"
    assert len(response.allocation_diff.newly_selected_issue_ids) > 0
    assert response.impact_comparison.benefit_delta > 0.0
    assert response.impact_comparison.selected_count_delta > 0


def test_mcda_scores_remain_identical_between_scenarios(scenario_service, sample_synthetic_issues):
    """Verify that MCDA scores and ranking order are 100% identical and invariant to resource limits."""
    baseline_resources = MunicipalResources(budget=10000.0, workers=2, vehicles=1)
    scenario_resources = MunicipalResources(budget=100000.0, workers=20, vehicles=10)

    response = scenario_service.run_scenario(
        issues=sample_synthetic_issues,
        baseline_resources=baseline_resources,
        scenario_resources=scenario_resources,
    )

    # Re-evaluate MCDA independently
    from app.core.mcda import MCDAEngine
    independent_mcda = MCDAEngine().evaluate_and_rank_batch(sample_synthetic_issues)

    assert len(response.mcda_rankings) == len(independent_mcda)
    for res, expected in zip(response.mcda_rankings, independent_mcda):
        assert res.issue_id == expected.issue_id
        assert res.composite_score == expected.composite_score
        assert res.priority_level == expected.priority_level
        assert res.rank == expected.rank


def test_or_tools_constraints_and_no_negative_resources(scenario_service, sample_synthetic_issues):
    """Verify all OR-Tools knapsack constraints and non-negative utilization in both plans."""
    baseline = MunicipalResources(budget=35000.0, workers=7, vehicles=2, time_capacity_hours=14.0)
    scenario = MunicipalResources(budget=25000.0, workers=5, vehicles=1, time_capacity_hours=10.0)

    response = scenario_service.run_scenario(
        issues=sample_synthetic_issues,
        baseline_resources=baseline,
        scenario_resources=scenario,
    )

    # Check baseline usage
    bu = response.baseline_plan.resource_usage
    assert bu.allocated_budget <= baseline.budget
    assert bu.remaining_budget >= 0.0
    assert bu.allocated_workers <= baseline.workers
    assert bu.remaining_workers >= 0
    assert bu.allocated_vehicles <= baseline.vehicles
    assert bu.remaining_vehicles >= 0
    assert bu.allocated_time_hours <= baseline.time_capacity_hours
    assert bu.remaining_time_hours >= 0.0

    # Check scenario usage
    su = response.scenario_plan.resource_usage
    assert su.allocated_budget <= scenario.budget
    assert su.remaining_budget >= 0.0
    assert su.allocated_workers <= scenario.workers
    assert su.remaining_workers >= 0
    assert su.allocated_vehicles <= scenario.vehicles
    assert su.remaining_vehicles >= 0
    assert su.allocated_time_hours <= scenario.time_capacity_hours
    assert su.remaining_time_hours >= 0.0


def test_scenario_determinism(scenario_service, sample_synthetic_issues):
    """Verify that repeated scenario runs with identical inputs produce identical responses."""
    baseline = MunicipalResources(budget=40000.0, workers=8, vehicles=2)
    scenario = MunicipalResources(budget=20000.0, workers=4, vehicles=1)

    r1 = scenario_service.run_scenario(sample_synthetic_issues, baseline, scenario)
    r2 = scenario_service.run_scenario(sample_synthetic_issues, baseline, scenario)

    assert r1.model_dump() == r2.model_dump()


def test_duplicate_issue_ids_raises_error(scenario_service):
    """Verify that duplicate issue IDs in scenario request raise ValueError."""
    dup_issues = [
        CivicIssue(id="DUP-1", severity=70.0, urgency=70.0, population_affected=100.0, health_safety_impact=70.0, location_sensitivity=70.0, complaint_age=5.0),
        CivicIssue(id="DUP-1", severity=80.0, urgency=80.0, population_affected=200.0, health_safety_impact=80.0, location_sensitivity=80.0, complaint_age=5.0),
    ]
    res = MunicipalResources(budget=10000.0, workers=5, vehicles=2)

    with pytest.raises(ValueError, match="Duplicate issue IDs"):
        scenario_service.run_scenario(dup_issues, res, res)


def test_empty_issues_list_handled_gracefully(scenario_service):
    """Verify that empty issues list returns a valid zeroed response without errors."""
    res = MunicipalResources(budget=10000.0, workers=5, vehicles=2)
    response = scenario_service.run_scenario([], res, res)

    assert response.status == "SUCCESS"
    assert response.impact_comparison.baseline_selected_count == 0
    assert response.impact_comparison.scenario_selected_count == 0


def test_api_scenario_endpoint(client):
    """Test POST /api/cie/scenario through FastAPI REST TestClient."""
    payload = {
        "issues": [
            {
                "id": "API-SCENARIO-1",
                "title": "Major Pipe Leak (Synthetic)",
                "severity": 90.0,
                "urgency": 90.0,
                "population_affected": 800.0,
                "health_safety_impact": 85.0,
                "location_sensitivity": 90.0,
                "complaint_age": 20.0,
                "estimated_cost": 25000.0,
                "required_workers": 4,
                "required_vehicles": 1,
                "required_time_hours": 8.0,
            },
            {
                "id": "API-SCENARIO-2",
                "title": "Road Repair (Synthetic)",
                "severity": 70.0,
                "urgency": 70.0,
                "population_affected": 400.0,
                "health_safety_impact": 60.0,
                "location_sensitivity": 70.0,
                "complaint_age": 10.0,
                "estimated_cost": 15000.0,
                "required_workers": 3,
                "required_vehicles": 1,
                "required_time_hours": 6.0,
            },
        ],
        "baseline_resources": {
            "budget": 50000.0,
            "workers": 10,
            "vehicles": 3,
            "time_capacity_hours": 24.0,
        },
        "scenario_resources": {
            "budget": 30000.0,
            "workers": 6,
            "vehicles": 1,
            "time_capacity_hours": 24.0,
        },
    }

    response = client.post("/api/cie/scenario", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "SUCCESS"
    assert len(data["mcda_rankings"]) == 2
    assert "baseline_plan" in data
    assert "scenario_plan" in data
    assert "allocation_diff" in data
    assert "impact_comparison" in data
    assert "resource_delta" in data
    assert len(data["explanations"]) > 0


def test_api_scenario_invalid_schema_returns_422(client):
    """Test malformed request schema returns HTTP 422."""
    # Missing scenario_resources
    bad_payload = {
        "issues": [],
        "baseline_resources": {
            "budget": 1000.0,
            "workers": 2,
            "vehicles": 1,
        },
    }
    response = client.post("/api/cie/scenario", json=bad_payload)
    assert response.status_code == 422
