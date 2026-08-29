"""Unit tests for the Rule-Based Explanation Engine."""

import pytest
from app.core.explainer import ExplanationEngine
from app.models.civic_issue import CivicIssue, PriorityLevel
from app.models.decision import (
    FactorContribution,
    MCDAFactorScores,
    MCDAScoreResult,
    OptimizationAllocationPlan,
)
from app.models.resources import ResourceUsage


@pytest.fixture
def explainer():
    """Fixture providing an ExplanationEngine instance."""
    return ExplanationEngine()


def create_sample_mcda_result(
    issue_id: str,
    severity: float = 85.0,
    urgency: float = 90.0,
    population: float = 80.0,
    health_safety: float = 80.0,
    location: float = 90.0,
    complaint_age: float = 75.0,
) -> MCDAScoreResult:
    """Helper to construct an exact MCDAScoreResult with factor contributions."""
    weights = {
        "severity": 0.25,
        "urgency": 0.20,
        "population_affected": 0.20,
        "health_safety_impact": 0.15,
        "location_sensitivity": 0.10,
        "complaint_age": 0.10,
    }

    weighted_contribs = {
        "severity": round(severity * weights["severity"], 4),
        "urgency": round(urgency * weights["urgency"], 4),
        "population_affected": round(population * weights["population_affected"], 4),
        "health_safety_impact": round(health_safety * weights["health_safety_impact"], 4),
        "location_sensitivity": round(location * weights["location_sensitivity"], 4),
        "complaint_age": round(complaint_age * weights["complaint_age"], 4),
    }

    composite_score = round(sum(weighted_contribs.values()), 2)
    priority = (
        PriorityLevel.CRITICAL
        if composite_score >= 80.0
        else PriorityLevel.HIGH
        if composite_score >= 60.0
        else PriorityLevel.MEDIUM
        if composite_score >= 40.0
        else PriorityLevel.LOW
    )

    factor_scores = MCDAFactorScores(
        normalized_severity=severity,
        normalized_urgency=urgency,
        normalized_population_affected=population,
        normalized_health_safety_impact=health_safety,
        normalized_location_sensitivity=location,
        normalized_complaint_age=complaint_age,
        factor_weights=weights,
        weighted_contributions=weighted_contribs,
    )

    return MCDAScoreResult(
        issue_id=issue_id,
        composite_score=composite_score,
        priority_level=priority,
        factor_scores=factor_scores,
    )


def test_selected_critical_issue(explainer):
    """Test explanation generation for a selected CRITICAL priority issue."""
    issue = CivicIssue(
        id="CRIT-1",
        title="Major Water Main Break",
        estimated_cost=5000.0,
        required_workers=4,
        required_vehicles=2,
        required_time_hours=6.0,
    )
    mcda_res = create_sample_mcda_result(
        issue_id="CRIT-1",
        severity=90.0,
        urgency=95.0,
        population=85.0,
        health_safety=90.0,
        location=80.0,
        complaint_age=70.0,
    )

    explanation = explainer.generate_explanation(issue, mcda_res, is_selected=True)

    assert explanation.issue_id == "CRIT-1"
    assert explanation.priority_level == PriorityLevel.CRITICAL
    assert explanation.composite_score == mcda_res.composite_score
    assert explanation.is_recommended_for_allocation is True
    assert explanation.recommendation_status == "RECOMMENDED"
    assert "Selected for immediate action" in explanation.allocation_rationale
    assert explanation.resource_requirements["estimated_cost"] == 5000.0
    assert explanation.resource_requirements["required_workers"] == 4.0
    assert explanation.resource_requirements["required_vehicles"] == 2.0
    assert explanation.resource_requirements["required_time_hours"] == 6.0
    assert any("Severity contributed" in r for r in explanation.reasons)
    assert any("Recommended for action" in r for r in explanation.reasons)


def test_selected_high_priority_issue(explainer):
    """Test explanation generation for a selected HIGH priority issue."""
    issue = CivicIssue(
        id="HIGH-1",
        title="Traffic Signal Malfunction",
        estimated_cost=3000.0,
        required_workers=2,
        required_vehicles=1,
        required_time_hours=4.0,
    )
    mcda_res = create_sample_mcda_result(
        issue_id="HIGH-1",
        severity=70.0,
        urgency=75.0,
        population=65.0,
        health_safety=70.0,
        location=60.0,
        complaint_age=50.0,
    )

    explanation = explainer.generate_explanation(issue, mcda_res, is_selected=True)

    assert explanation.issue_id == "HIGH-1"
    assert explanation.priority_level == PriorityLevel.HIGH
    assert explanation.is_recommended_for_allocation is True
    assert explanation.recommendation_status == "RECOMMENDED"
    assert "RECOMMENDED for immediate action" in explanation.summary


