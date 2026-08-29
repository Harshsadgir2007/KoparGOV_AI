"""Unit and integration tests for the Municipal Officer Decision Workflow layer."""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.civic_issue import CivicIssue
from app.models.workflow import WorkflowRecord, WorkflowStatus
from app.routers.workflow import db_service


@pytest.fixture
def client():
    """Fixture providing a FastAPI TestClient."""
    return TestClient(app)


@pytest.fixture(autouse=True)
def clean_db():
    """Clear in-memory mock database before each test."""
    db_service._mock_db["issues"].clear()
    db_service._mock_db["workflow"].clear()
    db_service._mock_db["cie_results"].clear()


def test_get_workflow_state_for_existing_issue(client):
    """Test GET /api/workflow/{issue_id} returns default PENDING state for existing issue."""
    issue = CivicIssue(
        id="ISSUE-WF-1",
        title="Pothole on 5th Ave",
        severity=70.0,
        urgency=60.0,
        population_affected=200.0,
        health_safety_impact=50.0,
        location_sensitivity=60.0,
        complaint_age=5.0,
    )
    db_service.save_issue(issue)

    response = client.get("/api/workflow/ISSUE-WF-1")
    assert response.status_code == 200
    data = response.json()
    assert data["issue_id"] == "ISSUE-WF-1"
    assert data["status"] == "PENDING"
    assert data["officer_id"] is None


def test_get_workflow_state_not_found(client):
    """Test GET /api/workflow/{issue_id} returns 404 for unknown issue."""
    response = client.get("/api/workflow/NON-EXISTENT-ISSUE")
    assert response.status_code == 404
    data = response.json()
    assert "not found" in data["detail"].lower()


