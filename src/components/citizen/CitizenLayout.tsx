import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  PlusCircle,
  FileText,
  Bell,
  Home,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  X,
  User,
  RotateCcw,
  Trophy,
  Sliders,
} from 'lucide-react';
import { citizenService, CitizenNotification } from '../../services/citizenService';
import { issueService } from '../../services/issueService';
import { recommendationService } from '../../services/recommendationService';
import { assignmentService } from '../../services/assignmentService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const CitizenLayout: React.FC = () => {
  const { user, switchRole } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<CitizenNotification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const list = await citizenService.getNotifications();
      setNotifications(list);
    }
    load();

    const handleStateUpdate = () => {
      load();
    };
    window.addEventListener('kopargov_state_updated', handleStateUpdate);
    return () => window.removeEventListener('kopargov_state_updated', handleStateUpdate);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkRead = async (id: string) => {
    await citizenService.markNotificationRead(id);
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleResetDemo = async () => {
    await issueService.resetDemo();
    await recommendationService.resetDemo();
    await assignmentService.resetDemo();
    await citizenService.resetDemo();
    showToast('info', 'Demo State Reset', 'Restored ISS-1024 to PENDING state and refreshed complaint feeds.');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-16 sm:pb-0">
      {/* Top Citizen Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link to="/citizen" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-xs">
              <Building2 className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm sm:text-base tracking-tight whitespace-nowrap">
                  KoparGov AI
                </span>
                <span className="text-[10px] bg-sky-500/20 text-sky-300 font-bold px-1.5 py-0.2 rounded border border-sky-400/30">
                  Citizen
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-none hidden md:block mt-0.5 whitespace-nowrap">
                Kopargaon Municipal Public Services
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden sm:flex items-center gap-1.5 md:gap-2 text-xs font-semibold shrink-0">
            <NavLink
              to="/citizen"
              end
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  isActive ? 'bg-slate-800 text-white font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              Home
            </NavLink>

            <NavLink
              to="/citizen/report"
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap shadow-xs ${
                  isActive
                    ? 'bg-sky-600 text-white ring-1 ring-sky-400'
                    : 'bg-sky-700 hover:bg-sky-600 text-white'
                }`
              }
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Report Issue</span>
            </NavLink>

            <NavLink
              to="/citizen/issues"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  isActive ? 'bg-slate-800 text-white font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              My Complaints
            </NavLink>

            <NavLink
              to="/citizen/leaderboard"
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  isActive ? 'bg-slate-800 text-amber-300 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Leaderboard</span>
            </NavLink>

            <NavLink
              to="/citizen/profile"
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  isActive ? 'bg-slate-800 text-white font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Privacy</span>
            </NavLink>

            {/* Notifications Button */}
            <button
              onClick={() => setNotifOpen(true)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 relative cursor-pointer ml-1"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>

            {/* Reset Demo */}
            <button
              onClick={handleResetDemo}
              title="Reset demo data"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Reset Demo"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-slate-700 mx-1" />

            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-lg text-[11px] font-bold hover:bg-slate-800 whitespace-nowrap transition-colors"
            >
              <span>Officer Portal</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </nav>

          {/* Mobile Right Icons */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={handleResetDemo}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              title="Reset Demo"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setNotifOpen(true)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white relative"
              aria-label="Notifications"
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
              )}
            </button>
            <Link
              to="/dashboard"
              className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded font-bold"
            >
              Officer &rarr;
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar (Mobile-first UX) */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-30 px-2 py-1 flex items-center justify-around text-[10px] font-bold shadow-lg">
        <NavLink
          to="/citizen"
          end
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 p-1 ${
              isActive ? 'text-sky-700 font-black' : 'text-slate-500'
            }`
          }
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/citizen/report"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 p-1 text-sky-700 font-black`
          }
        >
          <div className="w-7 h-7 -mt-3 rounded-full bg-sky-700 text-white flex items-center justify-center shadow-md">
            <PlusCircle className="w-4 h-4" />
          </div>
          <span>Report</span>
        </NavLink>

        <NavLink
          to="/citizen/issues"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 p-1 ${
              isActive ? 'text-sky-700 font-black' : 'text-slate-500'
            }`
          }
        >
          <FileText className="w-4 h-4" />
          <span>Complaints</span>
        </NavLink>

        <NavLink
          to="/citizen/leaderboard"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 p-1 ${
              isActive ? 'text-amber-600 font-black' : 'text-slate-500'
            }`
          }
        >
          <Trophy className="w-4 h-4" />
          <span>Ranks</span>
        </NavLink>

        <NavLink
          to="/citizen/profile"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 p-1 ${
              isActive ? 'text-sky-700 font-black' : 'text-slate-500'
            }`
          }
        >
          <Sliders className="w-4 h-4" />
          <span>Privacy</span>
        </NavLink>
      </nav>

      {/* Notification Drawer / Modal */}
      {notifOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-sky-700" />
                <h3 className="font-bold text-slate-900 text-sm">Citizen Notifications</h3>
              </div>
              <button
                onClick={() => setNotifOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
              {notifications.length === 0 ? (
                <p className="text-center text-slate-400 py-6">No notifications yet.</p>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => {
                      handleMarkRead(n.id);
                      setNotifOpen(false);
                      navigate(`/citizen/issues/${n.issue_id}`);
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      n.read
                        ? 'bg-slate-50 border-slate-200 opacity-80'
                        : 'bg-sky-50/70 border-sky-300 ring-1 ring-sky-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900 text-xs mb-1">
                      <span>{n.title}</span>
                      <span className="text-[10px] font-mono text-slate-500 font-normal">
                        {new Date(n.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-700 leading-normal">{n.message}</p>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setNotifOpen(false)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
