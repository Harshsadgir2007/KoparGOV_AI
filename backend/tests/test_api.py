"""Unit and integration tests for the FastAPI REST API layer."""

import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    """Fixture providing a FastAPI TestClient."""
    return TestClient(app)


def test_root_endpoint(client):
    """Test GET / returns root service metadata."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data == {
        "service": "KoparGov AI",
        "component": "Civic Intelligence Engine",
        "status": "running",
    }


def test_health_endpoint(client):
    """Test GET /health returns expected health check status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data == {
        "status": "ok",
        "service": "KoparGov CIE",
    }


def test_cie_evaluate_valid_data(client):
    """Test POST /api/cie/evaluate with valid civic issues and resource constraints."""
    payload = {
        "issues": [
            {
                "id": "ISSUE-1",
                "title": "Severe Water Leak",
                "severity": 85.0,
                "urgency": 90.0,
                "population_affected": 500.0,
                "health_safety_impact": 80.0,
                "location_sensitivity": 90.0,
                "complaint_age": 20.0,
                "estimated_cost": 4000.0,
                "required_workers": 2,
                "required_vehicles": 1,
                "required_time_hours": 4.0,
            },
            {
                "id": "ISSUE-2",
                "title": "Faded Crosswalk Marking",
                "severity": 40.0,
                "urgency": 30.0,
                "population_affected": 200.0,
                "health_safety_impact": 30.0,
                "location_sensitivity": 40.0,
                "complaint_age": 10.0,
                "estimated_cost": 1500.0,
                "required_workers": 1,
                "required_vehicles": 1,
                "required_time_hours": 2.0,
            },
        ],
        "resources": {
            "budget": 10000.0,
            "workers": 5,
            "vehicles": 2,
            "time_capacity_hours": 8.0,
        },
    }

    response = client.post("/api/cie/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()

    # 1. Structure assertions
    assert data["status"] == "SUCCESS"
    assert data["valid_issue_count"] == 2
    assert data["flagged_issue_count"] == 0
    assert len(data["validation_reports"]) == 2
    assert len(data["mcda_rankings"]) == 2
    assert data["allocation_plan"] is not None
    assert len(data["explanations"]) == 2


def test_cie_evaluate_contains_mcda_results(client):
    """Test response contains complete MCDA rankings and scores."""
    payload = {
        "issues": [
            {
                "id": "MCDA-1",
                "severity": 95.0,
                "urgency": 90.0,
                "population_affected": 800.0,
                "health_safety_impact": 95.0,
                "location_sensitivity": 90.0,
                "complaint_age": 30.0,
                "estimated_cost": 3000.0,
                "required_workers": 2,
                "required_vehicles": 1,
                "required_time_hours": 3.0,
            }
        ],
        "resources": {
            "budget": 10000.0,
            "workers": 5,
            "vehicles": 2,
        },
    }

    response = client.post("/api/cie/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()

    mcda_rankings = data["mcda_rankings"]
    assert len(mcda_rankings) == 1
    item = mcda_rankings[0]
    assert item["issue_id"] == "MCDA-1"
    assert item["priority_level"] == "CRITICAL"
    assert item["composite_score"] > 80.0
    assert item["rank"] == 1
    assert "factor_scores" in item
    assert "weighted_contributions" in item["factor_scores"]


def test_cie_evaluate_contains_optimization_results(client):
    """Test response contains complete optimization allocation plan."""
    payload = {
        "issues": [
            {
                "id": "OPT-1",
                "severity": 80.0,
                "urgency": 80.0,
                "population_affected": 500.0,
                "health_safety_impact": 80.0,
                "location_sensitivity": 80.0,
                "complaint_age": 10.0,
                "estimated_cost": 3000.0,
                "required_workers": 2,
                "required_vehicles": 1,
                "required_time_hours": 3.0,
            }
        ],
        "resources": {
            "budget": 10000.0,
            "workers": 5,
            "vehicles": 2,
            "time_capacity_hours": 8.0,
        },
    }

    response = client.post("/api/cie/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()

    plan = data["allocation_plan"]
    assert plan is not None
    assert plan["selected_issue_ids"] == ["OPT-1"]
    assert plan["deferred_issue_ids"] == []
    assert plan["total_benefit_score"] > 0.0

    usage = plan["resource_usage"]
    assert usage["allocated_budget"] == 3000.0
    assert usage["remaining_budget"] == 7000.0
    assert usage["allocated_workers"] == 2
    assert usage["remaining_workers"] == 3
    assert usage["allocated_vehicles"] == 1
    assert usage["remaining_vehicles"] == 1
    assert usage["allocated_time_hours"] == 3.0
    assert usage["remaining_time_hours"] == 5.0


def test_cie_evaluate_contains_explanations(client):
    """Test response contains transparent, rule-based explanations."""
    payload = {
        "issues": [
            {
                "id": "EXP-1",
                "severity": 90.0,
                "urgency": 85.0,
                "population_affected": 600.0,
                "health_safety_impact": 85.0,
                "location_sensitivity": 80.0,
                "complaint_age": 15.0,
                "estimated_cost": 2500.0,
                "required_workers": 2,
                "required_vehicles": 1,
                "required_time_hours": 3.0,
            }
        ],
        "resources": {
            "budget": 5000.0,
            "workers": 3,
            "vehicles": 1,
        },
    }

    response = client.post("/api/cie/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()

    explanations = data["explanations"]
    assert len(explanations) == 1
    exp = explanations[0]
    assert exp["issue_id"] == "EXP-1"
    assert exp["recommendation_status"] == "RECOMMENDED"
    assert exp["is_recommended_for_allocation"] is True
    assert len(exp["top_contributing_factors"]) == 6
    assert len(exp["reasons"]) > 0
    assert "resource_requirements" in exp
    assert exp["resource_requirements"]["estimated_cost"] == 2500.0


def test_cie_evaluate_invalid_schema_returns_422(client):
    """Test malformed JSON or invalid schema types returns HTTP 422."""
    # Missing 'resources' object
    bad_payload_1 = {
        "issues": []
    }
    res1 = client.post("/api/cie/evaluate", json=bad_payload_1)
    assert res1.status_code == 422

    # Invalid negative worker count
    bad_payload_2 = {
        "issues": [],
        "resources": {
            "budget": 1000.0,
            "workers": -5,  # Invalid
            "vehicles": 1,
        },
    }
    res2 = client.post("/api/cie/evaluate", json=bad_payload_2)
    assert res2.status_code == 422


def test_cie_evaluate_duplicate_issue_ids_returns_400(client):
    """Test that submitting duplicate issue IDs in the request returns HTTP 400."""
    payload = {
        "issues": [
            {
                "id": "DUP-ID",
                "severity": 80.0,
                "urgency": 80.0,
                "population_affected": 100.0,
                "health_safety_impact": 80.0,
                "location_sensitivity": 80.0,
                "complaint_age": 10.0,
            },
            {
                "id": "DUP-ID",
                "severity": 70.0,
                "urgency": 70.0,
                "population_affected": 200.0,
                "health_safety_impact": 70.0,
                "location_sensitivity": 70.0,
                "complaint_age": 10.0,
            },
        ],
        "resources": {
            "budget": 10000.0,
            "workers": 5,
            "vehicles": 2,
        },
    }

    response = client.post("/api/cie/evaluate", json=payload)
    assert response.status_code == 400
    data = response.json()
    assert "Duplicate issue ID" in data["detail"]


def test_cie_evaluate_missing_required_fields_handled_gracefully(client):
    """Test that issues missing required MCDA fields are flagged and reported in validation reports."""
    payload = {
        "issues": [
            {
                "id": "INCOMPLETE-1",
                "severity": None,  # Missing severity
                "urgency": 80.0,
                "population_affected": 100.0,
                "health_safety_impact": 80.0,
                "location_sensitivity": 80.0,
                "complaint_age": 10.0,
            }
        ],
        "resources": {
            "budget": 10000.0,
            "workers": 5,
            "vehicles": 2,
        },
    }

    response = client.post("/api/cie/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["valid_issue_count"] == 0
    assert data["flagged_issue_count"] == 1
    assert data["validation_reports"][0]["is_valid"] is False
    assert "severity" in data["validation_reports"][0]["missing_fields"]


def test_cie_evaluate_calls_optimization_and_selects_non_greedy(client):
    """Verify that API integration actually invokes the non-greedy OR-Tools optimization."""
    payload = {
        "issues": [
            {
                "id": "A",
                "severity": 100.0,
                "urgency": 100.0,
                "population_affected": 1000.0,
                "health_safety_impact": 100.0,
                "location_sensitivity": 100.0,
                "complaint_age": 100.0,
                "estimated_cost": 7000.0,
                "required_workers": 4,
                "required_vehicles": 1,
                "required_time_hours": 4.0,
            },
            {
                "id": "B",
                "severity": 60.0,
                "urgency": 60.0,
                "population_affected": 600.0,
                "health_safety_impact": 60.0,
                "location_sensitivity": 60.0,
                "complaint_age": 60.0,
                "estimated_cost": 4000.0,
                "required_workers": 2,
                "required_vehicles": 1,
                "required_time_hours": 2.0,
            },
            {
                "id": "C",
                "severity": 60.0,
                "urgency": 60.0,
                "population_affected": 600.0,
                "health_safety_impact": 60.0,
                "location_sensitivity": 60.0,
                "complaint_age": 60.0,
                "estimated_cost": 4000.0,
                "required_workers": 2,
                "required_vehicles": 1,
                "required_time_hours": 2.0,
            },
        ],
        "resources": {
            "budget": 10000.0,
            "workers": 4,
            "vehicles": 2,
            "time_capacity_hours": 8.0,
        },
    }

    response = client.post("/api/cie/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Must select B and C, defer A
    selected = set(data["allocation_plan"]["selected_issue_ids"])
    assert selected == {"B", "C"}
    assert data["allocation_plan"]["deferred_issue_ids"] == ["A"]
    assert data["allocation_plan"]["total_benefit_score"] == 120.0


def test_cie_evaluate_deterministic_api_response(client):
    """Verify that calling the API with identical data returns identical results."""
    payload = {
        "issues": [
            {
                "id": "DET-1",
                "severity": 75.0,
                "urgency": 70.0,
                "population_affected": 400.0,
                "health_safety_impact": 60.0,
                "location_sensitivity": 70.0,
                "complaint_age": 12.0,
                "estimated_cost": 2000.0,
                "required_workers": 2,
                "required_vehicles": 1,
                "required_time_hours": 3.0,
            }
        ],
        "resources": {
            "budget": 5000.0,
            "workers": 4,
            "vehicles": 2,
        },
    }

    res1 = client.post("/api/cie/evaluate", json=payload).json()
    res2 = client.post("/api/cie/evaluate", json=payload).json()

    assert res1 == res2


def test_cie_evaluate_persists_issues_and_result(client):
    """Test that a successful CIE evaluation persists issues and the CIE result in db_service."""
    from app.routers.cie import db_service

    payload = {
        "issues": [
            {
                "id": "PERSIST-1",
                "title": "Severe Pothole Cluster",
                "severity": 80.0,
                "urgency": 85.0,
                "population_affected": 300.0,
                "health_safety_impact": 75.0,
                "location_sensitivity": 80.0,
                "complaint_age": 14.0,
                "estimated_cost": 2000.0,
                "required_workers": 2,
                "required_vehicles": 1,
                "required_time_hours": 3.0,
            }
        ],
        "resources": {
            "budget": 5000.0,
            "workers": 3,
            "vehicles": 1,
        },
    }

    response = client.post("/api/cie/evaluate", json=payload)
    assert response.status_code == 200

    # Verify issue is persisted in database
    stored_issue = db_service.get_issue("PERSIST-1")
    assert stored_issue is not None
    assert stored_issue.id == "PERSIST-1"
    assert stored_issue.title == "Severe Pothole Cluster"

    # Verify CIE result is persisted in database
    stored_results = list(db_service._mock_db["cie_results"].values())
    matching = [r for r in stored_results if "PERSIST-1" in r.get("issue_ids", [])]
    assert len(matching) > 0
    assert matching[-1]["status"] == "SUCCESS"
    assert matching[-1]["valid_issue_count"] == 1


def test_cie_evaluate_offline_mode_does_not_break_endpoint(client):
    """Test that running with mock/offline DatabaseService returns HTTP 200 seamlessly."""
    from app.routers.cie import db_service

    assert db_service.is_using_mock is True

    payload = {
        "issues": [
            {
                "id": "OFFLINE-1",
                "severity": 70.0,
                "urgency": 70.0,
                "population_affected": 100.0,
                "health_safety_impact": 70.0,
                "location_sensitivity": 70.0,
                "complaint_age": 10.0,
                "estimated_cost": 1000.0,
                "required_workers": 1,
                "required_vehicles": 1,
                "required_time_hours": 2.0,
            }
        ],
        "resources": {
            "budget": 5000.0,
            "workers": 2,
            "vehicles": 1,
        },
    }

    response = client.post("/api/cie/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["valid_issue_count"] == 1


def test_cie_evaluate_database_failure_resilience(client, monkeypatch):
    """Test that a simulated database failure does NOT cause an HTTP error or break the response."""
    from app.routers import cie

    # Simulate a Firestore connection timeout or exception during save
    def mock_save_issue_fail(*args, **kwargs):
        raise RuntimeError("Simulated Firestore timeout / network drop")

    def mock_save_cie_result_fail(*args, **kwargs):
        raise RuntimeError("Simulated Firestore write failure")

    monkeypatch.setattr(cie.db_service, "save_issue", mock_save_issue_fail)
    monkeypatch.setattr(cie.db_service, "save_cie_result", mock_save_cie_result_fail)

    payload = {
        "issues": [
            {
                "id": "RESILIENT-1",
                "severity": 90.0,
                "urgency": 90.0,
                "population_affected": 500.0,
                "health_safety_impact": 90.0,
                "location_sensitivity": 90.0,
                "complaint_age": 20.0,
                "estimated_cost": 3000.0,
                "required_workers": 2,
                "required_vehicles": 1,
                "required_time_hours": 3.0,
            }
        ],
        "resources": {
            "budget": 10000.0,
            "workers": 5,
            "vehicles": 2,
        },
    }

    # Endpoint must still succeed with HTTP 200
    response = client.post("/api/cie/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()

    # CIE Pipeline results are completely valid and intact
    assert data["status"] == "SUCCESS"
    assert data["valid_issue_count"] == 1
    assert len(data["mcda_rankings"]) == 1
    assert data["mcda_rankings"][0]["issue_id"] == "RESILIENT-1"
    assert data["allocation_plan"]["selected_issue_ids"] == ["RESILIENT-1"]
    assert len(data["explanations"]) == 1

