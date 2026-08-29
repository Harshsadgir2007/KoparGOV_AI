import React, { useState } from 'react';
import { Menu, Search, ShieldAlert, Sparkles, User, ExternalLink, Bell, ChevronDown, RotateCcw, Building2 } from 'lucide-react';
import { useCivic } from '../../context/CivicContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { issueService } from '../../services/issueService';
import { recommendationService } from '../../services/recommendationService';
import { assignmentService } from '../../services/assignmentService';
import { citizenService } from '../../services/citizenService';
import { useNavigate, Link, useLocation } from 'react-router-dom';

interface OfficerTopbarProps {
  onToggleSidebar: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const OfficerTopbar: React.FC<OfficerTopbarProps> = ({
  onToggleSidebar,
  searchQuery = '',
  onSearchChange,
}) => {
  const { issues, refreshData } = useCivic();
  const { user, switchRole } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const pendingApprovals = issues.filter(i => i.status === 'PRIORITIZED');

  const todayFormatted = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date());

  const handleResetDemo = async () => {
    await issueService.resetDemo();
    await recommendationService.resetDemo();
    await assignmentService.resetDemo();
    await citizenService.resetDemo();
    await refreshData();
    showToast('info', 'Demo State Reset', 'Restored ISS-1024 to PENDING state and refreshed all datasets.');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-2.5 shadow-2xs">
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        {/* Left Section: Mobile Menu + Branding & CIE Pill */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <span className="font-black text-sm text-slate-900 tracking-tight block lg:hidden">
              KoparGov AI
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>CIE Engine Active</span>
            </span>
            <span className="hidden md:inline text-xs text-slate-400 font-medium">
              {todayFormatted}
            </span>
          </div>
        </div>

        {/* Center: Quick Global Search Field */}
        <div className="flex-1 max-w-md mx-1 sm:mx-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search issues, teams, wards (e.g. ISS-1024)..."
              value={searchQuery}
              onChange={e => {
                if (onSearchChange) onSearchChange(e.target.value);
                else navigate(`/issues?q=${encodeURIComponent(e.target.value)}`);
              }}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-sky-600 focus:ring-1 focus:ring-sky-600 transition-all font-medium"
            />
          </div>
        </div>

        {/* Right Actions: Reset Demo, Alerts, Citizen View, & Officer Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Unobtrusive Reset Demo Button */}
          <button
            onClick={handleResetDemo}
            title="Reset demo data to initial state"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100/80 hover:bg-slate-200 rounded-xl border border-slate-200 transition-all cursor-pointer shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">Reset Demo</span>
          </button>

          {/* Notifications Bell with Popover */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors relative cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4.5 h-4.5" />
              {pendingApprovals.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-600 ring-2 ring-white" />
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-3.5 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs font-bold text-slate-800">
                  <span>Municipal Alerts</span>
                  <span className="text-[10px] text-sky-800 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                    {pendingApprovals.length} Pending Approvals
                  </span>
                </div>
                <div className="py-2 space-y-1.5 max-h-52 overflow-y-auto text-xs">
                  {pendingApprovals.length === 0 ? (
                    <p className="text-center text-slate-400 py-4 text-[11px]">All recommendations cleared</p>
                  ) : (
                    pendingApprovals.map(i => (
                      <Link
                        key={i.id}
                        to={`/recommendations/${i.id}`}
                        onClick={() => setNotificationsOpen(false)}
                        className="block p-2 rounded-xl hover:bg-slate-50 border border-slate-100 text-left transition-colors"
                      >
                        <div className="flex justify-between font-bold text-slate-900 text-[11px]">
                          <span>{i.id}</span>
                          <span className="text-red-700 font-mono">{i.priority_score} CRITICAL</span>
                        </div>
                        <p className="text-[11px] text-slate-600 truncate mt-0.5">{i.title}</p>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Citizen Portal Shortcut */}
          <Link
            to="/citizen"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 rounded-xl transition-colors border border-sky-200 shadow-2xs"
          >
            <span>Citizen View</span>
            <ExternalLink className="w-3 h-3 text-sky-600" />
          </Link>

          {/* Officer Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="hidden md:inline text-xs font-bold text-slate-800 max-w-[110px] truncate">
                {user.name.split(' ')[1] || user.name}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 hidden md:inline" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-3.5 z-50 animate-in fade-in zoom-in-95 text-xs">
                <div className="pb-2.5 border-b border-slate-100">
                  <p className="font-bold text-slate-900">{user.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user.designation}</p>
                </div>
                <div className="pt-2 space-y-1">
                  <button
                    onClick={() => {
                      switchRole();
                      setProfileOpen(false);
                    }}
                    className="w-full text-left py-2 px-2.5 rounded-lg hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer transition-colors"
                  >
                    Switch to Citizen Mode
                  </button>
                  <Link
                    to="/login"
                    onClick={() => setProfileOpen(false)}
                    className="block py-2 px-2.5 rounded-lg hover:bg-slate-50 text-slate-700 font-semibold transition-colors"
                  >
                    Account Switcher
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
