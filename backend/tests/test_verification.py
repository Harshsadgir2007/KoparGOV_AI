"""Comprehensive deterministic tests for Civic Trust & Verification Engine (Challenge 2).

Verifies:
1. A normal unique complaint evaluation (high confidence / VERIFIED).
2. Multiple similar complaints detection (SIMILAR_REPORTS).
3. Submission burst detection (SUBMISSION_BURST penalty & NEEDS_REVIEW).
4. Location clustering detection (LOCATION_CLUSTER).
5. Missing evidence handling (missing photos does not invalidate complaint).
6. Independent citizen confirmation (cross-corroboration by distinct users).
7. Suspicious complaint requiring officer review (requires_officer_review=True).
8. Existing normal CIE flow integration.
9. Existing blackout flow protection (PENDING_RECOVERY preserved).
10. Officer manual override authorization and RBAC protection.
"""

from datetime import datetime, timezone, timedelta
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.trust_engine import TrustEngine
from app.models.civic_issue import CivicIssue
from app.models.verification import (
    OfficerVerificationOverrideRequest,
    SignalSeverity,
    VerificationResult,
    VerificationStatus,
)
from app.services.db_service import DatabaseService, _GLOBAL_MOCK_DB
from app.services.resilience_service import get_resilience_service
from app.services.verification_service import VerificationService

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_system_state():
    """Reset database and resilience state before each test."""
    resilience = get_resilience_service()
    resilience.reset_demo()
    for key in _GLOBAL_MOCK_DB:
        _GLOBAL_MOCK_DB[key] = {}
    yield


# ------------------------------------------------------------------------------
# 1. Normal Unique Complaint
# ------------------------------------------------------------------------------
def test_normal_unique_complaint():
    """A normal complaint with photo evidence and GPS coordinates receives a high trust score."""
    engine = TrustEngine()
    issue = CivicIssue(
        id="ISS-2001",
        title="Severe pothole near Gandhi Chowk",
        description="Deep crater on main asphalt road causing traffic congestion and vehicle tire damage.",
        ward_number=5,
        location="Ward 5 Gandhi Chowk",
        address="Station Road, Gandhi Chowk, Kopargaon",
        latitude=19.8915,
        longitude=74.4792,
        citizen_name="Rahul Patil",
        citizen_phone="9876543210",
        before_photos=["https://storage.kopargov.in/photos/pothole1.jpg"],
        created_at="2026-08-30T10:00:00Z",
    )

    result = engine.evaluate_issue(issue, existing_issues=[])

    assert result.issue_id == "ISS-2001"
    assert result.trust_score >= 80.0
    assert result.verification_status == VerificationStatus.VERIFIED
    assert result.requires_officer_review is False

    signal_names = [s.name for s in result.signals]
    assert "EVIDENCE_PRESENT" in signal_names
    assert "SIMILAR_REPORTS" in signal_names

    evidence_sig = next(s for s in result.signals if s.name == "EVIDENCE_PRESENT")
    assert evidence_sig.severity == SignalSeverity.POSITIVE
    assert evidence_sig.score_impact > 0


# ------------------------------------------------------------------------------
# 2. Multiple Similar Complaints
# ------------------------------------------------------------------------------
def test_multiple_similar_complaints():
    """Multiple complaints describing the same road issue are detected as SIMILAR_REPORTS."""
    engine = TrustEngine()
    existing1 = CivicIssue(
        id="ISS-101",
        title="Pothole on Station Road",
        description="Deep pothole on Station Road causing accidents and tire puncture.",
        ward_number=5,
        location="Ward 5",
        address="Station Road",
        latitude=19.8910,
        longitude=74.4790,
        citizen_name="Anil Deshmukh",
        citizen_phone="9822112233",
        created_at="2026-08-28T09:00:00Z",
    )
    new_issue = CivicIssue(
        id="ISS-102",
        title="Major pothole on Station Road",
        description="Large dangerous pothole on Station Road causing vehicle damage and traffic.",
        ward_number=5,
        location="Ward 5",
        address="Station Road, Near Bus Stand",
        latitude=19.8912,
        longitude=74.4791,
        citizen_name="Sunil Kulkarni",
        citizen_phone="9855443322",
        created_at="2026-08-30T11:00:00Z",
    )

    result = engine.evaluate_issue(new_issue, existing_issues=[existing1])

    similar_sig = next(s for s in result.signals if s.name == "SIMILAR_REPORTS")
    assert "ISS-101" in similar_sig.details
    assert any("corroborating or related report" in r for r in result.verification_reasons)


