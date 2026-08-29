"""Data models for municipal resource constraints and utilization."""

from typing import Optional
from pydantic import BaseModel, Field


class MunicipalResources(BaseModel):
    """Total available municipal resources for allocation."""
    budget: float = Field(..., ge=0.0, description="Total available municipal budget")
    workers: int = Field(..., ge=0, description="Total available municipal workers/laborers")
    vehicles: int = Field(..., ge=0, description="Total available municipal vehicles/trucks")
    time_capacity_hours: Optional[float] = Field(None, ge=0.0, description="Total available work-hours window")


class ResourceUsage(BaseModel):
    """Breakdown of resource consumption vs remaining limits."""
    allocated_budget: float = Field(0.0, ge=0.0)
    allocated_workers: int = Field(0, ge=0)
    allocated_vehicles: int = Field(0, ge=0)
    allocated_time_hours: float = Field(0.0, ge=0.0)
    
    remaining_budget: float = Field(0.0, ge=0.0)
    remaining_workers: int = Field(0, ge=0)
    remaining_vehicles: int = Field(0, ge=0)
    remaining_time_hours: float = Field(0.0, ge=0.0)
