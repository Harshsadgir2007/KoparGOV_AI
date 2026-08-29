import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, OFFICER_PRESETS } from '../../context/AuthContext';
import { AuthorityRole } from '../../types';
import {
  Building2,
  ShieldCheck,
  User,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
  UserCheck,
  FileCheck,
  Layers,
  MapPin,
  Phone,
  UserPlus,
  LogIn,
  KeyRound,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginAsSpecificOfficer, loginCitizen, registerCitizen } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<'OFFICER' | 'CITIZEN'>('OFFICER');
  const [citizenMode, setCitizenMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Citizen Form State
  const [citizenName, setCitizenName] = useState('');
  const [citizenPhone, setCitizenPhone] = useState('+91 98220 44112');
  const [citizenWard, setCitizenWard] = useState('Ward 5 - Shivaji Chowk');
  const [citizenPassword, setCitizenPassword] = useState('pass123');

  // Officer Form State
  const [selectedRole, setSelectedRole] = useState<AuthorityRole>('CHIEF_OFFICER');
  const [officerPin, setOfficerPin] = useState('1234');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Return destination if redirected from a protected route
  const from = (location.state as any)?.from?.pathname || (activeTab === 'OFFICER' ? '/dashboard' : '/citizen');

  const handleOfficerLogin = (roleKey: AuthorityRole) => {
    loginAsSpecificOfficer(roleKey);
    navigate(from || '/dashboard', { replace: true });
  };

  const handleCitizenLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!citizenPhone.trim()) {
      setErrorMessage('Please enter a valid mobile number.');
      return;
    }
    loginCitizen(citizenPhone);
    navigate('/citizen', { replace: true });
  };

  const handleCitizenRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!citizenName.trim() || !citizenPhone.trim()) {
      setErrorMessage('Please fill in all mandatory fields.');
      return;
    }
    registerCitizen(citizenName, citizenPhone, citizenWard);
    navigate('/citizen', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 text-slate-100 font-sans">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-sky-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-sky-600/30">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            KoparGov AI Portal Authentication
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Role-Based Municipal Governance & Citizen Service Gateway for Kopargaon.
          </p>
        </div>

        {/* Auth Role Selector Tabs */}
        <div className="flex p-1.5 bg-slate-900 rounded-2xl border border-slate-800 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab('OFFICER');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'OFFICER'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Municipal Officer Portal</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('CITIZEN');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'CITIZEN'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Citizen Public Services</span>
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-xl max-w-md mx-auto text-center font-semibold">
            {errorMessage}
          </div>
        )}

        {/* OFFICER TAB */}
        {activeTab === 'OFFICER' && (
          <div className="space-y-4">
            {/* Governance Principle Banner */}
            <div className="p-4 rounded-2xl bg-sky-950/60 border border-sky-800/60 flex items-start gap-3 text-xs text-sky-200">
              <Layers className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white font-bold block mb-0.5">
                  CIE Executive Protection Principle:
                </strong>
                <span>
                  Higher authorities are <strong>never overwhelmed</strong> with raw complaints. Issues must be field-verified and approved by lower officers first before unlocking on higher authorities' action queues.
                </span>
              </div>
            </div>

            {/* 4 Officer Personas Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* TIER 1: Ward In-Charge */}
              <div
                onClick={() => handleOfficerLogin('WARD_INCHARGE')}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/70 hover:bg-slate-850 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Tier 1 • Field Assessment
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">Ward 5</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                      {OFFICER_PRESETS.WARD_INCHARGE.name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {OFFICER_PRESETS.WARD_INCHARGE.designation}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {OFFICER_PRESETS.WARD_INCHARGE.description}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    Sanction: <strong className="text-slate-300 font-mono">₹10,000</strong>
                  </span>
                  <span className="font-bold text-amber-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Sign In (Step 1)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

              {/* TIER 2: Department Head */}
              <div
                onClick={() => handleOfficerLogin('DEPARTMENT_OFFICER')}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/70 hover:bg-slate-850 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      Tier 2 • Departmental Sanction
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">Sanitation Dept</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors">
                      {OFFICER_PRESETS.DEPARTMENT_OFFICER.name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {OFFICER_PRESETS.DEPARTMENT_OFFICER.designation}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {OFFICER_PRESETS.DEPARTMENT_OFFICER.description}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    Sanction: <strong className="text-slate-300 font-mono">₹25,000</strong>
                  </span>
                  <span className="font-bold text-sky-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Sign In (Step 2)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

              {/* TIER 3: Chief Municipal Officer (CMO) */}
              <div
                onClick={() => handleOfficerLogin('CHIEF_OFFICER')}
                className="p-5 rounded-2xl bg-slate-900/90 border-2 border-emerald-500/60 hover:border-emerald-400 hover:bg-slate-850 transition-all cursor-pointer group shadow-md flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Tier 3 • Chief Municipal Executive
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">KMC Head</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {OFFICER_PRESETS.CHIEF_OFFICER.name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {OFFICER_PRESETS.CHIEF_OFFICER.designation}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {OFFICER_PRESETS.CHIEF_OFFICER.description}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    Sanction: <strong className="text-emerald-300 font-mono">Full Municipal Authority</strong>
                  </span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Sign In (Step 3)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

              {/* TIER 4: Tahsildar */}
              <div
                onClick={() => handleOfficerLogin('TAHSILDAR_OR_RELEVANT_AUTHORITY')}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/70 hover:bg-slate-850 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Tier 4 • Taluka Magistrate & Revenue
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">Sub-Division</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                      {OFFICER_PRESETS.TAHSILDAR_OR_RELEVANT_AUTHORITY.name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {OFFICER_PRESETS.TAHSILDAR_OR_RELEVANT_AUTHORITY.designation}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {OFFICER_PRESETS.TAHSILDAR_OR_RELEVANT_AUTHORITY.description}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    Sanction: <strong className="text-slate-300 font-mono">Taluka / Land Scope</strong>
                  </span>
                  <span className="font-bold text-purple-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Sign In (Step 4)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CITIZEN TAB */}
        {activeTab === 'CITIZEN' && (
          <div className="max-w-md mx-auto w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sky-600 text-white">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {citizenMode === 'LOGIN' ? 'Citizen Sign In' : 'Citizen Registration'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Kopargaon Civic Services</p>
                </div>
              </div>

              <div className="flex gap-1 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setCitizenMode('LOGIN')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    citizenMode === 'LOGIN' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setCitizenMode('REGISTER')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    citizenMode === 'REGISTER' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Register
                </button>
              </div>
            </div>

            {citizenMode === 'LOGIN' ? (
              <form onSubmit={handleCitizenLoginSubmit} className="space-y-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Mobile Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={citizenPhone}
                      onChange={e => setCitizenPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium focus:ring-2 focus:ring-sky-500"
                      placeholder="+91 98220 44112"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Password / OTP PIN
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      value={citizenPassword}
                      onChange={e => setCitizenPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium focus:ring-2 focus:ring-sky-500"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">
                  Demo credential helper: Enter <strong>+91 98220 44112</strong> (Rahul Patil, Ward 5).
                </p>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Access Citizen Portal</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleCitizenRegisterSubmit} className="space-y-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={citizenName}
                    onChange={e => setCitizenName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium focus:ring-2 focus:ring-sky-500"
                    placeholder="e.g. Ramesh K. Deshmukh"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="text"
                    value={citizenPhone}
                    onChange={e => setCitizenPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium focus:ring-2 focus:ring-sky-500"
                    placeholder="+91 98..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Select Your Ward *
                  </label>
                  <select
                    value={citizenWard}
                    onChange={e => setCitizenWard(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Ward 1 - Gandhi Chowk">Ward 1 - Gandhi Chowk & Tilak Road</option>
                    <option value="Ward 2 - Station Road">Ward 2 - Station Road & Godavari Colony</option>
                    <option value="Ward 3 - Subhash Road">Ward 3 - Subhash Road & Shani Mandir</option>
                    <option value="Ward 4 - Sai Nagar">Ward 4 - Sai Nagar & Shirdi Highway</option>
                    <option value="Ward 5 - Shivaji Chowk">Ward 5 - Shivaji Chowk & Market Area</option>
                    <option value="Ward 6 - Ambedkar Nagar">Ward 6 - Ambedkar Nagar & Samata Path</option>
                    <option value="Ward 7 - Industrial Area">Ward 7 - Industrial Area & MIDC Bypass</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Citizen Account & Enter</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