# ------------------------------------------------------------------------------
# 3. Submission Burst (Rapid Submissions Penalty)
# ------------------------------------------------------------------------------
def test_submission_burst_detection():
    """Rapid duplicate submissions within 30 minutes trigger SUBMISSION_BURST and require review."""
    engine = TrustEngine(burst_window_seconds=1800, burst_count_threshold=3)
    base_time = datetime(2026, 8, 30, 10, 0, 0, tzinfo=timezone.utc)

    # 2 existing identical reports submitted 5 and 10 minutes prior
    existing1 = CivicIssue(
        id="BURST-1",
        title="Water pipeline rupture overflowing everywhere",
        description="Massive water leak pipeline burst flooding the market entrance street completely.",
        ward_number=3,
        location="Ward 3 Market",
        address="Market Lane 1",
        latitude=19.8850,
        longitude=74.4720,
        created_at=(base_time - timedelta(minutes=10)).isoformat(),
    )
    existing2 = CivicIssue(
        id="BURST-2",
        title="Water pipeline rupture overflowing everywhere",
        description="Massive water leak pipeline burst flooding the market entrance street completely.",
        ward_number=3,
        location="Ward 3 Market",
        address="Market Lane 1",
        latitude=19.8850,
        longitude=74.4720,
        created_at=(base_time - timedelta(minutes=5)).isoformat(),
    )

    new_burst_issue = CivicIssue(
        id="BURST-3",
        title="Water pipeline rupture overflowing everywhere",
        description="Massive water leak pipeline burst flooding the market entrance street completely.",
        ward_number=3,
        location="Ward 3 Market",
        address="Market Lane 1",
        latitude=19.8850,
        longitude=74.4720,
        created_at=base_time.isoformat(),
    )

    result = engine.evaluate_issue(new_burst_issue, existing_issues=[existing1, existing2])

    burst_sig = next(s for s in result.signals if s.name == "SUBMISSION_BURST")
    assert burst_sig.severity == SignalSeverity.WARNING
    assert burst_sig.score_impact < 0
    assert result.requires_officer_review is True
    assert result.verification_status in [VerificationStatus.NEEDS_REVIEW, VerificationStatus.UNVERIFIED]


# ------------------------------------------------------------------------------
# 4. Location Clustering
# ------------------------------------------------------------------------------
def test_location_clustering():
    """Concentrated reports in the same ward trigger LOCATION_CLUSTER signal."""
    engine = TrustEngine()
    existing1 = CivicIssue(
        id="LOC-1",
        title="Garbage bin overflowing near school",
        description="Waste pile and garbage bin overflowing creating foul odor near primary school.",
        ward_number=2,
        location="Ward 2 School Zone",
        address="Main Road, Ward 2",
        created_at="2026-08-25T08:00:00Z",
    )
    new_issue = CivicIssue(
        id="LOC-2",
        title="Garbage accumulation near primary school",
        description="Severe waste pile and garbage bin overflowing near school gate.",
        ward_number=2,
        location="Ward 2 School Zone",
        address="School Gate, Ward 2",
        created_at="2026-08-29T10:00:00Z",
    )

    result = engine.evaluate_issue(new_issue, existing_issues=[existing1])

    loc_sig = next(s for s in result.signals if s.name == "LOCATION_CLUSTER")
    assert "Ward 2" in loc_sig.details
    assert loc_sig.score_impact >= 0


