"""Unit and integration tests for the CIE End-to-End Pipeline Service."""

import pytest
from app.models.civic_issue import CivicIssue, PriorityLevel, ValidationStatus
from app.models.resources import MunicipalResources
from app.services.pipeline import CIEPipelineService


@pytest.fixture
def pipeline_service():
    """Fixture providing a CIEPipelineService instance."""
    return CIEPipelineService()


def test_pipeline_demo_non_greedy_optimization(pipeline_service):
    """IMPORTANT DEMO TEST:
    Verifies that the entire pipeline:
    1. Runs Data Validation
    2. Runs MCDA Prioritization (A has high score ~100, B and C have ~60)
    3. Runs OR-Tools Optimization (chooses B + C instead of A)
    4. Generates transparent rule-based explanations

    Setup:
    Issue A: severity=100, urgency=100, pop=1000, safety=100, loc=100, age=100 (MCDA score = 100.0)
             cost=7000, workers=4, vehicles=1, time=4
    Issue B: severity=60, urgency=60, pop=600, safety=60, loc=60, age=60 (MCDA score = 60.0)
             cost=4000, workers=2, vehicles=1, time=2
    Issue C: severity=60, urgency=60, pop=600, safety=60, loc=60, age=60 (MCDA score = 60.0)
             cost=4000, workers=2, vehicles=1, time=2

    Resources: budget=10000, workers=4, vehicles=2, time=8

    The pipeline MUST recommend B + C (benefit = 120.0) rather than A (benefit = 100.0).
    """
    resources = MunicipalResources(
        budget=10000.0,
        workers=4,
        vehicles=2,
        time_capacity_hours=8.0,
    )

    issues = [
        CivicIssue(
            id="ISSUE-A",
            title="High Priority Costly Issue A",
            severity=100.0,
            urgency=100.0,
            population_affected=1000.0,
            health_safety_impact=100.0,
            location_sensitivity=100.0,
            complaint_age=100.0,
            estimated_cost=7000.0,
            required_workers=4,
            required_vehicles=1,
            required_time_hours=4.0,
        ),
        CivicIssue(
            id="ISSUE-B",
            title="Medium Priority Efficient Issue B",
            severity=60.0,
            urgency=60.0,
            population_affected=600.0,
            health_safety_impact=60.0,
            location_sensitivity=60.0,
            complaint_age=60.0,
            estimated_cost=4000.0,
            required_workers=2,
            required_vehicles=1,
            required_time_hours=2.0,
        ),
        CivicIssue(
            id="ISSUE-C",
            title="Medium Priority Efficient Issue C",
            severity=60.0,
            urgency=60.0,
            population_affected=600.0,
            health_safety_impact=60.0,
            location_sensitivity=60.0,
            complaint_age=60.0,
            estimated_cost=4000.0,
            required_workers=2,
            required_vehicles=1,
            required_time_hours=2.0,
        ),
    ]

    result = pipeline_service.run_pipeline(issues, resources)

    # 1. Validation Checks
    assert result.valid_issue_count == 3
    assert result.flagged_issue_count == 0
    assert len(result.validation_reports) == 3
    assert all(r.is_valid for r in result.validation_reports)

    # 2. MCDA Checks (A has highest score, B and C have 60.0)
    assert len(result.mcda_rankings) == 3
    rank_map = {r.issue_id: r for r in result.mcda_rankings}
    assert rank_map["ISSUE-A"].composite_score == 100.0
    assert rank_map["ISSUE-A"].priority_level == PriorityLevel.CRITICAL
    assert rank_map["ISSUE-A"].rank == 1
    assert rank_map["ISSUE-B"].composite_score == 60.0
    assert rank_map["ISSUE-C"].composite_score == 60.0

    # 3. Optimization Checks (Must select B + C, defer A)
    plan = result.allocation_plan
    assert set(plan.selected_issue_ids) == {"ISSUE-B", "ISSUE-C"}
    assert plan.deferred_issue_ids == ["ISSUE-A"]
    assert plan.total_benefit_score == 120.0
    assert plan.resource_usage.allocated_budget == 8000.0
    assert plan.resource_usage.remaining_budget == 2000.0
    assert plan.resource_usage.allocated_workers == 4
    assert plan.resource_usage.remaining_workers == 0

    # 4. Explanations Checks
    assert len(result.explanations) == 3
    exp_map = {e.issue_id: e for e in result.explanations}

    # Issue A: CRITICAL priority but DEFERRED
    assert exp_map["ISSUE-A"].priority_level == PriorityLevel.CRITICAL
    assert exp_map["ISSUE-A"].is_recommended_for_allocation is False
    assert exp_map["ISSUE-A"].recommendation_status == "DEFERRED"
    assert "resource constraints" in exp_map["ISSUE-A"].allocation_rationale.lower()

    # Issues B & C: HIGH priority and RECOMMENDED
    assert exp_map["ISSUE-B"].is_recommended_for_allocation is True
    assert exp_map["ISSUE-B"].recommendation_status == "RECOMMENDED"
    assert exp_map["ISSUE-C"].is_recommended_for_allocation is True
    assert exp_map["ISSUE-C"].recommendation_status == "RECOMMENDED"