def test_deferred_high_priority_issue(explainer):
    """Test explanation for a HIGH/CRITICAL priority issue deferred due to resource limits."""
    issue = CivicIssue(
        id="HIGH-EXPENSIVE",
        title="Major Bridge Overhaul",
        estimated_cost=50000.0,
        required_workers=10,
        required_vehicles=5,
        required_time_hours=40.0,
    )
    mcda_res = create_sample_mcda_result(
        issue_id="HIGH-EXPENSIVE",
        severity=95.0,
        urgency=90.0,
        population=90.0,
        health_safety=95.0,
        location=90.0,
        complaint_age=80.0,
    )

    explanation = explainer.generate_explanation(issue, mcda_res, is_selected=False)

    assert explanation.issue_id == "HIGH-EXPENSIVE"
    assert explanation.priority_level == PriorityLevel.CRITICAL
    assert explanation.is_recommended_for_allocation is False
    assert explanation.recommendation_status == "DEFERRED"
    # Verify we do NOT claim it had lower priority; it is deferred due to capacity
    assert "resource constraints" in explanation.allocation_rationale.lower()
    assert "DEFERRED" in explanation.summary


def test_deferred_low_priority_issue(explainer):
    """Test explanation for a LOW priority issue that is deferred."""
    issue = CivicIssue(
        id="LOW-1",
        title="Park Bench Repaint",
        estimated_cost=500.0,
        required_workers=1,
        required_vehicles=0,
        required_time_hours=2.0,
    )
    mcda_res = create_sample_mcda_result(
        issue_id="LOW-1",
        severity=20.0,
        urgency=15.0,
        population=10.0,
        health_safety=10.0,
        location=20.0,
        complaint_age=5.0,
    )

    explanation = explainer.generate_explanation(issue, mcda_res, is_selected=False)

    assert explanation.issue_id == "LOW-1"
    assert explanation.priority_level == PriorityLevel.LOW
    assert explanation.is_recommended_for_allocation is False
    assert explanation.recommendation_status == "DEFERRED"


def test_top_factor_identification(explainer):
    """Verify that the top contributing factor is correctly identified and ranked."""
    issue = CivicIssue(
        id="TOP-FACTOR-TEST",
        estimated_cost=1000.0,
        required_workers=1,
        required_vehicles=1,
        required_time_hours=1.0,
    )
    # Give severity the highest normalized score (100.0 * 0.25 = 25.0 pts)
    mcda_res = create_sample_mcda_result(
        issue_id="TOP-FACTOR-TEST",
        severity=100.0,  # 25.0 pts
        urgency=50.0,    # 10.0 pts
        population=40.0, # 8.0 pts
        health_safety=30.0, # 4.5 pts
        location=20.0,   # 2.0 pts
        complaint_age=10.0, # 1.0 pts
    )

    explanation = explainer.generate_explanation(issue, mcda_res, is_selected=True)

    factors = explanation.top_contributing_factors
    assert len(factors) == 6
    assert factors[0].factor == "severity"
    assert factors[0].weighted_contribution == 25.0
    assert factors[0].weight == 0.25
    assert factors[0].normalized_score == 100.0
    assert "Top driver: Severity (25.00 pts)" in explanation.summary


def test_weighted_contribution_accuracy(explainer):
    """Verify that all factor contributions and reason statements strictly match MCDA data."""
    issue = CivicIssue(
        id="AUDIT-ISSUE",
        estimated_cost=2500.0,
        required_workers=2,
        required_vehicles=1,
        required_time_hours=3.0,
    )
    mcda_res = create_sample_mcda_result(
        issue_id="AUDIT-ISSUE",
        severity=85.0,  # 85 * 0.25 = 21.25
        urgency=90.0,   # 90 * 0.20 = 18.00
        population=80.0,# 80 * 0.20 = 16.00
        health_safety=80.0, # 80 * 0.15 = 12.00
        location=90.0,  # 90 * 0.10 = 9.00
        complaint_age=75.0, # 75 * 0.10 = 7.50
    )

    explanation = explainer.generate_explanation(issue, mcda_res, is_selected=True)

    reasons = explanation.reasons
    assert "Severity contributed 21.25 points to the priority score." in reasons
    assert "Urgency contributed 18.00 points to the priority score." in reasons
    assert "Population affected contributed 16.00 points to the priority score." in reasons
    assert "Health and safety impact contributed 12.00 points to the priority score." in reasons
    assert "Location sensitivity contributed 9.00 points to the priority score." in reasons
    assert "Complaint age contributed 7.50 points to the priority score." in reasons


def test_missing_resource_data_not_fabricated(explainer):
    """Verify that missing resource data remains None and is flagged rather than fabricated."""
    issue = CivicIssue(
        id="INCOMPLETE-DATA",
        title="Issue with Missing Fields",
        estimated_cost=None,  # Missing
        required_workers=None, # Missing
        required_vehicles=1,
        required_time_hours=None, # Missing
    )
    mcda_res = create_sample_mcda_result(issue_id="INCOMPLETE-DATA", severity=90.0)

    explanation = explainer.generate_explanation(issue, mcda_res, is_selected=False)

    reqs = explanation.resource_requirements
    assert reqs["estimated_cost"] is None
    assert reqs["required_workers"] is None
    assert reqs["required_vehicles"] == 1.0
    assert reqs["required_time_hours"] is None

    assert "missing estimated_cost, required_workers, required_time_hours" in explanation.allocation_rationale
    assert any("incomplete" in r.lower() for r in explanation.reasons)
    assert any("never fabricated" in r.lower() for r in explanation.reasons)


