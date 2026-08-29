"""Unit and integration tests for Auth, Map/GIS, and Notifications endpoints."""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_list_roles():
    """Verify listing of all pre-configured municipal roles."""
    r = client.get("/api/auth/roles")
    assert r.status_code == 200
    roles = r.json()
    assert len(roles) >= 5
    role_keys = [role["role"] for role in roles]
    assert "WARD_INCHARGE" in role_keys
    assert "DEPARTMENT_OFFICER" in role_keys
    assert "CHIEF_OFFICER" in role_keys
    assert "TAHSILDAR_OR_RELEVANT_AUTHORITY" in role_keys
    assert "CITIZEN" in role_keys


def test_auth_login_and_me():
    """Verify logging in with role returns token and profile."""
    r_login = client.post("/api/auth/login", json={"role": "CHIEF_OFFICER", "officer_id": "Shri. Rajesh Kulkarni"})
    assert r_login.status_code == 200
    data = r_login.json()
    assert data["role"] == "CHIEF_OFFICER"
    assert "approve_workflow" in data["permissions"]
    assert data["token"].startswith("kpg-token-")

    # Test /me endpoint
    r_me = client.get("/api/auth/me", headers={"X-Officer-Role": "WARD_INCHARGE", "X-Officer-Id": "Shri. Sunil Jadhav"})
    assert r_me.status_code == 200
    assert r_me.json()["role"] == "WARD_INCHARGE"


def test_citizen_register():
    """Verify citizen registration."""
    payload = {
        "name": "Amit Deshpande",
        "phone": "+91 98900 11223",
        "ward": "Ward 2 - Old Town",
        "ward_number": 2,
        "address": "Near Godavari Ghat, Kopargaon",
    }
    r = client.post("/api/auth/register", json=payload)
    assert r.status_code == 201
    assert r.json()["status"] == "registered"


def test_map_layers_and_wards():
    """Verify GIS layers and wards dataset."""
    r_layers = client.get("/api/map/layers")
    assert r_layers.status_code == 200
    layers = r_layers.json()
    assert layers["city"] == "Kopargaon"
    assert len(layers["landmarks"]) >= 5
    assert len(layers["wards"]) == 5

    r_wards = client.get("/api/map/wards")
    assert r_wards.status_code == 200
    assert len(r_wards.json()) == 5


def test_geocoding_and_reverse():
    """Verify geocoding and reverse geocoding in Kopargaon."""
    # Forward geocode
    r_geo = client.get("/api/map/geocode?query=Shivaji+Chowk")
    assert r_geo.status_code == 200
    results = r_geo.json()
    assert len(results) > 0
    assert results[0]["ward_number"] == 5

    # Reverse geocode
    r_rev = client.get("/api/map/reverse-geocode?latitude=19.8917&longitude=74.4789")
    assert r_rev.status_code == 200
    rev_data = r_rev.json()
    assert rev_data["ward_number"] == 5
    assert "Shivaji Chowk" in rev_data["display_name"]


def test_notifications_lifecycle():
    """Verify creating, listing, and reading notifications."""
    # List notifications
    r_list = client.get("/api/notifications")
    assert r_list.status_code == 200

    # Create notification
    notif_payload = {
        "title": "Water Pipeline Repair Scheduled",
        "message": "Ward 5 supply disrupted between 2 PM - 5 PM for pipeline weld.",
        "type": "WARNING",
        "target_role": "ALL",
        "ward_number": 5,
    }
    r_post = client.post("/api/notifications", json=notif_payload)
    assert r_post.status_code == 201
    created_id = r_post.json()["id"]

    # Mark as read
    r_read = client.post(f"/api/notifications/{created_id}/read")
    assert r_read.status_code == 200
    assert r_read.json()["read"] is True
