import React, { useState, useMemo, useEffect } from 'react';
import { mapService, MapFilters } from '../../services/mapService';
import { KopargaonMap } from '../../components/map/KopargaonMap';
import { CivicIssue } from '../../types';
import { KOPARGAON_WARDS } from '../../data/mockData';
import {
  MapPin,
  Search,
  Filter,
  RotateCcw,
  Sparkles,
  Info,
  Layers,
  Truck,
  Eye,
  SlidersHorizontal,
  X,
} from 'lucide-react';

export const MapPage: React.FC = () => {
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [wardFilter, setWardFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showResources, setShowResources] = useState(false);

  // Mobile Filter Drawer Toggle
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Map View Center & Zoom
  const defaultCenter: [number, number] = [19.8917, 74.4789];
  const [mapCenter, setMapCenter] = useState<[number, number]>(defaultCenter);
  const [mapZoom, setMapZoom] = useState(14);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const list = await mapService.getMapIssues();
      setIssues(list);
      setLoading(false);
    }
    loadData();
  }, []);

  const categories = useMemo(() => Array.from(new Set(issues.map(i => i.category))), [issues]);

  // Filtered Issues list
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      if (wardFilter !== 'ALL' && issue.ward_number.toString() !== wardFilter && !issue.ward.includes(wardFilter)) return false;
      if (categoryFilter !== 'ALL' && issue.category !== categoryFilter) return false;
      if (priorityFilter !== 'ALL' && issue.priority_level !== priorityFilter) return false;
      if (statusFilter !== 'ALL' && issue.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          issue.id.toLowerCase().includes(q) ||
          issue.title.toLowerCase().includes(q) ||
          issue.ward.toLowerCase().includes(q) ||
          issue.category.toLowerCase().includes(q) ||
          issue.address.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [issues, search, wardFilter, categoryFilter, priorityFilter, statusFilter]);

  // Summary counts based on visible filtered issues
  const stats = useMemo(() => mapService.calculateMapStats(filteredIssues), [filteredIssues]);

  const handleWardChange = (wardVal: string) => {
    setWardFilter(wardVal);
    if (wardVal !== 'ALL') {
      const ward = KOPARGAON_WARDS.find(w => w.id.toString() === wardVal);
      if (ward) {
        setMapCenter([ward.lat, ward.lng]);
        setMapZoom(15);
      }
    } else {
      setMapCenter(defaultCenter);
      setMapZoom(14);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setWardFilter('ALL');
    setCategoryFilter('ALL');
    setPriorityFilter('ALL');
    setStatusFilter('ALL');
    setShowResources(false);
    setMapCenter(defaultCenter);
    setMapZoom(14);
  };

  const isFiltered =
    search ||
    wardFilter !== 'ALL' ||
    categoryFilter !== 'ALL' ||
    priorityFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    showResources;

  return (
    <div className="space-y-4">
      {/* 1. Page Header */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Civic GIS Map
            </h1>
            <span className="text-xs font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              Spatial Decision Support
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
            Explore civic issues geographically and identify priority areas across Kopargaon.
          </p>
        </div>

        {/* Small info indicator */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500 flex items-center gap-1.5 font-medium">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Data shown is based on available civic issue reports.</span>
          </div>

          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="lg:hidden p-2 rounded-lg bg-slate-100 border border-slate-300 text-slate-700 flex items-center gap-1 text-xs font-bold"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* 2. Main GIS Layout (Sidebar Filters + Large Map) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN: FILTERS + LEGEND + MAP SUMMARY (4 COLS on lg, drawer on mobile) */}
        <div
          className={`lg:col-span-4 space-y-4 ${
            mobileFilterOpen
              ? 'fixed inset-y-0 left-0 z-50 w-80 bg-white p-5 overflow-y-auto shadow-2xl border-r border-slate-200 block'
              : 'hidden lg:block'
          }`}
        >
          {/* Mobile Drawer Header */}
          {mobileFilterOpen && (
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 lg:hidden">
              <span className="font-bold text-sm text-slate-900">GIS Filter Controls</span>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 rounded-md text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* 6. Filter Panel */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-sky-600" />
                <span>Spatial Filters</span>
              </h2>
              {isFiltered && (
                <button
                  onClick={handleResetFilters}
                  className="text-[11px] text-sky-700 hover:text-sky-800 font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* 7. Search */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Search Issues</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search issues, wards, category..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Ward Filter */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Ward Jurisdiction</label>
              <select
                value={wardFilter}
                onChange={e => handleWardChange(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium"
              >
                <option value="ALL">All Kopargaon Wards</option>
                {KOPARGAON_WARDS.map(w => (
                  <option key={w.id} value={w.id.toString()}>
                    Ward {w.id} — {w.name.split(' - ')[1] || ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium"
              >
                <option value="ALL">All Categories</option>
                {categories.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">CIE Priority Level</label>
              <select
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium"
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">🔴 Critical (80–100)</option>
                <option value="HIGH">🟠 High (60–79)</option>
                <option value="MEDIUM">🟡 Medium (40–59)</option>
                <option value="LOW">🟢 Low (0–39)</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Lifecycle Status</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium"
              >
                <option value="ALL">All Statuses</option>
                <option value="PRIORITIZED">CIE Prioritized (Pending)</option>
                <option value="APPROVED">Officer Approved</option>
                <option value="ASSIGNED">Team Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>

            {/* 12. Resource Layer Toggle (Optional) */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-purple-700" />
                <span>Show Municipal Fleet / Teams</span>
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showResources}
                  onChange={e => setShowResources(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>

          {/* 9. Map Summary Panel */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-slate-900 text-xs">
              Visible Issues Summary
            </h3>

            <div className="space-y-1.5">
              <div className="flex justify-between p-1.5 rounded bg-red-50 text-red-900 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-600" />
                  <span>Critical (80–100)</span>
                </span>
                <strong className="font-mono">{stats.critical}</strong>
              </div>

              <div className="flex justify-between p-1.5 rounded bg-orange-50 text-orange-900 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  <span>High (60–79)</span>
                </span>
                <strong className="font-mono">{stats.high}</strong>
              </div>

              <div className="flex justify-between p-1.5 rounded bg-amber-50 text-amber-900 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Medium (40–59)</span>
                </span>
                <strong className="font-mono">{stats.medium}</strong>
              </div>

              <div className="flex justify-between p-1.5 rounded bg-emerald-50 text-emerald-900 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span>Low (0–39)</span>
                </span>
                <strong className="font-mono">{stats.low}</strong>
              </div>

              <div className="flex justify-between p-2 rounded bg-slate-100 text-slate-900 font-bold border-t border-slate-200 mt-2">
                <span>Total Visible on Map:</span>
                <span className="font-mono">{stats.total}</span>
              </div>
            </div>
          </div>

          {/* 8. Priority Legend Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2.5 text-[11px]">
            <h3 className="font-bold uppercase tracking-wider text-slate-800 text-[10px]">
              Priority Marker Legend
            </h3>
            <div className="grid grid-cols-2 gap-2 text-slate-700">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-red-600 shrink-0 border border-white shadow-xs" />
                <span>🔴 Critical (80–100)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-orange-500 shrink-0 border border-white shadow-xs" />
                <span>🟠 High (60–79)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500 shrink-0 border border-white shadow-xs" />
                <span>🟡 Medium (40–59)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shrink-0 border border-white shadow-xs" />
                <span>🟢 Low (0–39)</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LARGE LEAFLET MAP (8 COLS) */}
        <div className="lg:col-span-8 relative min-h-[620px]">
          <KopargaonMap
            issues={filteredIssues}
            height="660px"
            center={mapCenter}
            zoom={mapZoom}
            showResources={showResources}
          />

          {/* Empty State Overlay if 0 matches */}
          {filteredIssues.length === 0 && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-10 rounded-xl space-y-3">
              <MapPin className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No issues found</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                No civic issues match your current filter selections. Try adjusting the search query, category, or priority.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-sm cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
