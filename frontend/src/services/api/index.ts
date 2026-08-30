import { CivicIssue, MunicipalResources, AnalyticsOverview, AssignmentDetails, ResolutionDetails, CivicStatus } from '../../types';
import { INITIAL_ISSUES, INITIAL_RESOURCES, INITIAL_ANALYTICS } from '../../data/mockData';
import { INITIAL_MOCK_ISSUES } from '../../mock/issues';
import { API_BASE_URL, API_ENDPOINTS } from '../../config/api';
import { cieService, transformCivicIssueToBackend } from '../cieService';

export const ISSUES_STORAGE_KEY = 'kopargov_unified_issues_v2';
const RESOURCES_STORAGE_KEY = 'kopargov_resources_v1';
const ANALYTICS_STORAGE_KEY = 'kopargov_analytics_v1';

// Canonical single-source-of-truth reader
export function getStoredIssues(): CivicIssue[] {
  try {
    // 1. Check canonical storage key
    const data = localStorage.getItem(ISSUES_STORAGE_KEY);
    if (data) {
      const parsed: CivicIssue[] = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Clean legacy/conflicting keys once
        localStorage.removeItem('kopargov_unified_issues_v4');
        localStorage.removeItem('kopargov_unified_issues_v1');
        return parsed;
      }
    }

    // 2. Migration safety: check if v4 data exists from previous session
    const v4Data = localStorage.getItem('kopargov_unified_issues_v4');
    if (v4Data) {
      try {
        const parsedV4: CivicIssue[] = JSON.parse(v4Data);
        if (Array.isArray(parsedV4) && parsedV4.length > 0) {
          localStorage.setItem(ISSUES_STORAGE_KEY, JSON.stringify(parsedV4));
          localStorage.removeItem('kopargov_unified_issues_v4');
          localStorage.removeItem('kopargov_unified_issues_v1');
          return parsedV4;
        }
      } catch (e) {
        console.error('Error migrating v4 issues:', e);
      }
    }
  } catch (e) {
    console.error('Error reading localStorage issues:', e);
  }

  // 3. Fallback to initial mock issues
  const initial = INITIAL_MOCK_ISSUES && INITIAL_MOCK_ISSUES.length ? INITIAL_MOCK_ISSUES : INITIAL_ISSUES;
  localStorage.setItem(ISSUES_STORAGE_KEY, JSON.stringify(initial));
  localStorage.removeItem('kopargov_unified_issues_v4');
  localStorage.removeItem('kopargov_unified_issues_v1');
  return initial;
}

export function saveStoredIssues(issues: CivicIssue[]) {
  try {
    localStorage.setItem(ISSUES_STORAGE_KEY, JSON.stringify(issues));
    window.dispatchEvent(new Event('kopargov_state_updated'));
  } catch (e) {
    console.error('Error saving issues to localStorage:', e);
  }
}

