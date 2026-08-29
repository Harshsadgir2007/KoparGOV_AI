"""Integration and API tests for the Civic Issues router (/api/issues)."""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.civic_issue import CivicIssue
from app.services.db_service import DatabaseService


@pytest.fixture
def client():
    """Fixture providing a FastAPI TestClient."""
    return TestClient(app)


@pytest.fixture
def db_service():
    """Fixture providing DatabaseService in offline mock mode."""
    return DatabaseService(use_mock_if_missing=True)


def test_create_and_get_issue_api(client):
    """Test creating a new issue via POST /api/issues and retrieving it via GET /api/issues/{id}."""
    issue_payload = {
        "id": "ISSUE-API-TEST-1",
        "title": "Severe Sewage Overflow near Bus Stand",
        "category": "Drainage & Sewage",
        "severity": 88.0,
        "urgency": 85.0,
        "population_affected": 900.0,
        "health_safety_impact": 85.0,
        "location_sensitivity": 80.0,
        "complaint_age": 12.0,
        "estimated_cost": 8000.0,
        "required_workers": 2,
        "required_vehicles": 1,
        "required_time_hours": 3.0,
        "status": "SUBMITTED",
    }

    # 1. Ingest citizen issue
    post_res = client.post("/api/issues", json=issue_payload)
    assert post_res.status_code == 201
    post_data = post_res.json()
    assert post_data["status"] == "SUCCESS"
    assert post_data["issue"]["id"] == "ISSUE-API-TEST-1"
    assert post_data["cie_result"] is not None
    assert len(post_data["cie_result"]["mcda_rankings"]) > 0

    # 2. Get the created issue
    get_res = client.get("/api/issues/ISSUE-API-TEST-1")
    assert get_res.status_code == 200
    get_data = get_res.json()
    assert get_data["id"] == "ISSUE-API-TEST-1"
    assert get_data["title"] == "Severe Sewage Overflow near Bus Stand"

    # 3. List all issues
    list_res = client.get("/api/issues")
    assert list_res.status_code == 200
    list_data = list_res.json()
    assert any(i["id"] == "ISSUE-API-TEST-1" for i in list_data)


def test_get_nonexistent_issue_returns_404(client):
    """Test retrieving a non-existent issue ID returns HTTP 404."""
    res = client.get("/api/issues/NONEXISTENT-ISSUE-ID-999")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()
