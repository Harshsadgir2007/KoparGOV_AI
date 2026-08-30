import { VerificationResult, VerificationOverridePayload } from '../types/verification';
import { API_ENDPOINTS, getApiAuthHeaders } from '../config/api';

export const verificationService = {
  /**
   * Fetch verification evaluation result for a civic issue.
   */
  async getVerificationResult(issueId: string): Promise<VerificationResult | null> {
    try {
      const response = await fetch(API_ENDPOINTS.VERIFICATION_DETAIL(issueId), {
        headers: getApiAuthHeaders(),
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn(`[VerificationService] Backend offline fetching verification for #${issueId}:`, err);
    }
    return null;
  },

  /**
   * Force re-evaluation of verification signals against current corpus.
   */
  async reevaluateVerification(issueId: string): Promise<VerificationResult | null> {
    try {
      const response = await fetch(API_ENDPOINTS.VERIFICATION_REEVALUATE(issueId), {
        method: 'POST',
        headers: getApiAuthHeaders(),
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn(`[VerificationService] Backend offline reevaluating #${issueId}:`, err);
    }
    return null;
  },

  /**
   * Record officer manual override (MARK VERIFIED / MARK UNVERIFIED).
   */
  async overrideVerification(
    issueId: string,
    payload: VerificationOverridePayload,
    _officerRole: string = 'DEPARTMENT_OFFICER'
  ): Promise<VerificationResult | null> {
    try {
      const response = await fetch(API_ENDPOINTS.VERIFICATION_OVERRIDE(issueId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getApiAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn(`[VerificationService] Backend offline overriding #${issueId}:`, err);
    }
    return null;
  },
};
