"""Unit and mock tests for the Firebase Firestore Database Service layer."""

import os
from unittest.mock import MagicMock
import pytest
from app.models.civic_issue import CivicIssue, PriorityLevel
from app.models.decision import (
    CIEPipelineResponse,
    FactorContribution,
    IssueExplanation,
    MCDAFactorScores,
    MCDAScoreResult,
    OptimizationAllocationPlan,
)
from app.models.resources import MunicipalResources, ResourceUsage
from app.models.workflow import WorkflowRecord
from app.services.db_service import DatabaseService


@pytest.fixture
def db_service():
    """Fixture providing a DatabaseService instance in safe offline mock mode."""
    return DatabaseService(use_mock_if_missing=True)


def test_db_service_offline_mode_without_credentials(db_service):
    """Test that DatabaseService gracefully operates in offline mock mode when credentials are not configured."""
    assert db_service.is_using_mock is True


def test_save_and_retrieve_issue(db_service):
    """Test persisting and retrieving a CivicIssue document."""
    issue = CivicIssue(
        id="ISSUE-DB-1",
        title="Main Street Water Pipe Burst",
        category="Water Supply",
        description="Potable water pipe leakage near central market.",
        location="Ward 4, Market Area",
        latitude=19.2084,
        longitude=72.8715,
        severity=85.0,
        urgency=90.0,
        population_affected=800.0,
        health_safety_impact=80.0,
        location_sensitivity=90.0,
        complaint_age=20.0,
        estimated_cost=5000.0,
        required_workers=3,
        required_vehicles=1,
        required_time_hours=4.0,
        status="SUBMITTED",
    )

    saved_id = db_service.save_issue(issue)
    assert saved_id == "ISSUE-DB-1"

    retrieved = db_service.get_issue("ISSUE-DB-1")
    assert retrieved is not None
    assert retrieved.id == "ISSUE-DB-1"
    assert retrieved.title == "Main Street Water Pipe Burst"
    assert retrieved.category == "Water Supply"
    assert retrieved.latitude == 19.2084
    assert retrieved.longitude == 72.8715
    assert retrieved.severity == 85.0
    assert retrieved.urgency == 90.0
    assert retrieved.estimated_cost == 5000.0
    assert retrieved.required_workers == 3
    assert retrieved.created_at is not None
    assert retrieved.updated_at is not None


def test_list_and_delete_issues(db_service):
    """Test listing all issues and deleting an issue by ID."""
    issue1 = CivicIssue(
        id="ISSUE-A",
        severity=70.0,
        urgency=70.0,
        population_affected=100.0,
        health_safety_impact=70.0,
        location_sensitivity=70.0,
        complaint_age=10.0,
    )
    issue2 = CivicIssue(
        id="ISSUE-B",
        severity=80.0,
        urgency=80.0,
        population_affected=200.0,
        health_safety_impact=80.0,
        location_sensitivity=80.0,
        complaint_age=15.0,
    )

    db_service.save_issue(issue1)
    db_service.save_issue(issue2)

    issues = db_service.list_issues()
    assert len(issues) >= 2
    issue_ids = [i.id for i in issues]
    assert "ISSUE-A" in issue_ids
    assert "ISSUE-B" in issue_ids

    deleted = db_service.delete_issue("ISSUE-A")
    assert deleted is True
    assert db_service.get_issue("ISSUE-A") is None


