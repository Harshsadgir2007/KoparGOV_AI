import { CivicIssue, CivicStatus, CivicCategory, CivicPriorityLevel } from '../types';
import { INITIAL_MOCK_ISSUES } from '../mock/issues';
import { API_ENDPOINTS } from '../config/api';

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
    const cleanId = id.toUpperCase();
    const list = loadIssues();
    let issue = list.find(i => i.id.toUpperCase() === cleanId);

    // 1. If not found locally, fetch from backend issues API
    if (!issue) {
      try {
        const res = await fetch(API_ENDPOINTS.ISSUE_DETAIL(cleanId));
        if (res.ok) {
          const remote = await res.json();
          if (remote) {
            issue = {
              id: remote.id,
              title: remote.title || `Civic issue ${cleanId}`,
              description: remote.description || '',
              category: (remote.category as CivicCategory) || 'Garbage Accumulation',
              ward: remote.location || 'Ward 1',
              ward_number: 1,
              coordinates: [remote.latitude || 19.8917, remote.longitude || 74.4789],
              address: remote.location || 'Kopargaon',
              submitted_at: remote.created_at || new Date().toISOString(),
              age_days: Number(remote.complaint_age) || 0,
              status: (remote.status as CivicStatus) || 'REPORTED',
              priority_score: 85,
              priority_level: 'HIGH',
              population_affected: Number(remote.population_affected) || 500,
              citizen_name: 'Citizen',
              citizen_phone: '',
              before_photos: ['https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=600&q=80'],
              after_photos: ['https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80'],
              factors: {
                severity: Number(remote.severity) || 80,
                urgency: Number(remote.urgency) || 75,
                population_affected: Number(remote.population_affected) || 500,
                health_safety: Number(remote.health_safety_impact) || 70,
                location_sensitivity: Number(remote.location_sensitivity) || 65,
                complaint_age_days: Number(remote.complaint_age) || 1,
              },
            };
            list.unshift(issue);
            saveIssues(list);
          }
        }
      } catch (err) {
        // Fallback gracefully
      }
    }

    // 2. Overlay live backend workflow lifecycle status
    try {
      const res = await fetch(API_ENDPOINTS.WORKFLOW_STATE(cleanId));
      if (res.ok) {
        const wf = await res.json();
        if (wf && wf.status && issue) {
          issue.status = wf.status as CivicStatus;
          if (wf.status === 'RESOLVED' && !issue.resolution) {
            issue.resolution = {
              resolved_at: wf.resolved_at || new Date().toISOString(),
              completion_notes: wf.resolution_notes || 'Resolved and verified by Municipal Field Officer.',
              after_photos: issue.after_photos || [
                'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80',
              ],
              verified_by: wf.officer_id || 'Chief Municipal Officer, Kopargaon',
            };
          }
          saveIssues(list);
        }
      }
    } catch (err) {
      // Fallback gracefully
    }

    return issue;
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
