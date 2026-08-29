import { CivicIssue, MunicipalResources, AnalyticsOverview } from '../types';

export const INITIAL_RESOURCES: MunicipalResources = {
  available_budget: 340000,
  total_budget: 500000,
  available_workers: 18,
  total_workers: 45,
  available_vehicles: 5,
  total_vehicles: 12,
  equipment_status: [
    { name: 'Hydraulic Compactors', available: 2, total: 4 },
    { name: 'Suction Jetting Machines', available: 1, total: 3 },
    { name: 'Road Patching Rollers', available: 1, total: 2 },
    { name: 'Water Tanker Fleets', available: 3, total: 5 },
  ],
};

export const INITIAL_ISSUES: CivicIssue[] = [
  {
    id: 'ISS-1024',
    title: 'Severe Municipal Waste & Solid Garbage Accumulation',
    description: 'Extensive solid waste dumping near commercial vegetable market and school intersection blocking pedestrian pathway and creating severe foul odor and public hygiene risks.',
    category: 'Garbage Accumulation',
    ward: 'Ward 5 - Shivaji Chowk & Market Yard',
    ward_number: 5,
    coordinates: [19.8917, 74.4789],
    address: 'Near Old Market Yard Gate, Shivaji Chowk, Kopargaon 423601',
    submitted_at: '2026-08-26T08:30:00Z',
    age_days: 3,
    status: 'PRIORITIZED',
    priority_score: 87,
    priority_level: 'CRITICAL',
    population_affected: 1200,
    citizen_name: 'Anand Patil',
    citizen_phone: '+91 98220 44112',
    before_photos: [
      'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80'
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
      recommended_action: 'Deploy Hydraulic Compactor Vehicle & 2 Sanitation Personnel for bulk debris evacuation and anti-bacterial spraying.',
      assigned_team_type: 'Sanitation Rapid Response Unit B',
      required_workers: 2,
      required_vehicles: 1,
      vehicle_type: 'Hydraulic Compactor (MH-17-AZ-4102)',
      estimated_cost: 8000,
      rationales: [
        'High public health hazard index due to organic decomposition near vegetable market',
        'Directly impacts over 1,200 daily market vendors, shoppers and school students',
        'Unresolved for 3 consecutive days with rising community escalation',
        'High commercial zone sensitivity with heavy foot traffic',
        'Actionable with minimal personnel footprint (2 workers) and immediate compactor availability',
        'Fully accommodates available daily ward allocation budget'
      ],
      resource_impact: {
        budget_required: 8000,
        budget_available: 20000,
        workers_required: 2,
        workers_available: 5,
        vehicles_required: 1,
        vehicles_available: 2,
      }
    }
  },
  {
    id: 'ISS-1025',
    title: 'Major Drinking Water Main Pipeline Rupture',
    description: 'High-pressure drinking water feeder line fractured causing potable water flooding onto Station Road and loss of supply to 450 households.',
    category: 'Water Supply & Pipeline',
    ward: 'Ward 2 - Station Road & Railway Colony',
    ward_number: 2,
    coordinates: [19.8972, 74.4845],
    address: 'Opposite Railway Goods Shed, Station Road, Kopargaon',
    submitted_at: '2026-08-27T06:15:00Z',
    age_days: 2,
    status: 'APPROVED',
    priority_score: 92,
    priority_level: 'CRITICAL',
    population_affected: 2400,
    citizen_name: 'Sunil Shinde',
    citizen_phone: '+91 94231 77652',
    before_photos: [
      'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=600&q=80'
    ],
    factors: {
      severity: 95,
      urgency: 95,
      population_affected: 92,
      health_safety: 88,
      location_sensitivity: 85,
      complaint_age_days: 60,
    },
    recommendation: {
      recommended_action: 'Emergency valve isolation, pipe sleeve replacement, and pressure restoration test.',
      assigned_team_type: 'Hydraulic Engineering Quick Fix Team 1',
      required_workers: 4,
      required_vehicles: 1,
      vehicle_type: 'Emergency Pipeline Van (MH-17-BG-8819)',
      estimated_cost: 14500,
      rationales: [
        'Severe drinking water wastage and household supply outage',
        'Risk of roadbed subsidence under moving traffic',
        'Directly affects 2,400 residents across Railway Colony'
      ],
      resource_impact: {
        budget_required: 14500,
        budget_available: 35000,
        workers_required: 4,
        workers_available: 8,
        vehicles_required: 1,
        vehicles_available: 3,
      }
    }
  },
  {
    id: 'ISS-1026',
    title: 'Open Deep Drainage Trench Clogging & Backflow',
    description: 'Monsoon silt and plastic waste blocked primary storm runoff drain resulting in foul backflow into residential lane.',
    category: 'Drainage & Sewage',
    ward: 'Ward 7 - Bet Kopargaon Riverside',
    ward_number: 7,
    coordinates: [19.8821, 74.4712],
    address: 'Ghat Road, Lane 4, Bet Kopargaon',
    submitted_at: '2026-08-25T14:20:00Z',
    age_days: 4,
    status: 'IN_PROGRESS',
    priority_score: 79,
    priority_level: 'HIGH',
    population_affected: 850,
    citizen_name: 'Pooja Jadhav',
    citizen_phone: '+91 97654 22091',
    before_photos: [
      'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=600&q=80'
    ],
    factors: {
      severity: 80,
      urgency: 78,
      population_affected: 75,
      health_safety: 85,
      location_sensitivity: 70,
      complaint_age_days: 82,
    },
    recommendation: {
      recommended_action: 'Dispatch Suction Jetting Unit and 3 drain workers for mechanical declogging and silt removal.',
      assigned_team_type: 'Drainage Maintenance Unit 2',
      required_workers: 3,
      required_vehicles: 1,
      vehicle_type: 'Suction Jetting Truck (MH-17-DE-3041)',
      estimated_cost: 6500,
      rationales: [
        'Backflow contamination risk in high-density residential clusters',
        'Stagnant water accelerating vector-borne disease concerns'
      ],
      resource_impact: {
        budget_required: 6500,
        budget_available: 18000,
        workers_required: 3,
        workers_available: 6,
        vehicles_required: 1,
        vehicles_available: 2,
      }
    },
    assignment: {
      team_name: 'Drainage Maintenance Unit 2',
      vehicle_id: 'MH-17-DE-3041',
      lead_worker: 'Ramesh Kale',
      worker_count: 3,
      assigned_at: '2026-08-28T09:00:00Z',
      notes: 'Desilting commenced at 09:30 AM. Expected completion within 4 hours.'
    }
  },
  {
    id: 'ISS-1027',
    title: 'Dangerous Deep Pothole Cluster on Bus Route',
    description: 'Consecutive deep asphalt potholes on main transit corridor causing two-wheeler skids and severe traffic slowdowns during peak hours.',
    category: 'Potholes & Road Damage',
    ward: 'Ward 4 - Shirdi Highway Link Road',
    ward_number: 4,
    coordinates: [19.8995, 74.4698],
    address: 'Near State Transport Bus Depot Crossing, Highway Link Road',
    submitted_at: '2026-08-28T11:00:00Z',
    age_days: 1,
    status: 'PRIORITIZED',
    priority_score: 74,
    priority_level: 'HIGH',
    population_affected: 3100,
    citizen_name: 'Mahesh Gorde',
    citizen_phone: '+91 99701 88432',
    before_photos: [
      'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80'
    ],
    factors: {
      severity: 75,
      urgency: 82,
      population_affected: 90,
      health_safety: 78,
      location_sensitivity: 85,
      complaint_age_days: 20,
    },
    recommendation: {
      recommended_action: 'Cold mix asphalt leveling, mechanical compacting, and reflective warning barricade placement.',
      assigned_team_type: 'Roads & Infrastructure Section',
      required_workers: 4,
      required_vehicles: 1,
      vehicle_type: 'Road Maintenance Utility Truck (MH-17-RT-1109)',
      estimated_cost: 11000,
      rationales: [
        'High velocity vehicular corridor with public transport buses',
        'Direct accident mitigation for 3,000+ daily commuters'
      ],
      resource_impact: {
        budget_required: 11000,
        budget_available: 40000,
        workers_required: 4,
        workers_available: 10,
        vehicles_required: 1,
        vehicles_available: 3,
      }
    }
  },
  {
    id: 'ISS-1028',
    title: 'Complete Streetlight Strip Power Fault',
    description: '8 consecutive LED streetlights unlit along river promenade creating unsafe dark zone for pedestrians during evening hours.',
    category: 'Streetlight Outage',
    ward: 'Ward 8 - Godavari Riverfront Promenade',
    ward_number: 8,
    coordinates: [19.8875, 74.4820],
    address: 'River Promenade Road, Near Goda Ghat Bridge',
    submitted_at: '2026-08-26T20:00:00Z',
    age_days: 3,
    status: 'ASSIGNED',
    priority_score: 58,
    priority_level: 'MEDIUM',
    population_affected: 600,
    citizen_name: 'Snehal Deshmukh',
    citizen_phone: '+91 98602 11543',
    before_photos: [
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80'
    ],
    factors: {
      severity: 55,
      urgency: 60,
      population_affected: 50,
      health_safety: 65,
      location_sensitivity: 60,
      complaint_age_days: 65,
    },
    recommendation: {
      recommended_action: 'Electrical feeder box inspection, blown circuit fuse replacement, and timer calibration.',
      assigned_team_type: 'Electrical Maintenance Squad',
      required_workers: 2,
      required_vehicles: 1,
      vehicle_type: 'Hydraulic Bucket Ladder Van (MH-17-EL-0914)',
      estimated_cost: 3200,
      rationales: [
        'Public safety enhancement along dark pedestrian walkway',
        'Rapid electrical repair with low material expenditure'
      ],
      resource_impact: {
        budget_required: 3200,
        budget_available: 15000,
        workers_required: 2,
        workers_available: 4,
        vehicles_required: 1,
        vehicles_available: 1,
      }
    },
    assignment: {
      team_name: 'Electrical Maintenance Squad',
      vehicle_id: 'MH-17-EL-0914',
      lead_worker: 'Kiran Wagh',
      worker_count: 2,
      assigned_at: '2026-08-28T14:30:00Z'
    }
  },
  {
    id: 'ISS-1029',
    title: 'Public Health Vector Spraying & Disinfection Required',
    description: 'Stagnant water puddle near municipal slaughterhouse and residential boundary requiring immediate larvicide chemical fogging.',
    category: 'Public Health & Sanitation',
    ward: 'Ward 3 - Subhash Nagar',
    ward_number: 3,
    coordinates: [19.8940, 74.4750],
    address: 'Behind Municipal Health Sub-Center, Subhash Nagar',
    submitted_at: '2026-08-24T10:00:00Z',
    age_days: 5,
    status: 'RESOLVED',
    priority_score: 83,
    priority_level: 'CRITICAL',
    population_affected: 1500,
    citizen_name: 'Dr. Rahul Vikhe',
    citizen_phone: '+91 94222 33451',
    before_photos: [
      'https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=600&q=80'
    ],
    factors: {
      severity: 85,
      urgency: 85,
      population_affected: 88,
      health_safety: 92,
      location_sensitivity: 75,
      complaint_age_days: 90,
    },
    recommendation: {
      recommended_action: 'Vector control fumigation, anti-larval chemical treatment, and stagnant pool drainage.',
      assigned_team_type: 'Health & Vector Control Unit',
      required_workers: 3,
      required_vehicles: 1,
      vehicle_type: 'Fogging & Disinfection Carrier (MH-17-HC-2290)',
      estimated_cost: 5500,
      rationales: [
        'Dengue and malaria breeding prevention near residential zones',
        'Direct protection for over 1,500 residents and children'
      ],
      resource_impact: {
        budget_required: 5500,
        budget_available: 25000,
        workers_required: 3,
        workers_available: 6,
        vehicles_required: 1,
        vehicles_available: 2,
      }
    },
    assignment: {
      team_name: 'Health & Vector Control Unit',
      vehicle_id: 'MH-17-HC-2290',
      lead_worker: 'Vijay Tambe',
      worker_count: 3,
      assigned_at: '2026-08-25T08:00:00Z'
    },
    resolution: {
      resolved_at: '2026-08-25T16:30:00Z',
      completion_notes: 'Full larvicide spraying completed across 2-acre radius. Stagnant puddles filled with dry soil and bleaching powder applied.',
      after_photos: [
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'
      ],
      verified_by: 'Chief Health Officer, Kopargaon Municipal Council',
      actual_cost: 5200
    }
  },
  {
    id: 'ISS-1030',
    title: 'Damaged Concrete Manhole Cover on Pedestrian Walkway',
    description: 'Cracked concrete cover over stormwater junction posing immediate fall hazard for school children and evening walkers.',
    category: 'Drainage & Sewage',
    ward: 'Ward 1 - Gandhi Chowk & Tilak Road',
    ward_number: 1,
    coordinates: [19.8902, 74.4765],
    address: 'Near Kanya Shala, Tilak Road, Kopargaon',
    submitted_at: '2026-08-29T07:10:00Z',
    age_days: 0,
    status: 'REPORTED',
    priority_score: 68,
    priority_level: 'MEDIUM',
    population_affected: 750,
    citizen_name: 'Ganesh Autade',
    citizen_phone: '+91 98500 12984',
    before_photos: [
      'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=600&q=80'
    ],
    factors: {
      severity: 70,
      urgency: 72,
      population_affected: 65,
      health_safety: 75,
      location_sensitivity: 80,
      complaint_age_days: 10,
    },
    recommendation: {
      recommended_action: 'Cast-iron heavy duty manhole replacement and rapid curing mortar sealing.',
      assigned_team_type: 'Civil Works Repair Squad',
      required_workers: 2,
      required_vehicles: 1,
      vehicle_type: 'Civil Maintenance Van (MH-17-CW-5120)',
      estimated_cost: 4500,
      rationales: [
        'Direct pedestrian safety risk adjacent to girls primary school',
        'Immediate replacement prevent liability and severe injury'
      ],
      resource_impact: {
        budget_required: 4500,
        budget_available: 20000,
        workers_required: 2,
        workers_available: 6,
        vehicles_required: 1,
        vehicles_available: 2,
      }
    }
  }
];

