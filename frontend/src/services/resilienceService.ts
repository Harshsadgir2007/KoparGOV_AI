import { API_ENDPOINTS } from '../config/api';
import {
  ConflictItem,
  OperationRecord,
  ReconciliationRequest,
  RecoveryReport,
  ResilienceStatusResponse,
  SnapshotRecord,
} from '../types';

export const resilienceService = {
  async getStatus(): Promise<ResilienceStatusResponse> {
    const res = await fetch(API_ENDPOINTS.RESILIENCE_STATUS);
    if (!res.ok) {
      throw new Error(`Failed to fetch resilience status: ${res.statusText}`);
    }
    return await res.json();
  },

  async simulateBlackout(): Promise<ResilienceStatusResponse> {
    const res = await fetch(API_ENDPOINTS.RESILIENCE_SIMULATE_BLACKOUT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`Failed to simulate blackout: ${res.statusText}`);
    }
    const data: ResilienceStatusResponse = await res.json();
    window.dispatchEvent(new Event('kopargov_resilience_updated'));
    window.dispatchEvent(new Event('kopargov_state_updated'));
    return data;
  },

  async recoverSystem(): Promise<RecoveryReport> {
    const res = await fetch(API_ENDPOINTS.RESILIENCE_RECOVER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`Failed to recover system: ${res.statusText}`);
    }
    const data: RecoveryReport = await res.json();
    window.dispatchEvent(new Event('kopargov_resilience_updated'));
    window.dispatchEvent(new Event('kopargov_state_updated'));
    return data;
  },

  async getRecoveryReport(): Promise<RecoveryReport | null> {
    const res = await fetch(API_ENDPOINTS.RESILIENCE_RECOVERY_REPORT);
    if (res.ok) {
      return await res.json();
    }
    return null;
  },

  async reconcileOperation(opId: string, request: ReconciliationRequest): Promise<ConflictItem> {
    const res = await fetch(API_ENDPOINTS.RESILIENCE_RECONCILE(opId), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      throw new Error(`Failed to reconcile operation: ${res.statusText}`);
    }
    const data = await res.json();
    window.dispatchEvent(new Event('kopargov_resilience_updated'));
    window.dispatchEvent(new Event('kopargov_state_updated'));
    return data;
  },

  async createSnapshot(label?: string): Promise<SnapshotRecord> {
    const res = await fetch(API_ENDPOINTS.RESILIENCE_SNAPSHOT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label }),
    });
    if (!res.ok) {
      throw new Error('Failed to create snapshot');
    }
    const snap = await res.json();
    window.dispatchEvent(new Event('kopargov_resilience_updated'));
    return snap;
  },

  async listJournal(limit: number = 50): Promise<OperationRecord[]> {
    const res = await fetch(`${API_ENDPOINTS.RESILIENCE_JOURNAL}?limit=${limit}`);
    if (!res.ok) {
      throw new Error('Failed to fetch journal records');
    }
    return await res.json();
  },

  async listSnapshots(): Promise<SnapshotRecord[]> {
    const res = await fetch(API_ENDPOINTS.RESILIENCE_SNAPSHOTS);
    if (!res.ok) {
      throw new Error('Failed to fetch snapshots');
    }
    return await res.json();
  },

  async resetDemo(): Promise<ResilienceStatusResponse> {
    const res = await fetch(API_ENDPOINTS.RESILIENCE_RESET, {
      method: 'POST',
    });
    if (!res.ok) {
      throw new Error('Failed to reset demo state');
    }
    const data = await res.json();
    window.dispatchEvent(new Event('kopargov_resilience_updated'));
    window.dispatchEvent(new Event('kopargov_state_updated'));
    return data;
  },
};