def test_pipeline_complete_end_to_end(pipeline_service):
    """Test full pipeline with diverse issues, complete validation, MCDA, optimization, and explanations."""
    resources = MunicipalResources(
        budget=20000.0,
        workers=8,
        vehicles=3,
        time_capacity_hours=16.0,
    )

    issues = [
        CivicIssue(
            id="ROAD-1",
            title="Pothole near Hospital",
            severity=85.0,
            urgency=90.0,
            population_affected=500.0,
            health_safety_impact=80.0,
            location_sensitivity=90.0,
            complaint_age=30.0,
            estimated_cost=5000.0,
            required_workers=2,
            required_vehicles=1,
            required_time_hours=4.0,
        ),
        CivicIssue(
            id="WATER-1",
            title="Broken Pipe Main Street",
            severity=90.0,
            urgency=95.0,
            population_affected=800.0,
            health_safety_impact=85.0,
            location_sensitivity=80.0,
            complaint_age=20.0,
            estimated_cost=8000.0,
            required_workers=3,
            required_vehicles=1,
            required_time_hours=6.0,
        ),
        CivicIssue(
            id="PARK-1",
            title="Faded Sign in Park",
            severity=20.0,
            urgency=15.0,
            population_affected=50.0,
            health_safety_impact=10.0,
            location_sensitivity=20.0,
            complaint_age=5.0,
            estimated_cost=1000.0,
            required_workers=1,
            required_vehicles=0,
            required_time_hours=2.0,
        ),
    ]

    response = pipeline_service.run_pipeline(issues, resources)

    assert response.status == "SUCCESS"
    assert response.valid_issue_count == 3
    assert response.flagged_issue_count == 0
    assert len(response.mcda_rankings) == 3
    assert len(response.explanations) == 3
    assert response.allocation_plan is not None

    # Verify resource conservation
    usage = response.allocation_plan.resource_usage
    assert abs(usage.allocated_budget + usage.remaining_budget - resources.budget) < 0.01
    assert usage.allocated_workers + usage.remaining_workers == resources.workers


