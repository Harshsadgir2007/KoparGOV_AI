"""FastAPI application entry point for KoparGov AI Civic Intelligence Engine."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import (
    cie_router,
    health_router,
    workflow_router,
    issues_router,
    resilience_router,
    contractors_router,
    recommendations_router,
    analytics_router,
    roads_router,
    auth_router,
    map_router,
    notifications_router,
    verification_router,
)

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Decision-support Civic Intelligence Engine for Municipal Authorities.",
)

# Configure CORS for frontend development, mobile devices, and local network APIs
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount modular routers
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(cie_router)
app.include_router(workflow_router)
app.include_router(issues_router)
app.include_router(resilience_router)
app.include_router(contractors_router)
app.include_router(recommendations_router)
app.include_router(analytics_router)
app.include_router(roads_router)
app.include_router(map_router)
app.include_router(notifications_router)
app.include_router(verification_router)


@app.get("/", summary="Root service metadata endpoint")
async def root():
    """Return root metadata and service status."""
    return {
        "service": "KoparGov AI",
        "component": "Civic Intelligence Engine",
        "status": "running",
    }