def test_explanation_determinism(explainer):
    """Verify that repeated calls with identical inputs produce identical explanations."""
    issue = CivicIssue(
        id="DETERMINISTIC-1",
        estimated_cost=4000.0,
        required_workers=3,
        required_vehicles=1,
        required_time_hours=5.0,
    )
    mcda_res = create_sample_mcda_result(issue_id="DETERMINISTIC-1")

    exp1 = explainer.generate_explanation(issue, mcda_res, is_selected=True)
    exp2 = explainer.generate_explanation(issue, mcda_res, is_selected=True)

    assert exp1.model_dump() == exp2.model_dump()


def test_score_and_priority_level_match_mcda(explainer):
    """Verify that composite_score and priority_level match MCDAScoreResult exactly."""
    issue = CivicIssue(
        id="MATCH-TEST",
        estimated_cost=1000.0,
        required_workers=1,
        required_vehicles=1,
        required_time_hours=1.0,
    )
    mcda_res = create_sample_mcda_result(
        issue_id="MATCH-TEST",
        severity=50.0,
        urgency=50.0,
        population=50.0,
        health_safety=50.0,
        location=50.0,
        complaint_age=50.0,
    )

    explanation = explainer.generate_explanation(issue, mcda_res, is_selected=True)

    assert explanation.composite_score == mcda_res.composite_score == 50.0
    assert explanation.priority_level == mcda_res.priority_level == PriorityLevel.MEDIUM


def test_selected_status_differs_from_priority_level(explainer):
    """Verify that 'High Priority' is strictly distinguished from 'Selected for Action'."""
    issue_high = CivicIssue(
        id="ISSUE-HIGH-DEF",
        estimated_cost=20000.0,
        required_workers=8,
        required_vehicles=4,
        required_time_hours=20.0,
    )
    mcda_high = create_sample_mcda_result("ISSUE-HIGH-DEF", severity=90.0, urgency=90.0)

    issue_med = CivicIssue(
        id="ISSUE-MED-SEL",
        estimated_cost=2000.0,
        required_workers=2,
        required_vehicles=1,
        required_time_hours=2.0,
    )
    mcda_med = create_sample_mcda_result(
        "ISSUE-MED-SEL",
        severity=50.0,
        urgency=50.0,
        population=50.0,
        health_safety=50.0,
        location=50.0,
        complaint_age=50.0,
    )

    exp_high = explainer.generate_explanation(issue_high, mcda_high, is_selected=False)
    exp_med = explainer.generate_explanation(issue_med, mcda_med, is_selected=True)

    # High priority issue is DEFERRED
    assert exp_high.priority_level in (PriorityLevel.HIGH, PriorityLevel.CRITICAL)
    assert exp_high.is_recommended_for_allocation is False
    assert exp_high.recommendation_status == "DEFERRED"

    # Medium priority issue is RECOMMENDED
    assert exp_med.priority_level == PriorityLevel.MEDIUM
    assert exp_med.is_recommended_for_allocation is True
    assert exp_med.recommendation_status == "RECOMMENDED"


def test_batch_explanations(explainer):
    """Verify generate_batch_explanations returns explanations for all issues."""
    issues = [
        CivicIssue(id="B-1", estimated_cost=1000.0, required_workers=1, required_vehicles=1, required_time_hours=2.0),
        CivicIssue(id="B-2", estimated_cost=2000.0, required_workers=2, required_vehicles=1, required_time_hours=3.0),
    ]
    mcda_results = [
        create_sample_mcda_result("B-1", severity=80.0),
        create_sample_mcda_result("B-2", severity=60.0),
    ]
    allocation_plan = OptimizationAllocationPlan(
        selected_issue_ids=["B-1"],
        deferred_issue_ids=["B-2"],
        total_benefit_score=80.0,
        resource_usage=ResourceUsage(allocated_budget=1000.0, remaining_budget=4000.0),
    )

    batch_exps = explainer.generate_batch_explanations(issues, mcda_results, allocation_plan)

    assert len(batch_exps) == 2
    assert batch_exps[0].issue_id == "B-1"
    assert batch_exps[0].is_recommended_for_allocation is True
    assert batch_exps[1].issue_id == "B-2"
    assert batch_exps[1].is_recommended_for_allocation is False


def test_mismatched_issue_id_raises_error(explainer):
    """Verify that mismatched issue and MCDAScoreResult IDs raise ValueError."""
    issue = CivicIssue(id="ISSUE-X", estimated_cost=1000.0, required_workers=1, required_vehicles=1, required_time_hours=1.0)
    mcda_res = create_sample_mcda_result("ISSUE-Y")

    with pytest.raises(ValueError, match="Issue ID mismatch"):
        explainer.generate_explanation(issue, mcda_res, is_selected=True)