def test_approve_workflow_happy_path(client):
    """Test approving a PENDING issue transitions it to APPROVED with audit fields."""
    issue = CivicIssue(
        id="ISSUE-WF-2",
        title="Broken Streetlight",
        severity=60.0,
        urgency=50.0,
        population_affected=150.0,
        health_safety_impact=40.0,
        location_sensitivity=50.0,
        complaint_age=4.0,
    )
    db_service.save_issue(issue)

    payload = {
        "officer_id": "OFFICER-42",
        "notes": "Approved for standard maintenance batch.",
    }
    response = client.post("/api/workflow/ISSUE-WF-2/approve", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["issue_id"] == "ISSUE-WF-2"
    assert data["status"] == "APPROVED"
    assert data["officer_id"] == "OFFICER-42"
    assert data["notes"] == "Approved for standard maintenance batch."
    assert data["approved_at"] is not None

    # Check persistence
    stored = db_service.get_workflow_record("ISSUE-WF-2")
    assert stored is not None
    assert stored.status == "APPROVED"
    assert stored.officer_id == "OFFICER-42"


def test_reject_workflow_happy_path(client):
    """Test rejecting a PENDING issue transitions it to REJECTED with reason."""
    issue = CivicIssue(
        id="ISSUE-WF-3",
        title="Duplicate Garbage Report",
        severity=30.0,
        urgency=30.0,
        population_affected=50.0,
        health_safety_impact=20.0,
        location_sensitivity=30.0,
        complaint_age=2.0,
    )
    db_service.save_issue(issue)

    payload = {
        "officer_id": "OFFICER-12",
        "reason": "Duplicate report of already handled sanitation ticket #8812.",
    }
    response = client.post("/api/workflow/ISSUE-WF-3/reject", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["issue_id"] == "ISSUE-WF-3"
    assert data["status"] == "REJECTED"
    assert data["officer_id"] == "OFFICER-12"
    assert data["rejection_reason"] == "Duplicate report of already handled sanitation ticket #8812."


def test_assign_workflow_happy_path(client):
    """Test assigning an APPROVED issue transitions it to ASSIGNED."""
    issue = CivicIssue(
        id="ISSUE-WF-4",
        severity=75.0,
        urgency=75.0,
        population_affected=300.0,
        health_safety_impact=60.0,
        location_sensitivity=70.0,
        complaint_age=10.0,
    )
    db_service.save_issue(issue)

    # Approve first
    client.post("/api/workflow/ISSUE-WF-4/approve", json={"officer_id": "OFFICER-01"})

    # Assign
    assign_payload = {
        "assigned_team": "Road Maintenance Crew 7",
        "officer_id": "OFFICER-01",
        "notes": "Bring asphalt patcher unit.",
    }
    response = client.post("/api/workflow/ISSUE-WF-4/assign", json=assign_payload)
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "ASSIGNED"
    assert data["assigned_team"] == "Road Maintenance Crew 7"
    assert data["notes"] == "Bring asphalt patcher unit."


def test_start_workflow_happy_path(client):
    """Test transitioning an ASSIGNED issue to IN_PROGRESS."""
    issue = CivicIssue(
        id="ISSUE-WF-5",
        severity=80.0,
        urgency=80.0,
        population_affected=400.0,
        health_safety_impact=70.0,
        location_sensitivity=80.0,
        complaint_age=12.0,
    )
    db_service.save_issue(issue)

    client.post("/api/workflow/ISSUE-WF-5/approve", json={"officer_id": "OFFICER-01"})
    client.post("/api/workflow/ISSUE-WF-5/assign", json={"assigned_team": "Crew 1"})

    # Start work
    response = client.post(
        "/api/workflow/ISSUE-WF-5/start",
        json={"officer_id": "CREW-LEAD-9", "notes": "Work commenced on site."},
    )
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "IN_PROGRESS"
    assert data["officer_id"] == "CREW-LEAD-9"
    assert data["notes"] == "Work commenced on site."


def test_resolve_workflow_happy_path(client):
    """Test transitioning an IN_PROGRESS issue to RESOLVED with notes and timestamp."""
    issue = CivicIssue(
        id="ISSUE-WF-6",
        severity=85.0,
        urgency=85.0,
        population_affected=500.0,
        health_safety_impact=80.0,
        location_sensitivity=85.0,
        complaint_age=15.0,
    )
    db_service.save_issue(issue)

    client.post("/api/workflow/ISSUE-WF-6/approve", json={"officer_id": "OFFICER-01"})
    client.post("/api/workflow/ISSUE-WF-6/assign", json={"assigned_team": "Crew 1"})
    client.post("/api/workflow/ISSUE-WF-6/start", json={"officer_id": "CREW-LEAD-9"})

    # Resolve
    resolve_payload = {
        "officer_id": "INSPECTOR-3",
        "resolution_notes": "Excavation and pipe replacement completed. Road surface repaved.",
    }
    response = client.post("/api/workflow/ISSUE-WF-6/resolve", json=resolve_payload)
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "RESOLVED"
    assert data["resolved_at"] is not None
    assert data["resolution_notes"] == "Excavation and pipe replacement completed. Road surface repaved."


def test_complete_valid_lifecycle(client):
    """Test full sequential lifecycle: PENDING -> APPROVED -> ASSIGNED -> IN_PROGRESS -> RESOLVED."""
    issue = CivicIssue(
        id="LIFECYCLE-1",
        title="Fallen Tree Blocking Road",
        severity=90.0,
        urgency=95.0,
        population_affected=600.0,
        health_safety_impact=85.0,
        location_sensitivity=90.0,
        complaint_age=1.0,
    )
    db_service.save_issue(issue)

    # 1. Initial state
    r0 = client.get("/api/workflow/LIFECYCLE-1")
    assert r0.json()["status"] == "PENDING"

    # 2. Approve
    r1 = client.post("/api/workflow/LIFECYCLE-1/approve", json={"officer_id": "OFF-1"})
    assert r1.status_code == 200
    assert r1.json()["status"] == "APPROVED"

    # 3. Assign
    r2 = client.post("/api/workflow/LIFECYCLE-1/assign", json={"assigned_team": "Forestry Team 2"})
    assert r2.status_code == 200
    assert r2.json()["status"] == "ASSIGNED"

    # 4. Start
    r3 = client.post("/api/workflow/LIFECYCLE-1/start")
    assert r3.status_code == 200
    assert r3.json()["status"] == "IN_PROGRESS"

    # 5. Resolve
    r4 = client.post(
        "/api/workflow/LIFECYCLE-1/resolve",
        json={"resolution_notes": "Tree cleared, road reopened."},
    )
    assert r4.status_code == 200
    assert r4.json()["status"] == "RESOLVED"

    # 6. Verify final state persists
    r_final = client.get("/api/workflow/LIFECYCLE-1")
    assert r_final.json()["status"] == "RESOLVED"
    assert r_final.json()["resolved_at"] is not None


def test_disallowed_deferred_to_approved(client):
    """Verify that DEFERRED issues cannot be approved via the normal approve endpoint."""
    workflow = WorkflowRecord(
        issue_id="DEFERRED-ISSUE-1",
        status=WorkflowStatus.DEFERRED.value,
    )
    db_service.save_workflow_record(workflow)

    response = client.post(
        "/api/workflow/DEFERRED-ISSUE-1/approve",
        json={"officer_id": "OFF-1"},
    )
    assert response.status_code == 400
    data = response.json()
    assert "cannot approve" in data["detail"].lower()
    assert "deferred" in data["detail"].lower()


def test_invalid_transitions_return_400(client):
    """Verify that invalid/out-of-order state transitions return HTTP 400."""
    issue = CivicIssue(
        id="TRANS-ISSUE-1",
        severity=50.0,
        urgency=50.0,
        population_affected=100.0,
        health_safety_impact=50.0,
        location_sensitivity=50.0,
        complaint_age=5.0,
    )
    db_service.save_issue(issue)

    # Cannot assign directly from PENDING (must be APPROVED)
    r1 = client.post("/api/workflow/TRANS-ISSUE-1/assign", json={"assigned_team": "Team A"})
    assert r1.status_code == 400
    assert "cannot assign" in r1.json()["detail"].lower()

    # Cannot start directly from PENDING (must be ASSIGNED)
    r2 = client.post("/api/workflow/TRANS-ISSUE-1/start")
    assert r2.status_code == 400
    assert "cannot start" in r2.json()["detail"].lower()

    # Cannot resolve directly from PENDING (must be IN_PROGRESS)
    r3 = client.post("/api/workflow/TRANS-ISSUE-1/resolve")
    assert r3.status_code == 400
    assert "cannot resolve" in r3.json()["detail"].lower()

    # Approve the issue
    client.post("/api/workflow/TRANS-ISSUE-1/approve", json={"officer_id": "OFF-1"})

    # Cannot start work directly from APPROVED (must be ASSIGNED first)
    r4 = client.post("/api/workflow/TRANS-ISSUE-1/start")
    assert r4.status_code == 400

    # Cannot resolve directly from APPROVED
    r5 = client.post("/api/workflow/TRANS-ISSUE-1/resolve")
    assert r5.status_code == 400

    # Assign team
    client.post("/api/workflow/TRANS-ISSUE-1/assign", json={"assigned_team": "Team A"})

    # Cannot resolve directly from ASSIGNED (must START first)
    r6 = client.post("/api/workflow/TRANS-ISSUE-1/resolve")
    assert r6.status_code == 400


def test_cannot_transition_from_resolved_state(client):
    """Verify that once an issue is RESOLVED, it cannot be approved, started, or resolved again."""
    workflow = WorkflowRecord(
        issue_id="RESOLVED-ISSUE-1",
        status=WorkflowStatus.RESOLVED.value,
    )
    db_service.save_workflow_record(workflow)

    r1 = client.post("/api/workflow/RESOLVED-ISSUE-1/approve", json={"officer_id": "OFF-1"})
    assert r1.status_code == 400

    r2 = client.post("/api/workflow/RESOLVED-ISSUE-1/assign", json={"assigned_team": "Team B"})
    assert r2.status_code == 400

    r3 = client.post("/api/workflow/RESOLVED-ISSUE-1/start")
    assert r3.status_code == 400

    r4 = client.post("/api/workflow/RESOLVED-ISSUE-1/resolve")
    assert r4.status_code == 400


def test_cannot_transition_from_rejected_state(client):
    """Verify that once an issue is REJECTED, it cannot be approved or assigned."""
    workflow = WorkflowRecord(
        issue_id="REJECTED-ISSUE-1",
        status=WorkflowStatus.REJECTED.value,
    )
    db_service.save_workflow_record(workflow)

    r1 = client.post("/api/workflow/REJECTED-ISSUE-1/approve", json={"officer_id": "OFF-1"})
    assert r1.status_code == 400

    r2 = client.post("/api/workflow/REJECTED-ISSUE-1/assign", json={"assigned_team": "Team B"})
    assert r2.status_code == 400
