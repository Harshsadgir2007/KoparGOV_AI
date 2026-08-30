import { API_ENDPOINTS, getApiAuthHeaders } from '../config/api';
import {
  Contractor,
  MunicipalProject,
  ContractorAccountabilityEvent,
  RecordInspectionRequest,
} from '../types';

const CONTRACTORS_STORAGE_KEY = 'kopargov_contractors_v1';
const PROJECTS_STORAGE_KEY = 'kopargov_projects_v1';
const EVENTS_STORAGE_KEY = 'kopargov_accountability_events_v1';

const INITIAL_CONTRACTORS: Contractor[] = [
  {
    contractor_id: 'CON-ABC',
    name: 'ABC Infrastructure & Roadways Pvt. Ltd.',
    categories: ['Road Construction', 'Asphalt Resurfacing', 'Stormwater Drainage'],
    wards_served: ['Ward 1', 'Ward 2', 'Ward 5', 'Ward 7'],
    contact_person: 'Vikram Shinde (Project Director)',
    phone: '+91 98221 55670',
    active_projects: 2,
    completed_projects: 8,
    on_time_completion_rate: 87.5,
    inspection_pass_rate: 75.0,
    rework_count: 2,
    total_complaint_count: 21,
    safety_flags_count: 1,
    performance: {
      overall_score: 72.8,
      on_time_score: 87.5,
      inspection_score: 75.0,
      quality_score: 50.0,
      complaint_score: 73.8,
      safety_score: 70.0,
      score_tier: 'MONITORING',
    },
    compliance_status: 'ENHANCED_MONITORING',
  },
  {
    contractor_id: 'CON-GODAVARI',
    name: 'Godavari Civil Engineers & Builders',
    categories: ['Water Pipelines', 'Sewage Networks', 'Sanitation Facilities'],
    wards_served: ['Ward 3', 'Ward 4', 'Ward 5', 'Ward 6'],
    contact_person: 'Anil Deshmukh (Managing Partner)',
    phone: '+91 94222 33890',
    active_projects: 1,
    completed_projects: 12,
    on_time_completion_rate: 95.0,
    inspection_pass_rate: 92.0,
    rework_count: 0,
    total_complaint_count: 5,
    safety_flags_count: 0,
    performance: {
      overall_score: 93.4,
      on_time_score: 95.0,
      inspection_score: 92.0,
      quality_score: 100.0,
      complaint_score: 95.8,
      safety_score: 100.0,
      score_tier: 'EXCELLENT',
    },
    compliance_status: 'COMPLIANT',
  },
  {
    contractor_id: 'CON-MAHALAXMI',
    name: 'Mahalaxmi Electricals & Infrastructure',
    categories: ['Streetlighting', 'High-Mast Illumination', 'Grid Maintenance'],
    wards_served: ['Ward 1', 'Ward 2', 'Ward 3', 'Ward 4', 'Ward 5', 'Ward 6', 'Ward 7'],
    contact_person: 'Suresh Gholap',
    phone: '+91 98500 11223',
    active_projects: 1,
    completed_projects: 15,
    on_time_completion_rate: 93.3,
    inspection_pass_rate: 88.0,
    rework_count: 1,
    total_complaint_count: 8,
    safety_flags_count: 0,
    performance: {
      overall_score: 87.8,
      on_time_score: 93.3,
      inspection_score: 88.0,
      quality_score: 83.3,
      complaint_score: 94.7,
      safety_score: 100.0,
      score_tier: 'EXCELLENT',
    },
    compliance_status: 'COMPLIANT',
  },
];

