import { CitizenProfile, LeaderboardEntry } from '../types';

export const DEFAULT_CITIZEN_PROFILE: CitizenProfile = {
  id: 'CITIZEN-01',
  real_name: 'Rahul Patil',
  identity_mode: 'ANONYMOUS', // Default is Anonymous as specified in prompt
  leaderboard_enabled: false,  // Default is OFF as specified in prompt
  alias: 'CivicChampion',
  phone: '+91 98220 44112',
  address: 'Shivaji Chowk, Main Bazaar Road',
  ward: 'Ward 5 - Shivaji Chowk',
  reports_count: 18,
  resolved_count: 16,
  contribution_score: 94,
};

export const MOCK_CITIZEN_PROFILES: Record<string, CitizenProfile> = {
  'rahul-public': {
    id: 'CITIZEN-01',
    real_name: 'Rahul Patil',
    identity_mode: 'PUBLIC',
    leaderboard_enabled: true,
    alias: 'KoparHero',
    phone: '+91 98220 44112',
    address: 'Shivaji Chowk, Main Bazaar Road',
    ward: 'Ward 5 - Shivaji Chowk',
    reports_count: 18,
    resolved_count: 16,
    contribution_score: 94,
  },
  'priya-anonymous': {
    id: 'CITIZEN-02',
    real_name: 'Priya Sharma',
    identity_mode: 'ANONYMOUS',
    leaderboard_enabled: true,
    alias: 'CivicChampion',
    phone: '+91 97654 22091',
    address: 'Subhash Nagar Lane 3',
    ward: 'Ward 3 - Subhash Nagar',
    reports_count: 15,
    resolved_count: 13,
    contribution_score: 88,
  },
  'sunil-public': {
    id: 'CITIZEN-03',
    real_name: 'Sunil Shinde',
    identity_mode: 'PUBLIC',
    leaderboard_enabled: true,
    phone: '+91 94231 77652',
    address: 'Ghat Road, Godavari Bank',
    ward: 'Ward 7 - Bet Kopargaon Riverside',
    reports_count: 10,
    resolved_count: 9,
    contribution_score: 78,
  },
};

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    display_name: 'Rahul Patil',
    identity_type: 'PUBLIC',
    reports: 18,
    resolved: 16,
    score: 94,
  },
  {
    rank: 2,
    display_name: 'CivicChampion',
    identity_type: 'ANONYMOUS',
    reports: 15,
    resolved: 13,
    score: 88,
  },
  {
    rank: 3,
    display_name: 'GreenCitizen',
    identity_type: 'ANONYMOUS',
    reports: 12,
    resolved: 11,
    score: 82,
  },
  {
    rank: 4,
    display_name: 'Sunil Shinde',
    identity_type: 'PUBLIC',
    reports: 10,
    resolved: 9,
    score: 78,
  },
  {
    rank: 5,
    display_name: 'Ward5Helper',
    identity_type: 'ANONYMOUS',
    reports: 8,
    resolved: 7,
    score: 72,
  },
  {
    rank: 6,
    display_name: 'CivicVoice',
    identity_type: 'ANONYMOUS',
    reports: 6,
    resolved: 5,
    score: 65,
  },
];
