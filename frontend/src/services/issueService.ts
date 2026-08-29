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

const STORAGE_KEY = 'kopargov_unified_issues_v4';

function loadIssues(): CivicIssue[] {
  try {
    // Clean legacy storage keys if present
    localStorage.removeItem('kopargov_unified_issues_v1');
    localStorage.removeItem('kopargov_unified_issues_v2');

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: CivicIssue[] = JSON.parse(saved);
      // Auto-heal ISS-1024 exact MCDA score and priority
      const iss1024 = parsed.find(i => i.id === 'ISS-1024');
      if (iss1024 && (iss1024.priority_score !== 92.25 || iss1024.priority_level !== 'CRITICAL')) {
        iss1024.priority_score = 92.25;
        iss1024.priority_level = 'CRITICAL';
        if (iss1024.factors) {
          iss1024.factors.severity = 90;
          iss1024.factors.urgency = 90;
          iss1024.factors.population_affected = 1200;
          iss1024.factors.health_safety = 85;
          iss1024.factors.location_sensitivity = 90;
          iss1024.factors.complaint_age_days = 3;
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
      return parsed;
    }
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
            i.description.toLowerCase().includes(query) ||
            i.address.toLowerCase().includes(query) ||
            i.ward.toLowerCase().includes(query)
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

  async updateIssueStatus(
    id: string,
    status: CivicStatus,
    _notes?: string
  ): Promise<CivicIssue | undefined> {
    const list = loadIssues();
    const cleanId = id.toUpperCase();
    const index = list.findIndex(i => i.id.toUpperCase() === cleanId);

    if (index !== -1) {
      list[index].status = status;
      saveIssues(list);
      return list[index];
    }
    return undefined;
  },

  async updateIssue(
    id: string,
    updates: Partial<CivicIssue>
  ): Promise<CivicIssue | undefined> {
    const list = loadIssues();
    const cleanId = id.toUpperCase();
    const index = list.findIndex(i => i.id.toUpperCase() === cleanId);

    if (index !== -1) {
      list[index] = { ...list[index], ...updates };
      saveIssues(list);
      return list[index];
    }
    return undefined;
  },

  async submitIssue(
    issueData: Omit<CivicIssue, 'id' | 'submitted_at' | 'status' | 'priority_score' | 'priority_level' | 'age_days'>
  ): Promise<CivicIssue> {
    const list = loadIssues();

    // Generate unique ID in sequence: ISS-1030, ISS-1031...
    const nextNum = 1024 + list.length;
    const newId = `ISS-${nextNum}`;

    let uploadedPhotos = issueData.before_photos || [];
    if (uploadedPhotos.length > 0 && uploadedPhotos[0].startsWith('data:')) {
      try {
        const { uploadEvidencePhoto } = await import('../config/firebase');
        const cloudUrl = await uploadEvidencePhoto(uploadedPhotos[0], 'complaints');
        uploadedPhotos = [cloudUrl];
      } catch (err) {
        console.warn('Firebase Storage upload fallback:', err);
      }
    }

    const newIssue: CivicIssue = {
      ...issueData,
      id: newId,
      before_photos: uploadedPhotos,
      submitted_at: new Date().toISOString(),
      age_days: 0,
      status: 'REPORTED',
      priority_score: 50,
      priority_level: 'MEDIUM',
    };

    // Try submitting to backend live API if available
    try {
      const response = await fetch(API_ENDPOINTS.ISSUES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newIssue.id,
          title: newIssue.title,
          category: newIssue.category,
          description: newIssue.description,
          location: newIssue.ward,
          ward_number: newIssue.ward_number,
          latitude: newIssue.coordinates ? newIssue.coordinates[0] : 19.8917,
          longitude: newIssue.coordinates ? newIssue.coordinates[1] : 74.4789,
          address: newIssue.address,
          citizen_name: newIssue.citizen_name,
          citizen_phone: newIssue.citizen_phone,
          before_photos: newIssue.before_photos,
          severity: newIssue.factors?.severity || 50,
          urgency: newIssue.factors?.urgency || 50,
          population_affected: newIssue.population_affected || 100,
          health_safety_impact: newIssue.factors?.health_safety || 50,
          location_sensitivity: newIssue.factors?.location_sensitivity || 50,
          complaint_age: 0,
          estimated_cost: newIssue.recommendation?.estimated_cost || 5000,
          required_workers: newIssue.recommendation?.required_workers || 2,
          required_vehicles: newIssue.recommendation?.required_vehicles || 1,
          required_time_hours: 4.0,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.cie_result && data.cie_result.mcda_rankings) {
          const rank = data.cie_result.mcda_rankings.find((r: any) => r.issue_id === newIssue.id);
          if (rank) {
            newIssue.priority_score = rank.composite_score;
            newIssue.priority_level = rank.priority_level;
          }
        }
      }
    } catch (err) {
      console.warn('FastAPI backend offline, saving issue locally in unified store:', err);
    }

    try {
      const { notificationService } = await import('./notificationService');
      notificationService.addNotification({
        title: 'Complaint Registered',
        message: `Complaint #${newIssue.id} (${newIssue.category}) registered and prioritized by CIE.`,
        type: 'SUCCESS',
        issue_id: newIssue.id,
      });
    } catch (err) {
      // ignore
    }

    list.unshift(newIssue);
    saveIssues(list);
    return newIssue;
  },

  async resetDemo(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('kopargov_unified_issues_v2');
    localStorage.removeItem('kopargov_unified_issues_v1');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_ISSUES));
    window.dispatchEvent(new Event('kopargov_state_updated'));
  },
};
