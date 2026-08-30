"""Security Test Suite for Firebase Authentication & RBAC Enforcement.

Verifies all 10 mandatory security specifications:
1. Valid Firebase officer token -> 200 OK & full officer profile.
2. Valid Firebase citizen token -> 200 OK on user endpoints (citizen role).
3. Invalid / malformed token -> 401 Unauthorized.
4. Missing Bearer token on protected endpoints -> 401 Unauthorized.
5. Citizen calling officer-only endpoints -> 403 Forbidden.
6. Inactive officer calling officer-only endpoints -> 403 Forbidden.
7. Unverified officer calling officer-only endpoints -> 403 Forbidden.
8. Valid officer accessing officer endpoints -> 200 OK.
9. Fake X-Officer-Role header without valid Firebase token -> 401 Unauthorized (never grants auth).
10. Mock token rejected when AUTH_TEST_MODE is false -> 401 Unauthorized.
"""

import os
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.civic_issue import CivicIssue
from app.services.db_service import DatabaseService

client = TestClient(app)
db = DatabaseService()


@pytest.fixture(autouse=True)
def setup_security_test_issue():
    """Ensure a target civic issue exists for testing workflow endpoints."""
    issue = CivicIssue(
        id="ISS-SEC-VAL-01",
        title="Major Water Main Burst",
        category="Water Supply",
        severity=85.0,
        urgency=80.0,
        population_affected=600.0,
        health_safety_impact=75.0,
        location_sensitivity=80.0,
        complaint_age=1.0,
        required_workers=3,
        required_vehicles=1,
        estimated_cost=12000.0,
    )
    db.save_issue(issue)
    yield
    db.delete_issue("ISS-SEC-VAL-01")


# 1. Valid Firebase Officer Token -> 200 OK
def test_valid_firebase_officer_token():
    """An authorized officer in officers/{uid} with verified=True and active=True gets 200."""
    headers = {"Authorization": "Bearer mock-token-UID-AUTH-OFFICER-001"}
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["authenticated"] is True
    assert data["role"] == "officer"
    assert data["is_officer"] is True
    assert data["uid"] == "UID-AUTH-OFFICER-001"
    assert data["officer"]["employeeId"] == "KOP-DEMO-001"
    assert "approve_workflow" in data["permissions"]


# 2. Valid Firebase Citizen Token -> 200 OK (Citizen profile)
def test_valid_firebase_citizen_token():
    """A valid citizen receives 200 on /me with citizen role and non-officer status."""
    headers = {"Authorization": "Bearer mock-token-UID-CITIZEN-RAHUL-004"}
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["authenticated"] is True
    assert data["role"] == "citizen"
    assert data["is_officer"] is False
    assert data["uid"] == "UID-CITIZEN-RAHUL-004"
    assert "submit_issue" in data["permissions"]


# 3. Invalid Token -> 401 Unauthorized
def test_invalid_token_returns_401():
    """Malformed or invalid token returns HTTP 401."""
    headers = {"Authorization": "Bearer invalid_malformed_token_xyz"}
    response = client.post("/api/auth/verify-officer", headers=headers)
    assert response.status_code == 401
    assert "Invalid" in response.json()["detail"] or "token" in response.json()["detail"].lower()


# 4. Missing Token -> 401 Unauthorized
def test_missing_token_returns_401():
    """Calling protected endpoint without Authorization header returns HTTP 401."""
    response = client.post("/api/auth/verify-officer")
    assert response.status_code == 401
    assert "Authentication required" in response.json()["detail"] or "token" in response.json()["detail"].lower()


# 5. Citizen Calling Officer Endpoint -> 403 Forbidden
def test_citizen_calling_officer_endpoint_returns_403():
    """Authenticated citizen calling officer-only workflow/verification endpoints is rejected with 403."""
    headers = {"Authorization": "Bearer mock-token-UID-CITIZEN-RAHUL-004"}

    # Workflow approval endpoint
    r_approve = client.post(
        "/api/workflow/ISS-SEC-VAL-01/approve",
        headers=headers,
        json={"notes": "Citizen attempting workflow approval"},
    )
    assert r_approve.status_code == 403
    assert "Forbidden" in r_approve.json()["detail"]

    # Verify officer endpoint
    r_verify = client.post("/api/auth/verify-officer", headers=headers)
    assert r_verify.status_code == 403

    # Verification override endpoint
    r_override = client.post(
        "/api/verification/ISS-SEC-VAL-01/override",
        headers=headers,
        json={"status": "VERIFIED", "notes": "Citizen override attempt"},
    )
    assert r_override.status_code == 403

    # Contractor project inspection endpoint
    r_inspect = client.post(
        "/api/contractors/projects/PRJ-024/inspect",
        headers=headers,
        json={
            "project_id": "PRJ-024",
            "officer_name": "Citizen User",
            "outcome": "PASSED",
            "inspection_notes": "Citizen inspection attempt",
        },
    )
    assert r_inspect.status_code == 403


