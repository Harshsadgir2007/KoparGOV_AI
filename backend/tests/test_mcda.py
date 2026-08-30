"""Unit tests for the Deterministic MCDA Priority Engine."""

import pytest
from app.core.mcda import MCDAEngine
from app.models.civic_issue import CivicIssue, PriorityLevel


@pytest.fixture
def mcda_engine():
    """Fixture providing an MCDAEngine instance."""
    return MCDAEngine()


def test_mcda_exact_example_calculation(mcda_engine):
    """Test the specified example:
    Severity=85 (wt 0.25 -> 21.25)
    Urgency=90 (wt 0.20 -> 18.00)
    Population normalized=80 (wt 0.20 -> 16.00)
    Health/Safety=80 (wt 0.15 -> 12.00)
    Location=90 (wt 0.10 -> 9.00)
    Age normalized=75 (wt 0.10 -> 7.50)
    Composite = 83.75 -> CRITICAL
    """
    issue = CivicIssue(
        id="ISSUE-EX-1",
        title="Major Water Main Break",
        severity=85.0,
        urgency=90.0,
        population_affected=800.0,
        health_safety_impact=80.0,
        location_sensitivity=90.0,
        complaint_age=75.0,
    )
    result = mcda_engine.evaluate_issue(
        issue=issue,
        max_population_ref=1000.0,  # 800/1000 * 100 = 80.0
        max_age_ref=100.0,          # 75/100 * 100 = 75.0
    )

    factors = result.factor_scores
    assert factors.normalized_severity == 85.0
    assert factors.normalized_urgency == 90.0
    assert factors.normalized_population_affected == 80.0
    assert factors.normalized_health_safety_impact == 80.0
    assert factors.normalized_location_sensitivity == 90.0
    assert factors.normalized_complaint_age == 75.0

    assert factors.weighted_contributions["severity"] == 21.25
    assert factors.weighted_contributions["urgency"] == 18.0
    assert factors.weighted_contributions["population_affected"] == 16.0
    assert factors.weighted_contributions["health_safety_impact"] == 12.0
    assert factors.weighted_contributions["location_sensitivity"] == 9.0
    assert factors.weighted_contributions["complaint_age"] == 7.5

    assert result.composite_score == 83.75
    assert result.priority_level == PriorityLevel.CRITICAL


def test_mcda_exact_example_variant_83_25(mcda_engine):
    """Test variant with complaint age normalized to 70 giving exact 83.25."""
    issue = CivicIssue(
        id="ISSUE-EX-2",
        title="Critical Bridge Defect",
        severity=85.0,
        urgency=90.0,
        population_affected=800.0,
        health_safety_impact=80.0,
        location_sensitivity=90.0,
        complaint_age=70.0,
    )
    result = mcda_engine.evaluate_issue(
        issue=issue,
        max_population_ref=1000.0,  # 800/1000 * 100 = 80.0
        max_age_ref=100.0,          # 70/100 * 100 = 70.0
    )

    assert result.composite_score == 83.25
    assert result.priority_level == PriorityLevel.CRITICAL


def test_mcda_iss1031_exact_score_80(mcda_engine):
    """Test ISS-1031 exact factor calculation:
    Severity=90 (wt 0.25 -> 22.5)
    Urgency=85 (wt 0.20 -> 17.0)
    Population normalized=95 (wt 0.20 -> 19.0)
    Health/Safety=90 (wt 0.15 -> 13.5)
    Location=80 (wt 0.10 -> 8.0)
    Complaint age=0 (wt 0.10 -> 0.0)
    Composite = 22.5 + 17.0 + 19.0 + 13.5 + 8.0 + 0.0 = 80.0 -> CRITICAL
    """
    issue = CivicIssue(
        id="ISS-1031",
        title="Garbage Accumulation near market entrance",
        severity=90.0,
        urgency=85.0,
        population_affected=95.0,
        health_safety_impact=90.0,
        location_sensitivity=80.0,
        complaint_age=0.0,
    )
    result = mcda_engine.evaluate_issue(
        issue=issue,
        max_population_ref=100.0,  # 95/100 * 100 = 95.0
        max_age_ref=10.0,          # 0/10 * 100 = 0.0
    )

    factors = result.factor_scores
    assert factors.normalized_severity == 90.0
    assert factors.normalized_urgency == 85.0
    assert factors.normalized_population_affected == 95.0
    assert factors.normalized_health_safety_impact == 90.0
    assert factors.normalized_location_sensitivity == 80.0
    assert factors.normalized_complaint_age == 0.0

    assert factors.weighted_contributions["severity"] == 22.5
    assert factors.weighted_contributions["urgency"] == 17.0
    assert factors.weighted_contributions["population_affected"] == 19.0
    assert factors.weighted_contributions["health_safety_impact"] == 13.5
    assert factors.weighted_contributions["location_sensitivity"] == 8.0
    assert factors.weighted_contributions["complaint_age"] == 0.0

    assert result.composite_score == 80.0
    assert result.priority_level == PriorityLevel.CRITICAL


