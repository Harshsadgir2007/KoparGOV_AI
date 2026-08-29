"""Unit & Integration Tests for Civic Data Resilience & Blackout Chaos Engineering."""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.resilience import (
    OperationType,
    OperationStatus,
    ReconciliationDecision,
    SystemMode,
)
from app.services.resilience_service import get_resilience_service

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_resilience_state():
    """Ensure clean resilience state before and after each test."""
    service = get_resilience_service()
    service.reset_demo()
    yield
    service.reset_demo()


def test_initial_resilience_status():
    """Test initial telemetry status endpoint returns NORMAL online mode."""
    response = client.get("/api/resilience/status")
    assert response.status_code == 200
    data = response.json()

    assert data["primary_store_online"] is True
    assert data["system_mode"] == "NORMAL"
    assert data["is_blackout_active"] is False
    assert data["last_snapshot"] is not None
    assert data["last_snapshot"]["snapshot_id"] == "SNAP-001"


def test_manual_snapshot_creation():
    """Test creating manual point-in-time state snapshots."""
    response = client.post("/api/resilience/snapshot")
    assert response.status_code == 201
    data = response.json()

    assert data["snapshot_id"].startswith("SNAP-")
    assert data["status"] == "VALID"
    assert "issues" in data["state_dump"]


def test_operation_journal_logging_on_issue_creation():
    """Test that submitting an issue automatically appends to the resilient operation journal."""
    payload = {
        "id": "ISS-JOURNAL-01",
        "title": "Severe Water Main Rupture on MG Road",
        "category": "Water & Sewage",
        "severity": 90,
        "urgency": 85,
        "population_affected": 1500,
        "health_safety_impact": 90,
        "location_sensitivity": 80,
        "complaint_age": 2,
        "estimated_cost": 15000,
        "required_workers": 3,
        "required_vehicles": 1,
        "required_time_hours": 6,
    }
    create_res = client.post("/api/issues", json=payload)
    assert create_res.status_code == 201

    # Check journal has recorded the creation and CIE evaluation
    journal_res = client.get("/api/resilience/journal")
    assert journal_res.status_code == 200
    journal = journal_res.json()

    op_types = [entry["operation_type"] for entry in journal]
    assert "COMPLAINT_CREATED" in op_types
    assert "CIE_PRIORITY_CALCULATED" in op_types

    created_entry = next(entry for entry in journal if entry["operation_type"] == "COMPLAINT_CREATED")
    assert created_entry["entity_id"] == "ISS-JOURNAL-01"
    assert created_entry["checksum"] is not None


def test_workflow_actions_logged_to_journal():
    """Test officer approval, assignment, start, and resolution logging in journal."""
    issue_id = "ISS-WF-JOURNAL"
    client.post("/api/issues", json={
        "id": issue_id,
        "title": "Streetlight failure near Bus Stand",
        "category": "Electricity & Power",
        "severity": 70,
        "urgency": 70,
        "population_affected": 300,
        "health_safety_impact": 60,
        "location_sensitivity": 70,
        "complaint_age": 1,
        "estimated_cost": 5000,
        "required_workers": 2,
        "required_vehicles": 1,
        "required_time_hours": 2,
    })

    # 1. Approve
    client.post(f"/api/workflow/{issue_id}/approve", json={"officer_id": "Chief Officer"})
    # 2. Assign
    client.post(f"/api/workflow/{issue_id}/assign", json={"assigned_team": "Electrical Squad 2"})
    # 3. Start
    client.post(f"/api/workflow/{issue_id}/start", json={"officer_id": "Team Lead"})
    # 4. Resolve
    client.post(f"/api/workflow/{issue_id}/resolve", json={"resolution_notes": "Bulb and wiring replaced."})

    journal_res = client.get("/api/resilience/journal")
    journal = journal_res.json()

    recorded_types = [op["operation_type"] for op in journal if op["entity_id"] == issue_id]
    assert "COMPLAINT_CREATED" in recorded_types
    assert "OFFICER_APPROVED" in recorded_types
    assert "ASSIGNMENT_CREATED" in recorded_types
    assert "WORK_STARTED" in recorded_types
    assert "RESOLUTION_UPDATED" in recorded_types


def test_simulate_blackout_and_recovery_flow():
    """Test full Blackout Chaos flow: Normal -> Blackout (Degraded) -> Recovery -> Normal."""
    # 1. Ingest test issue and approve
    issue_id = "ISS-BLACKOUT-DEMO"
    client.post("/api/issues", json={
        "id": issue_id,
        "title": "Garbage has not been collected for 3 days near the market",
        "category": "Public Health & Sanitation",
        "severity": 87,
        "urgency": 85,
        "population_affected": 1200,
        "health_safety_impact": 85,
        "location_sensitivity": 80,
        "complaint_age": 3,
        "estimated_cost": 8000,
        "required_workers": 2,
        "required_vehicles": 1,
        "required_time_hours": 4,
    })
    client.post(f"/api/workflow/{issue_id}/approve", json={"officer_id": "Municipal Officer Patil"})

    # 2. Simulate Blackout
    blackout_res = client.post("/api/resilience/simulate-blackout")
    assert blackout_res.status_code == 200
    blackout_data = blackout_res.json()
    assert blackout_data["primary_store_online"] is False
    assert blackout_data["system_mode"] == "DEGRADED"
    assert blackout_data["is_blackout_active"] is True

    # 3. Recover System
    recover_res = client.post("/api/resilience/recover")
    assert recover_res.status_code == 200
    report = recover_res.json()

    assert report["status"] in ["SUCCESS", "PARTIAL_SUCCESS_WITH_CONFLICTS"]
    assert report["records_recovered"] > 0
    assert report["operations_replayed"] > 0
    assert len(report["step_logs"]) >= 5

    # 4. Verify system returned to NORMAL mode and recovered issue
    status_res = client.get("/api/resilience/status")
    assert status_res.json()["primary_store_online"] is True
    assert status_res.json()["system_mode"] == "NORMAL"

    # 5. Check issue and approval state preserved in primary store
    issue_res = client.get(f"/api/issues/{issue_id}")
    assert issue_res.status_code == 200
    assert issue_res.json()["status"] == "APPROVED"


