import os
from typing import Dict, Optional
from pydantic import BaseModel


class MCDAWeightsConfig(BaseModel):
    """MCDA factor weights strictly matching project specifications."""
    severity: float = 0.25
    urgency: float = 0.20
    population_affected: float = 0.20
    health_safety_impact: float = 0.15
    location_sensitivity: float = 0.10
    complaint_age: float = 0.10


class PriorityThresholdsConfig(BaseModel):
    """Deterministic score thresholds for priority classification (0-100 scale)."""
    low_min: float = 0.0
    low_max: float = 39.0
    medium_min: float = 40.0
    medium_max: float = 59.0
    high_min: float = 60.0
    high_max: float = 79.0
    critical_min: float = 80.0
    critical_max: float = 100.0


class Settings(BaseModel):
    """Global application settings."""
    app_name: str = "KoparGov AI - Civic Intelligence Engine"
    app_version: str = "0.1.0"
    debug: bool = True
    mcda_weights: MCDAWeightsConfig = MCDAWeightsConfig()
    priority_thresholds: PriorityThresholdsConfig = PriorityThresholdsConfig()

    # Firebase / Firestore Environment Configuration
    firebase_credentials_path: Optional[str] = os.environ.get("FIREBASE_CREDENTIALS_PATH")
    firebase_project_id: Optional[str] = os.environ.get("FIREBASE_PROJECT_ID")
    firebase_database_url: Optional[str] = os.environ.get("FIREBASE_DATABASE_URL")
    firestore_emulator_host: Optional[str] = os.environ.get("FIRESTORE_EMULATOR_HOST")


settings = Settings()
