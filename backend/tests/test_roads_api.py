"""Tests for Municipal Roads API endpoints and synthetic infrastructure."""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_list_roads():
    """Verify listing all municipal roads in Kopargaon."""
    response = client.get("/api/roads")
    assert response.status_code == 200
    roads = response.json()
    assert isinstance(roads, list)
    assert len(roads) >= 5
    # Verify properties
    road_0 = roads[0]
    assert "road_id" in road_0
    assert "road_name" in road_0
    assert "ward" in road_0
    assert "condition" in road_0
    assert "surface_type" in road_0


def test_get_road_by_id():
    """Verify retrieving single road detail."""
    response = client.get("/api/roads/RD-KPG-01")
    assert response.status_code == 200
    road = response.json()
    assert road["road_id"] == "RD-KPG-01"
    assert "Station Road" in road["road_name"]
    assert road["ward_number"] == 1


def test_get_road_not_found():
    """Verify 404 for non-existent road."""
    response = client.get("/api/roads/RD-NON-EXISTENT")
    assert response.status_code == 404