def test_conflict_detection_and_reconciliation():
    """Test that conflicting operations are flagged and can be reconciled by an officer."""
    service = get_resilience_service()

    # Log an operation with a simulated conflict flag
    op = service.log_operation(
        operation_type=OperationType.OFFICER_APPROVED,
        entity_id="ISS-CONFLICT-TEST",
        payload={
            "issue_id": "ISS-CONFLICT-TEST",
            "officer_id": "Officer Sharma",
            "_simulate_conflict": True,
        },
    )

    # Trigger recovery
    recover_res = client.post("/api/resilience/recover")
    assert recover_res.status_code == 200
    report = recover_res.json()

    assert report["conflicts_detected"] >= 1
    assert len(report["conflicts"]) >= 1
    assert report["conflicts"][0]["operation_id"] == op.operation_id
    assert report["conflicts"][0]["resolution_status"] == "REQUIRES_RECONCILIATION"

    # Reconcile conflict
    reconcile_res = client.post(
        f"/api/resilience/reconcile/{op.operation_id}",
        json={
            "decision": "ACCEPT_JOURNAL",
            "officer_id": "Chief Municipal Commissioner",
            "notes": "Verified against physical dispatch ledger.",
        },
    )
    assert reconcile_res.status_code == 200
    reconciled_item = reconcile_res.json()
    assert reconciled_item["resolution_status"] == "RECONCILED"


def test_reset_demo_endpoint():
    """Test demo reset clears state and restores clean baseline."""
    client.post("/api/resilience/simulate-blackout")
    status_degraded = client.get("/api/resilience/status").json()
    assert status_degraded["is_blackout_active"] is True

    reset_res = client.post("/api/resilience/reset")
    assert reset_res.status_code == 200
    status_normal = reset_res.json()
    assert status_normal["primary_store_online"] is True
    assert status_normal["system_mode"] == "NORMAL"
    assert status_normal["is_blackout_active"] is False


def test_blackout_submission_queues_pending_recovery_and_recovers():
    """Test that submitting during Blackout safely queues as PENDING_RECOVERY and is committed on recovery."""
    # 1. Start Blackout
    client.post("/api/resilience/simulate-blackout")
    status_res = client.get("/api/resilience/status").json()
    assert status_res["is_blackout_active"] is True

    # 2. Submit complaint while Blackout is active
    issue_id = "ISS-DEGRADED-QUEUE-01"
    sub_res = client.post("/api/issues", json={
        "id": issue_id,
        "title": "Severe sewage blockage in Ward 7 during blackout",
        "category": "Drainage & Sewage",
        "severity": 88,
        "urgency": 82,
        "population_affected": 800,
        "health_safety_impact": 85,
        "location_sensitivity": 75,
        "complaint_age": 1,
        "estimated_cost": 7500,
        "required_workers": 2,
        "required_vehicles": 1,
        "required_time_hours": 3,
    })
    assert sub_res.status_code == 201
    sub_data = sub_res.json()

    # Verify Option A contract: status is PENDING_RECOVERY, operation_id is issued
    assert sub_data["status"] == "PENDING_RECOVERY"
    assert sub_data["issue"]["status"] == "PENDING_RECOVERY"
    assert sub_data["operation_id"].startswith("OP-")

    # Verify that failed primary database does not have this record yet
    get_res = client.get(f"/api/issues/{issue_id}")
    assert get_res.status_code == 404

    # 3. Recover System
    rec_res = client.post("/api/resilience/recover")
    assert rec_res.status_code == 200

    # 4. Verify that complaint was replayed and committed into primary store
    post_rec_issue = client.get(f"/api/issues/{issue_id}")
    assert post_rec_issue.status_code == 200
    assert post_rec_issue.json()["status"] in ["PRIORITIZED", "REPORTED"]
    assert post_rec_issue.json()["title"] == "Severe sewage blockage in Ward 7 during blackout"

    # 5. Verify subsequent normal submission succeeds with SUCCESS
    norm_res = client.post("/api/issues", json={
        "id": "ISS-NORMAL-AFTER-RECOVERY",
        "title": "Broken road asphalt",
        "category": "Potholes & Road Damage",
        "severity": 60,
        "urgency": 60,
        "population_affected": 200,
        "health_safety_impact": 50,
        "location_sensitivity": 50,
        "complaint_age": 1,
        "estimated_cost": 4000,
        "required_workers": 1,
        "required_vehicles": 1,
        "required_time_hours": 2,
    })
    assert norm_res.status_code == 201
    assert norm_res.json()["status"] == "SUCCESS"
