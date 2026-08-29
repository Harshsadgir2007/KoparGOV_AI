"""Routers package for KoparGov AI."""

from .health import router as health_router
from .cie import router as cie_router
from .workflow import router as workflow_router
from .issues import router as issues_router
from .resilience import router as resilience_router
from .contractors import router as contractors_router
from .recommendations import router as recommendations_router
from .analytics import router as analytics_router
from .roads import router as roads_router
from .auth import router as auth_router
from .map import router as map_router
from .notifications import router as notifications_router

__all__ = [
    "health_router",
    "cie_router",
    "workflow_router",
    "issues_router",
    "resilience_router",
    "contractors_router",
    "recommendations_router",
    "analytics_router",
    "roads_router",
    "auth_router",
    "map_router",
    "notifications_router",
]
