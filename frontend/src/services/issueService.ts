import { CivicIssue, CivicStatus } from '../types';
import { api } from './api';

export interface IssueFilters {
  search?: string;
  category?: string;
  ward?: string;
  priority?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Unified Civic Issue Service (delegates to canonical api store).
 * Uses ONE SINGLE SOURCE OF TRUTH: 'kopargov_unified_issues_v2'.
 */
export const issueService = {
  async getIssues(filters?: IssueFilters): Promise<CivicIssue[]> {
    return api.getIssues(filters);
  },

  async getIssue(id: string): Promise<CivicIssue | undefined> {
    return api.getIssueById(id);
  },

  async updateIssueStatus(
    id: string,
    status: CivicStatus,
    notes?: string
  ): Promise<CivicIssue | undefined> {
    return api.updateIssueStatus(id, status, notes);
  },

  async updateIssue(
    id: string,
    updates: Partial<CivicIssue>
  ): Promise<CivicIssue | undefined> {
    return api.updateIssue(id, updates);
  },

  async submitIssue(
    issueData: Partial<CivicIssue>
  ): Promise<CivicIssue> {
    return api.createIssue(issueData);
  },

  async resetDemo(): Promise<void> {
    api.resetToMockData();
  },
};