const INITIAL_PROJECTS: MunicipalProject[] = [
  {
    project_id: 'PRJ-024',
    asset_id: 'AST-RD-05',
    asset_name: 'Ward 5 Market Road (Shivaji Chowk to Mandi)',
    contractor_id: 'CON-ABC',
    contractor_name: 'ABC Infrastructure & Roadways Pvt. Ltd.',
    category: 'Road Resurfacing & Drainage',
    ward: 'Ward 5 - Shivaji Chowk',
    ward_number: 5,
    coordinates: [19.8917, 74.4789],
    start_date: '2026-05-10T00:00:00Z',
    planned_completion_date: '2026-08-01T00:00:00Z',
    actual_completion_date: '2026-08-15T00:00:00Z',
    contract_value: 4500000,
    status: 'COMPLETED',
    post_completion_complaints: 17,
    high_severity_complaints: 5,
    safety_complaints: 3,
    recent_complaints_last_7_days: 4,
    rework_requests: 2,
    last_inspection_date: '2026-08-12T00:00:00Z',
    last_inspection_outcome: 'PASSED',
    cie_inspection_status: 'INSPECTION_RECOMMENDED',
    inspection_signals: [
      '17 post-completion complaints accumulated on record.',
      '3 high-hazard safety complaints flagged by citizens.',
      '4 complaints reported in the last 7 days.',
      'Prior defect rework history (2 rework orders logged).',
    ],
    cie_rationale:
      'Inspection is recommended because the completed project on Ward 5 Market Road has accumulated repeated post-completion complaints (17 total, 3 safety-related) within a concentrated municipal location.',
  },
  {
    project_id: 'PRJ-019',
    asset_id: 'AST-PL-03',
    asset_name: 'Ward 3 Subhash Road Feeder Water Pipeline',
    contractor_id: 'CON-GODAVARI',
    contractor_name: 'Godavari Civil Engineers & Builders',
    category: 'Water Pipeline Replacement',
    ward: 'Ward 3 - Subhash Road',
    ward_number: 3,
    coordinates: [19.8942, 74.4721],
    start_date: '2026-03-01T00:00:00Z',
    planned_completion_date: '2026-06-15T00:00:00Z',
    actual_completion_date: '2026-06-10T00:00:00Z',
    contract_value: 3200000,
    status: 'COMPLETED',
    post_completion_complaints: 2,
    high_severity_complaints: 0,
    safety_complaints: 0,
    recent_complaints_last_7_days: 0,
    rework_requests: 0,
    last_inspection_date: '2026-06-12T00:00:00Z',
    last_inspection_outcome: 'PASSED',
    cie_inspection_status: 'NORMAL',
    inspection_signals: [],
    cie_rationale: 'Project durability within expected operating parameters.',
  },
  {
    project_id: 'PRJ-031',
    asset_id: 'AST-SL-01',
    asset_name: 'Ward 1 Tilak Road LED Streetlight Grid',
    contractor_id: 'CON-MAHALAXMI',
    contractor_name: 'Mahalaxmi Electricals & Infrastructure',
    category: 'Streetlight Modernization',
    ward: 'Ward 1 - Gandhi Chowk & Tilak Road',
    ward_number: 1,
    coordinates: [19.8876, 74.4812],
    start_date: '2026-07-01T00:00:00Z',
    planned_completion_date: '2026-08-20T00:00:00Z',
    actual_completion_date: '2026-08-18T00:00:00Z',
    contract_value: 1800000,
    status: 'COMPLETED',
    post_completion_complaints: 4,
    high_severity_complaints: 1,
    safety_complaints: 0,
    recent_complaints_last_7_days: 1,
    rework_requests: 0,
    last_inspection_date: '2026-08-19T00:00:00Z',
    last_inspection_outcome: 'PASSED',
    cie_inspection_status: 'WARNING',
    inspection_signals: ['Elevated post-completion activity detected. Enhanced monitoring advised.'],
    cie_rationale: 'Elevated post-completion activity detected on Ward 1 Tilak Road LED Streetlight Grid.',
  },
];

const INITIAL_EVENTS: ContractorAccountabilityEvent[] = [
  {
    event_id: 'EVT-101',
    contractor_id: 'CON-ABC',
    project_id: 'PRJ-024',
    asset_id: 'AST-RD-05',
    timestamp: '2026-08-27T14:30:00Z',
    event_type: 'INSPECTION_RECOMMENDED',
    severity: 'HIGH',
    evidence_summary:
      '17 post-completion complaints accumulated on Ward 5 Market Road within 14 days of project handover.',
    status: 'ACTIVE',
    logged_by: 'CIE Contractor Accountability Engine',
  },
];

function loadStored<T>(key: string, defaultVal: T): T {
  try {
    const s = localStorage.getItem(key);
    if (s) return JSON.parse(s);
  } catch (e) {
    console.error(`Error loading ${key}:`, e);
  }
  localStorage.setItem(key, JSON.stringify(defaultVal));
  return defaultVal;
}

function saveStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
    window.dispatchEvent(new Event('kopargov_state_updated'));
  } catch (e) {
    console.error(`Error saving ${key}:`, e);
  }
}

