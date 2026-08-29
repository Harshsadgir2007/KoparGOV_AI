"""Pydantic data models for Kopargaon road network and synthetic infrastructure."""

from typing import List, Optional
from pydantic import BaseModel, Field


class MunicipalRoad(BaseModel):
    """Synthetic municipal road record in Kopargaon."""
    road_id: str = Field(..., description="Unique road identifier, e.g., 'RD-KPG-01'")
    road_name: str = Field(..., description="Name of the street or road")
    ward: str = Field(..., description="Ward name, e.g., 'Ward 5 - Shivaji Chowk'")
    ward_number: int = Field(..., description="Ward number (1-7)")
    length_km: float = Field(default=1.2, description="Road length in kilometers")
    surface_type: str = Field(default="Asphalt", description="Asphalt, Concrete, Paver Blocks, Dirt")
    condition: str = Field(default="FAIR", description="EXCELLENT, GOOD, FAIR, POOR, CRITICAL")
    issue_type: Optional[str] = Field(None, description="Active issue if any: Potholes, Waterlogging, Encroachment")
    priority: str = Field(default="MEDIUM", description="LOW, MEDIUM, HIGH, CRITICAL")
    assigned_contractor_id: Optional[str] = Field(None, description="ID of assigned contractor")
    assigned_contractor_name: Optional[str] = Field(None, description="Name of assigned maintenance contractor")
    coordinates: List[List[float]] = Field(
        default_factory=list,
        description="Polyline coordinate points [[lat, lng], ...]"
    )
    last_inspected: Optional[str] = Field(None, description="ISO timestamp of last inspection")
