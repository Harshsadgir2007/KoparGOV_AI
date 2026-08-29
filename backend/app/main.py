"""FastAPI application entry point for KoparGov AI Civic Intelligence Engine."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import cie_router, health_router, workflow_router, issues_router

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Decision-support Civic Intelligence Engine for Municipal Authorities.",
)

# Configure CORS for frontend development and local APIs
# Allow standard localhost and local development ports
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Mount modular routers
app.include_router(health_router)
app.include_router(cie_router)
app.include_router(workflow_router)
app.include_router(issues_router)


@app.get("/", summary="Root service metadata endpoint")
async def root():
    """Return root metadata and service status."""
    return {
        "service": "KoparGov AI",
        "component": "Civic Intelligence Engine",
        "status": "running",
    }
