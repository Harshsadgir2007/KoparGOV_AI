import { CivicIssue, CivicStatus, CivicCategory, CivicPriorityLevel } from '../types';
import { INITIAL_MOCK_ISSUES } from '../mock/issues';

export interface IssueFilters {
  search?: string;
  category?: string;
  ward?: string;
  priority?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

const STORAGE_KEY = 'kopargov_unified_issues_v2';

function loadIssues(): CivicIssue[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load issues from localStorage', e);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_ISSUES));
  return INITIAL_MOCK_ISSUES;
}

function saveIssues(issues: CivicIssue[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(issues));
    // Dispatch storage event for multi-tab or instant React reactivity
    window.dispatchEvent(new Event('kopargov_state_updated'));
  } catch (e) {
    console.error('Failed to save issues to localStorage', e);
  }
}

export const issueService = {
  async getIssues(filters?: IssueFilters): Promise<CivicIssue[]> {
    let list = loadIssues();

    if (filters) {
      if (filters.category && filters.category !== 'ALL') {
        list = list.filter(i => i.category === filters.category);
      }
      if (filters.ward && filters.ward !== 'ALL') {
        list = list.filter(
          i => i.ward_number.toString() === filters.ward || i.ward.includes(filters.ward!)
        );
      }
      if (filters.priority && filters.priority !== 'ALL') {
        list = list.filter(i => i.priority_level === filters.priority);
      }
      if (filters.status && filters.status !== 'ALL') {
        list = list.filter(i => i.status === filters.status);
      }
      if (filters.search && filters.search.trim()) {
        const query = filters.search.toLowerCase();
        list = list.filter(
          i =>
            i.id.toLowerCase().includes(query) ||
            i.title.toLowerCase().includes(query) ||
            i.ward.toLowerCase().includes(query) ||
            i.category.toLowerCase().includes(query) ||
            i.address.toLowerCase().includes(query)
        );
      }
    }

    return list;
  },

  async getIssue(id: string): Promise<CivicIssue | undefined> {
    const list = loadIssues();
    const cleanId = id.toUpperCase();
    return list.find(i => i.id.toUpperCase() === cleanId);
  },

  async updateIssueStatus(id: string, status: CivicStatus, notes?: string): Promise<CivicIssue | undefined> {
    const list = loadIssues();
    const cleanId = id.toUpperCase();
    const issue = list.find(i => i.id.toUpperCase() === cleanId);

    if (issue) {
      issue.status = status;
      if (status === 'RESOLVED' && !issue.resolution) {
        issue.resolution = {
          resolved_at: new Date().toISOString(),
          completion_notes: notes || 'Resolved and verified by Municipal Field Officer.',
          after_photos: issue.after_photos || [
            'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80',
          ],
          verified_by: 'Chief Municipal Officer, Kopargaon',
        };
      }
      saveIssues(list);
    }
    return issue;
  },

  async resetDemo(): Promise<void> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_ISSUES));
    window.dispatchEvent(new Event('kopargov_state_updated'));
  },
};
