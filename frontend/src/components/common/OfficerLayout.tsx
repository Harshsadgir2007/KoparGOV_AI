import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { OfficerSidebar } from './OfficerSidebar';
import { OfficerTopbar } from './OfficerTopbar';
import { resilienceService } from '../../services/resilienceService';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export const OfficerLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isBlackout, setIsBlackout] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkStatus() {
      try {
        const s = await resilienceService.getStatus();
        setIsBlackout(Boolean(s.is_blackout_active || s.system_mode === 'DEGRADED'));
      } catch (e) {
        // ignore connection failure
      }
    }
    checkStatus();

    const intervalId = setInterval(() => {
      checkStatus();
    }, 3000);

    const handleUpdate = () => checkStatus();
    window.addEventListener('kopargov_resilience_updated', handleUpdate);
    window.addEventListener('kopargov_state_updated', handleUpdate);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('kopargov_resilience_updated', handleUpdate);
      window.removeEventListener('kopargov_state_updated', handleUpdate);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Global Degraded Mode Alert Banner */}
      {isBlackout && (
        <div className="bg-red-600 text-white py-2 px-4 text-xs font-bold flex items-center justify-between z-50 sticky top-0 shadow-md animate-in fade-in">
          <div className="flex items-center gap-2 max-w-4xl">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-300 animate-bounce" />
            <span>
              🚨 PRIMARY STORE UNAVAILABLE — SYSTEM IN DEGRADED RESILIENCE MODE
            </span>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-3 py-1 bg-white text-red-700 hover:bg-red-50 text-[11px] font-black rounded-lg transition-colors cursor-pointer shrink-0"
          >
            Go to Resilience Recovery
          </button>
        </div>
      )}

      {/* Sidebar Navigation */}
      <OfficerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area with offset for lg screens */}
      <div className="lg:pl-72 flex flex-col flex-1 min-w-0">
        <OfficerTopbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
        <footer className="bg-white border-t border-slate-200 py-3 px-6 text-center text-xs text-slate-700">
          KoparGov AI — Civic Decision-Support Platform • Kopargaon Municipal Council (KMC) • Internal Municipal Use Only
        </footer>
      </div>
    </div>
  );
};