# ------------------------------------------------------------------------------
# 5. Missing Evidence (Never Marks False)
# ------------------------------------------------------------------------------
def test_missing_evidence_not_marked_false():
    """A complaint without photos receives neutral evidence points and is NOT automatically rejected or marked false."""
    engine = TrustEngine()
    issue_no_photo = CivicIssue(
        id="ISS-NO-PHOTO",
        title="Streetlight flickering on 4th cross",
        description="Street light blinks intermittently during evening hours on 4th cross road.",
        ward_number=4,
        location="Ward 4",
        address="4th Cross Road",
        latitude=19.8900,
        longitude=74.4800,
        before_photos=[],  # No photos
    )

    result = engine.evaluate_issue(issue_no_photo, existing_issues=[])

    evidence_sig = next(s for s in result.signals if s.name == "EVIDENCE_PRESENT")
    assert "Missing photo does not invalidate civic complaint" in evidence_sig.details
    # Score remains within valid operational range
    assert 0.0 <= result.trust_score <= 100.0
    assert result.verification_status in [VerificationStatus.NEEDS_REVIEW, VerificationStatus.VERIFIED]


# ------------------------------------------------------------------------------
# 6. Independent Citizen Confirmation
# ------------------------------------------------------------------------------
def test_independent_confirmation():
    """Corroboration from distinct citizens creates an INDEPENDENT_CONFIRMATION positive signal."""
    engine = TrustEngine()
    rep1 = CivicIssue(
        id="CORROB-1",
        title="Open manhole on Tilak Road",
        description="Dangerous uncovered manhole chamber open on pedestrian walkway.",
        ward_number=1,
        citizen_name="Deepak Sharma",
        citizen_phone="9811111111",
        user_id="USR-101",
        created_at="2026-08-20T10:00:00Z",
    )
    rep2 = CivicIssue(
        id="CORROB-2",
        title="Broken open manhole lid Tilak Road",
        description="Uncovered manhole chamber open on walkway creating hazard for pedestrians.",
        ward_number=1,
        citizen_name="Kavita Joshi",
        citizen_phone="9822222222",
        user_id="USR-102",
        created_at="2026-08-22T14:00:00Z",
    )
    new_issue = CivicIssue(
        id="CORROB-3",
        title="Hazardous open manhole on Tilak Road walkway",
        description="Uncovered open manhole chamber on pedestrian walkway near junction.",
        ward_number=1,
        citizen_name="Sanjay Shinde",
        citizen_phone="9833333333",
        user_id="USR-103",
        latitude=19.8920,
        longitude=74.4780,
        address="Tilak Road Junction",
        before_photos=["https://storage.kopargov.in/photos/manhole.jpg"],
        created_at="2026-08-25T09:00:00Z",
    )

    result = engine.evaluate_issue(new_issue, existing_issues=[rep1, rep2])

    ind_sig = next(s for s in result.signals if s.name == "INDEPENDENT_CONFIRMATION")
    assert ind_sig.severity == SignalSeverity.POSITIVE
    assert ind_sig.score_impact >= 20.0
    assert result.trust_score >= 80.0
    assert result.verification_status == VerificationStatus.VERIFIED


# ------------------------------------------------------------------------------
# 7. Suspicious Complaint Requiring Officer Review
# ------------------------------------------------------------------------------
def test_suspicious_complaint_requires_officer_review():
    """A complaint with minimal details and rapid duplicate burst requires officer review."""
    engine = TrustEngine(burst_window_seconds=1800, burst_count_threshold=2)
    now = datetime.now(timezone.utc)

    existing = CivicIssue(
        id="SPAM-1",
        title="bad road",
        description="broken",
        ward_number=1,
        created_at=(now - timedelta(minutes=2)).isoformat(),
    )
    new_issue = CivicIssue(
        id="SPAM-2",
        title="bad road",
        description="broken",
        ward_number=1,
        created_at=now.isoformat(),
        before_photos=[],
    )

    result = engine.evaluate_issue(new_issue, existing_issues=[existing])

    assert result.requires_officer_review is True
    assert result.verification_status != VerificationStatus.VERIFIED


