import { CivicIssue, CivicCategory, CivicStatus } from '../types';
import { issueService } from './issueService';

export interface CitizenIssuePayload {
  category: CivicCategory;
  title?: string;
  description: string;
  ward: string;
  ward_number: number;
  latitude: number;
  longitude: number;
  landmark?: string;
  photoUrl?: string;
  citizen_name?: string;
  citizen_phone?: string;
}

export interface CitizenNotification {
  id: string;
  issue_id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'INFO' | 'ASSIGNED' | 'RESOLVED';
  read: boolean;
}

const CITIZEN_NOTIFICATIONS_KEY = 'kopargov_citizen_notifications_v2';

const DEFAULT_NOTIFICATIONS: CitizenNotification[] = [
  {
    id: 'NOTIF-1',
    issue_id: 'ISS-1024',
    title: 'Team Assigned',
    message: 'Municipal Team 2 (Hydraulic Compactor) has been dispatched for waste clearance near Shivaji Chowk.',
    timestamp: '2026-08-28T10:30:00Z',
    type: 'ASSIGNED',
    read: false,
  },
  {
    id: 'NOTIF-2',
    issue_id: 'ISS-1024',
    title: 'Complaint Received',
    message: 'Your complaint ISS-1024 has been successfully submitted and prioritized by CIE.',
    timestamp: '2026-08-26T08:30:00Z',
    type: 'INFO',
    read: true,
  },
  {
    id: 'NOTIF-3',
    issue_id: 'ISS-1018',
    title: 'Issue Resolved',
    message: 'Streetlight fault on Station Road has been verified and marked as resolved.',
    timestamp: '2026-08-25T17:00:00Z',
    type: 'RESOLVED',
    read: true,
  },
];

function loadNotifications(): CitizenNotification[] {
  try {
    const saved = localStorage.getItem(CITIZEN_NOTIFICATIONS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load notifications', e);
  }
  localStorage.setItem(CITIZEN_NOTIFICATIONS_KEY, JSON.stringify(DEFAULT_NOTIFICATIONS));
  return DEFAULT_NOTIFICATIONS;
}

function saveNotifications(list: CitizenNotification[]) {
  try {
    localStorage.setItem(CITIZEN_NOTIFICATIONS_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('kopargov_state_updated'));
  } catch (e) {
    console.error('Failed to save notifications', e);
  }
}

export const citizenService = {
  async getMyIssues(filter?: 'ALL' | 'ACTIVE' | 'IN_PROGRESS' | 'RESOLVED'): Promise<CivicIssue[]> {
    let list = await issueService.getIssues();

    if (filter && filter !== 'ALL') {
      if (filter === 'ACTIVE') {
        list = list.filter(i => i.status !== 'RESOLVED');
      } else if (filter === 'IN_PROGRESS') {
        list = list.filter(i => i.status === 'IN_PROGRESS' || i.status === 'ASSIGNED');
      } else if (filter === 'RESOLVED') {
        list = list.filter(i => i.status === 'RESOLVED');
      }
    }

    return list.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
  },

  async getIssue(id: string): Promise<CivicIssue | undefined> {
    return issueService.getIssue(id);
  },

  async submitIssue(payload: CitizenIssuePayload): Promise<CivicIssue> {
    const allIssues = await issueService.getIssues();
    const newId = `ISS-${1024 + allIssues.length + 1}`;

    const newIssue: CivicIssue = {
      id: newId,
      title: payload.title || `${payload.category} issue reported near ${payload.ward}`,
      description: payload.description,
      category: payload.category,
      ward: payload.ward,
      ward_number: payload.ward_number,
      coordinates: [payload.latitude, payload.longitude],
      address: payload.landmark ? `${payload.landmark}, ${payload.ward}, Kopargaon` : `${payload.ward}, Kopargaon`,
      submitted_at: new Date().toISOString(),
      age_days: 0,
      status: 'PRIORITIZED', // Auto-prioritized by CIE for officer review
      priority_score: 87,
      priority_level: 'CRITICAL',
      population_affected: 1200,
      citizen_name: payload.citizen_name || 'Anand Patil',
      citizen_phone: payload.citizen_phone || '+91 98220 44112',
      before_photos: payload.photoUrl
        ? [payload.photoUrl]
        : ['https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=600&q=80'],
      after_photos: [
        'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80',
      ],
      factors: {
        severity: 90,
        urgency: 85,
        population_affected: 95,
        health_safety: 90,
        location_sensitivity: 80,
        complaint_age_days: 70,
      },
      recommendation: {
        recommended_action: 'Deploy Hydraulic Compactor (Vehicle 2) and 2 sanitation workers for waste clearance.',
        assigned_team_type: 'Sanitation Rapid Response Unit 1',
        required_workers: 2,
        required_vehicles: 1,
        vehicle_type: 'Vehicle 2 (Hydraulic Compactor)',
        estimated_cost: 8000,
        rationales: [
          'High health impact due to organic decomposition near vegetable market',
          '1,200 people affected daily across commercial zone',
          'Unresolved for 3 days with escalating public hazard',
          'Located near a primary market with dense pedestrian footfall',
          'Requires only 2 workers and fits within current available budget and fleet capacity'
        ],
        resource_impact: {
          budget_required: 8000,
          budget_available: 42000,
          workers_required: 2,
          workers_available: 18,
          vehicles_required: 1,
          vehicles_available: 6,
        }
      }
    };

    allIssues.unshift(newIssue);
    localStorage.setItem('kopargov_unified_issues_v2', JSON.stringify(allIssues));
    window.dispatchEvent(new Event('kopargov_state_updated'));

    // Create confirmation notification
    const notifications = loadNotifications();
    notifications.unshift({
      id: `NOTIF-${Date.now()}`,
      issue_id: newId,
      title: 'Complaint Received',
      message: `Your complaint ${newId} has been successfully submitted and logged with Kopargaon Municipal Council.`,
      timestamp: new Date().toISOString(),
      type: 'INFO',
      read: false,
    });
    saveNotifications(notifications);

    return newIssue;
  },

  async getNotifications(): Promise<CitizenNotification[]> {
    return loadNotifications();
  },

  async markNotificationRead(id: string): Promise<void> {
    const list = loadNotifications();
    const item = list.find(n => n.id === id);
    if (item) {
      item.read = true;
      saveNotifications(list);
    }
  },

  async resetDemo(): Promise<void> {
    localStorage.setItem(CITIZEN_NOTIFICATIONS_KEY, JSON.stringify(DEFAULT_NOTIFICATIONS));
    window.dispatchEvent(new Event('kopargov_state_updated'));
  },
};