export const contractorService = {
  async getContractors(): Promise<Contractor[]> {
    try {
      const res = await fetch(API_ENDPOINTS.CONTRACTORS);
      if (res.ok) {
        const data = await res.json();
        saveStored(CONTRACTORS_STORAGE_KEY, data);
        return data;
      }
    } catch (e) {
      // Graceful offline fallback
    }
    return loadStored(CONTRACTORS_STORAGE_KEY, INITIAL_CONTRACTORS);
  },

  async getProjects(): Promise<MunicipalProject[]> {
    try {
      const res = await fetch(API_ENDPOINTS.PROJECTS);
      if (res.ok) {
        const data = await res.json();
        saveStored(PROJECTS_STORAGE_KEY, data);
        return data;
      }
    } catch (e) {
      // Graceful offline fallback
    }
    return loadStored(PROJECTS_STORAGE_KEY, INITIAL_PROJECTS);
  },

  async getProjectById(projectId: string): Promise<MunicipalProject | undefined> {
    try {
      const res = await fetch(API_ENDPOINTS.PROJECT_DETAIL(projectId));
      if (res.ok) return await res.json();
    } catch (e) {
      // Fallback
    }
    const projects = await this.getProjects();
    return projects.find(p => p.project_id.toUpperCase() === projectId.toUpperCase());
  },

  async recordInspection(
    projectId: string,
    request: RecordInspectionRequest
  ): Promise<MunicipalProject | undefined> {
    const cleanId = projectId.toUpperCase();
    try {
      const res = await fetch(API_ENDPOINTS.PROJECT_INSPECT(cleanId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getApiAuthHeaders(),
        },
        body: JSON.stringify(request),
      });
      if (res.ok) {
        const updated = await res.json();
        const projects = loadStored(PROJECTS_STORAGE_KEY, INITIAL_PROJECTS);
        const idx = projects.findIndex(p => p.project_id.toUpperCase() === cleanId);
        if (idx >= 0) projects[idx] = updated;
        saveStored(PROJECTS_STORAGE_KEY, projects);
        return updated;
      }
    } catch (e) {
      console.warn('Backend offline, recording inspection locally:', e);
    }

    // Local fallback update
    const projects = loadStored(PROJECTS_STORAGE_KEY, INITIAL_PROJECTS);
    const proj = projects.find(p => p.project_id.toUpperCase() === cleanId);
    if (proj) {
      proj.last_inspection_date = new Date().toISOString();
      proj.last_inspection_outcome = request.outcome;
      if (request.outcome === 'REQUIRES_REWORK') {
        proj.status = 'REWORK_IN_PROGRESS';
        proj.rework_requests += 1;
      } else if (request.outcome === 'FAILED') {
        proj.status = 'FAILED_INSPECTION';
      } else {
        proj.status = 'COMPLETED';
      }
      saveStored(PROJECTS_STORAGE_KEY, projects);

      // Log event
      const events = loadStored(EVENTS_STORAGE_KEY, INITIAL_EVENTS);
      events.unshift({
        event_id: `EVT-${100 + events.length + 1}`,
        contractor_id: proj.contractor_id,
        project_id: proj.project_id,
        asset_id: proj.asset_id,
        timestamp: new Date().toISOString(),
        event_type: request.outcome === 'REQUIRES_REWORK' ? 'REWORK_REQUIRED' : 'FAILED_INSPECTION',
        severity: request.outcome === 'FAILED' ? 'CRITICAL' : 'HIGH',
        evidence_summary: `On-site inspection by ${request.officer_name}: ${request.inspection_notes}`,
        status: 'ACTIVE',
        logged_by: request.officer_name,
      });
      saveStored(EVENTS_STORAGE_KEY, events);
    }
    return proj;
  },

  async getAccountabilityEvents(): Promise<ContractorAccountabilityEvent[]> {
    try {
      const res = await fetch(API_ENDPOINTS.ACCOUNTABILITY_EVENTS);
      if (res.ok) {
        const data = await res.json();
        saveStored(EVENTS_STORAGE_KEY, data);
        return data;
      }
    } catch (e) {
      // Fallback
    }
    return loadStored(EVENTS_STORAGE_KEY, INITIAL_EVENTS);
  },

  async getRoads(): Promise<any[]> {
    try {
      const res = await fetch(API_ENDPOINTS.ROADS);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // Fallback
    }
    return [
      {
        road_id: 'RD-KPG-01',
        road_name: 'Station Road (Railway Station to Shivaji Chowk)',
        ward: 'Ward 1 - Railway Station Area',
        ward_number: 1,
        length_km: 1.8,
        surface_type: 'Asphalt',
        condition: 'POOR',
        issue_type: 'Potholes & Broken Edges',
        priority: 'HIGH',
        assigned_contractor_id: 'CON-ABC',
        assigned_contractor_name: 'ABC Infrastructure & Roadways Pvt. Ltd.',
        coordinates: [[19.8850, 74.4710], [19.8880, 74.4750], [19.8917, 74.4789]],
      },
      {
        road_id: 'RD-KPG-05',
        road_name: 'Shivaji Chowk Market Gateway',
        ward: 'Ward 5 - Shivaji Chowk',
        ward_number: 5,
        length_km: 0.8,
        surface_type: 'Paver Blocks',
        condition: 'POOR',
        issue_type: 'Garbage Spill & Drain Overflow',
        priority: 'CRITICAL',
        assigned_contractor_id: 'CON-ABC',
        assigned_contractor_name: 'ABC Infrastructure & Roadways Pvt. Ltd.',
        coordinates: [[19.8910, 74.4780], [19.8917, 74.4789], [19.8935, 74.4810]],
      },
    ];
  },
};