def test_mcda_low_score(mcda_engine):
    """Test a LOW priority issue (score 0-39)."""
    issue = CivicIssue(
        id="ISSUE-LOW",
        title="Minor park bench paint chip",
        severity=20.0,
        urgency=15.0,
        population_affected=50.0,
        health_safety_impact=10.0,
        location_sensitivity=20.0,
        complaint_age=5.0,
    )
    result = mcda_engine.evaluate_issue(
        issue=issue,
        max_population_ref=500.0,   # 50/500 * 100 = 10.0
        max_age_ref=50.0,           # 5/50 * 100 = 10.0
    )
    # 0.25(20) + 0.20(15) + 0.20(10) + 0.15(10) + 0.10(20) + 0.10(10) = 5.0 + 3.0 + 2.0 + 1.5 + 2.0 + 1.0 = 14.5
    assert result.composite_score == 14.5
    assert result.priority_level == PriorityLevel.LOW


def test_mcda_medium_score(mcda_engine):
    """Test a MEDIUM priority issue (score 40-59)."""
    issue = CivicIssue(
        id="ISSUE-MED",
        title="Faded street sign",
        severity=50.0,
        urgency=50.0,
        population_affected=250.0,
        health_safety_impact=50.0,
        location_sensitivity=50.0,
        complaint_age=25.0,
    )
    result = mcda_engine.evaluate_issue(
        issue=issue,
        max_population_ref=500.0,   # 250/500 * 100 = 50.0
        max_age_ref=50.0,           # 25/50 * 100 = 50.0
    )
    # All factors 50.0 -> composite = 50.0
    assert result.composite_score == 50.0
    assert result.priority_level == PriorityLevel.MEDIUM


def test_mcda_high_score(mcda_engine):
    """Test a HIGH priority issue (score 60-79)."""
    issue = CivicIssue(
        id="ISSUE-HIGH",
        title="Non-functioning traffic signal at busy intersection",
        severity=70.0,
        urgency=70.0,
        population_affected=350.0,
        health_safety_impact=70.0,
        location_sensitivity=70.0,
        complaint_age=35.0,
    )
    result = mcda_engine.evaluate_issue(
        issue=issue,
        max_population_ref=500.0,   # 350/500 * 100 = 70.0
        max_age_ref=50.0,           # 35/50 * 100 = 70.0
    )
    # All factors 70.0 -> composite = 70.0
    assert result.composite_score == 70.0
    assert result.priority_level == PriorityLevel.HIGH


def test_mcda_critical_score(mcda_engine):
    """Test a CRITICAL priority issue (score 80-100)."""
    issue = CivicIssue(
        id="ISSUE-CRIT",
        title="Collapsed drainage wall near hospital",
        severity=95.0,
        urgency=90.0,
        population_affected=1000.0,
        health_safety_impact=95.0,
        location_sensitivity=100.0,
        complaint_age=60.0,
    )
    result = mcda_engine.evaluate_issue(
        issue=issue,
        max_population_ref=1000.0,  # 1000/1000 * 100 = 100.0
        max_age_ref=60.0,           # 60/60 * 100 = 100.0
    )
    # 0.25(95) + 0.20(90) + 0.20(100) + 0.15(95) + 0.10(100) + 0.10(100)
    # = 23.75 + 18.0 + 20.0 + 14.25 + 10.0 + 10.0 = 96.0
    assert result.composite_score == 96.0
    assert result.priority_level == PriorityLevel.CRITICAL