def test_save_and_retrieve_cie_result(db_service):
    """Test saving and retrieving an end-to-end CIE evaluation result bundle."""
    factor_scores = MCDAFactorScores(
        normalized_severity=85.0,
        normalized_urgency=90.0,
        normalized_population_affected=80.0,
        normalized_health_safety_impact=80.0,
        normalized_location_sensitivity=90.0,
        normalized_complaint_age=75.0,
        factor_weights={"severity": 0.25, "urgency": 0.20},
        weighted_contributions={"severity": 21.25, "urgency": 18.00},
    )
    mcda_res = MCDAScoreResult(
        issue_id="CIE-ISSUE-1",
        composite_score=83.75,
        priority_level=PriorityLevel.CRITICAL,
        factor_scores=factor_scores,
        rank=1,
    )
    plan = OptimizationAllocationPlan(
        selected_issue_ids=["CIE-ISSUE-1"],
        deferred_issue_ids=[],
        total_benefit_score=83.75,
        resource_usage=ResourceUsage(
            allocated_budget=5000.0,
            remaining_budget=5000.0,
            allocated_workers=2,
            remaining_workers=3,
        ),
    )
    explanation = IssueExplanation(
        issue_id="CIE-ISSUE-1",
        priority_level=PriorityLevel.CRITICAL,
        composite_score=83.75,
        top_contributing_factors=[
            FactorContribution(
                factor="severity",
                normalized_score=85.0,
                weight=0.25,
                weighted_contribution=21.25,
            )
        ],
        resource_requirements={"estimated_cost": 5000.0, "required_workers": 2.0},
        recommendation_status="RECOMMENDED",
        reasons=["Severity contributed 21.25 points to the priority score."],
        is_recommended_for_allocation=True,
        allocation_rationale="Selected by optimization.",
        summary="Issue CIE-ISSUE-1 evaluated as CRITICAL priority.",
    )

    cie_response = CIEPipelineResponse(
        valid_issue_count=1,
        flagged_issue_count=0,
        mcda_rankings=[mcda_res],
        allocation_plan=plan,
        explanations=[explanation],
        status="SUCCESS",
    )

    result_id = db_service.save_cie_result(cie_response, result_id="CIE-TEST-RUN-001")
    assert result_id == "CIE-TEST-RUN-001"

    retrieved = db_service.get_cie_result("CIE-TEST-RUN-001")
    assert retrieved is not None
    assert retrieved["result_id"] == "CIE-TEST-RUN-001"
    assert retrieved["status"] == "SUCCESS"
    assert retrieved["valid_issue_count"] == 1
    assert len(retrieved["mcda_rankings"]) == 1
    assert retrieved["mcda_rankings"][0]["composite_score"] == 83.75
    assert retrieved["allocation_plan"]["total_benefit_score"] == 83.75
    assert retrieved["explanations"][0]["recommendation_status"] == "RECOMMENDED"


def test_save_and_retrieve_workflow_record(db_service):
    """Test saving and updating an administrative workflow tracking record."""
    workflow = WorkflowRecord(
        issue_id="WF-ISSUE-1",
        status="RECOMMENDED",
        officer_id="OFFICER-101",
        assigned_team="Road Maintenance Squad 3",
        approved_at=None,
        resolved_at=None,
    )

    saved_id = db_service.save_workflow_record(workflow)
    assert saved_id == "WF-ISSUE-1"

    retrieved = db_service.get_workflow_record("WF-ISSUE-1")
    assert retrieved is not None
    assert retrieved.issue_id == "WF-ISSUE-1"
    assert retrieved.status == "RECOMMENDED"
    assert retrieved.officer_id == "OFFICER-101"
    assert retrieved.assigned_team == "Road Maintenance Squad 3"
    assert retrieved.updated_at is not None


def test_mock_firestore_client_injection():
    """Test injecting a mock Firestore client to verify real client delegation."""
    mock_firestore = MagicMock()
    mock_collection = MagicMock()
    mock_doc = MagicMock()
    mock_doc_snapshot = MagicMock()

    mock_doc_snapshot.exists = True
    mock_doc_snapshot.to_dict.return_value = {
        "id": "MOCK-DOC-1",
        "severity": 50.0,
        "urgency": 50.0,
        "population_affected": 100.0,
        "health_safety_impact": 50.0,
        "location_sensitivity": 50.0,
        "complaint_age": 5.0,
    }

    mock_doc.get.return_value = mock_doc_snapshot
    mock_collection.document.return_value = mock_doc
    mock_firestore.collection.return_value = mock_collection

    service = DatabaseService(db_client=mock_firestore)
    assert service.is_using_mock is False

    issue = service.get_issue("MOCK-DOC-1")
    assert issue is not None
    assert issue.id == "MOCK-DOC-1"
    mock_firestore.collection.assert_called_with("issues")


def test_no_hardcoded_secrets_in_codebase():
    """Verify that no sensitive service account keys or private keys are hardcoded in the codebase."""
    # Check config settings
    from app.config import settings
    assert settings.firebase_credentials_path is None or isinstance(settings.firebase_credentials_path, str)

    # Scan python app files for common accidental secret patterns
    private_key_marker = "-----BEGIN" + " PRIVATE KEY-----"
    service_acc_marker = '"type": ' + '"service_account"'

    app_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "app")
    for root, _, files in os.walk(app_dir):
        for file in files:
            if file.endswith(".py"):
                filepath = os.path.join(root, file)
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                    assert private_key_marker not in content, f"Hardcoded private key found in {file}!"
                    assert service_acc_marker not in content, f"Hardcoded service account json in {file}!"
