import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertCircle,
  Sparkles,
  Truck,
  MapPin,
  BarChart3,
  Sliders,
  RotateCcw,
  Users,
  Building2,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { useCivic } from '../../context/CivicContext';
import { useAuth } from '../../context/AuthContext';

export const OfficerSidebar: React.FC<{ isOpen?: boolean; onClose?: () => void }> = ({
  isOpen = true,
  onClose
}) => {
  const { issues, resetToDefaults } = useCivic();
  const { user, switchRole } = useAuth();

  const criticalCount = issues.filter(i => i.priority_level === 'CRITICAL' && i.status !== 'RESOLVED').length;
  const pendingRecsCount = issues.filter(i => i.status === 'PRIORITIZED').length;

  const navigation = [
    {
      name: 'Operations Overview',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Civic Issues',
      href: '/issues',
      icon: AlertCircle,
      badge: criticalCount > 0 ? `${criticalCount} Critical` : undefined,
      badgeColor: 'bg-red-500/20 text-red-300 border border-red-500/30',
      activeBadgeColor: 'bg-red-100 text-red-800',
    },
    {
      name: 'CIE Recommendations',
      href: '/recommendations',
      icon: Sparkles,
      badge: pendingRecsCount > 0 ? `${pendingRecsCount} Pending` : undefined,
      badgeColor: 'bg-sky-500/20 text-sky-300 border border-sky-400/30',
      activeBadgeColor: 'bg-white text-sky-900',
    },
    {
      name: 'What-If Simulator',
      href: '/scenario',
      icon: Sliders,
      badge: 'CIE Lab',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
      activeBadgeColor: 'bg-indigo-100 text-indigo-900',
    },
    {
      name: 'Resource Assignments',
      href: '/assignments',
      icon: Truck,
    },
    {
      name: 'Kopargaon GIS Map',
      href: '/map',
      icon: MapPin,
    },
    {
      name: 'Civic Analytics',
      href: '/analytics',
      icon: BarChart3,
    },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-transform duration-200 lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
      aria-label="Officer Sidebar Navigation"
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 py-4.5 border-b border-slate-800 bg-slate-950/70">
        <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-md shrink-0">
          <Building2 className="w-5.5 h-5.5" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-base tracking-tight text-white">KoparGov</span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold border border-sky-400/30">
              AI CIE
            </span>
          </div>
          <p className="text-[11px] text-slate-400 truncate leading-tight mt-0.5">
            Kopargaon Municipal Council
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3.5 py-4 space-y-1.5 overflow-y-auto" role="navigation">
        <div className="px-2.5 pb-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Municipal Management
          </p>
        </div>

        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-sky-600 text-white shadow-sm ring-1 ring-sky-400/50'
                  : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-2.5 min-w-0">
                  <item.icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} aria-hidden="true" />
                  <span className="whitespace-nowrap truncate">{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
                      isActive ? item.activeBadgeColor : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* Public Citizen Portal Quick Switch */}
        <div className="pt-5 px-2.5 pb-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Citizen Interfaces
          </p>
        </div>
        <NavLink
          to="/citizen"
          onClick={onClose}
          className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Users className="w-4.5 h-4.5 text-slate-400" />
            <span className="whitespace-nowrap">Citizen Portal</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 opacity-60" />
        </NavLink>
      </nav>

      {/* Officer Profile & Reset Action */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-950/50 space-y-2.5">
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-800/60 border border-slate-700/50">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-200 font-bold text-xs shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-100 truncate">{user.name}</p>
            <p className="text-[10px] text-slate-400 truncate">{user.designation || 'Municipal Officer'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={switchRole}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            title="Switch between Officer and Citizen views"
          >
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span>Switch Role</span>
          </button>
          <button
            onClick={resetToDefaults}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            title="Reset to initial pristine demonstration dataset"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset Data</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