export const INITIAL_ANALYTICS: AnalyticsOverview = {
  total_issues: 42,
  critical_issues: 9,
  high_priority_issues: 14,
  pending_approvals: 6,
  active_assignments: 11,
  resolved_issues: 18,
  critical_resolved: 7,
  avg_response_time_hours: 4.8,
  population_benefited: 38400,
  budget_utilized: 160000,
  budget_total: 500000,
  worker_utilization_pct: 60,
  vehicle_utilization_pct: 58,
  category_distribution: [
    { category: 'Garbage Accumulation', count: 14, critical: 4 },
    { category: 'Water Supply & Pipeline', count: 9, critical: 3 },
    { category: 'Drainage & Sewage', count: 8, critical: 1 },
    { category: 'Potholes & Road Damage', count: 6, critical: 1 },
    { category: 'Streetlight Outage', count: 3, critical: 0 },
    { category: 'Public Health & Sanitation', count: 2, critical: 0 }
  ],
  ward_distribution: [
    { ward: 'Ward 1 - Gandhi Chowk', issues: 5, resolved: 3 },
    { ward: 'Ward 2 - Station Road', issues: 7, resolved: 4 },
    { ward: 'Ward 3 - Subhash Nagar', issues: 4, resolved: 2 },
    { ward: 'Ward 4 - Shirdi Highway Link', issues: 6, resolved: 2 },
    { ward: 'Ward 5 - Shivaji Chowk', issues: 8, resolved: 3 },
    { ward: 'Ward 6 - Somaiya Factory Area', issues: 3, resolved: 1 },
    { ward: 'Ward 7 - Bet Kopargaon', issues: 5, resolved: 2 },
    { ward: 'Ward 8 - Godavari Riverfront', issues: 4, resolved: 1 }
  ],
  priority_distribution: [
    { level: 'CRITICAL', count: 9, color: '#DC2626' },
    { level: 'HIGH', count: 14, color: '#EA580C' },
    { level: 'MEDIUM', count: 12, color: '#D97706' },
    { level: 'LOW', count: 7, color: '#16A34A' }
  ],
  resolution_trends: [
    { date: '23 Aug', reported: 6, resolved: 4 },
    { date: '24 Aug', reported: 8, resolved: 5 },
    { date: '25 Aug', reported: 7, resolved: 6 },
    { date: '26 Aug', reported: 9, resolved: 7 },
    { date: '27 Aug', reported: 5, resolved: 5 },
    { date: '28 Aug', reported: 8, resolved: 6 },
    { date: '29 Aug', reported: 4, resolved: 3 }
  ]
};

