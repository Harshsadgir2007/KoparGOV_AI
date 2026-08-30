"""Contractor Accountability and Project Inspection Router for KoparGov AI."""

from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth_dependency import require_officer
from app.models.auth import AuthenticatedUser

from app.core.contractor_engine import ContractorAccountabilityEngine
from app.models.contractor import (
    Contractor,
    ContractorAccountabilityEvent,
    ContractorAccountabilityEventType,
    InspectionOutcome,
    InspectionRecommendationStatus,
    MunicipalProject,
    RecordInspectionRequest,
)

router = APIRouter(prefix="/api/contractors", tags=["Contractors & Projects"])
engine = ContractorAccountabilityEngine()

# In-memory realistic initial dataset for Kopargaon public works
INITIAL_CONTRACTORS_DATA = [
    {
        "contractor_id": "CON-ABC",
        "name": "ABC Infrastructure & Roadways Pvt. Ltd.",
        "categories": ["Road Construction", "Asphalt Resurfacing", "Stormwater Drainage"],
        "wards_served": ["Ward 1", "Ward 2", "Ward 5", "Ward 7"],
        "contact_person": "Vikram Shinde (Project Director)",
        "phone": "+91 98221 55670",
        "active_projects": 2,
        "completed_projects": 8,
        "on_time_completion_rate": 87.5,
        "inspection_pass_rate": 75.0,
        "rework_count": 2,
        "total_complaint_count": 21,
        "safety_flags_count": 1,
        "compliance_status": "ENHANCED_MONITORING",
    },
    {
        "contractor_id": "CON-GODAVARI",
        "name": "Godavari Civil Engineers & Builders",
        "categories": ["Water Pipelines", "Sewage Networks", "Sanitation Facilities"],
        "wards_served": ["Ward 3", "Ward 4", "Ward 5", "Ward 6"],
        "contact_person": "Anil Deshmukh (Managing Partner)",
        "phone": "+91 94222 33890",
        "active_projects": 1,
        "completed_projects": 12,
        "on_time_completion_rate": 95.0,
        "inspection_pass_rate": 92.0,
        "rework_count": 0,
        "total_complaint_count": 5,
        "safety_flags_count": 0,
        "compliance_status": "COMPLIANT",
    },
    {
        "contractor_id": "CON-MAHALAXMI",
        "name": "Mahalaxmi Electricals & Infrastructure",
        "categories": ["Streetlighting", "High-Mast Illumination", "Grid Maintenance"],
        "wards_served": ["Ward 1", "Ward 2", "Ward 3", "Ward 4", "Ward 5", "Ward 6", "Ward 7"],
        "contact_person": "Suresh Gholap",
        "phone": "+91 98500 11223",
        "active_projects": 1,
        "completed_projects": 15,
        "on_time_completion_rate": 93.3,
        "inspection_pass_rate": 88.0,
        "rework_count": 1,
        "total_complaint_count": 8,
        "safety_flags_count": 0,
        "compliance_status": "COMPLIANT",
    },
]

