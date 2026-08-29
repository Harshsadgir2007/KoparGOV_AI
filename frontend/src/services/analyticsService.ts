export interface AnalyticsFilters {
  dateRange?: string;
  ward?: string;
  category?: string;
  priority?: string;
  status?: string;
}

export interface AnalyticsDataSet {
  summary: {
    total_issues: number;
    critical_issues: number;
    resolved_issues: number;
    critical_resolved: number;
    average_response_hours: number;
    population_benefited: number;
  };
  priority_distribution: {
    name: string;
    level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    count: number;
    color: string;
  }[];
  category_distribution: {
    category: string;
    count: number;
  }[];
  ward_distribution: {
    ward: string;
    count: number;
  }[];
  resolution_trend: {
    date: string;
    resolved: number;
    reported: number;
  }[];
  resource_utilization: {
    budget_used: number;
    budget_available: number;
    budget_pct: number;
    workers_pct: number;
    vehicles_pct: number;
    equipment_pct: number;
  };
  outcomes: {
    critical_resolved_ratio: string;
    average_response_hours: number;
    population_benefited: number;
    budget_utilization_pct: number;
    resource_utilization_pct: number;
  };
  cie_performance: {
    recommendations: number;
    approved: number;
    rejected: number;
    pending: number;
    average_priority_score: number;
    critical_resolved: number;
  };
  research_comparison: {
    metric: string;
    traditional_fcfs: string;
    cie_approach: string;
    improvement: string;
  }[];
}

const DEFAULT_ANALYTICS: AnalyticsDataSet = {
  summary: {
    total_issues: 128,
    critical_issues: 18,
    resolved_issues: 92,
    critical_resolved: 15,
    average_response_hours: 18,
    population_benefited: 12450,
  },
  priority_distribution: [
    { name: 'Critical (80-100)', level: 'CRITICAL', count: 18, color: '#DC2626' },
    { name: 'High (60-79)', level: 'HIGH', count: 34, color: '#EA580C' },
    { name: 'Medium (40-59)', level: 'MEDIUM', count: 46, color: '#D97706' },
    { name: 'Low (0-39)', level: 'LOW', count: 30, color: '#16A34A' },
  ],
  category_distribution: [
    { category: 'Garbage', count: 38 },
    { category: 'Water', count: 25 },
    { category: 'Drainage', count: 21 },
    { category: 'Road', count: 18 },
    { category: 'Streetlight', count: 14 },
    { category: 'Sanitation', count: 12 },
  ],
  ward_distribution: [
    { ward: 'Ward 1', count: 12 },
    { ward: 'Ward 2', count: 17 },
    { ward: 'Ward 3', count: 23 },
    { ward: 'Ward 4', count: 14 },
    { ward: 'Ward 5', count: 28 },
    { ward: 'Ward 6', count: 15 },
    { ward: 'Ward 7', count: 19 },
  ],
  resolution_trend: [
    { date: 'Aug 24', resolved: 8, reported: 12 },
    { date: 'Aug 25', resolved: 11, reported: 14 },
    { date: 'Aug 26', resolved: 14, reported: 10 },
    { date: 'Aug 27', resolved: 16, reported: 15 },
    { date: 'Aug 28', resolved: 19, reported: 13 },
    { date: 'Aug 29', resolved: 24, reported: 18 },
  ],
  resource_utilization: {
    budget_used: 30240,
    budget_available: 42000,
    budget_pct: 72,
    workers_pct: 80,
    vehicles_pct: 67,
    equipment_pct: 61,
  },
  outcomes: {
    critical_resolved_ratio: '15 / 18',
    average_response_hours: 18,
    population_benefited: 12450,
    budget_utilization_pct: 72,
    resource_utilization_pct: 74,
  },
  cie_performance: {
    recommendations: 76,
    approved: 61,
    rejected: 7,
    pending: 8,
    average_priority_score: 74.2,
    critical_resolved: 15,
  },
  research_comparison: [
    {
      metric: 'Critical issues resolved',
      traditional_fcfs: '8 / 18 (44%)',
      cie_approach: '15 / 18 (83%)',
      improvement: '+39% critical closure',
    },
    {
      metric: 'Population benefited',
      traditional_fcfs: '6,200 citizens',
      cie_approach: '12,450 citizens',
      improvement: '2.0x higher reach',
    },
    {
      metric: 'Resource utilization',
      traditional_fcfs: '52% (Bottlenecks & idle fleet)',
      cie_approach: '74% (Balanced assignment)',
      improvement: '+22% efficiency',
    },
    {
      metric: 'Average response time',
      traditional_fcfs: '38 hrs (Queue backlog)',
      cie_approach: '18 hrs (Rapid prioritization)',
      improvement: '-52% delay reduction',
    },
    {
      metric: 'Budget expenditure',
      traditional_fcfs: '₹38,000 (Reactive overtime)',
      cie_approach: '₹30,240 (Batch optimized)',
      improvement: '20% cost savings',
    },
    {
      metric: 'Critical issues remaining',
      traditional_fcfs: '10 unattended hazards',
      cie_approach: '3 in active execution',
      improvement: '70% hazard reduction',
    },
  ],
};

export const analyticsService = {
  /**
   * Conceptually retrieves municipal performance and analytics datasets.
   * Returns synthetic/demo data prepared for FastAPI integration.
   */
  async getAnalytics(filters?: AnalyticsFilters): Promise<AnalyticsDataSet> {
    // Clone default
    const data = JSON.parse(JSON.stringify(DEFAULT_ANALYTICS)) as AnalyticsDataSet;

    if (filters) {
      if (filters.ward && filters.ward !== 'ALL') {
        data.summary.total_issues = Math.round(data.summary.total_issues / 7);
        data.summary.critical_issues = Math.round(data.summary.critical_issues / 7);
        data.summary.resolved_issues = Math.round(data.summary.resolved_issues / 7);
        data.summary.population_benefited = Math.round(data.summary.population_benefited / 7);
      }
      if (filters.priority && filters.priority !== 'ALL') {
        const item = data.priority_distribution.find(p => p.level === filters.priority);
        if (item) {
          data.summary.total_issues = item.count;
        }
      }
    }

    return data;
  },
};
