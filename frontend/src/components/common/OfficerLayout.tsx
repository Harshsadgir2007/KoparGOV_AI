import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { OfficerSidebar } from './OfficerSidebar';
import { OfficerTopbar } from './OfficerTopbar';

export const OfficerLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