# 6. Inactive Officer -> 403 Forbidden
def test_inactive_officer_returns_403():
    """An officer record with active=False is rejected with HTTP 403 Forbidden."""
    headers = {"Authorization": "Bearer mock-token-UID-INACTIVE-OFFICER-003"}
    response = client.post(
        "/api/workflow/ISS-SEC-VAL-01/approve",
        headers=headers,
        json={"notes": "Suspended officer trying to approve"},
    )
    assert response.status_code == 403
    assert "Forbidden" in response.json()["detail"]


# 7. Unverified Officer -> 403 Forbidden
def test_unverified_officer_returns_403():
    """An officer record with verified=False is rejected with HTTP 403 Forbidden."""
    headers = {"Authorization": "Bearer mock-token-UID-UNVERIFIED-OFFICER-002"}
    response = client.post(
        "/api/workflow/ISS-SEC-VAL-01/approve",
        headers=headers,
        json={"notes": "Unverified officer trying to approve"},
    )
    assert response.status_code == 403
    assert "Forbidden" in response.json()["detail"]


# 8. Valid Officer Access -> 200 OK
def test_valid_officer_access_returns_200():
    """An active verified officer successfully executes workflow and inspection actions with 200."""
    headers = {"Authorization": "Bearer mock-token-UID-AUTH-OFFICER-001"}

    # 1. Officer verification check
    r_verify = client.post("/api/auth/verify-officer", headers=headers)
    assert r_verify.status_code == 200
    assert r_verify.json()["is_officer"] is True

    # 2. Workflow approve
    r_approve = client.post(
        "/api/workflow/ISS-SEC-VAL-01/approve",
        headers=headers,
        json={"notes": "Valid technical approval by CMO"},
    )
    assert r_approve.status_code == 200
    assert r_approve.json()["status"] == "APPROVED"
    assert r_approve.json()["officer_id"] == "Demo Municipal Officer"

    # 3. Verification override
    r_override = client.post(
        "/api/verification/ISS-SEC-VAL-01/override",
        headers=headers,
        json={"status": "VERIFIED", "notes": "Officer verified after on-site check"},
    )
    assert r_override.status_code == 200
    assert r_override.json()["verification_status"] == "VERIFIED"


# 9. Fake X-Officer-Role header without valid Firebase token -> 401 Unauthorized
def test_fake_x_officer_role_header_rejected_without_token():
    """Headers like X-Officer-Role or X-Officer-ID NEVER grant authentication without valid token."""
    spoofed_headers = {
        "X-Officer-Role": "CHIEF_OFFICER",
        "X-Officer-ID": "Shri. Rajesh Kulkarni",
    }
    # Protected endpoint must return 401, not 200
    response = client.post(
        "/api/workflow/ISS-SEC-VAL-01/approve",
        headers=spoofed_headers,
        json={"notes": "Spoofed header attempt without token"},
    )
    assert response.status_code == 401
    assert "Authentication required" in response.json()["detail"] or "Bearer" in response.headers.get("WWW-Authenticate", "")


# 10. Mock Token Rejected when AUTH_TEST_MODE is false -> 401 Unauthorized
def test_mock_token_rejected_when_auth_test_mode_is_false(monkeypatch):
    """When AUTH_TEST_MODE is false (production default), mock tokens are strictly rejected."""
    monkeypatch.setenv("AUTH_TEST_MODE", "false")
    headers = {"Authorization": "Bearer mock-token-UID-AUTH-OFFICER-001"}
    response = client.post("/api/auth/verify-officer", headers=headers)
    assert response.status_code == 401
    assert "Invalid, expired, or unverified" in response.json()["detail"] or "Firebase" in response.json()["detail"]