# ------------------------------------------------------------------------------
# 8. Normal CIE Pipeline End-to-End Integration
# ------------------------------------------------------------------------------
def test_cie_pipeline_flow_with_verification():
    """POST /api/issues normal flow runs Verification Engine and CIE Pipeline seamlessly."""
    payload = {
        "id": "ISS-NORMAL-1",
        "title": "Severe road cavity on College Road",
        "description": "Massive pothole endangering two-wheeler commuters near college gate.",
        "category": "Potholes & Road Damage",
        "ward_number": 3,
        "location": "Ward 3 College Zone",
        "address": "College Road, Near Sanjivani Campus",
        "latitude": 19.8890,
        "longitude": 74.4750,
        "citizen_name": "Pooja Wagh",
        "citizen_phone": "9844445555",
        "before_photos": ["https://storage.kopargov.in/photos/road_cavity.jpg"],
        "severity": 85.0,
        "urgency": 80.0,
        "population_affected": 500.0,
        "health_safety_impact": 75.0,
        "location_sensitivity": 90.0,
        "complaint_age": 2.0,
        "estimated_cost": 15000.0,
        "required_workers": 4,
        "required_vehicles": 1,
        "required_time_hours": 6.0,
    }

    response = client.post("/api/issues", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["status"] == "SUCCESS"
    assert data["issue"]["id"] == "ISS-NORMAL-1"
    assert data["cie_result"] is not None
    assert data["verification_result"] is not None
    assert data["verification_result"]["trust_score"] >= 80.0
    assert data["verification_result"]["verification_status"] == "VERIFIED"

    # Query GET /api/verification/{issue_id}
    v_res = client.get("/api/verification/ISS-NORMAL-1")
    assert v_res.status_code == 200
    v_data = v_res.json()
    assert v_data["issue_id"] == "ISS-NORMAL-1"
    assert v_data["trust_score"] == data["verification_result"]["trust_score"]


# ------------------------------------------------------------------------------
# 9. Blackout Resilience Flow (Unchanged & Preserved)
# ------------------------------------------------------------------------------
def test_blackout_flow_preserved():
    """During blackout, POST /api/issues safely queues PENDING_RECOVERY without executing trust engine."""
    resilience = get_resilience_service()
    resilience.simulate_blackout()
    assert resilience.is_blackout_active() is True

    payload = {
        "id": "ISS-BLACKOUT-1",
        "title": "Emergency pipeline burst during blackout",
        "description": "Flooding on market street.",
        "ward_number": 5,
        "severity": 90.0,
        "urgency": 95.0,
    }

    response = client.post("/api/issues", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["status"] == "PENDING_RECOVERY"
    assert data["cie_result"] is None
    assert data["verification_result"] is None
    assert data["operation_id"] is not None

    # Recover system and verify restored state
    report = resilience.recover_system()
    assert report.status == "SUCCESS"
    assert resilience.is_blackout_active() is False


# ------------------------------------------------------------------------------
# 10. Officer Manual Override & RBAC Protection
# ------------------------------------------------------------------------------
def test_officer_override_and_rbac():
    """Officer can manually override verification; Citizen caller is forbidden (403)."""
    db = DatabaseService()
    issue = CivicIssue(
        id="ISS-OVERRIDE-1",
        title="Suspected hoax of water contamination",
        description="Claims tap water has strange color without evidence.",
        ward_number=4,
        before_photos=[],
    )
    db.save_issue(issue)

    # 1. Citizen attempts override -> 403 Forbidden
    override_body = {
        "status": "VERIFIED",
        "officer_id": "citizen_user",
        "notes": "Citizen trying to self-verify",
    }
    cit_res = client.post(
        "/api/verification/ISS-OVERRIDE-1/override",
        json=override_body,
        headers={"X-Officer-Role": "CITIZEN"},
    )
    assert cit_res.status_code == 403

    # 2. Officer performs override -> 200 OK
    officer_body = {
        "status": "VERIFIED",
        "officer_id": "Shri. Rajesh Kulkarni (CMO)",
        "notes": "Field inspection confirmed by Junior Engineer Sunil Jadhav.",
    }
    off_res = client.post(
        "/api/verification/ISS-OVERRIDE-1/override",
        json=officer_body,
        headers={"X-Officer-Role": "CHIEF_OFFICER"},
    )
    assert off_res.status_code == 200
    off_data = off_res.json()
    assert off_data["verification_status"] == "VERIFIED"
    assert off_data["manual_override"] is True
    assert off_data["overridden_by"] == "Shri. Rajesh Kulkarni (CMO)"
    assert "Field inspection confirmed" in off_data["override_notes"]
    assert any("Officer manual override" in r for r in off_data["verification_reasons"])
