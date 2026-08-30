"""Comprehensive Test Suite for Officer Authentication & Authorization Matrix.

Tests all 8 mandatory security requirements:
1. Citizen logs in -> Cannot access officer APIs (403 Forbidden).
2. Random authenticated Google/Gmail user -> Cannot access officer APIs (403 Forbidden).
3. Authorized officer UID (verified=True, active=True) -> Can access officer APIs (200 OK).
4. Officer with verified=False -> Access denied (403 Forbidden).
5. Officer with active=False -> Access denied (403 Forbidden).
6. No Firebase token -> 401 Unauthorized.
7. Invalid Firebase token -> 401 Unauthorized.
8. Frontend sends role="officer" in request payload or header -> Backend denies access unless UID exists in officer registry.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.civic_issue import CivicIssue
from app.services.db_service import DatabaseService

client = TestClient(app)
db = DatabaseService()


@pytest.fixture(autouse=True)
def setup_test_data():
    """Setup clean state for officer registry and civic issue before each test."""
    # Create test civic issue
    issue = CivicIssue(
        id="ISS-SEC-TEST-01",
        title="Pothole on Station Road",
        category="Potholes & Road Damage",
        severity=75.0,
        urgency=70.0,
        population_affected=400.0,
        health_safety_impact=70.0,
        location_sensitivity=80.0,
        complaint_age=2.0,
        required_workers=2,
        required_vehicles=1,
        estimated_cost=5000.0,
    )
    db.save_issue(issue)

    # 1. Pre-provision an Authorized Officer in officers/{uid}
    authorized_officer = {
        "uid": "UID-AUTH-OFFICER-001",
        "name": "Demo Municipal Officer",
        "employeeId": "KOP-DEMO-001",
        "designation": "Chief Municipal Officer (CMO)",
        "department": "Kopargaon Municipal Council",
        "ward": "Ward 5",
        "email": "officer@kopargaon.gov.in",
        "verified": True,
        "active": True,
    }
    db.save_officer(authorized_officer)

    # 2. Pre-provision an Officer with verified=False
    unverified_officer = {
        "uid": "UID-UNVERIFIED-OFFICER-002",
        "name": "Unverified Officer",
        "employeeId": "KOP-UNV-002",
        "designation": "Junior Engineer",
        "department": "Public Works",
        "email": "unverified@kopargaon.gov.in",
        "verified": False,
        "active": True,
    }
    db.save_officer(unverified_officer)

    # 3. Pre-provision an Officer with active=False
    inactive_officer = {
        "uid": "UID-INACTIVE-OFFICER-003",
        "name": "Suspended Officer",
        "employeeId": "KOP-SUS-003",
        "designation": "Sanitation Inspector",
        "department": "Sanitation",
        "email": "inactive@kopargaon.gov.in",
        "verified": True,
        "active": False,
    }
    db.save_officer(inactive_officer)

    # 4. Save a regular Citizen profile in users collection
    citizen_user = {
        "uid": "UID-CITIZEN-RAHUL-004",
        "name": "Rahul Patil",
        "email": "rahul.patil@gmail.com",
        "role": "citizen",
    }
    db.save_user(citizen_user)

    # 5. Save a random Google user in users collection
    google_user = {
        "uid": "UID-GOOGLE-USER-005",
        "name": "Random Google User",
        "email": "random.person@gmail.com",
        "role": "citizen",
    }
    db.save_user(google_user)

    yield

    # Cleanup
    db.delete_issue("ISS-SEC-TEST-01")
    db.delete_officer("UID-AUTH-OFFICER-001")
    db.delete_officer("UID-UNVERIFIED-OFFICER-002")
    db.delete_officer("UID-INACTIVE-OFFICER-003")


# ------------------------------------------------------------------------------
# TEST 1: Citizen logs in -> Cannot access officer APIs (403 Forbidden)
# ------------------------------------------------------------------------------
def test_1_citizen_cannot_access_officer_apis():
    """A valid citizen token must be denied access to officer workflow APIs with HTTP 403."""
    headers = {"Authorization": "Bearer mock-token-UID-CITIZEN-RAHUL-004"}
    
    # Try officer approval
    r_approve = client.post(
        "/api/workflow/ISS-SEC-TEST-01/approve",
        headers=headers,
        json={"officer_id": "Rahul Patil", "notes": "Citizen trying to approve"},
    )
    assert r_approve.status_code == 403
    assert "Forbidden" in r_approve.json()["detail"]

    # Try verify officer endpoint
    r_verify = client.post("/api/auth/verify-officer", headers=headers)
    assert r_verify.status_code == 403


# ------------------------------------------------------------------------------
# TEST 2: Random authenticated Google/Gmail user -> Cannot access officer APIs (403)
# ------------------------------------------------------------------------------
def test_2_random_google_user_cannot_access_officer_apis():
    """A random authenticated Google user not in officers collection must be denied with 403."""
    headers = {"Authorization": "Bearer mock-token-UID-GOOGLE-USER-005"}

    r = client.post(
        "/api/workflow/ISS-SEC-TEST-01/approve",
        headers=headers,
        json={"officer_id": "Random Person", "notes": "Google user bypass attempt"},
    )
    assert r.status_code == 403
    assert "Forbidden" in r.json()["detail"]


# ------------------------------------------------------------------------------
# TEST 3: Authorized officer UID -> Can access officer APIs (200 OK)
# ------------------------------------------------------------------------------
def test_3_authorized_officer_can_access_officer_apis():
    """An authorized officer in officers/{uid} with verified=true & active=true succeeds with 200."""
    headers = {"Authorization": "Bearer mock-token-UID-AUTH-OFFICER-001"}

    # Test officer verification
    r_verify = client.post("/api/auth/verify-officer", headers=headers)
    assert r_verify.status_code == 200
    assert r_verify.json()["is_officer"] is True
    assert r_verify.json()["officer"]["employeeId"] == "KOP-DEMO-001"

    # Test workflow approval
    r_approve = client.post(
        "/api/workflow/ISS-SEC-TEST-01/approve",
        headers=headers,
        json={"officer_id": "Demo Municipal Officer", "notes": "Authorized technical sanction."},
    )
    assert r_approve.status_code == 200
    assert r_approve.json()["status"] == "APPROVED"


# ------------------------------------------------------------------------------
# TEST 4: Officer with verified=False -> Access denied (403 Forbidden)
# ------------------------------------------------------------------------------
def test_4_unverified_officer_access_denied():
    """An officer document with verified=False must be rejected with HTTP 403."""
    headers = {"Authorization": "Bearer mock-token-UID-UNVERIFIED-OFFICER-002"}

    r = client.post(
        "/api/workflow/ISS-SEC-TEST-01/approve",
        headers=headers,
        json={"officer_id": "Unverified Officer"},
    )
    assert r.status_code == 403
    assert "Forbidden" in r.json()["detail"]


# ------------------------------------------------------------------------------
# TEST 5: Officer with active=False -> Access denied (403 Forbidden)
# ------------------------------------------------------------------------------
def test_5_inactive_officer_access_denied():
    """An officer document with active=False must be rejected with HTTP 403."""
    headers = {"Authorization": "Bearer mock-token-UID-INACTIVE-OFFICER-003"}

    r = client.post(
        "/api/workflow/ISS-SEC-TEST-01/approve",
        headers=headers,
        json={"officer_id": "Suspended Officer"},
    )
    assert r.status_code == 403
    assert "Forbidden" in r.json()["detail"]


# ------------------------------------------------------------------------------
# TEST 6: No Firebase token -> 401 Unauthorized
# ------------------------------------------------------------------------------
def test_6_no_token_returns_401_on_protected_endpoints():
    """Protected endpoints without token or identity must return HTTP 401."""
    r_verify = client.post("/api/auth/verify-officer")
    assert r_verify.status_code == 401
    assert "Authentication required" in r_verify.json()["detail"] or "credentials" in r_verify.json()["detail"].lower()


# ------------------------------------------------------------------------------
# TEST 7: Invalid Firebase token -> 401 Unauthorized
# ------------------------------------------------------------------------------
def test_7_invalid_token_returns_401():
    """Malformed or invalid tokens must be rejected with HTTP 401."""
    headers = {"Authorization": "Bearer invalid_malformed_token_xyz"}
    r = client.post("/api/auth/verify-officer", headers=headers)
    assert r.status_code == 401


# ------------------------------------------------------------------------------
# TEST 8: Frontend sends role="officer" -> Backend still denies access unless UID in registry
# ------------------------------------------------------------------------------
def test_8_spoofed_role_body_or_header_denied_without_registry_entry():
    """Passing role='officer' in payload or header from an unauthorized citizen UID must be blocked."""
    headers = {
        "Authorization": "Bearer mock-token-UID-CITIZEN-RAHUL-004",
        "X-Officer-Role": "officer",
        "X-Officer-Id": "Rahul Patil",
    }
    spoofed_body = {
        "officer_id": "Rahul Patil",
        "role": "officer",
        "notes": "Attempting role injection via client payload",
    }

    r = client.post("/api/workflow/ISS-SEC-TEST-01/approve", headers=headers, json=spoofed_body)
    assert r.status_code == 403
    assert "Forbidden" in r.json()["detail"]