def test_mcda_boundary_values(mcda_engine):
    """Test strict boundary threshold mapping:
    39.0 -> LOW
    40.0 -> MEDIUM
    59.0 -> MEDIUM
    60.0 -> HIGH
    79.0 -> HIGH
    80.0 -> CRITICAL
    """
    assert mcda_engine.classify_priority(0.0) == PriorityLevel.LOW
    assert mcda_engine.classify_priority(39.0) == PriorityLevel.LOW
    assert mcda_engine.classify_priority(39.99) == PriorityLevel.LOW
    assert mcda_engine.classify_priority(40.0) == PriorityLevel.MEDIUM
    assert mcda_engine.classify_priority(59.0) == PriorityLevel.MEDIUM
    assert mcda_engine.classify_priority(59.99) == PriorityLevel.MEDIUM
    assert mcda_engine.classify_priority(60.0) == PriorityLevel.HIGH
    assert mcda_engine.classify_priority(79.0) == PriorityLevel.HIGH
    assert mcda_engine.classify_priority(79.99) == PriorityLevel.HIGH
    assert mcda_engine.classify_priority(80.0) == PriorityLevel.CRITICAL
    assert mcda_engine.classify_priority(100.0) == PriorityLevel.CRITICAL


def test_mcda_invalid_factor_values(mcda_engine):
    """Test that out-of-range (<0 or >100) or invalid values raise ValueError."""
    # Negative severity
    with pytest.raises(ValueError, match="Invalid value for 'severity'"):
        issue = CivicIssue(
            id="INV-1",
            severity=-5.0,
            urgency=50.0,
            population_affected=100.0,
            health_safety_impact=50.0,
            location_sensitivity=50.0,
            complaint_age=10.0,
        )
        mcda_engine.evaluate_issue(issue, max_population_ref=1000.0, max_age_ref=30.0)

    # Severity > 100
    with pytest.raises(ValueError, match="Invalid value for 'severity'"):
        issue = CivicIssue(
            id="INV-2",
            severity=105.0,
            urgency=50.0,
            population_affected=100.0,
            health_safety_impact=50.0,
            location_sensitivity=50.0,
            complaint_age=10.0,
        )
        mcda_engine.evaluate_issue(issue, max_population_ref=1000.0, max_age_ref=30.0)

    # Negative population
    with pytest.raises(ValueError, match="Invalid 'population_affected'"):
        issue = CivicIssue(
            id="INV-3",
            severity=50.0,
            urgency=50.0,
            population_affected=-10.0,
            health_safety_impact=50.0,
            location_sensitivity=50.0,
            complaint_age=10.0,
        )
        mcda_engine.evaluate_issue(issue, max_population_ref=1000.0, max_age_ref=30.0)

    # Missing factor (None)
    with pytest.raises(ValueError, match="Missing required MCDA factor"):
        issue = CivicIssue(
            id="INV-4",
            severity=50.0,
            urgency=None,
            population_affected=100.0,
            health_safety_impact=50.0,
            location_sensitivity=50.0,
            complaint_age=10.0,
        )
        mcda_engine.evaluate_issue(issue, max_population_ref=1000.0, max_age_ref=30.0)


def test_batch_population_normalization(mcda_engine):
    """Test batch population normalization: normalized = (pop / max_pop) * 100."""
    issues = [
        CivicIssue(
            id="ISSUE-A",
            severity=50.0,
            urgency=50.0,
            population_affected=100.0,
            health_safety_impact=50.0,
            location_sensitivity=50.0,
            complaint_age=10.0,
        ),
        CivicIssue(
            id="ISSUE-B",
            severity=50.0,
            urgency=50.0,
            population_affected=500.0,
            health_safety_impact=50.0,
            location_sensitivity=50.0,
            complaint_age=10.0,
        ),
        CivicIssue(
            id="ISSUE-C",
            severity=50.0,
            urgency=50.0,
            population_affected=1000.0,
            health_safety_impact=50.0,
            location_sensitivity=50.0,
            complaint_age=10.0,
        ),
    ]

    results = mcda_engine.evaluate_and_rank_batch(issues)
    result_map = {r.issue_id: r for r in results}

    # Max population is 1000
    assert result_map["ISSUE-A"].factor_scores.normalized_population_affected == 10.0
    assert result_map["ISSUE-B"].factor_scores.normalized_population_affected == 50.0
    assert result_map["ISSUE-C"].factor_scores.normalized_population_affected == 100.0

    # Ranks should be 1, 2, 3 descending by composite score
    assert result_map["ISSUE-C"].rank == 1
    assert result_map["ISSUE-B"].rank == 2
    assert result_map["ISSUE-A"].rank == 3


