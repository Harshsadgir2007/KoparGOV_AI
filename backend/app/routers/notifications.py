"""Notifications & Alerts Router for KoparGov AI.

Provides endpoints for:
- Listing notifications (`GET /api/notifications`)
- Broadcasting a new notification (`POST /api/notifications`)
- Marking notifications as read (`POST /api/notifications/{notification_id}/read`)
"""

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Query, status
from pydantic import BaseModel, Field

from app.services.db_service import DatabaseService

router = APIRouter(prefix="/api/notifications", tags=["Notifications & Alerts"])
db_service = DatabaseService()


class NotificationPayload(BaseModel):
    """Notification broadcast payload."""
    title: str
    message: str
    type: str = Field(default="INFO", description="INFO, WARNING, SUCCESS, URGENT")
    target_role: Optional[str] = Field(default="ALL", description="ALL, CITIZEN, OFFICER, WARD_INCHARGE")
    issue_id: Optional[str] = None
    ward_number: Optional[int] = None


class NotificationResponse(BaseModel):
    """Notification item."""
    id: str
    title: str
    message: str
    type: str
    target_role: str
    issue_id: Optional[str] = None
    ward_number: Optional[int] = None
    read: bool = False
    created_at: str


@router.get(
    "",
    response_model=List[NotificationResponse],
    summary="List all notifications",
    status_code=status.HTTP_200_OK,
)
async def list_notifications(
    user_id: Optional[str] = Query(None, description="Optional filter by user ID"),
    role: Optional[str] = Query(None, description="Optional filter by role"),
) -> List[NotificationResponse]:
    """Retrieve notifications list."""
    raw_notifs = db_service.list_notifications(user_id=user_id)
    if not raw_notifs:
        # Seed initial system alert if empty
        seed = {
            "id": "NOTIF-WELCOME",
            "title": "KoparGov AI Active",
            "message": "Kopargaon Municipal Decision Support & Civic Intelligence Engine online.",
            "type": "INFO",
            "target_role": "ALL",
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        db_service.save_notification(seed)
        raw_notifs = [seed]

    items = []
    for n in raw_notifs:
        items.append(
            NotificationResponse(
                id=n.get("id") or "N-1",
                title=n.get("title") or "Notice",
                message=n.get("message") or "",
                type=n.get("type") or "INFO",
                target_role=n.get("target_role") or "ALL",
                issue_id=n.get("issue_id"),
                ward_number=n.get("ward_number"),
                read=bool(n.get("read", False)),
                created_at=n.get("created_at") or datetime.now(timezone.utc).isoformat(),
            )
        )
    return items


@router.post(
    "",
    response_model=NotificationResponse,
    summary="Broadcast a new notification",
    status_code=status.HTTP_201_CREATED,
)
async def create_notification(payload: NotificationPayload) -> NotificationResponse:
    """Create and broadcast a new civic notification."""
    notif_id = f"NOTIF-{uuid.uuid4().hex[:8]}"
    now_iso = datetime.now(timezone.utc).isoformat()
    record = {
        "id": notif_id,
        "title": payload.title,
        "message": payload.message,
        "type": payload.type.upper(),
        "target_role": (payload.target_role or "ALL").upper(),
        "issue_id": payload.issue_id,
        "ward_number": payload.ward_number,
        "read": False,
        "created_at": now_iso,
    }
    db_service.save_notification(record)
    return NotificationResponse(**record)


@router.post(
    "/{notification_id}/read",
    summary="Mark notification as read",
    status_code=status.HTTP_200_OK,
)
async def mark_notification_read(notification_id: str) -> Dict[str, Any]:
    """Mark a notification as read."""
    # update mock or firestore
    notifs = db_service.list_notifications()
    for n in notifs:
        if n.get("id") == notification_id:
            n["read"] = True
            db_service.save_notification(n)
            return {"status": "updated", "id": notification_id, "read": True}
    return {"status": "not_found", "id": notification_id}
