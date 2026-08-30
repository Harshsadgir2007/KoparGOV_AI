import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CivicIssue, MunicipalResources, AnalyticsOverview, AssignmentDetails, ResolutionDetails } from '../types';
import { api } from '../services/api';
import { cieService, transformCivicIssueToBackend, transformResourcesToBackend } from '../services/cieService';
import { useToast } from './ToastContext';

interface CivicContextType {
  issues: CivicIssue[];
  resources: MunicipalResources | null;
  analytics: AnalyticsOverview | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  approveRecommendation: (id: string, officerName?: string) => Promise<CivicIssue | undefined>;
  assignTeamToIssue: (id: string, assignment: AssignmentDetails) => Promise<CivicIssue | undefined>;
  resolveIssueAction: (id: string, resolution: ResolutionDetails) => Promise<CivicIssue | undefined>;
  submitCitizenIssue: (data: Partial<CivicIssue>) => Promise<CivicIssue>;
  resetToDefaults: () => Promise<void>;
}

const CivicContext = createContext<CivicContextType | undefined>(undefined);

export const CivicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [resources, setResources] = useState<MunicipalResources | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [issuesData, resData, analyticsData] = await Promise.all([
        api.getIssues(),
        api.getResources(),
        api.getAnalytics(),
      ]);

      // Enrich issues with real CIE MCDA evaluation (FastAPI or high-fidelity fallback)
      if (issuesData.length > 0) {
        try {
          const { data: cieResult } = await cieService.evaluateCIE({
            issues: issuesData.map(transformCivicIssueToBackend),
            resources: transformResourcesToBackend(resData),
          });

          if (cieResult?.mcda_rankings?.length) {
            const rankingMap = new Map(cieResult.mcda_rankings.map(r => [r.issue_id, r]));

            issuesData.forEach(issue => {
              const r = rankingMap.get(issue.id);
              if (r) {
                issue.priority_score = r.composite_score;
                issue.priority_level = r.priority_level;
                if (r.factor_scores?.normalized_severity !== undefined) {
                  issue.factors = {
                    severity: r.factor_scores.normalized_severity,
                    urgency: r.factor_scores.normalized_urgency,
                    population_affected: r.factor_scores.normalized_population_affected ?? (issue.factors?.population_affected ?? 95),
                    health_safety: r.factor_scores.normalized_health_safety_impact,
                    location_sensitivity: r.factor_scores.normalized_location_sensitivity,
                    complaint_age_days: r.factor_scores.normalized_complaint_age ?? (issue.factors?.complaint_age_days ?? 0),
                  };
                }
              }
            });
            issuesData.sort((a, b) => b.priority_score - a.priority_score);
          }
        } catch (e) {
          console.warn('CIE batch evaluation fallback used:', e);
        }
      }

      setIssues(issuesData);
      setResources(resData);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Error fetching civic data:', err);
      setError('Unable to load municipal dataset.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
    const handleStateUpdate = () => {
      refreshData();
    };
    window.addEventListener('kopargov_state_updated', handleStateUpdate);
    window.addEventListener('storage', handleStateUpdate);
    return () => {
      window.removeEventListener('kopargov_state_updated', handleStateUpdate);
      window.removeEventListener('storage', handleStateUpdate);
    };
  }, [refreshData]);

  const approveRecommendation = async (id: string, officerName = 'Municipal Commissioner') => {
    try {
      const updated = await api.approveRecommendation(id, officerName);
      await refreshData();
      showToast('success', 'Recommendation Approved', `CIE recommendation for #${id} has been formally authorized.`);
      return updated;
    } catch (err) {
      console.error(err);
      showToast('error', 'Approval Failed', 'Unable to record approval.');
    }
  };

  const assignTeamToIssue = async (id: string, assignment: AssignmentDetails) => {
    try {
      const updated = await api.assignTeam(id, assignment);
      await refreshData();
      showToast('success', 'Team Dispatched & Assigned', `${assignment.team_name} assigned with ${assignment.worker_count} personnel.`);
      return updated;
    } catch (err) {
      console.error(err);
      showToast('error', 'Assignment Error', 'Failed to dispatch municipal team.');
    }
  };

  const resolveIssueAction = async (id: string, resolution: ResolutionDetails) => {
    try {
      const updated = await api.resolveIssue(id, resolution);
      await refreshData();
      showToast('success', 'Issue Marked Resolved', `Civic complaint #${id} resolved and verified by ${resolution.verified_by}.`);
      return updated;
    } catch (err) {
      console.error(err);
      showToast('error', 'Resolution Error', 'Failed to mark issue as resolved.');
    }
  };

  const submitCitizenIssue = async (data: Partial<CivicIssue>) => {
    const created = await api.createIssue(data);
    await refreshData();
    showToast('success', 'Complaint Registered Successfully', `Your reference ID is ${created.id}. CIE is prioritizing resources.`);
    return created;
  };

  const resetToDefaults = async () => {
    api.resetToMockData();
    await refreshData();
    showToast('info', 'Demo Dataset Reset', 'Restored pristine Kopargaon municipal demonstration data.');
  };

  return (
    <CivicContext.Provider
      value={{
        issues,
        resources,
        analytics,
        loading,
        error,
        refreshData,
        approveRecommendation,
        assignTeamToIssue,
        resolveIssueAction,
        submitCitizenIssue,
        resetToDefaults,
      }}
    >
      {children}
    </CivicContext.Provider>
  );
};

export const useCivic = (): CivicContextType => {
  const context = useContext(CivicContext);
  if (!context) throw new Error('useCivic must be used within a CivicProvider');
  return context;
};
