import { CIERecommendationDetail } from '../types';
import { INITIAL_MOCK_RECOMMENDATIONS } from '../mock/recommendations';
import { issueService } from './issueService';

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
    const data = loadRecommendations();
    let rec = data[cleanId];

    // Synchronize with shared issue state
    const issue = await issueService.getIssue(cleanId);
    if (issue) {
      if (!rec) {
        rec = {
          issue_id: issue.id,
          issue_title: issue.title,
          ward: issue.ward,
          category: issue.category,
          status: issue.status,
          priority_score: issue.priority_score,
          priority_level: issue.priority_level,
          factors: issue.factors,
          recommended_action: {
            headline: issue.recommendation?.recommended_action || 'Deploy rapid municipal response squad',
            vehicle: issue.recommendation?.vehicle_type || 'Vehicle 2 (Hydraulic Compactor)',
            workers: issue.recommendation?.required_workers || 2,
            estimated_cost: issue.recommendation?.estimated_cost || 8000,
            estimated_time: '2 hours',
          },
          reasons: issue.recommendation?.rationales || [
            'High public health and safety impact',
            'Affects high density zone',
            'Fits available budget and personnel resources',
          ],
          resource_availability: {
            budget_available: 42000,
            budget_required: 8000,
            budget_remaining: 34000,
            workers_available: 18,
            workers_required: 2,
            workers_remaining: 16,
            vehicles_available: 6,
            vehicles_required: 1,
            vehicles_remaining: 5,
          },
          alternatives: [
            {
              id: 'OPT-A',
              name: 'Option A — Recommended Allocation',
              action: 'Deploy Vehicle 2 + 2 Workers',
              cost: 8000,
              benefit: 'High',
              resource_impact: 'Low',
              is_recommended: true,
            },
          ],
        };
      }
      rec.status = issue.status;
    }

    return rec;
  },

  async approveRecommendation(
    issueId: string,
    _selectedOptionId?: string,
    officerName?: string
  ): Promise<boolean> {
    const cleanId = issueId.toUpperCase();
    const data = loadRecommendations();
    const rec = data[cleanId];

    if (rec) {
      rec.status = 'APPROVED';
      rec.approved_by = officerName || 'Shri. Rajesh Kulkarni (CMO)';
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

  async rejectRecommendation(issueId: string, _reason: string): Promise<boolean> {
    const cleanId = issueId.toUpperCase();
    await issueService.updateIssueStatus(cleanId, 'VALIDATED');
    return true;
  },

  async resetDemo(): Promise<void> {
    localStorage.setItem(RECOMMENDATIONS_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_RECOMMENDATIONS));
    window.dispatchEvent(new Event('kopargov_state_updated'));
  },
};
