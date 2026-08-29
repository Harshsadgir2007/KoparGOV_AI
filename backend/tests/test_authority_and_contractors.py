"""Tests for Authority Routing and Contractor Accountability & Project Inspection Engine."""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.authority_router import AuthorityRoutingEngine
from app.core.contractor_engine import ContractorAccountabilityEngine
from app.models.civic_issue import CivicIssue, PriorityLevel
from app.models.authority import AuthorityRole, ApprovalStepStatus
from app.models.contractor import (
    InspectionOutcome,
    InspectionRecommendationStatus,
    MunicipalProject,
    RecordInspectionRequest,
)

client = TestClient(app)


def test_authority_routing_routine_ward_issue():
    engine = AuthorityRoutingEngine()
    issue = CivicIssue(
        id="ISS-ROUTINE",
        title="Minor streetlight repair",
        category="Streetlight Outage",
        severity=40.0,
        urgency=40.0,
        population_affected=100.0,
        health_safety_impact=30.0,
        location_sensitivity=40.0,
        complaint_age=1.0,
        estimated_cost=5000.0,
        required_workers=1,
        required_vehicles=1,
        required_time_hours=2.0,
    )
    routing = engine.determine_routing(issue, composite_score=38.0, priority_level=PriorityLevel.LOW)
    assert routing.required_authority == AuthorityRole.WARD_INCHARGE
    assert len(routing.approval_chain) == 1
    assert routing.approval_chain[0].status == ApprovalStepStatus.PENDING
    assert routing.expected_response_sla_hours == 72


def test_authority_routing_critical_waste_issue():
    """ISS-1024 Waste issue with 15k cost, 2 workers, 92.25 score routes to Chief Officer (Municipal)."""
    engine = AuthorityRoutingEngine()
    issue = CivicIssue(
        id="ISS-1024",
        title="Garbage accumulation near market",
        category="WASTE",
        severity=90.0,
        urgency=90.0,
        population_affected=1200.0,
        health_safety_impact=85.0,
        location_sensitivity=90.0,
        complaint_age=3.0,
        estimated_cost=15000.0,
        required_workers=2,
        required_vehicles=1,
        required_time_hours=4.0,
    )
    routing = engine.determine_routing(issue, composite_score=92.25, priority_level=PriorityLevel.CRITICAL)
    assert routing.required_authority == AuthorityRole.CHIEF_OFFICER
    assert len(routing.approval_chain) == 3
    assert routing.approval_chain[0].role == AuthorityRole.WARD_INCHARGE
    assert routing.approval_chain[0].status == ApprovalStepStatus.PENDING
    assert routing.approval_chain[1].role == AuthorityRole.DEPARTMENT_OFFICER
    assert routing.approval_chain[1].status == ApprovalStepStatus.LOCKED
    assert routing.approval_chain[2].role == AuthorityRole.CHIEF_OFFICER
    assert routing.approval_chain[2].status == ApprovalStepStatus.LOCKED
    assert routing.expected_response_sla_hours == 12


def test_authority_routing_inter_jurisdiction_land_dispute():
    """Land encroachment / revenue disputes route to Tahsildar / Taluka administration."""
    engine = AuthorityRoutingEngine()
    issue = CivicIssue(
        id="ISS-LAND",
        title="Encroachment on municipal public land reserve",
        category="Encroachment",
        description="Illegal land dispute and commercial structure encroachment near taluka boundary.",
        severity=75.0,
        urgency=70.0,
        population_affected=800.0,
        health_safety_impact=60.0,
        location_sensitivity=85.0,
        complaint_age=5.0,
        estimated_cost=30000.0,
        required_workers=3,
        required_vehicles=2,
        required_time_hours=8.0,
    )
    routing = engine.determine_routing(issue, composite_score=72.0, priority_level=PriorityLevel.HIGH)
    assert routing.required_authority == AuthorityRole.TAHSILDAR_OR_RELEVANT_AUTHORITY
    assert routing.requires_inter_jurisdiction is True
    assert len(routing.approval_chain) == 4


def test_contractor_signal_detection_excessive_complaints():
    engine = ContractorAccountabilityEngine()
    project = MunicipalProject(
        project_id="PRJ-024",
        asset_id="AST-RD-05",
        asset_name="Ward 5 Market Road",
        contractor_id="CON-ABC",
        contractor_name="ABC Infrastructure Pvt. Ltd.",
        category="Road Resurfacing",
        ward="Ward 5",
        ward_number=5,
        coordinates=[19.8917, 74.4789],
        start_date="2026-05-10T00:00:00Z",
        planned_completion_date="2026-08-01T00:00:00Z",
        actual_completion_date="2026-08-15T00:00:00Z",
        contract_value=4500000.0,
        post_completion_complaints=17,
        high_severity_complaints=5,
        safety_complaints=3,
        recent_complaints_last_7_days=4,
        rework_requests=2,
    )
    status_val, signals, rationale = engine.evaluate_project_signals(project)
    assert status_val == InspectionRecommendationStatus.INSPECTION_RECOMMENDED
    assert len(signals) >= 3
    assert "Ward 5 Market Road" in rationale
    assert "safety-related" in rationale


def test_contractors_api_list_and_inspect():
    # 1. List contractors
    res = client.get("/api/contractors")
    assert res.status_code == 200
    contractors = res.json()
    assert len(contractors) >= 3
    assert any(c["contractor_id"] == "CON-ABC" for c in contractors)

    # 2. List projects
    res_proj = client.get("/api/contractors/projects")
    assert res_proj.status_code == 200
    projects = res_proj.json()
    assert len(projects) >= 3
    prj_24 = next(p for p in projects if p["project_id"] == "PRJ-024")
    assert prj_24["cie_inspection_status"] == "INSPECTION_RECOMMENDED"

    # 3. Perform inspection recording
    inspect_payload = {
        "project_id": "PRJ-024",
        "officer_id": "CMO-KOPARGAON",
        "officer_name": "Shri. Rajesh Kulkarni (CMO)",
        "outcome": "REQUIRES_REWORK",
        "inspection_notes": "Sub-base asphalt degradation observed near drainage curb. Contractor instructed to mill and patch within 7 days.",
        "evidence_photos": ["https://images.unsplash.com/photo-1542601906990-b4d3fb778b09"],
    }
    res_insp = client.post("/api/contractors/projects/PRJ-024/inspect", json=inspect_payload)
    assert res_insp.status_code == 200
    updated_prj = res_insp.json()
    assert updated_prj["status"] == "REWORK_IN_PROGRESS"
    assert updated_prj["last_inspection_outcome"] == "REQUIRES_REWORK"

    # 4. Verify accountability event was logged
    res_events = client.get("/api/contractors/accountability/events")
    assert res_events.status_code == 200
    events = res_events.json()
    assert len(events) >= 1
    assert any(e["project_id"] == "PRJ-024" for e in events)