def test_pipeline_handles_invalid_and_missing_data_issues(pipeline_service):
    """Test that invalid/missing data issues are flagged and excluded from MCDA/optimization."""
    resources = MunicipalResources(budget=10000.0, workers=5, vehicles=2)

    issues = [
        CivicIssue(
            id="VALID-1",
            severity=75.0,
            urgency=70.0,
            population_affected=300.0,
            health_safety_impact=70.0,
            location_sensitivity=60.0,
            complaint_age=15.0,
            estimated_cost=3000.0,
            required_workers=2,
            required_vehicles=1,
            required_time_hours=3.0,
        ),
        CivicIssue(
            id="MISSING-URGENCY",
            severity=80.0,
            urgency=None,  # Missing required field
            population_affected=400.0,
            health_safety_impact=80.0,
            location_sensitivity=70.0,
            complaint_age=10.0,
            estimated_cost=2000.0,
            required_workers=1,
            required_vehicles=1,
            required_time_hours=2.0,
        ),
        CivicIssue(
            id="OUT-OF-RANGE",
            severity=150.0,  # Invalid out of range
            urgency=80.0,
            population_affected=400.0,
            health_safety_impact=80.0,
            location_sensitivity=70.0,
            complaint_age=10.0,
            estimated_cost=2000.0,
            required_workers=1,
            required_vehicles=1,
            required_time_hours=2.0,
        ),
    ]

    response = pipeline_service.run_pipeline(issues, resources)

    assert response.valid_issue_count == 1
    assert response.flagged_issue_count == 2

    report_map = {r.issue_id: r for r in response.validation_reports}
    assert report_map["VALID-1"].is_valid is True
    assert report_map["MISSING-URGENCY"].is_valid is False
    assert report_map["MISSING-URGENCY"].status == ValidationStatus.MISSING_DATA
    assert report_map["OUT-OF-RANGE"].is_valid is False
    assert report_map["OUT-OF-RANGE"].status == ValidationStatus.INVALID

    # Only VALID-1 should be in MCDA and explanations
    assert len(response.mcda_rankings) == 1
    assert response.mcda_rankings[0].issue_id == "VALID-1"
    assert len(response.explanations) == 1
    assert response.explanations[0].issue_id == "VALID-1"


def test_pipeline_missing_resource_requirements_deferred_not_invented(pipeline_service):
    """Test that issues with missing resource requirements are marked deferred
    and no values are fabricated.
    """
    resources = MunicipalResources(budget=50000.0, workers=10, vehicles=5)

    issues = [
        CivicIssue(
            id="NO-COST-ISSUE",
            severity=95.0,
            urgency=95.0,
            population_affected=1000.0,
            health_safety_impact=95.0,
            location_sensitivity=90.0,
            complaint_age=50.0,
            estimated_cost=None,  # Missing cost
            required_workers=2,
            required_vehicles=1,
            required_time_hours=4.0,
        ),
        CivicIssue(
            id="VALID-COMPLETE-ISSUE",
            severity=60.0,
            urgency=60.0,
            population_affected=500.0,
            health_safety_impact=60.0,
            location_sensitivity=60.0,
            complaint_age=20.0,
            estimated_cost=3000.0,
            required_workers=2,
            required_vehicles=1,
            required_time_hours=3.0,
        ),
    ]

    response = pipeline_service.run_pipeline(issues, resources)

    assert response.valid_issue_count == 2  # MCDA factors are valid
    assert len(response.mcda_rankings) == 2

    # NO-COST-ISSUE has high score but must be DEFERRED because resources are incomplete
    plan = response.allocation_plan
    assert plan.selected_issue_ids == ["VALID-COMPLETE-ISSUE"]
    assert plan.deferred_issue_ids == ["NO-COST-ISSUE"]

    exp_map = {e.issue_id: e for e in response.explanations}
    assert exp_map["NO-COST-ISSUE"].is_recommended_for_allocation is False
    assert exp_map["NO-COST-ISSUE"].recommendation_status == "DEFERRED"
    assert "incomplete resource requirements" in exp_map["NO-COST-ISSUE"].allocation_rationale