def test_batch_complaint_age_normalization(mcda_engine):
    """Test batch complaint age normalization: normalized = (age / max_age) * 100."""
    issues = [
        CivicIssue(
            id="ISSUE-1",
            severity=60.0,
            urgency=60.0,
            population_affected=200.0,
            health_safety_impact=60.0,
            location_sensitivity=60.0,
            complaint_age=5.0,
        ),
        CivicIssue(
            id="ISSUE-2",
            severity=60.0,
            urgency=60.0,
            population_affected=200.0,
            health_safety_impact=60.0,
            location_sensitivity=60.0,
            complaint_age=25.0,
        ),
        CivicIssue(
            id="ISSUE-3",
            severity=60.0,
            urgency=60.0,
            population_affected=200.0,
            health_safety_impact=60.0,
            location_sensitivity=60.0,
            complaint_age=50.0,
        ),
    ]

    results = mcda_engine.evaluate_and_rank_batch(issues)
    result_map = {r.issue_id: r for r in results}

    # Max age is 50
    assert result_map["ISSUE-1"].factor_scores.normalized_complaint_age == 10.0
    assert result_map["ISSUE-2"].factor_scores.normalized_complaint_age == 50.0
    assert result_map["ISSUE-3"].factor_scores.normalized_complaint_age == 100.0


def test_batch_zero_maximum_population_error(mcda_engine):
    """Test that zero maximum population in batch raises an error instead of inventing values."""
    issues = [
        CivicIssue(
            id="ISSUE-Z1",
            severity=50.0,
            urgency=50.0,
            population_affected=0.0,
            health_safety_impact=50.0,
            location_sensitivity=50.0,
            complaint_age=10.0,
        ),
        CivicIssue(
            id="ISSUE-Z2",
            severity=60.0,
            urgency=60.0,
            population_affected=0.0,
            health_safety_impact=60.0,
            location_sensitivity=60.0,
            complaint_age=20.0,
        ),
    ]

    with pytest.raises(ValueError, match="Maximum population affected in batch is zero or invalid"):
        mcda_engine.evaluate_and_rank_batch(issues)


def test_batch_all_zero_complaint_age_handled(mcda_engine):
    """Test that all genuinely zero complaint ages normalize cleanly to 0."""
    issues = [
        CivicIssue(
            id="ISSUE-NEW1",
            severity=70.0,
            urgency=70.0,
            population_affected=100.0,
            health_safety_impact=70.0,
            location_sensitivity=70.0,
            complaint_age=0.0,
        ),
        CivicIssue(
            id="ISSUE-NEW2",
            severity=80.0,
            urgency=80.0,
            population_affected=200.0,
            health_safety_impact=80.0,
            location_sensitivity=80.0,
            complaint_age=0.0,
        ),
    ]

    results = mcda_engine.evaluate_and_rank_batch(issues)
    for r in results:
        assert r.factor_scores.normalized_complaint_age == 0.0


def test_weighted_contributions_sum_auditable(mcda_engine):
    """Verify the critical auditability rule: sum(weighted_contributions) == composite_score."""
    issues = [
        CivicIssue(
            id=f"AUDIT-{i}",
            severity=float((i * 17) % 100),
            urgency=float((i * 23) % 100),
            population_affected=float(100 + i * 50),
            health_safety_impact=float((i * 31) % 100),
            location_sensitivity=float((i * 13) % 100),
            complaint_age=float(1 + (i * 7) % 60),
        )
        for i in range(1, 15)
    ]

    results = mcda_engine.evaluate_and_rank_batch(issues)
    for res in results:
        contributions = res.factor_scores.weighted_contributions
        sum_contrib = round(sum(contributions.values()), 2)
        assert abs(sum_contrib - res.composite_score) < 0.01, (
            f"Audit failed for {res.issue_id}: sum of contributions {sum_contrib} "
            f"!= composite score {res.composite_score}"
        )
