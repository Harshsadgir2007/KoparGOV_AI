import React, { useState, useEffect } from 'react';
import { analyticsService, AnalyticsFilters, AnalyticsDataSet } from '../../services/analyticsService';
import { useToast } from '../../context/ToastContext';
import { KPICard } from '../../components/common/KPICard';
import { LoadingSkeleton, EmptyState } from '../../components/common/LoadingSkeleton';
import { AnalyticsFilterBar } from '../../components/analytics/AnalyticsFilterBar';
import { AnalyticsCharts } from '../../components/analytics/AnalyticsCharts';
import { ResourceUtilizationSection } from '../../components/analytics/ResourceUtilizationSection';
import { CivicOutcomesSection } from '../../components/analytics/CivicOutcomesSection';
import { CIEPerformanceSection } from '../../components/analytics/CIEPerformanceSection';
import { DecisionComparisonTable } from '../../components/analytics/DecisionComparisonTable';
import {
  BarChart3,
  Clock,
  Users,
  IndianRupee,
  CheckCircle2,
  AlertOctagon,
  Truck,
  Info,
  ShieldCheck,
  Download,
  RotateCcw,
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { showToast } = useToast();
  const [data, setData] = useState<AnalyticsDataSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateRange: 'LAST_30_DAYS',
    ward: 'ALL',
    category: 'ALL',
    priority: 'ALL',
    status: 'ALL',
  });

  const loadData = async (activeFilters = filters) => {
    try {
      setLoading(true);
      setError(null);
      const res = await analyticsService.getAnalytics(activeFilters);
      setData(res);
    } catch (err) {
      setError('Unable to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFilterChange = (key: keyof AnalyticsFilters, value: string) => {
    const nextFilters = { ...filters, [key]: value };
    setFilters(nextFilters);
    loadData(nextFilters);
  };

  const handleReset = () => {
    const defaultFilters: AnalyticsFilters = {
      dateRange: 'LAST_30_DAYS',
      ward: 'ALL',
      category: 'ALL',
      priority: 'ALL',
      status: 'ALL',
    };
    setFilters(defaultFilters);
    loadData(defaultFilters);
  };

  const handleExport = () => {
    showToast('info', 'Report Export', 'Report export will be available when analytics API is connected.');

    // Also download lightweight CSV demo
    if (data) {
      const csvContent =
        'data:text/csv;charset=utf-8,' +
        ['Category,Count'].concat(data.category_distribution.map(c => `${c.category},${c.count}`)).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `kopargov_analytics_summary_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="card" rows={6} />
        <LoadingSkeleton type="table" rows={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-3">
        <AlertOctagon className="w-10 h-10 text-red-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-900">{error}</h2>
        <p className="text-xs text-slate-500">Please verify network connectivity and reload the workspace.</p>
        <button
          onClick={() => loadData()}
          className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-lg text-xs cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Civic Analytics
            </h1>
            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
              Synthetic / Demo Data
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
            Monitor civic outcomes, resolution performance and resource utilization across Kopargaon.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <AnalyticsFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        onExport={handleExport}
      />

      {/* 3. Main KPI Row (6 Key Operational Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard
          title="Total Issues"
          value={data.summary.total_issues}
          subValue="Registered volume"
          icon={AlertOctagon}
          iconColor="text-slate-700"
          iconBg="bg-slate-100"
        />

        <KPICard
          title="Critical Issues"
          value={data.summary.critical_issues}
          subValue="Severity 80-100"
          badge="High Risk"
          badgeType="danger"
          icon={ShieldCheck}
          iconColor="text-red-700"
          iconBg="bg-red-100"
        />

        <KPICard
          title="Resolved Issues"
          value={data.summary.resolved_issues}
          subValue={`${Math.round((data.summary.resolved_issues / data.summary.total_issues) * 100)}% resolution rate`}
          badge="Verified"
          badgeType="success"
          icon={CheckCircle2}
          iconColor="text-emerald-700"
          iconBg="bg-emerald-100"
        />

        <KPICard
          title="Critical Resolved"
          value={data.summary.critical_resolved}
          subValue="Out of 18 critical"
          badge="83% Closure"
          badgeType="success"
          icon={ShieldCheck}
          iconColor="text-red-700"
          iconBg="bg-red-100"
        />

        <KPICard
          title="Avg Response Time"
          value={`${data.summary.average_response_hours} hrs`}
          subValue="CIE priority dispatch"
          badge="Fast"
          badgeType="info"
          icon={Clock}
          iconColor="text-sky-700"
          iconBg="bg-sky-100"
        />

        <KPICard
          title="Population Benefited"
          value={data.summary.population_benefited.toLocaleString('en-IN')}
          subValue="Across 10 wards"
          badge="Direct Reach"
          badgeType="neutral"
          icon={Users}
          iconColor="text-indigo-700"
          iconBg="bg-indigo-100"
        />
      </div>

      {/* 4, 5, 6, 7. Charts Section (Priority, Category, Ward, Trend) */}
      <AnalyticsCharts data={data} />

      {/* 8. Resource Utilization Section */}
      <ResourceUtilizationSection data={data.resource_utilization} />

      {/* 9. Civic Outcome Metrics Section */}
      <CivicOutcomesSection outcomes={data.outcomes} />

      {/* 10. CIE Decision Performance Section */}
      <CIEPerformanceSection data={data.cie_performance} />

      {/* 11. Decision Approach Comparison (Traditional FCFS vs CIE Resource-Aware) */}
      <DecisionComparisonTable comparison={data.research_comparison} />
    </div>
  );
};
