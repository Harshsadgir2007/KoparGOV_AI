import { CivicIssue, CivicCategory, CivicStatus, CitizenProfile, LeaderboardEntry, CitizenIdentityMode } from '../types';
import { api } from './api';
import { DEFAULT_CITIZEN_PROFILE, MOCK_LEADERBOARD } from '../mock/citizens';
import { API_ENDPOINTS } from '../config/api';
import { transformCivicIssueToBackend } from './cieService';


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
  identity_mode?: CitizenIdentityMode;
  leaderboard_enabled?: boolean;
  alias?: string;
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
const CITIZEN_PROFILE_KEY = 'kopargov_citizen_profile_v2';
const CITIZEN_LEADERBOARD_KEY = 'kopargov_citizen_leaderboard_v2';

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

function loadProfile(): CitizenProfile {
  try {
    const saved = localStorage.getItem(CITIZEN_PROFILE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load citizen profile', e);
  }
  localStorage.setItem(CITIZEN_PROFILE_KEY, JSON.stringify(DEFAULT_CITIZEN_PROFILE));
  return DEFAULT_CITIZEN_PROFILE;
}

function saveProfile(profile: CitizenProfile) {
  try {
    localStorage.setItem(CITIZEN_PROFILE_KEY, JSON.stringify(profile));
    window.dispatchEvent(new Event('kopargov_state_updated'));
  } catch (e) {
    console.error('Failed to save citizen profile', e);
  }
}

function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const saved = localStorage.getItem(CITIZEN_LEADERBOARD_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load leaderboard', e);
  }
  localStorage.setItem(CITIZEN_LEADERBOARD_KEY, JSON.stringify(MOCK_LEADERBOARD));
  return MOCK_LEADERBOARD;
}

function saveLeaderboard(list: LeaderboardEntry[]) {
  try {
    localStorage.setItem(CITIZEN_LEADERBOARD_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('kopargov_state_updated'));
  } catch (e) {
    console.error('Failed to save leaderboard', e);
  }
}

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
  async getProfile(): Promise<CitizenProfile> {
    return loadProfile();
  },

  async updateProfile(updates: Partial<CitizenProfile>): Promise<CitizenProfile> {
    const current = loadProfile();
    const updated = { ...current, ...updates };
    saveProfile(updated);
    return updated;
  },

  async getLeaderboard(): Promise<{ current_user: CitizenProfile; entries: LeaderboardEntry[] }> {
    const profile = loadProfile();
    const baseLeaderboard = loadLeaderboard();

    // Check if current user is participating in leaderboard
    let entries = [...baseLeaderboard];

    if (profile.leaderboard_enabled) {
      const displayName = profile.identity_mode === 'PUBLIC' 
        ? profile.real_name 
        : (profile.alias || 'CivicChampion');
      
      const userEntryIndex = entries.findIndex(e => e.display_name === displayName || e.is_current_user);
      
      if (userEntryIndex >= 0) {
        entries[userEntryIndex] = {
          ...entries[userEntryIndex],
          display_name: displayName,
          identity_type: profile.identity_mode,
          reports: profile.reports_count,
          resolved: profile.resolved_count,
          score: profile.contribution_score,
          is_current_user: true,
        };
      } else {
        // Insert user according to score
        entries.push({
          rank: entries.length + 1,
          display_name: displayName,
          identity_type: profile.identity_mode,
          reports: profile.reports_count,
          resolved: profile.resolved_count,
          score: profile.contribution_score,
          is_current_user: true,
        });
      }
      
      // Sort and recalculate ranks
      entries.sort((a, b) => b.score - a.score);
      entries = entries.map((e, idx) => ({ ...e, rank: idx + 1 }));
    } else {
      // User opted out: remove any previous entry of current user
      entries = entries.filter(e => !e.is_current_user && e.display_name !== profile.real_name && e.display_name !== profile.alias);
      entries = entries.map((e, idx) => ({ ...e, rank: idx + 1 }));
    }

    return {
      current_user: profile,
      entries,
    };
  },

  async getMyIssues(filter?: 'ALL' | 'ACTIVE' | 'IN_PROGRESS' | 'RESOLVED'): Promise<CivicIssue[]> {
    let list = await api.getIssues();

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
    return api.getIssueById(id);
  },

  async submitIssue(payload: CitizenIssuePayload): Promise<CivicIssue> {
    const profile = loadProfile();
    const identityMode: CitizenIdentityMode = payload.identity_mode || profile.identity_mode || 'ANONYMOUS';
    const isAnonymous = identityMode === 'ANONYMOUS';
    
    // SOURCE OF TRUTH PRIVACY RULE:
    // For Public: real name displayed.
    // For Anonymous: 'Anonymous Citizen' displayed. Real name NEVER exposed publicly.
    const reporterDisplayName = isAnonymous ? 'Anonymous Citizen' : (payload.citizen_name || profile.real_name);

    // If payload contains updated alias or leaderboard preference, update profile
    if (payload.alias) {
      profile.alias = payload.alias;
    }
    if (payload.leaderboard_enabled !== undefined) {
      profile.leaderboard_enabled = payload.leaderboard_enabled;
    }
    profile.identity_mode = identityMode;
    profile.reports_count = (profile.reports_count || 18) + 1;
    saveProfile(profile);

    const issueDraft: Partial<CivicIssue> = {
      title: payload.title || `${payload.category} issue reported near ${payload.ward}`,
      description: payload.description,
      category: payload.category,
      ward: payload.ward,
      ward_number: payload.ward_number,
      coordinates: [payload.latitude, payload.longitude],
      address: payload.landmark ? `${payload.landmark}, ${payload.ward}, Kopargaon` : `${payload.ward}, Kopargaon`,
      citizen_name: profile.real_name,
      citizen_phone: profile.phone,
      identity_mode: identityMode,
      is_anonymous: isAnonymous,
      reporter_display_name: reporterDisplayName,
      before_photos: payload.photoUrl
        ? [payload.photoUrl]
        : ['https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=600&q=80'],
      factors: {
        severity: 90,
        urgency: 85,
        population_affected: 95,
        health_safety: 90,
        location_sensitivity: 80,
        complaint_age_days: 0,
      },
    };

    // Create via canonical api store
    const newIssue = await api.createIssue(issueDraft);

    // Create confirmation notification
    const notifications = loadNotifications();
    const isQueued = newIssue.status === 'PENDING_RECOVERY';
    notifications.unshift({
      id: `NOTIF-${Date.now()}`,
      issue_id: newIssue.id,
      title: isQueued ? '⚠️ Complaint Queued (Degraded Mode)' : 'Complaint Received',
      message: isQueued
        ? `Your complaint ${newIssue.id} has been safely queued in the resilience operation journal (Op #${newIssue.operation_id || 'OP-PENDING'}). It will be committed once data services are restored.`
        : `Your complaint ${newIssue.id} has been successfully submitted as ${reporterDisplayName}.`,
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
    localStorage.setItem(CITIZEN_PROFILE_KEY, JSON.stringify(DEFAULT_CITIZEN_PROFILE));
    localStorage.setItem(CITIZEN_LEADERBOARD_KEY, JSON.stringify(MOCK_LEADERBOARD));
    window.dispatchEvent(new Event('kopargov_state_updated'));
  },
};