INITIAL_PROJECTS_DATA = [
    {
        "project_id": "PRJ-024",
        "asset_id": "AST-RD-05",
        "asset_name": "Ward 5 Market Road (Shivaji Chowk to Vegetable Mandi)",
        "contractor_id": "CON-ABC",
        "contractor_name": "ABC Infrastructure & Roadways Pvt. Ltd.",
        "category": "Road Resurfacing & Drainage",
        "ward": "Ward 5 - Shivaji Chowk",
        "ward_number": 5,
        "coordinates": [19.8917, 74.4789],
        "start_date": "2026-05-10T00:00:00Z",
        "planned_completion_date": "2026-08-01T00:00:00Z",
        "actual_completion_date": "2026-08-15T00:00:00Z",
        "contract_value": 4500000.0,
        "status": "COMPLETED",
        "post_completion_complaints": 17,
        "high_severity_complaints": 5,
        "safety_complaints": 3,
        "recent_complaints_last_7_days": 4,
        "rework_requests": 2,
        "last_inspection_date": "2026-08-12T00:00:00Z",
        "last_inspection_outcome": "PASSED",
    },
    {
        "project_id": "PRJ-019",
        "asset_id": "AST-PL-03",
        "asset_name": "Ward 3 Subhash Road Feeder Water Pipeline",
        "contractor_id": "CON-GODAVARI",
        "contractor_name": "Godavari Civil Engineers & Builders",
        "category": "Water Pipeline Replacement",
        "ward": "Ward 3 - Subhash Road",
        "ward_number": 3,
        "coordinates": [19.8942, 74.4721],
        "start_date": "2026-03-01T00:00:00Z",
        "planned_completion_date": "2026-06-15T00:00:00Z",
        "actual_completion_date": "2026-06-10T00:00:00Z",
        "contract_value": 3200000.0,
        "status": "COMPLETED",
        "post_completion_complaints": 2,
        "high_severity_complaints": 0,
        "safety_complaints": 0,
        "recent_complaints_last_7_days": 0,
        "rework_requests": 0,
        "last_inspection_date": "2026-06-12T00:00:00Z",
        "last_inspection_outcome": "PASSED",
    },
    {
        "project_id": "PRJ-031",
        "asset_id": "AST-SL-01",
        "asset_name": "Ward 1 Tilak Road LED Streetlight Grid",
        "contractor_id": "CON-MAHALAXMI",
        "contractor_name": "Mahalaxmi Electricals & Infrastructure",
        "category": "Streetlight Modernization",
        "ward": "Ward 1 - Gandhi Chowk & Tilak Road",
        "ward_number": 1,
        "coordinates": [19.8876, 74.4812],
        "start_date": "2026-07-01T00:00:00Z",
        "planned_completion_date": "2026-08-20T00:00:00Z",
        "actual_completion_date": "2026-08-18T00:00:00Z",
        "contract_value": 1800000.0,
        "status": "COMPLETED",
        "post_completion_complaints": 4,
        "high_severity_complaints": 1,
        "safety_complaints": 0,
        "recent_complaints_last_7_days": 1,
        "rework_requests": 0,
        "last_inspection_date": "2026-08-19T00:00:00Z",
        "last_inspection_outcome": "PASSED",
    },
]

INITIAL_EVENTS_DATA = [
    {
        "event_id": "EVT-101",
        "contractor_id": "CON-ABC",
        "project_id": "PRJ-024",
        "asset_id": "AST-RD-05",
        "timestamp": "2026-08-27T14:30:00Z",
        "event_type": "INSPECTION_RECOMMENDED",
        "severity": "HIGH",
        "evidence_summary": "17 post-completion complaints accumulated on Ward 5 Market Road within 14 days of project handover.",
        "status": "ACTIVE",
        "logged_by": "CIE Contractor Accountability Engine",
    }
]

# In-memory stores
CONTRACTORS_STORE = {c["contractor_id"]: c for c in INITIAL_CONTRACTORS_DATA}
PROJECTS_STORE = {p["project_id"]: p for p in INITIAL_PROJECTS_DATA}
EVENTS_STORE = {e["event_id"]: e for e in INITIAL_EVENTS_DATA}


@router.get("", response_model=List[Contractor], summary="List all contractors")
async def list_contractors() -> List[Contractor]:
    """Retrieve all municipal contractors with live computed performance ratings."""
    result: List[Contractor] = []
    for c_data in CONTRACTORS_STORE.values():
        perf = engine.calculate_performance_score(c_data)
        contractor = Contractor(
            contractor_id=c_data["contractor_id"],
            name=c_data["name"],
            categories=c_data["categories"],
            wards_served=c_data["wards_served"],
            contact_person=c_data["contact_person"],
            phone=c_data["phone"],
            active_projects=c_data.get("active_projects", 0),
            completed_projects=c_data.get("completed_projects", 0),
            on_time_completion_rate=c_data.get("on_time_completion_rate", 100.0),
            inspection_pass_rate=c_data.get("inspection_pass_rate", 100.0),
            rework_count=c_data.get("rework_count", 0),
            total_complaint_count=c_data.get("total_complaint_count", 0),
            safety_flags_count=c_data.get("safety_flags_count", 0),
            performance=perf,
            compliance_status=c_data.get("compliance_status", "COMPLIANT"),
        )
        result.append(contractor)
    return result


@router.get("/projects", response_model=List[MunicipalProject], summary="List all public works projects")
async def list_projects() -> List[MunicipalProject]:
    """Retrieve all municipal projects evaluated by CIE for post-completion durability signals."""
    result: List[MunicipalProject] = []
    for p_data in PROJECTS_STORE.values():
        project = MunicipalProject(**p_data)
        status_val, signals, rationale = engine.evaluate_project_signals(project)
        project.cie_inspection_status = status_val
        project.inspection_signals = signals
        project.cie_rationale = rationale
        result.append(project)
    return result


