export type OperationType =
  | 'COMPLAINT_CREATED'
  | 'CIE_PRIORITY_CALCULATED'
  | 'CIE_RECOMMENDATION_CREATED'
  | 'OFFICER_APPROVED'
  | 'OFFICER_REJECTED'
  | 'ASSIGNMENT_CREATED'
  | 'WORK_STARTED'
  | 'RESOLUTION_UPDATED'
  | 'CITIZEN_NOTIFIED';

export type OperationStatus =
  | 'COMMITTED'
  | 'PENDING_RECOVERY'
  | 'REPLAYED'
  | 'CONFLICT'
  | 'RECONCILED';

export type SystemMode = 'NORMAL' | 'DEGRADED' | 'RECOVERING';

export interface OperationRecord {
  operation_id: string;
  operation_type: OperationType;
  entity_id: string;
  timestamp: string;
  payload: Record<string, any>;
  status: OperationStatus;
  checksum?: string;
}

export interface SnapshotRecord {
  snapshot_id: string;
  version: string;
  timestamp: string;
  record_count: number;
  status: string;
  state_dump?: Record<string, any>;
}

export interface ConflictItem {
  operation_id: string;
  operation_type: OperationType;
  entity_id: string;
  reason: string;
  snapshot_state?: Record<string, any>;
  journal_payload: Record<string, any>;
  resolution_status: 'REQUIRES_RECONCILIATION' | 'RECONCILED';
}

export interface RecoveryStep {
  step_name: string;
  status: 'COMPLETED' | 'WARNING' | 'FAILED';
  details: string;
  timestamp: string;
}

export interface RecoveryReport {
  records_recovered: number;
  operations_replayed: number;
  conflicts_detected: number;
  records_requiring_review: number;
  step_logs: RecoveryStep[];
  conflicts: ConflictItem[];
  recovered_at: string;
  status: 'SUCCESS' | 'PARTIAL_SUCCESS_WITH_CONFLICTS';
}

export interface ResilienceStatusResponse {
  primary_store_online: boolean;
  system_mode: SystemMode;
  last_snapshot?: SnapshotRecord;
  journal_operations_count: number;
  pending_operations_count: number;
  recoverable_records_count: number;
  is_blackout_active: boolean;
}

export type ReconciliationDecision = 'ACCEPT_JOURNAL' | 'KEEP_SNAPSHOT' | 'MANUAL_OVERRIDE';

export interface ReconciliationRequest {
  decision: ReconciliationDecision;
  officer_id: string;
  notes?: string;
  override_data?: Record<string, any>;
}
