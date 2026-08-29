"""Resilience and Chaos Engineering Models for KoparGov AI.

Implements data structures for:
- Operation Journaling (immutable append-only transaction log)
- Last-Known-Good Snapshots (consistent state backups)
- Blackout Simulation & Degraded System State
- Recovery Analysis, Step Tracking, and Conflict Reconciliation
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class OperationType(str, Enum):
    """Types of logged civic domain operations."""
    COMPLAINT_CREATED = "COMPLAINT_CREATED"
    CIE_PRIORITY_CALCULATED = "CIE_PRIORITY_CALCULATED"
    CIE_RECOMMENDATION_CREATED = "CIE_RECOMMENDATION_CREATED"
    OFFICER_APPROVED = "OFFICER_APPROVED"
    OFFICER_REJECTED = "OFFICER_REJECTED"
    ASSIGNMENT_CREATED = "ASSIGNMENT_CREATED"
    WORK_STARTED = "WORK_STARTED"
    RESOLUTION_UPDATED = "RESOLUTION_UPDATED"
    CITIZEN_NOTIFIED = "CITIZEN_NOTIFIED"


class OperationStatus(str, Enum):
    """Lifecycle status of an operation journal entry."""
    COMMITTED = "COMMITTED"
    PENDING_RECOVERY = "PENDING_RECOVERY"
    REPLAYED = "REPLAYED"
    CONFLICT = "CONFLICT"
    RECONCILED = "RECONCILED"


class SystemMode(str, Enum):
    """Operational mode of the municipal platform."""
    NORMAL = "NORMAL"
    DEGRADED = "DEGRADED"
    RECOVERING = "RECOVERING"


class OperationRecord(BaseModel):
    """An individual entry in the immutable civic operation journal."""
    operation_id: str = Field(..., description="Unique operation identifier, e.g. OP-1042")
    operation_type: OperationType = Field(..., description="Domain operation category")
    entity_id: str = Field(..., description="Target issue/complaint or resource ID, e.g. ISS-1024")
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO-8601 creation timestamp",
    )
    payload: Dict[str, Any] = Field(default_factory=dict, description="Operation parameters and state payload")
    status: OperationStatus = Field(default=OperationStatus.COMMITTED, description="Journal commit/recovery status")
    checksum: Optional[str] = Field(default=None, description="Integrity verification hash/checksum")


class SnapshotRecord(BaseModel):
    """Last-known-good point-in-time snapshot of system state."""
    snapshot_id: str = Field(..., description="Unique snapshot identifier, e.g. SNAP-018")
    version: str = Field(default="1.0", description="Snapshot format version")
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO-8601 snapshot capture timestamp",
    )
    record_count: int = Field(default=0, description="Total number of database records captured")
    status: str = Field(default="VALID", description="Snapshot status (VALID, RESTORED, CORRUPT)")
    state_dump: Dict[str, Any] = Field(
        default_factory=dict,
        description="Serialized tables (issues, workflow, cie_results)",
    )


class ConflictItem(BaseModel):
    """A conflicting or unverified operation detected during recovery."""
    operation_id: str
    operation_type: OperationType
    entity_id: str
    reason: str
    snapshot_state: Optional[Dict[str, Any]] = None
    journal_payload: Dict[str, Any] = Field(default_factory=dict)
    resolution_status: str = Field(default="REQUIRES_RECONCILIATION")


class RecoveryStep(BaseModel):
    """Log entry for an individual recovery workflow step."""
    step_name: str
    status: str = "COMPLETED"  # COMPLETED, WARNING, FAILED
    details: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class RecoveryReport(BaseModel):
    """Comprehensive post-recovery audit report."""
    records_recovered: int = Field(default=0, description="Total entities restored to primary store")
    operations_replayed: int = Field(default=0, description="Valid journal operations successfully applied")
    conflicts_detected: int = Field(default=0, description="Number of conflicting records flagged")
    records_requiring_review: int = Field(default=0, description="Records pending officer reconciliation")
    step_logs: List[RecoveryStep] = Field(default_factory=list, description="Step-by-step progress trace")
    conflicts: List[ConflictItem] = Field(default_factory=list, description="List of conflict details")
    recovered_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    status: str = Field(default="SUCCESS", description="Overall recovery outcome status")


class ResilienceStatusResponse(BaseModel):
    """Current health and resilience telemetry of the data store."""
    primary_store_online: bool = Field(..., description="True if primary DB is healthy, False during Blackout")
    system_mode: SystemMode = Field(..., description="NORMAL, DEGRADED, or RECOVERING")
    last_snapshot: Optional[SnapshotRecord] = Field(default=None, description="Latest valid snapshot metadata")
    journal_operations_count: int = Field(default=0, description="Total operations in journal")
    pending_operations_count: int = Field(default=0, description="Operations executed after last snapshot")
    recoverable_records_count: int = Field(default=0, description="Estimated recoverable entities")
    is_blackout_active: bool = Field(default=False, description="Whether chaos blackout failure is active")


class ReconciliationDecision(str, Enum):
    """Human officer decision for resolving a conflict."""
    ACCEPT_JOURNAL = "ACCEPT_JOURNAL"
    KEEP_SNAPSHOT = "KEEP_SNAPSHOT"
    MANUAL_OVERRIDE = "MANUAL_OVERRIDE"


class ReconciliationRequest(BaseModel):
    """Request payload to reconcile a conflicting operation."""
    decision: ReconciliationDecision
    officer_id: str = Field(..., description="Municipal officer authorizing the resolution")
    notes: Optional[str] = Field(default=None, description="Officer justification notes")
    override_data: Optional[Dict[str, Any]] = Field(default=None, description="Optional manual override payload")