export const KOPARGAON_WARDS = [
  { id: 1, name: 'Ward 1 - Gandhi Chowk & Tilak Road', lat: 19.8902, lng: 74.4765 },
  { id: 2, name: 'Ward 2 - Station Road & Railway Colony', lat: 19.8972, lng: 74.4845 },
  { id: 3, name: 'Ward 3 - Subhash Nagar', lat: 19.8940, lng: 74.4750 },
  { id: 4, name: 'Ward 4 - Shirdi Highway Link Road', lat: 19.8995, lng: 74.4698 },
  { id: 5, name: 'Ward 5 - Shivaji Chowk & Market Yard', lat: 19.8917, lng: 74.4789 },
  { id: 6, name: 'Ward 6 - Somaiya Mills & Industrial Area', lat: 19.9050, lng: 74.4890 },
  { id: 7, name: 'Ward 7 - Bet Kopargaon Riverside', lat: 19.8821, lng: 74.4712 },
  { id: 8, name: 'Ward 8 - Godavari Riverfront Promenade', lat: 19.8875, lng: 74.4820 },
  { id: 9, name: 'Ward 9 - Samata Nagar & College Road', lat: 19.8960, lng: 74.4650 },
  { id: 10, name: 'Ward 10 - Sanjeevani Sugar Factory Zone', lat: 19.9120, lng: 74.4920 },
];
