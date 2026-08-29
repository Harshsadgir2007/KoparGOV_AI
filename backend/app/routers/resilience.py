"""Resilience & Chaos Engineering Router for KoparGov AI.

Exposes REST APIs for:
- Telemetry & failure status (/api/resilience/status)
- Blackout chaos injection (/api/resilience/simulate-blackout)
- Snapshot restoration & journal replay (/api/resilience/recover)
- Post-recovery audit reports (/api/resilience/recovery-report)
- Human-in-the-loop conflict reconciliation (/api/resilience/reconcile/{operation_id})
- Demo state reset (/api/resilience/reset)
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, status

from app.models.resilience import (
    ConflictItem,
    OperationRecord,
    ReconciliationRequest,
    RecoveryReport,
    ResilienceStatusResponse,
    SnapshotRecord,
)
from app.services.resilience_service import get_resilience_service

router = APIRouter(prefix="/api/resilience", tags=["Resilience"])

resilience_service = get_resilience_service()


@router.get(
    "/status",
    response_model=ResilienceStatusResponse,
    summary="Get current data store resilience & blackout status",
    status_code=status.HTTP_200_OK,
)
async def get_resilience_status() -> ResilienceStatusResponse:
    """Retrieve operational state (ONLINE/FAILED), system mode (NORMAL/DEGRADED), and snapshot metadata."""
    return resilience_service.get_status()


@router.post(
    "/simulate-blackout",
    response_model=ResilienceStatusResponse,
    summary="Simulate catastrophic primary data store failure (Blackout Mode)",
    status_code=status.HTTP_200_OK,
)
async def simulate_blackout() -> ResilienceStatusResponse:
    """Trigger simulated primary data store failure:
    - Marks primary store as FAILED
    - Switches system to DEGRADED mode
    - Locks unsafe direct primary database writes
    - Preserves last-known-good snapshot and append-only journal
    """
    return resilience_service.simulate_blackout()


@router.post(
    "/recover",
    response_model=RecoveryReport,
    summary="Execute deterministic recovery from snapshot and journal replay",
    status_code=status.HTTP_200_OK,
)
async def recover_system() -> RecoveryReport:
    """Execute complete resilience recovery sequence:
    1. Load last valid snapshot.
    2. Read operations after snapshot.
    3. Validate integrity and detect state conflicts.
    4. Replay valid operations in chronological sequence.
    5. Reconstruct primary database state.
    6. Return system to NORMAL operational mode.
    """
    return resilience_service.recover_system()


@router.get(
    "/recovery-report",
    response_model=Optional[RecoveryReport],
    summary="Get the most recent post-recovery report",
    status_code=status.HTTP_200_OK,
)
async def get_recovery_report() -> Optional[RecoveryReport]:
    """Retrieve the audit report from the latest recovery execution."""
    report = resilience_service.get_last_recovery_report()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No recovery report available. Run /api/resilience/recover first.",
        )
    return report


@router.post(
    "/reconcile/{operation_id}",
    response_model=ConflictItem,
    summary="Reconcile a conflicting operation with human officer authorization",
    status_code=status.HTTP_200_OK,
)
async def reconcile_conflict(
    operation_id: str,
    request: ReconciliationRequest,
) -> ConflictItem:
    """Human-controlled reconciliation for operations flagged with conflict during replay."""
    try:
        return resilience_service.reconcile_conflict(operation_id, request)
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conflict item for operation '{operation_id}' not found.",
        )


@router.post(
    "/snapshot",
    response_model=SnapshotRecord,
    summary="Capture a manual point-in-time snapshot",
    status_code=status.HTTP_201_CREATED,
)
async def create_snapshot(label: Optional[str] = "Manual Officer Snapshot") -> SnapshotRecord:
    """Capture a new last-known-good state snapshot of all civic issues and workflow records."""
    return resilience_service.create_snapshot(label)


@router.get(
    "/journal",
    response_model=List[OperationRecord],
    summary="List recent operation journal entries",
    status_code=status.HTTP_200_OK,
)
async def list_journal(limit: int = 50) -> List[OperationRecord]:
    """Inspect the append-only civic operation journal."""
    return resilience_service.list_journal(limit)


@router.get(
    "/snapshots",
    response_model=List[SnapshotRecord],
    summary="List historical snapshots",
    status_code=status.HTTP_200_OK,
)
async def list_snapshots() -> List[SnapshotRecord]:
    """Inspect captured state snapshots."""
    return resilience_service.list_snapshots()


@router.post(
    "/reset",
    response_model=ResilienceStatusResponse,
    summary="Reset demo resilience state to clean baseline",
    status_code=status.HTTP_200_OK,
)
async def reset_resilience_demo() -> ResilienceStatusResponse:
    """Reset blackout status, clear ephemeral journal entries, and re-establish baseline snapshot."""
    return resilience_service.reset_demo()
