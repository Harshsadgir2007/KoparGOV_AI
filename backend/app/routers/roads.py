"""Municipal Roads API Router with Synthetic Kopargaon GIS Network."""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from app.models.road import MunicipalRoad
from app.services.db_service import DatabaseService

router = APIRouter(prefix="/api/roads", tags=["Municipal Roads"])
db_service = DatabaseService()

# Synthetic Demo Roads Dataset for Kopargaon
SYNTHETIC_ROADS = [
    {
        "road_id": "RD-KPG-01",
        "road_name": "Station Road (Railway Station to Shivaji Chowk)",
        "ward": "Ward 1 - Railway Station Area",
        "ward_number": 1,
        "length_km": 1.8,
        "surface_type": "Asphalt",
        "condition": "POOR",
        "issue_type": "Potholes & Broken Edges",
        "priority": "HIGH",
        "assigned_contractor_id": "CON-ABC",
        "assigned_contractor_name": "ABC Infrastructure & Roadways Pvt. Ltd.",
        "coordinates": [[19.8850, 74.4710], [19.8880, 74.4750], [19.8917, 74.4789]],
        "last_inspected": "2026-08-20T10:00:00Z",
    },
    {
        "road_id": "RD-KPG-02",
        "road_name": "Mahatma Gandhi Road",
        "ward": "Ward 2 - Tilak Nagar",
        "ward_number": 2,
        "length_km": 1.4,
        "surface_type": "Concrete",
        "condition": "GOOD",
        "issue_type": None,
        "priority": "LOW",
        "assigned_contractor_id": "CON-ABC",
        "assigned_contractor_name": "ABC Infrastructure & Roadways Pvt. Ltd.",
        "coordinates": [[19.8900, 74.4720], [19.8920, 74.4760]],
        "last_inspected": "2026-08-15T14:30:00Z",
    },
    {
        "road_id": "RD-KPG-03",
        "road_name": "Subhash Road Commercial Corridor",
        "ward": "Ward 3 - Subhash Road",
        "ward_number": 3,
        "length_km": 1.1,
        "surface_type": "Asphalt",
        "condition": "FAIR",
        "issue_type": "Water Pipe Trenching Settlement",
        "priority": "MEDIUM",
        "assigned_contractor_id": "CON-GODAVARI",
        "assigned_contractor_name": "Godavari Civil Engineers & Builders",
        "coordinates": [[19.8930, 74.4740], [19.8950, 74.4800]],
        "last_inspected": "2026-08-22T09:00:00Z",
    },
    {
        "road_id": "RD-KPG-04",
        "road_name": "Godavari Riverbank Bypass",
        "ward": "Ward 4 - Riverbank North",
        "ward_number": 4,
        "length_km": 2.5,
        "surface_type": "Asphalt",
        "condition": "CRITICAL",
        "issue_type": "Embankment Erosion & Clogged Drainage",
        "priority": "CRITICAL",
        "assigned_contractor_id": "CON-GODAVARI",
        "assigned_contractor_name": "Godavari Civil Engineers & Builders",
        "coordinates": [[19.8970, 74.4700], [19.8990, 74.4850]],
        "last_inspected": "2026-08-25T11:00:00Z",
    },
    {
        "road_id": "RD-KPG-05",
        "road_name": "Shivaji Chowk Market Gateway",
        "ward": "Ward 5 - Shivaji Chowk",
        "ward_number": 5,
        "length_km": 0.8,
        "surface_type": "Paver Blocks",
        "condition": "POOR",
        "issue_type": "Garbage Spill & Drain Overflow",
        "priority": "CRITICAL",
        "assigned_contractor_id": "CON-ABC",
        "assigned_contractor_name": "ABC Infrastructure & Roadways Pvt. Ltd.",
        "coordinates": [[19.8910, 74.4780], [19.8917, 74.4789], [19.8935, 74.4810]],
        "last_inspected": "2026-08-26T16:00:00Z",
    },
    {
        "road_id": "RD-KPG-06",
        "road_name": "K.J. Somaiya College Road",
        "ward": "Ward 6 - College Campus",
        "ward_number": 6,
        "length_km": 1.6,
        "surface_type": "Asphalt",
        "condition": "GOOD",
        "issue_type": "Minor Streetlight Outage",
        "priority": "LOW",
        "assigned_contractor_id": "CON-MAHALAXMI",
        "assigned_contractor_name": "Mahalaxmi Electricals & Infrastructure",
        "coordinates": [[19.8860, 74.4830], [19.8890, 74.4890]],
        "last_inspected": "2026-08-18T10:00:00Z",
    },
    {
        "road_id": "RD-KPG-07",
        "road_name": "Sai Mandir Link Road",
        "ward": "Ward 7 - Shirdi Highway Access",
        "ward_number": 7,
        "length_km": 3.2,
        "surface_type": "Asphalt",
        "condition": "FAIR",
        "issue_type": "Heavy Pilgrim Vehicle Rutting",
        "priority": "HIGH",
        "assigned_contractor_id": "CON-ABC",
        "assigned_contractor_name": "ABC Infrastructure & Roadways Pvt. Ltd.",
        "coordinates": [[19.8820, 74.4750], [19.8780, 74.4700]],
        "last_inspected": "2026-08-24T15:00:00Z",
    },
]

# Pre-populate database with synthetic roads if empty
def _ensure_roads_seeded():
    existing = db_service.list_roads()
    if not existing:
        for r in SYNTHETIC_ROADS:
            db_service.save_road(r)


@router.get("", response_model=List[MunicipalRoad], summary="List all municipal roads")
async def list_roads() -> List[MunicipalRoad]:
    """Retrieve all municipal roads with current condition and assigned contractors."""
    _ensure_roads_seeded()
    records = db_service.list_roads()
    return [MunicipalRoad(**r) for r in records]


@router.get("/{road_id}", response_model=MunicipalRoad, summary="Get single road details")
async def get_road(road_id: str) -> MunicipalRoad:
    """Retrieve a specific municipal road record by ID."""
    _ensure_roads_seeded()
    record = db_service.get_road(road_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Road '{road_id}' not found.",
        )
    return MunicipalRoad(**record)