def test_pipeline_duplicate_issue_ids_raises_error(pipeline_service):
    """Test that duplicate issue IDs in input raise ValueError."""
    resources = MunicipalResources(budget=10000.0, workers=5, vehicles=2)
    issues = [
        CivicIssue(
            id="DUP-ID",
            severity=70.0,
            urgency=70.0,
            population_affected=100.0,
            health_safety_impact=70.0,
            location_sensitivity=70.0,
            complaint_age=10.0,
        ),
        CivicIssue(
            id="DUP-ID",
            severity=80.0,
            urgency=80.0,
            population_affected=200.0,
            health_safety_impact=80.0,
            location_sensitivity=80.0,
            complaint_age=20.0,
        ),
    ]

    with pytest.raises(ValueError, match="Duplicate issue ID found in input: 'DUP-ID'"):
        pipeline_service.run_pipeline(issues, resources)


def test_pipeline_empty_issue_list(pipeline_service):
    """Test pipeline execution with an empty issue list."""
    resources = MunicipalResources(budget=5000.0, workers=4, vehicles=2, time_capacity_hours=10.0)
    response = pipeline_service.run_pipeline([], resources)

    assert response.status == "SUCCESS"
    assert response.valid_issue_count == 0
    assert response.flagged_issue_count == 0
    assert response.validation_reports == []
    assert response.mcda_rankings == []
    assert response.explanations == []
    assert response.allocation_plan.selected_issue_ids == []
    assert response.allocation_plan.total_benefit_score == 0.0
    assert response.allocation_plan.resource_usage.remaining_budget == 5000.0


def test_pipeline_zero_resources(pipeline_service):
    """Test pipeline execution when all available municipal resources are zero."""
    resources = MunicipalResources(budget=0.0, workers=0, vehicles=0, time_capacity_hours=0.0)

    issues = [
        CivicIssue(
            id="ISSUE-1",
            severity=80.0,
            urgency=80.0,
            population_affected=500.0,
            health_safety_impact=80.0,
            location_sensitivity=80.0,
            complaint_age=20.0,
            estimated_cost=2000.0,
            required_workers=2,
            required_vehicles=1,
            required_time_hours=4.0,
        ),
    ]

    response = pipeline_service.run_pipeline(issues, resources)

    assert response.status == "SUCCESS"
    assert response.valid_issue_count == 1
    assert response.allocation_plan.selected_issue_ids == []
    assert response.allocation_plan.deferred_issue_ids == ["ISSUE-1"]
    assert response.allocation_plan.total_benefit_score == 0.0
    assert response.explanations[0].recommendation_status == "DEFERRED"


def test_pipeline_determinism(pipeline_service):
    """Test that running the pipeline repeatedly on identical data produces identical output."""
    resources = MunicipalResources(budget=15000.0, workers=6, vehicles=2, time_capacity_hours=12.0)

    issues = [
        CivicIssue(
            id=f"ISSUE-{i}",
            severity=float(50 + i * 10),
            urgency=float(50 + i * 8),
            population_affected=float(100 * i),
            health_safety_impact=float(50 + i * 5),
            location_sensitivity=float(40 + i * 10),
            complaint_age=float(5 * i),
            estimated_cost=float(2000 * i),
            required_workers=i,
            required_vehicles=1,
            required_time_hours=float(2 * i),
        )
        for i in range(1, 4)
    ]

    res1 = pipeline_service.run_pipeline(issues, resources)
    res2 = pipeline_service.run_pipeline(issues, resources)

    assert res1.model_dump() == res2.model_dump()


def test_pipeline_all_invalid_issues_status(pipeline_service):
    """Test pipeline execution when all input issues fail validation."""
    resources = MunicipalResources(budget=10000.0, workers=5, vehicles=2)

    issues = [
        CivicIssue(id="INV-1", severity=None),
        CivicIssue(id="INV-2", severity=-10.0),
    ]

    response = pipeline_service.run_pipeline(issues, resources)

    assert response.status == "NO_VALID_ISSUES"
    assert response.valid_issue_count == 0
    assert response.flagged_issue_count == 2
    assert response.mcda_rankings == []
    assert response.allocation_plan.selected_issue_ids == []
    assert len(response.allocation_plan.deferred_issue_ids) == 2
