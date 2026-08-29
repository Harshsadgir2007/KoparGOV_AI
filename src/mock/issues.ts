import { CivicIssue } from '../types';

export const INITIAL_MOCK_ISSUES: CivicIssue[] = [
  {
    id: 'ISS-1024',
    title: 'Garbage accumulation near market',
    description: 'Garbage has not been collected near the market for 3 days. Severe organic accumulation, blocking pathway, and posing high health and hygiene hazard for vendors and pedestrians.',
    category: 'Garbage Accumulation',
    ward: 'Ward 5 - Shivaji Chowk',
    ward_number: 5,
    coordinates: [19.8917, 74.4789],
    address: 'Near Old Market Yard Gate, Shivaji Chowk, Kopargaon',
    submitted_at: '2026-08-26T08:30:00Z',
    age_days: 3,
    status: 'PRIORITIZED', // Initial state: PENDING officer review
    priority_score: 87,
    priority_level: 'CRITICAL',
    population_affected: 1200,
    citizen_name: 'Rahul Patil',
    citizen_phone: '+91 98220 44112',
    identity_mode: 'ANONYMOUS',
    is_anonymous: true,
    reporter_display_name: 'Anonymous Citizen',
    before_photos: [
      'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=600&q=80',
    ],
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
    },
    assignment: {
      team_name: 'Municipal Team 2 (Sanitation Unit)',
      vehicle_id: 'Vehicle 2 (Hydraulic Compactor)',
      lead_worker: 'Suresh More',
      worker_count: 2,
      assigned_at: '2026-08-28T10:00:00Z',
      notes: 'Scheduled for morning shift clearance.'
    },
    resolution: {
      resolved_at: '2026-08-28T14:30:00Z',
      completion_notes: 'Garbage cleared completely from market perimeter and disinfected by Municipal Team 2.',
      after_photos: [
        'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80',
      ],
      verified_by: 'Chief Sanitation Officer, Kopargaon',
      actual_cost: 7800
    }
  },
  {
    id: 'ISS-1025',
    title: 'Open deep drainage trench overflow & clogging',
    description: 'Monsoon silt and plastic waste blocked primary storm runoff drain resulting in sewage backflow into residential lane.',
    category: 'Drainage & Sewage',
    ward: 'Ward 3 - Subhash Nagar',
    ward_number: 3,
    coordinates: [19.8940, 74.4750],
    address: 'Near Municipal Health Center, Subhash Nagar, Kopargaon',
    submitted_at: '2026-08-27T09:15:00Z',
    age_days: 2,
    status: 'ASSIGNED',
    priority_score: 76,
    priority_level: 'HIGH',
    population_affected: 850,
    citizen_name: 'Pooja Jadhav',
    citizen_phone: '+91 97654 22091',
    before_photos: [
      'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=600&q=80',
    ],
    factors: {
      severity: 80,
      urgency: 78,
      population_affected: 75,
      health_safety: 85,
      location_sensitivity: 70,
      complaint_age_days: 60,
    },
    recommendation: {
      recommended_action: 'Dispatch Suction Jetting Unit and 3 drain workers for mechanical declogging.',
      assigned_team_type: 'Drainage Maintenance Squad',
      required_workers: 3,
      required_vehicles: 1,
      vehicle_type: 'Suction Jetting Truck (MH-17-DE-3041)',
      estimated_cost: 6500,
      rationales: [
        'Sewage backflow contamination risk in dense residential lane',
        'Stagnant water accelerating vector-borne disease concerns'
      ],
      resource_impact: {
        budget_required: 6500,
        budget_available: 42000,
        workers_required: 3,
        workers_available: 18,
        vehicles_required: 1,
        vehicles_available: 6,
      }
    },
    assignment: {
      team_name: 'Drainage Maintenance Squad',
      vehicle_id: 'MH-17-DE-3041',
      lead_worker: 'Ramesh Kale',
      worker_count: 3,
      assigned_at: '2026-08-28T09:00:00Z',
      notes: 'Jetting operations in progress.'
    }
  },
  {
    id: 'ISS-1026',
    title: 'Major potable drinking water pipeline fracture',
    description: 'High-pressure feeder line cracked causing potable water loss and street flooding near riverfront lane.',
    category: 'Water Supply & Pipeline',
    ward: 'Ward 7 - Bet Kopargaon Riverside',
    ward_number: 7,
    coordinates: [19.8821, 74.4712],
    address: 'Ghat Road, Bet Kopargaon, Kopargaon',
    submitted_at: '2026-08-28T07:45:00Z',
    age_days: 1,
    status: 'PRIORITIZED',
    priority_score: 71,
    priority_level: 'HIGH',
    population_affected: 1600,
    citizen_name: 'Sunil Shinde',
    citizen_phone: '+91 94231 77652',
    before_photos: [
      'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=600&q=80',
    ],
    factors: {
      severity: 75,
      urgency: 78,
      population_affected: 80,
      health_safety: 70,
      location_sensitivity: 65,
      complaint_age_days: 30,
    },
    recommendation: {
      recommended_action: 'Valve isolation and pipe sleeve replacement by hydraulic engineering team.',
      assigned_team_type: 'Hydraulic Emergency Team',
      required_workers: 4,
      required_vehicles: 1,
      vehicle_type: 'Pipeline Repair Van (MH-17-BG-8819)',
      estimated_cost: 9500,
      rationales: [
        'Loss of drinking water supply to 350 households in Bet Kopargaon',
        'Risk of roadbed washout under moving traffic'
      ],
      resource_impact: {
        budget_required: 9500,
        budget_available: 42000,
        workers_required: 4,
        workers_available: 18,
        vehicles_required: 1,
        vehicles_available: 6,
      }
    }
  },
  {
    id: 'ISS-1027',
    title: 'Complete dark zone streetlight fault on transit road',
    description: '6 consecutive LED streetlights unlit creating pedestrian safety hazard during evening hours.',
    category: 'Streetlight Outage',
    ward: 'Ward 2 - Station Road',
    ward_number: 2,
    coordinates: [19.8972, 74.4845],
    address: 'Station Road, Near Railway Goods Shed, Kopargaon',
    submitted_at: '2026-08-25T18:00:00Z',
    age_days: 4,
    status: 'IN_PROGRESS',
    priority_score: 54,
    priority_level: 'MEDIUM',
    population_affected: 600,
    citizen_name: 'Snehal Deshmukh',
    citizen_phone: '+91 98602 11543',
    before_photos: [
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    ],
    factors: {
      severity: 50,
      urgency: 55,
      population_affected: 45,
      health_safety: 60,
      location_sensitivity: 60,
      complaint_age_days: 80,
    },
    recommendation: {
      recommended_action: 'Feeder box fuse replacement and circuit recalibration.',
      assigned_team_type: 'Electrical Squad',
      required_workers: 2,
      required_vehicles: 1,
      vehicle_type: 'Bucket Ladder Van (MH-17-EL-0914)',
      estimated_cost: 3200,
      rationales: [
        'Public safety restoration for commuters walking to railway station',
        'Quick turnaround with minimal material cost'
      ],
      resource_impact: {
        budget_required: 3200,
        budget_available: 42000,
        workers_required: 2,
        workers_available: 18,
        vehicles_required: 1,
        vehicles_available: 6,
      }
    },
    assignment: {
      team_name: 'Electrical Squad',
      vehicle_id: 'MH-17-EL-0914',
      lead_worker: 'Kiran Wagh',
      worker_count: 2,
      assigned_at: '2026-08-28T14:30:00Z'
    }
  },
  {
    id: 'ISS-1028',
    title: 'Dangerous asphalt potholes near bus transit crossing',
    description: 'Cluster of deep road potholes causing vehicle skids and severe traffic bottleneck.',
    category: 'Potholes & Road Damage',
    ward: 'Ward 4 - Shirdi Highway Link',
    ward_number: 4,
    coordinates: [19.8995, 74.4698],
    address: 'Near ST Bus Depot Crossing, Highway Link Road, Kopargaon',
    submitted_at: '2026-08-28T11:00:00Z',
    age_days: 1,
    status: 'PRIORITIZED',
    priority_score: 74,
    priority_level: 'HIGH',
    population_affected: 3100,
    citizen_name: 'Mahesh Gorde',
    citizen_phone: '+91 99701 88432',
    before_photos: [
      'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80',
    ],
    factors: {
      severity: 75,
      urgency: 80,
      population_affected: 90,
      health_safety: 75,
      location_sensitivity: 85,
      complaint_age_days: 20,
    },
    recommendation: {
      recommended_action: 'Cold mix leveling, mechanical compacting and barricade placement.',
      assigned_team_type: 'Roads & Infrastructure Squad',
      required_workers: 4,
      required_vehicles: 1,
      vehicle_type: 'Road Utility Truck (MH-17-RT-1109)',
      estimated_cost: 11000,
      rationales: [
        'High-velocity vehicular corridor with state transport buses',
        'Direct accident prevention for over 3,000 daily commuters'
      ],
      resource_impact: {
        budget_required: 11000,
        budget_available: 42000,
        workers_required: 4,
        workers_available: 18,
        vehicles_required: 1,
        vehicles_available: 6,
      }
    }
  },
  {
    id: 'ISS-1029',
    title: 'Public health vector breeding & disinfection required',
    description: 'Stagnant water near health center boundary requiring chemical larvicide fogging.',
    category: 'Public Health & Sanitation',
    ward: 'Ward 1 - Gandhi Chowk',
    ward_number: 1,
    coordinates: [19.8902, 74.4765],
    address: 'Near Kanya Shala, Tilak Road, Kopargaon',
    submitted_at: '2026-08-24T10:00:00Z',
    age_days: 5,
    status: 'RESOLVED',
    priority_score: 83,
    priority_level: 'CRITICAL',
    population_affected: 1500,
    citizen_name: 'Dr. Rahul Vikhe',
    citizen_phone: '+91 94222 33451',
    before_photos: [
      'https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=600&q=80',
    ],
    after_photos: [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
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
      recommended_action: 'Vector control fogging and pool drainage.',
      assigned_team_type: 'Health & Vector Control Unit',
      required_workers: 3,
      required_vehicles: 1,
      vehicle_type: 'Fogging Carrier (MH-17-HC-2290)',
      estimated_cost: 5500,
      rationales: [
        'Dengue prevention near residential zone and primary school',
        'Direct protection for 1,500 residents'
      ],
      resource_impact: {
        budget_required: 5500,
        budget_available: 42000,
        workers_required: 3,
        workers_available: 18,
        vehicles_required: 1,
        vehicles_available: 6,
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
      completion_notes: 'Larvicide spraying completed across 2 acres.',
      after_photos: [
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
      ],
      verified_by: 'Chief Health Officer, Kopargaon',
      actual_cost: 5200
    }
  }
];
