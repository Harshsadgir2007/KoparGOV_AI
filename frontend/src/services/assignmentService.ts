import { MunicipalAssignment, CivicStatus } from '../types';
import { INITIAL_MOCK_ASSIGNMENTS } from '../mock/assignments';
import { issueService } from './issueService';

export interface AssignmentFilters {
  search?: string;
  ward?: string;
  category?: string;
  priority?: string;
  status?: string;
}

const ASSIGNMENTS_STORAGE_KEY = 'kopargov_unified_assignments_v2';

function loadAssignments(): MunicipalAssignment[] {
  try {
    const saved = localStorage.getItem(ASSIGNMENTS_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load assignments', e);
  }
  localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_ASSIGNMENTS));
  return INITIAL_MOCK_ASSIGNMENTS;
}

function saveAssignments(list: MunicipalAssignment[]) {
  try {
    localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('kopargov_state_updated'));
  } catch (e) {
    console.error('Failed to save assignments', e);
  }
}

export const assignmentService = {
  async getAssignments(filters?: AssignmentFilters): Promise<MunicipalAssignment[]> {
    let list = loadAssignments();
    // Synchronize statuses with shared issues
    const issues = await issueService.getIssues();
    const issueMap = new Map(issues.map(i => [i.id.toUpperCase(), i]));

    for (const item of list) {
      const parentIssue = issueMap.get(item.issue_id.toUpperCase());
      if (parentIssue) {
        item.status = parentIssue.status;
      }
    }

    if (filters) {
      if (filters.ward && filters.ward !== 'ALL') {
        list = list.filter(a => a.ward.includes(filters.ward!));
      }
      if (filters.category && filters.category !== 'ALL') {
        list = list.filter(a => a.category === filters.category);
      }
      if (filters.priority && filters.priority !== 'ALL') {
        list = list.filter(a => a.priority_level === filters.priority);
      }
      if (filters.status && filters.status !== 'ALL') {
        list = list.filter(a => a.status === filters.status);
      }
      if (filters.search && filters.search.trim()) {
        const q = filters.search.toLowerCase();
        list = list.filter(
          a =>
            a.assignment_id.toLowerCase().includes(q) ||
            a.issue_id.toLowerCase().includes(q) ||
            a.issue_title.toLowerCase().includes(q) ||
            a.team.toLowerCase().includes(q) ||
            a.vehicle.toLowerCase().includes(q)
        );
      }
    }

    return list;
  },

  async getAssignment(idOrIssueId: string): Promise<MunicipalAssignment | undefined> {
    const list = await this.getAssignments();
    const cleanId = idOrIssueId.toUpperCase();
    return list.find(
      a => a.assignment_id.toUpperCase() === cleanId || a.issue_id.toUpperCase() === cleanId
    );
  },

  async assignResources(
    issueId: string,
    data: {
      team: string;
      vehicle: string;
      workers: number;
      notes?: string;
    }
  ): Promise<MunicipalAssignment | undefined> {
    const list = loadAssignments();
    const cleanId = issueId.toUpperCase();
    let asg = list.find(a => a.issue_id.toUpperCase() === cleanId);

    if (asg) {
      asg.team = data.team;
      asg.vehicle = data.vehicle;
      asg.workers = data.workers;
      asg.status = 'ASSIGNED';
      asg.assigned_at = new Date().toISOString();
      asg.notes = data.notes;
    } else {
      const issue = await issueService.getIssue(cleanId);
      asg = {
        assignment_id: `ASG-${1024 + list.length + 1}`,
        issue_id: cleanId,
        issue_title: issue ? issue.title : `Civic issue ${cleanId}`,
        ward: issue ? issue.ward : 'Ward 5',
        category: issue ? issue.category : 'Garbage Accumulation',
        priority: issue ? issue.priority_score : 80,
        priority_level: issue ? issue.priority_level : 'HIGH',
        team: data.team,
        vehicle: data.vehicle,
        workers: data.workers,
        estimated_cost: 8000,
        estimated_time: '2 hours',
        status: 'ASSIGNED',
        assigned_at: new Date().toISOString(),
        notes: data.notes,
        before_photo: issue?.before_photos[0],
      };
      list.unshift(asg);
    }

    saveAssignments(list);
    await issueService.updateIssueStatus(cleanId, 'ASSIGNED', data.notes);
    return asg;
  },

  async updateAssignmentStatus(idOrIssueId: string, status: CivicStatus): Promise<boolean> {
    const cleanId = idOrIssueId.toUpperCase();
    const list = loadAssignments();
    const asg = list.find(
      a => a.assignment_id.toUpperCase() === cleanId || a.issue_id.toUpperCase() === cleanId
    );
    if (asg) {
      asg.status = status;
      saveAssignments(list);
      await issueService.updateIssueStatus(asg.issue_id, status);
    }
    return true;
  },

  async startWork(issueId: string): Promise<boolean> {
    return this.updateAssignmentStatus(issueId, 'IN_PROGRESS');
  },

  async resolveAssignment(
    issueId: string,
    resolution: {
      completion_notes: string;
      after_photos: string[];
      actual_cost?: number;
    }
  ): Promise<boolean> {
    const cleanId = issueId.toUpperCase();
    const list = loadAssignments();
    const asg = list.find(
      a => a.assignment_id.toUpperCase() === cleanId || a.issue_id.toUpperCase() === cleanId
    );

    if (asg) {
      asg.status = 'RESOLVED';
      asg.resolution = {
        resolved_at: new Date().toISOString(),
        completion_notes: resolution.completion_notes,
        after_photos: resolution.after_photos,
        verified_by: 'Chief Municipal Officer, Kopargaon',
        actual_cost: resolution.actual_cost || asg.estimated_cost,
      };
      saveAssignments(list);
    }

    await issueService.updateIssueStatus(cleanId, 'RESOLVED', resolution.completion_notes);
    return true;
  },

  async resetDemo(): Promise<void> {
    localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_ASSIGNMENTS));
    window.dispatchEvent(new Event('kopargov_state_updated'));
  },
};
