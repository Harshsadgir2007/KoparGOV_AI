import { CIERecommendationDetail, AuthorityRole } from '../types';
import { INITIAL_MOCK_RECOMMENDATIONS } from '../mock/recommendations';
import { issueService } from './issueService';
import { cieService } from './cieService';
import { API_ENDPOINTS } from '../config/api';

const RECOMMENDATIONS_STORAGE_KEY = 'kopargov_unified_recommendations_v3';

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

function saveRecommendations(data: Record<string, CIERecommendationDetail>, emitEvent = true) {
  try {
    localStorage.setItem(RECOMMENDATIONS_STORAGE_KEY, JSON.stringify(data));
    if (emitEvent) {
      window.dispatchEvent(new Event('kopargov_state_updated'));
    }
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

    // If we have stored approval chain progress, preserve it
    if (storedRec?.authority_routing?.approval_chain) {
      if (evaluated.authority_routing) {
        evaluated.authority_routing.approval_chain = storedRec.authority_routing.approval_chain;
      }
      evaluated.status = storedRec.status;
      evaluated.approved_by = storedRec.approved_by;
      evaluated.approved_at = storedRec.approved_at;
    } else {
      evaluated.status = issue.status;
    }

    // Persist evaluation locally without triggering state update event loop
    storedData[cleanId] = evaluated;
    saveRecommendations(storedData, false);

    return evaluated;
  },

  async approveStep(
    issueId: string,
    role: AuthorityRole,
    officerName: string,
    notes?: string
  ): Promise<{ isFinalApproval: boolean; nextStepTitle?: string }> {
    const cleanId = issueId.toUpperCase();
    const data = loadRecommendations();
    const rec = data[cleanId] || (await this.getRecommendation(cleanId));

    if (!rec || !rec.authority_routing) {
      return { isFinalApproval: true };
    }

    const chain = rec.authority_routing.approval_chain;
    const currentStepIdx = chain.findIndex(s => s.role === role);

    if (currentStepIdx === -1) {
      return { isFinalApproval: false };
    }

    // 1. Mark current step as approved with officer stamp
    chain[currentStepIdx].status = 'APPROVED';
    chain[currentStepIdx].officer_name = officerName;
    chain[currentStepIdx].action_timestamp = new Date().toISOString();
    chain[currentStepIdx].notes = notes || 'Field clearance granted.';

    // 2. Check if there is a next step
    const isFinalApproval = currentStepIdx === chain.length - 1;

    if (!isFinalApproval) {
      // Unlock next step
      chain[currentStepIdx + 1].status = 'PENDING';
      rec.status = 'PRIORITIZED';
    } else {
      // Full chain authorized!
      rec.status = 'APPROVED';
      rec.approved_by = officerName;
      rec.approved_at = new Date().toISOString();
      await issueService.updateIssueStatus(cleanId, 'APPROVED');

      // Best-effort live API call to FastAPI workflow backend
      try {
        await fetch(API_ENDPOINTS.WORKFLOW_APPROVE(cleanId), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            officer_id: officerName,
            notes: notes || 'Full sequential approval chain completed.',
          }),
        });
      } catch (err) {
        console.warn(`FastAPI workflow approve endpoint offline for ${cleanId}:`, err);
      }
    }

    data[cleanId] = rec;
    saveRecommendations(data);

    return {
      isFinalApproval,
      nextStepTitle: !isFinalApproval ? chain[currentStepIdx + 1].title : undefined,
    };
  },

  async approveRecommendation(
    issueId: string,
    _selectedOptionId?: string,
    officerName?: string
  ): Promise<boolean> {
    const res = await this.approveStep(
      issueId,
      'CHIEF_OFFICER',
      officerName || 'Shri. Rajesh Kulkarni (CMO)'
    );
    return res.isFinalApproval;
  },

  async rejectStep(
    issueId: string,
    role: AuthorityRole,
    officerName: string,
    reason: string
  ): Promise<boolean> {
    const cleanId = issueId.toUpperCase();
    const data = loadRecommendations();
    const rec = data[cleanId];

    if (rec && rec.authority_routing) {
      const currentStep = rec.authority_routing.approval_chain.find(s => s.role === role);
      if (currentStep) {
        currentStep.status = 'REJECTED';
        currentStep.officer_name = officerName;
        currentStep.notes = reason;
      }
      rec.status = 'VALIDATED';
      saveRecommendations(data);
    }

    // Best-effort live API call to FastAPI workflow backend
    try {
      await fetch(API_ENDPOINTS.WORKFLOW_REJECT(cleanId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officer_id: officerName,
          reason: reason || 'Rejected at approval checkpoint',
        }),
      });
    } catch (err) {
      console.warn(`FastAPI workflow reject endpoint offline for ${cleanId}:`, err);
    }

    await issueService.updateIssueStatus(cleanId, 'VALIDATED');
    return true;
  },

  async rejectRecommendation(issueId: string, reason: string): Promise<boolean> {
    return this.rejectStep(issueId, 'WARD_INCHARGE', 'Municipal Officer', reason);
  },

  async requestReviewRecommendation(issueId: string, note: string): Promise<boolean> {
    const cleanId = issueId.toUpperCase();
    await issueService.updateIssueStatus(cleanId, 'PRIORITIZED');
    return true;
  },

  async resetDemo(): Promise<void> {
    localStorage.removeItem(RECOMMENDATIONS_STORAGE_KEY);
    window.dispatchEvent(new Event('kopargov_state_updated'));
  },
};
