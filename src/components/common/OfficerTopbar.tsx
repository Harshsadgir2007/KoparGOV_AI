import React, { useState } from 'react';
import { Menu, Search, ShieldAlert, Sparkles, User, ExternalLink, Bell, ChevronDown, RotateCcw } from 'lucide-react';
import { useCivic } from '../../context/CivicContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { issueService } from '../../services/issueService';
import { recommendationService } from '../../services/recommendationService';
import { assignmentService } from '../../services/assignmentService';
import { citizenService } from '../../services/citizenService';
import { useNavigate, Link } from 'react-router-dom';

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
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const pendingApprovals = issues.filter(i => i.status === 'PRIORITIZED');

  const todayFormatted = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  const handleResetDemo = async () => {
    await issueService.resetDemo();
    await recommendationService.resetDemo();
    await assignmentService.resetDemo();
    await citizenService.resetDemo();
    await refreshData();
    showToast('info', 'Demo State Reset', 'Restored ISS-1024 to PENDING state and reset all mock assignments.');
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 shadow-2xs">
      <div className="flex items-center justify-between gap-4">
        {/* Left Section: Mobile Menu + Branding info */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900 tracking-tight">KoparGov AI</span>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              <Sparkles className="w-3 h-3 text-sky-600" />
              <span>CIE ACTIVE</span>
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {todayFormatted}
            </span>
          </div>
        </div>

        {/* Center: Search Field */}
        <div className="flex-1 max-w-md mx-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search issues, categories, wards (e.g. ISS-1024, Ward 5)..."
              value={searchQuery}
              onChange={e => {
                if (onSearchChange) onSearchChange(e.target.value);
                else navigate(`/issues?q=${encodeURIComponent(e.target.value)}`);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-500 focus:bg-white focus:border-sky-600 focus:ring-1 focus:ring-sky-600 transition-all"
            />
          </div>
        </div>

        {/* Right Actions: Reset Demo, Notifications, Citizen View, & Officer Profile */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Unobtrusive Reset Demo Button */}
          <button
            onClick={handleResetDemo}
            title="Reset demo data to initial state"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">Reset Demo</span>
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors relative cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4.5 h-4.5" />
              {pendingApprovals.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-600 ring-2 ring-white" />
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs font-bold text-slate-800">
                  <span>Municipal Alerts</span>
                  <span className="text-[10px] text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded">
                    {pendingApprovals.length} Pending
                  </span>
                </div>
                <div className="py-2 space-y-2 max-h-48 overflow-y-auto text-xs">
                  {pendingApprovals.map(i => (
                    <Link
                      key={i.id}
                      to={`/recommendations?issue=${i.id}`}
                      onClick={() => setNotificationsOpen(false)}
                      className="block p-2 rounded-lg hover:bg-slate-50 border border-slate-100 text-left"
                    >
                      <div className="flex justify-between font-bold text-slate-900 text-[11px]">
                        <span>{i.id}</span>
                        <span className="text-red-600">{i.priority_level}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 truncate mt-0.5">{i.title}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Citizen Portal Shortcut */}
          <Link
            to="/citizen"
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-300"
          >
            <span>Citizen View</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </Link>

          {/* Officer Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="hidden md:inline text-xs font-bold text-slate-800 max-w-[120px] truncate">
                {user.name.split(' ')[1] || user.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden md:inline" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 text-xs">
                <div className="pb-2 border-b border-slate-100">
                  <p className="font-bold text-slate-900">{user.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user.designation}</p>
                </div>
                <div className="pt-2 space-y-1">
                  <button
                    onClick={() => {
                      switchRole();
                      setProfileOpen(false);
                    }}
                    className="w-full text-left py-1.5 px-2 rounded hover:bg-slate-50 text-slate-700 font-medium cursor-pointer"
                  >
                    Switch to Citizen Mode
                  </button>
                  <Link
                    to="/login"
                    onClick={() => setProfileOpen(false)}
                    className="block py-1.5 px-2 rounded hover:bg-slate-50 text-slate-700 font-medium"
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
