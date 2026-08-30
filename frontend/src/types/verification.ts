export type VerificationStatus = 'VERIFIED' | 'NEEDS_REVIEW' | 'UNVERIFIED';

export type SignalSeverity = 'POSITIVE' | 'INFO' | 'WARNING' | 'CRITICAL';

export interface VerificationSignal {
  name: string;
  severity: SignalSeverity;
  score_impact: number;
  details: string;
}

export interface VerificationResult {
  issue_id: string;
  trust_score: number;
  verification_status: VerificationStatus;
  requires_officer_review: boolean;
  signals: VerificationSignal[];
  verification_reasons: string[];
  evaluated_at?: string;
  manual_override?: boolean;
  overridden_by?: string;
  override_notes?: string;
  override_timestamp?: string;
}

export interface VerificationOverridePayload {
  status: VerificationStatus;
  officer_id: string;
  notes?: string;
}