@router.get("/projects/{project_id}", response_model=MunicipalProject, summary="Get project details")
async def get_project(project_id: str) -> MunicipalProject:
    """Retrieve detailed project record with asset link, contractor, and CIE inspection recommendations."""
    clean_id = project_id.upper()
    if clean_id not in PROJECTS_STORE:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{project_id}' not found."
        )
    p_data = PROJECTS_STORE[clean_id]
    project = MunicipalProject(**p_data)
    status_val, signals, rationale = engine.evaluate_project_signals(project)
    project.cie_inspection_status = status_val
    project.inspection_signals = signals
    project.cie_rationale = rationale
    return project


@router.post("/projects/{project_id}/inspect", response_model=MunicipalProject, summary="Record project inspection")
async def record_project_inspection(
    project_id: str,
    request: RecordInspectionRequest,
    current_officer: AuthenticatedUser = Depends(require_officer),
) -> MunicipalProject:
    """Record an on-site project inspection outcome and trigger contractor accountability updates."""
    clean_id = project_id.upper()
    if clean_id not in PROJECTS_STORE:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{project_id}' not found."
        )
    
    p = PROJECTS_STORE[clean_id]
    now_iso = datetime.now(timezone.utc).isoformat()
    
    p["last_inspection_date"] = now_iso
    p["last_inspection_outcome"] = request.outcome.value

    # Update project status according to inspection result
    if request.outcome == InspectionOutcome.REQUIRES_REWORK:
        p["status"] = "REWORK_IN_PROGRESS"
        p["rework_requests"] = p.get("rework_requests", 0) + 1
        
        # Update contractor statistics
        c_id = p["contractor_id"]
        if c_id in CONTRACTORS_STORE:
            CONTRACTORS_STORE[c_id]["rework_count"] = CONTRACTORS_STORE[c_id].get("rework_count", 0) + 1
            CONTRACTORS_STORE[c_id]["compliance_status"] = "ENHANCED_MONITORING"
        
        # Log accountability event
        event_id = f"EVT-{100 + len(EVENTS_STORE) + 1}"
        event = {
            "event_id": event_id,
            "contractor_id": c_id,
            "project_id": clean_id,
            "asset_id": p["asset_id"],
            "timestamp": now_iso,
            "event_type": ContractorAccountabilityEventType.REWORK_REQUIRED.value,
            "severity": "HIGH",
            "evidence_summary": f"On-site inspection by {request.officer_name}: {request.inspection_notes}",
            "status": "ACTIVE",
            "logged_by": request.officer_name,
        }
        EVENTS_STORE[event_id] = event

    elif request.outcome == InspectionOutcome.FAILED:
        p["status"] = "FAILED_INSPECTION"
        c_id = p["contractor_id"]
        if c_id in CONTRACTORS_STORE:
            CONTRACTORS_STORE[c_id]["inspection_pass_rate"] = max(0.0, CONTRACTORS_STORE[c_id].get("inspection_pass_rate", 100.0) - 15.0)
            CONTRACTORS_STORE[c_id]["compliance_status"] = "ADMINISTRATIVE_REVIEW"
        
        event_id = f"EVT-{100 + len(EVENTS_STORE) + 1}"
        event = {
            "event_id": event_id,
            "contractor_id": c_id,
            "project_id": clean_id,
            "asset_id": p["asset_id"],
            "timestamp": now_iso,
            "event_type": ContractorAccountabilityEventType.FAILED_INSPECTION.value,
            "severity": "CRITICAL",
            "evidence_summary": f"Failed inspection by {request.officer_name}: {request.inspection_notes}",
            "status": "ACTIVE",
            "logged_by": request.officer_name,
        }
        EVENTS_STORE[event_id] = event

    else:
        p["status"] = "COMPLETED"

    project = MunicipalProject(**p)
    status_val, signals, rationale = engine.evaluate_project_signals(project)
    project.cie_inspection_status = status_val
    project.inspection_signals = signals
    project.cie_rationale = rationale
    return project


@router.get("/accountability/events", response_model=List[ContractorAccountabilityEvent], summary="List accountability events")
async def list_accountability_events() -> List[ContractorAccountabilityEvent]:
    """Retrieve chronological audit trail of contractor accountability and quality flags."""
    return [ContractorAccountabilityEvent(**e) for e in reversed(list(EVENTS_STORE.values()))]