function getStoredResources(): MunicipalResources {
  try {
    const data = localStorage.getItem(RESOURCES_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error reading localStorage resources:', e);
  }
  localStorage.setItem(RESOURCES_STORAGE_KEY, JSON.stringify(INITIAL_RESOURCES));
  return INITIAL_RESOURCES;
}

function saveStoredResources(res: MunicipalResources) {
  try {
    localStorage.setItem(RESOURCES_STORAGE_KEY, JSON.stringify(res));
    window.dispatchEvent(new Event('kopargov_state_updated'));
  } catch (e) {
    console.error('Error saving resources to localStorage:', e);
  }
}

export { cieService };

let reservedIdMax = 1024;

function getNextUniqueIssueId(existingIssues: CivicIssue[]): string {
  const maxExisting = existingIssues.reduce((max, i) => {
    const num = parseInt(i.id.replace(/\D/g, ''), 10);
    return !isNaN(num) && num > max ? num : max;
  }, 1024);
  reservedIdMax = Math.max(reservedIdMax, maxExisting);
  reservedIdMax += 1;
  return `ISS-${reservedIdMax}`;
}

export const api = {
  async getIssues(filters?: {
    category?: string;
    ward?: string;
    priority?: string;
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<CivicIssue[]> {
    let issues = getStoredIssues();

    if (filters) {
      if (filters.category && filters.category !== 'ALL') {
        issues = issues.filter(i => i.category === filters.category);
      }
      if (filters.ward && filters.ward !== 'ALL') {
        issues = issues.filter(
          i =>
            i.ward === filters.ward ||
            `Ward ${i.ward_number}` === filters.ward ||
            i.ward_number?.toString() === filters.ward ||
            (i.ward && i.ward.includes(filters.ward!))
        );
      }
      if (filters.priority && filters.priority !== 'ALL') {
        issues = issues.filter(i => i.priority_level === filters.priority);
      }
      if (filters.status && filters.status !== 'ALL') {
        issues = issues.filter(i => i.status === filters.status);
      }
      if (filters.search && filters.search.trim()) {
        const q = filters.search.toLowerCase();
        issues = issues.filter(
          i =>
            i.id.toLowerCase().includes(q) ||
            (i.title && i.title.toLowerCase().includes(q)) ||
            (i.description && i.description.toLowerCase().includes(q)) ||
            (i.address && i.address.toLowerCase().includes(q)) ||
            (i.ward && i.ward.toLowerCase().includes(q)) ||
            (i.category && i.category.toLowerCase().includes(q))
        );
      }
    }

    // Sort by priority score descending by default
    return issues.sort((a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0));
  },

  async getIssueById(id: string): Promise<CivicIssue | undefined> {
    const issues = getStoredIssues();
    const cleanId = id.toUpperCase();
    return issues.find(i => i.id.toUpperCase() === cleanId);
  },

  async createIssue(newIssueData: Partial<CivicIssue>): Promise<CivicIssue> {
    const issues = getStoredIssues();
    const issueId = newIssueData.id || getNextUniqueIssueId(issues);
    
    // Exact authoritative MCDA calculation:
    // 0.25*Severity + 0.20*Urgency + 0.20*Population + 0.15*Health + 0.10*Location + 0.10*Age
    const severity = newIssueData.factors?.severity ?? 80;
    const urgency = newIssueData.factors?.urgency ?? 75;
    const popNorm = newIssueData.factors?.population_affected ?? (
      newIssueData.population_affected && newIssueData.population_affected <= 100
        ? newIssueData.population_affected
        : Math.min(100, Math.round(((newIssueData.population_affected ?? 500) / 1200) * 100))
    );
    const healthSafety = newIssueData.factors?.health_safety ?? 75;
    const locSensitivity = newIssueData.factors?.location_sensitivity ?? 70;
    const ageNorm = newIssueData.factors?.complaint_age_days ?? (
      newIssueData.age_days ? Math.min(100, Math.round((newIssueData.age_days / 10) * 100)) : 0
    );

    const calculatedScore = newIssueData.priority_score ?? Number((
      (severity * 0.25) +
      (urgency * 0.20) +
      (popNorm * 0.20) +
      (healthSafety * 0.15) +
      (locSensitivity * 0.10) +
      (ageNorm * 0.10)
    ).toFixed(2));

    let priority_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = newIssueData.priority_level || 'LOW';
    if (!newIssueData.priority_level) {
      if (calculatedScore >= 80) priority_level = 'CRITICAL';
      else if (calculatedScore >= 60) priority_level = 'HIGH';
      else if (calculatedScore >= 40) priority_level = 'MEDIUM';
      else priority_level = 'LOW';
    }

    const rawPop = newIssueData.population_affected ?? (newIssueData.factors?.population_affected && newIssueData.factors.population_affected > 100 ? newIssueData.factors.population_affected : 1200);

    const fullIssue: CivicIssue = {
      id: issueId,
      title: newIssueData.title || `${newIssueData.category || 'Civic Issue'} reported in ${newIssueData.ward || 'Kopargaon'}`,
      description: newIssueData.description || 'No detailed description provided.',
      category: newIssueData.category || 'Garbage Accumulation',
      ward: newIssueData.ward || 'Ward 1 - Gandhi Chowk & Tilak Road',
      ward_number: newIssueData.ward_number || 1,
      coordinates: newIssueData.coordinates || [19.8917, 74.4789],
      address: newIssueData.address || `${newIssueData.ward || 'Kopargaon'}, Maharashtra`,
      submitted_at: newIssueData.submitted_at || new Date().toISOString(),
      age_days: newIssueData.age_days ?? 0,
      status: newIssueData.status || 'PRIORITIZED',
      priority_score: calculatedScore,
      priority_level: priority_level,
      population_affected: rawPop,
      citizen_name: newIssueData.citizen_name || 'Anonymous Citizen',
      citizen_phone: newIssueData.citizen_phone || '',
      identity_mode: newIssueData.identity_mode || (newIssueData.is_anonymous ? 'ANONYMOUS' : 'PUBLIC'),
      is_anonymous: newIssueData.is_anonymous ?? false,
      reporter_display_name: newIssueData.reporter_display_name || (newIssueData.is_anonymous ? 'Anonymous Citizen' : (newIssueData.citizen_name || 'Anonymous Citizen')),
      before_photos: newIssueData.before_photos?.length
        ? newIssueData.before_photos
        : ['https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=600&q=80'],
      after_photos: newIssueData.after_photos || [],
      factors: newIssueData.factors || {
        severity: severity,
        urgency: urgency,
        population_affected: popNorm,
        health_safety: healthSafety,
        location_sensitivity: locSensitivity,
        complaint_age_days: ageNorm,
      },
      recommendation: newIssueData.recommendation || {
        recommended_action: `Dispatch response unit for ${newIssueData.category || 'reported issue'} mitigation.`,
        assigned_team_type: 'Municipal Rapid Action Squad',
        required_workers: 2,
        required_vehicles: 1,
        vehicle_type: 'Municipal Utility Carrier',
        estimated_cost: 5000,
        rationales: [
          'Calculated priority score exceeds action threshold',
          `Directly impacts estimated ${rawPop} local citizens in immediate vicinity`,
          'Aligns with current available municipal operational team shift'
        ],
        resource_impact: {
          budget_required: 5000,
          budget_available: 25000,
          workers_required: 2,
          workers_available: 6,
          vehicles_required: 1,
          vehicles_available: 2,
        }
      }
    };

    // Post to backend database and run CIE
    try {
      const backendPayload = transformCivicIssueToBackend(fullIssue);
      const response = await fetch(API_ENDPOINTS.ISSUES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendPayload),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'PENDING_RECOVERY') {
          fullIssue.status = 'PENDING_RECOVERY';
          fullIssue.operation_id = data.operation_id;
          fullIssue.recovery_queued = true;
        } else if (data?.cie_result?.mcda_rankings?.length) {
          const matchingRank = data.cie_result.mcda_rankings.find((r: any) => r.issue_id === issueId);
          if (matchingRank) {
            fullIssue.priority_score = matchingRank.composite_score;
            fullIssue.priority_level = matchingRank.priority_level;
          }
        }
        if (data?.verification_result) {
          fullIssue.verification = data.verification_result;
        }
      }
    } catch (err) {
      console.warn('Backend issues API offline, persisting locally:', err);
    }

    // Check if issue already exists in list (avoid duplicate)
    const existingIdx = issues.findIndex(i => i.id.toUpperCase() === fullIssue.id.toUpperCase());
    if (existingIdx !== -1) {
      issues[existingIdx] = fullIssue;
    } else {
      issues.unshift(fullIssue);
    }

    saveStoredIssues(issues);
    return fullIssue;
  },

  async updateIssue(id: string, updates: Partial<CivicIssue>): Promise<CivicIssue | undefined> {
    const issues = getStoredIssues();
    const cleanId = id.toUpperCase();
    const index = issues.findIndex(i => i.id.toUpperCase() === cleanId);
    if (index === -1) return undefined;

    issues[index] = { ...issues[index], ...updates };
    saveStoredIssues(issues);
    return issues[index];
  },

  async updateStatus(id: string, status: CivicStatus, notes?: string): Promise<CivicIssue> {
    const issues = getStoredIssues();
    const cleanId = id.toUpperCase();
    const index = issues.findIndex(i => i.id.toUpperCase() === cleanId);
    if (index === -1) throw new Error(`Issue ${id} not found`);

    issues[index] = { ...issues[index], status };
    saveStoredIssues(issues);
    return issues[index];
  },

  async updateIssueStatus(id: string, status: CivicStatus, notes?: string): Promise<CivicIssue | undefined> {
    try {
      return await this.updateStatus(id, status, notes);
    } catch {
      return undefined;
    }
  },

  async approveRecommendation(id: string, officerName: string = 'Municipal Commissioner'): Promise<CivicIssue> {
    const issues = getStoredIssues();
    const cleanId = id.toUpperCase();
    const index = issues.findIndex(i => i.id.toUpperCase() === cleanId);
    if (index === -1) throw new Error('Issue not found');

    const updated = { ...issues[index] };
    updated.status = 'APPROVED';
    if (updated.recommendation) {
      updated.recommendation.approved_by = officerName;
      updated.recommendation.approved_at = new Date().toISOString();
    }

    issues[index] = updated;
    saveStoredIssues(issues);
    return updated;
  },

  async assignTeam(id: string, assignment: AssignmentDetails): Promise<CivicIssue> {
    const issues = getStoredIssues();
    const cleanId = id.toUpperCase();
    const index = issues.findIndex(i => i.id.toUpperCase() === cleanId);
    if (index === -1) throw new Error('Issue not found');

    const updated = { ...issues[index] };
    updated.status = 'ASSIGNED';
    updated.assignment = {
      ...assignment,
      assigned_at: new Date().toISOString()
    };

    // Deduct available resources
    const resources = getStoredResources();
    if (resources.available_workers >= assignment.worker_count) {
      resources.available_workers -= assignment.worker_count;
    }
    if (resources.available_vehicles > 0) {
      resources.available_vehicles -= 1;
    }
    saveStoredResources(resources);

    issues[index] = updated;
    saveStoredIssues(issues);
    return updated;
  },

  async resolveIssue(id: string, resolution: ResolutionDetails): Promise<CivicIssue> {
    const issues = getStoredIssues();
    const cleanId = id.toUpperCase();
    const index = issues.findIndex(i => i.id.toUpperCase() === cleanId);
    if (index === -1) throw new Error('Issue not found');

    const updated = { ...issues[index] };
    updated.status = 'RESOLVED';
    updated.resolution = {
      ...resolution,
      resolved_at: new Date().toISOString()
    };

    // Free back resources
    const resources = getStoredResources();
    if (updated.assignment) {
      resources.available_workers = Math.min(resources.total_workers, resources.available_workers + updated.assignment.worker_count);
      resources.available_vehicles = Math.min(resources.total_vehicles, resources.available_vehicles + 1);
    }
    if (resolution.actual_cost) {
      resources.available_budget = Math.max(0, resources.available_budget - resolution.actual_cost);
    }
    saveStoredResources(resources);

    issues[index] = updated;
    saveStoredIssues(issues);
    return updated;
  },

  async getResources(): Promise<MunicipalResources> {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/resources`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('Backend resources unavailable, using local mock store:', err);
      }
    }
    return getStoredResources();
  },

  async getAnalytics(): Promise<AnalyticsOverview> {
    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/analytics`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('Backend analytics unavailable, calculating from store:', err);
      }
    }
    const issues = getStoredIssues();
    const resources = getStoredResources();

    const criticalCount = issues.filter(i => i.priority_level === 'CRITICAL').length;
    const highCount = issues.filter(i => i.priority_level === 'HIGH').length;
    const mediumCount = issues.filter(i => i.priority_level === 'MEDIUM').length;
    const lowCount = issues.filter(i => i.priority_level === 'LOW').length;

    const pendingApprovals = issues.filter(i => i.status === 'PRIORITIZED').length;
    const activeAssignments = issues.filter(i => i.status === 'ASSIGNED' || i.status === 'IN_PROGRESS').length;
    const resolvedCount = issues.filter(i => i.status === 'RESOLVED').length;
    const criticalResolved = issues.filter(i => i.priority_level === 'CRITICAL' && i.status === 'RESOLVED').length;

    return {
      ...INITIAL_ANALYTICS,
      total_issues: issues.length,
      critical_issues: criticalCount,
      high_priority_issues: highCount,
      pending_approvals: pendingApprovals,
      active_assignments: activeAssignments,
      resolved_issues: resolvedCount,
      critical_resolved: criticalResolved,
      budget_utilized: resources.total_budget - resources.available_budget,
      budget_total: resources.total_budget,
      worker_utilization_pct: Math.round(((resources.total_workers - resources.available_workers) / resources.total_workers) * 100),
      vehicle_utilization_pct: Math.round(((resources.total_vehicles - resources.available_vehicles) / resources.total_vehicles) * 100),
      priority_distribution: [
        { level: 'CRITICAL', count: criticalCount, color: '#DC2626' },
        { level: 'HIGH', count: highCount, color: '#EA580C' },
        { level: 'MEDIUM', count: mediumCount, color: '#D97706' },
        { level: 'LOW', count: lowCount, color: '#16A34A' },
      ]
    };
  },

  resetToMockData(): void {
    reservedIdMax = 1029;
    const initial = INITIAL_MOCK_ISSUES && INITIAL_MOCK_ISSUES.length ? INITIAL_MOCK_ISSUES : INITIAL_ISSUES;
    localStorage.setItem(ISSUES_STORAGE_KEY, JSON.stringify(initial));
    localStorage.setItem(RESOURCES_STORAGE_KEY, JSON.stringify(INITIAL_RESOURCES));
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(INITIAL_ANALYTICS));
    localStorage.removeItem('kopargov_unified_issues_v4');
    localStorage.removeItem('kopargov_unified_issues_v1');
    window.dispatchEvent(new Event('kopargov_state_updated'));
  }
};
