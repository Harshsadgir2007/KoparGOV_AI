"""Pytest configuration and shared test fixtures for KoparGov AI."""

import os
import pytest
from app.services.db_service import DatabaseService, _GLOBAL_MOCK_DB
from app.models.civic_issue import CivicIssue


@pytest.fixture(autouse=True)
def enable_auth_test_mode_for_tests(monkeypatch):
    """Enable test authentication mode by default during pytest runs.
    
    Specific tests can override this with monkeypatch.setenv("AUTH_TEST_MODE", "false")
    to verify production authentication enforcement.
    """
    monkeypatch.setenv("AUTH_TEST_MODE", "true")


@pytest.fixture(autouse=True)
def seed_test_officers_and_users():
    """Ensure standard test officer registry and users exist for test suites."""
    db = DatabaseService()

    # Pre-provision authorized officers for all hierarchy tiers
    authorized_cmo = {
        "uid": "UID-AUTH-OFFICER-001",
        "name": "Demo Municipal Officer",
        "employeeId": "KOP-DEMO-001",
        "designation": "Chief Municipal Officer (CMO)",
        "department": "Kopargaon Municipal Council",
        "ward": "Ward 5",
        "email": "officer@kopargaon.gov.in",
        "hierarchy_role": "CMO",
        "verified": True,
        "active": True,
    }
    db.save_officer(authorized_cmo)

    sunil_ward = {
        "uid": "OFFICER-SUNIL-01",
        "name": "Shri. Sunil Jadhav",
        "employeeId": "KOP-MUN-002",
        "designation": "Junior Engineer & Ward 5 Field In-Charge",
        "department": "Ward 5 Field Administration",
        "ward": "Ward 5",
        "email": "sunil.jadhav@kopargaon.gov.in",
        "hierarchy_role": "WARD_OFFICER",
        "verified": True,
        "active": True,
    }
    db.save_officer(sunil_ward)

    sunita_dept = {
        "uid": "OFFICER-SUNITA-DEPT",
        "name": "Smt. Sunita More",
        "employeeId": "KOP-MUN-003",
        "designation": "Sanitation & Public Health Superintendent",
        "department": "Sanitation & Solid Waste Management Dept.",
        "ward": "City-Wide",
        "email": "sunita.more@kopargaon.gov.in",
        "hierarchy_role": "DEPARTMENT_OFFICER",
        "verified": True,
        "active": True,
    }
    db.save_officer(sunita_dept)

    rajesh_cmo = {
        "uid": "OFFICER-RAJESH-CMO",
        "name": "Shri. Rajesh Kulkarni",
        "employeeId": "KOP-MUN-001",
        "designation": "Chief Municipal Officer (CMO)",
        "department": "Kopargaon Municipal Council (KMC)",
        "ward": "City-Wide",
        "email": "rajesh.kulkarni@kopargaon.gov.in",
        "hierarchy_role": "CMO",
        "verified": True,
        "active": True,
    }
    db.save_officer(rajesh_cmo)

    deepak_tahsildar = {
        "uid": "OFFICER-DEEPAK-TAHSILDAR",
        "name": "Shri. Deepak Shinde",
        "employeeId": "KOP-REV-001",
        "designation": "Tahsildar & Sub-Divisional Magistrate",
        "department": "Sub-Divisional Revenue & Taluka Administration",
        "ward": "Taluka-Wide",
        "email": "deepak.shinde@maharashtra.gov.in",
        "hierarchy_role": "TAHSILDAR",
        "verified": True,
        "active": True,
    }
    db.save_officer(deepak_tahsildar)

    unverified_officer = {
        "uid": "UID-UNVERIFIED-OFFICER-002",
        "name": "Unverified Officer",
        "employeeId": "KOP-UNV-002",
        "designation": "Junior Engineer",
        "department": "Public Works",
        "email": "unverified@kopargaon.gov.in",
        "hierarchy_role": "WARD_OFFICER",
        "verified": False,
        "active": True,
    }
    db.save_officer(unverified_officer)

    inactive_officer = {
        "uid": "UID-INACTIVE-OFFICER-003",
        "name": "Suspended Officer",
        "employeeId": "KOP-SUS-003",
        "designation": "Sanitation Inspector",
        "department": "Sanitation",
        "email": "inactive@kopargaon.gov.in",
        "hierarchy_role": "DEPARTMENT_OFFICER",
        "verified": True,
        "active": False,
    }
    db.save_officer(inactive_officer)

    # Citizen users
    citizen_user = {
        "uid": "UID-CITIZEN-RAHUL-004",
        "name": "Rahul Patil",
        "email": "rahul.patil@gmail.com",
        "role": "citizen",
    }
    db.save_user(citizen_user)

    google_user = {
        "uid": "UID-GOOGLE-USER-005",
        "name": "Random Google User",
        "email": "random.person@gmail.com",
        "role": "citizen",
    }
    db.save_user(google_user)
