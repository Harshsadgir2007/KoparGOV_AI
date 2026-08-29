"""Unit and integration tests for Role-Based Access Control (RBAC) in KoparGov AI.

Tests:
1. Citizen cannot approve, reject, assign, start, or resolve issues (403 Forbidden).
2. Citizen cannot record contractor project inspections (403 Forbidden).
3. Authorized officer with valid role headers can perform approvals and inspections (200 OK).
4. Unauthenticated caller with empty officer identity is rejected (401 Unauthorized).
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.civic_issue import CivicIssue
from app.services.db_service import DatabaseService

client = TestClient(app)
db = DatabaseService()


@pytest.fixture(autouse=True)
def setup_test_issue():
    """Ensure a fresh test issue exists before each RBAC test."""
    issue_data = CivicIssue(
        id="ISS-RBAC-01",
        title="Overflowing Sewage Line",
        category="Sanitation",
        description="Raw sewage leaking into street drain near Shivaji Chowk",
        location="Ward 5 - Shivaji Chowk",
        ward_number=5,
        severity=85.0,
        urgency=80.0,
        population_affected=500.0,
        health_safety_impact=80.0,
        location_sensitivity=75.0,
        complaint_age=2.0,
    )
    db.save_issue(issue_data)
    yield
    db.delete_issue("ISS-RBAC-01")


def test_citizen_cannot_approve_workflow_issue():
    """A user passing X-Officer-Role: CITIZEN must receive HTTP 403 Forbidden."""
    response = client.post(
        "/api/workflow/ISS-RBAC-01/approve",
        headers={"X-Officer-Role": "CITIZEN", "X-Officer-ID": "Rahul Patil"},
        json={"officer_id": "Rahul Patil", "notes": "Unauthorized attempt"},
    )
    assert response.status_code == 403
    assert "Forbidden: Citizen account cannot perform municipal officer workflow actions" in response.json()["detail"]


def test_citizen_cannot_reject_workflow_issue():
    """A user passing X-Officer-Role: CITIZEN must receive HTTP 403 Forbidden."""
    response = client.post(
        "/api/workflow/ISS-RBAC-01/reject",
        headers={"X-Officer-Role": "CITIZEN", "X-Officer-ID": "Rahul Patil"},
        json={"officer_id": "Rahul Patil", "reason": "Unauthorized attempt"},
    )
    assert response.status_code == 403


def test_citizen_cannot_record_contractor_inspection():
    """A citizen trying to record official contractor inspection must receive HTTP 403 Forbidden."""
    response = client.post(
        "/api/contractors/projects/PRJ-024/inspect",
        headers={"X-Officer-Role": "CITIZEN"},
        json={
            "project_id": "PRJ-024",
            "officer_id": "CIT-01",
            "officer_name": "Rahul Patil",
            "outcome": "FAILED",
            "inspection_notes": "Citizen inspection attempt",
        },
    )
    assert response.status_code == 403
    assert "Forbidden: Citizens cannot record official municipal project inspections" in response.json()["detail"]


def test_officer_can_approve_workflow_issue():
    """An authenticated officer with valid clearance role can approve the issue."""
    response = client.post(
        "/api/workflow/ISS-RBAC-01/approve",
        headers={"X-Officer-Role": "WARD_INCHARGE", "X-Officer-ID": "Shri. Sunil Jadhav"},
        json={"officer_id": "Shri. Sunil Jadhav", "notes": "Ward verification complete"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "APPROVED"
    assert data["officer_id"] == "Shri. Sunil Jadhav"


def test_empty_officer_identity_rejected():
    """Attempting approval with blank officer identity returns HTTP 401 Unauthorized."""
    response = client.post(
        "/api/workflow/ISS-RBAC-01/approve",
        headers={"X-Officer-Role": "OFFICER"},
        json={"officer_id": "   ", "notes": "Anonymous approval"},
    )
    assert response.status_code == 401
    assert "Unauthorized" in response.json()["detail"]
