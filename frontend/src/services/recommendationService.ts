import { CIERecommendationDetail } from '../types';
import { INITIAL_MOCK_RECOMMENDATIONS } from '../mock/recommendations';
import { issueService } from './issueService';
import { cieService } from './cieService';
import { API_ENDPOINTS } from '../config/api';

const RECOMMENDATIONS_STORAGE_KEY = 'kopargov_unified_recommendations_v2';

function loadRecommendations(): Record<string, CIERecommendationDetail> {
  try {
    const saved = localStorage.getItem(RECOMMENDATIONS_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load recommendations', e);
  }
  localStorage.setItem(RECOMMENDATIONS_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_RECOMMENDATIONS));
  return INITIAL_MOCK_RECOMMENDATIONS;
}

function saveRecommendations(data: Record<string, CIERecommendationDetail>) {
  try {
    localStorage.setItem(RECOMMENDATIONS_STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event('kopargov_state_updated'));
  } catch (e) {
    console.error('Failed to save recommendations', e);
  }
}

export const recommendationService = {
  async getRecommendation(issueId: string): Promise<CIERecommendationDetail | undefined> {
    const cleanId = issueId.toUpperCase();
    const storedData = loadRecommendations();
    const storedRec = storedData[cleanId];

    // Synchronize with shared issue state and evaluate via real CIE engine
    const issue = await issueService.getIssue(cleanId);
    if (!issue) {
      return storedRec;
    }

    const allIssues = await issueService.getIssues();

    // Call CIE evaluation service (calls FastAPI POST /api/cie/evaluate with fallback)
    const evaluated = await cieService.evaluateSingleIssue(issue, allIssues);

    // If an officer has already approved or modified the decision, preserve that lifecycle status
    if (storedRec?.status === 'APPROVED') {
      evaluated.status = 'APPROVED';
      evaluated.approved_by = storedRec.approved_by;
      evaluated.approved_at = storedRec.approved_at;
    } else {
      evaluated.status = issue.status;
    }

    // Persist evaluation
    storedData[cleanId] = evaluated;
    saveRecommendations(storedData);

    return evaluated;
  },

  async approveRecommendation(
    issueId: string,
    _selectedOptionId?: string,
    officerName?: string
  ): Promise<boolean> {
    const cleanId = issueId.toUpperCase();
    const officer = officerName || 'Shri. Rajesh Kulkarni (CMO)';

    // Best-effort live API call to FastAPI workflow backend
    try {
      await fetch(API_ENDPOINTS.WORKFLOW_APPROVE(cleanId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officer_id: officer,
          notes: 'Approved via Officer Decision Portal',
        }),
      });
    } catch (err) {
      console.warn(`FastAPI workflow approve endpoint offline for ${cleanId}, updating locally:`, err);
    }

    const data = loadRecommendations();
    const rec = data[cleanId];

    if (rec) {
      rec.status = 'APPROVED';
      rec.approved_by = officer;
      rec.approved_at = new Date().toISOString();
      saveRecommendations(data);
    }

    // Update shared issue state
    await issueService.updateIssueStatus(cleanId, 'APPROVED');
    return true;
  },

  async requestReview(issueId: string, _reason: string): Promise<boolean> {
    const cleanId = issueId.toUpperCase();
    await issueService.updateIssueStatus(cleanId, 'PRIORITIZED');
    return true;
  },

  async requestReviewRecommendation(issueId: string, reason: string): Promise<boolean> {
    return this.requestReview(issueId, reason);
  },

  async rejectRecommendation(issueId: string, reason: string): Promise<boolean> {
    const cleanId = issueId.toUpperCase();

    // Best-effort live API call to FastAPI workflow backend
    try {
      await fetch(API_ENDPOINTS.WORKFLOW_REJECT(cleanId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officer_id: 'Municipal Officer',
          reason: reason || 'Returned to validation queue',
        }),
      });
    } catch (err) {
      console.warn(`FastAPI workflow reject endpoint offline for ${cleanId}, updating locally:`, err);
    }

    await issueService.updateIssueStatus(cleanId, 'VALIDATED');
    return true;
  },

  async resetDemo(): Promise<void> {
    localStorage.setItem(RECOMMENDATIONS_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_RECOMMENDATIONS));
    window.dispatchEvent(new Event('kopargov_state_updated'));
  },
};

