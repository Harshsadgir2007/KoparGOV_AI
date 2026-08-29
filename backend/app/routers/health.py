"""Health check router for KoparGov AI CIE."""

from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get("/health", summary="Health check endpoint")
async def health_check():
    """Return health status of the CIE service."""
    return {
        "status": "ok",
        "service": "KoparGov CIE",
    }
