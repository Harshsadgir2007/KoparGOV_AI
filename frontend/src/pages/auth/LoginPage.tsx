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
  Lock,
  UserCheck,
  FileCheck,
  Layers,
  MapPin,
  Phone,
  UserPlus,
  LogIn,
  KeyRound,
  Mail,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const {
    loginAsSpecificOfficer,
    loginOfficerWithCredentials,
    loginCitizen,
    loginCitizenWithCredentials,
    registerCitizen,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<'OFFICER' | 'CITIZEN'>('OFFICER');
  const [citizenMode, setCitizenMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Officer Credentials Form
  const [officerEmail, setOfficerEmail] = useState('chief@kopargaon.demo');
  const [officerPassword, setOfficerPassword] = useState('');
  const [isOfficerAuthenticating, setIsOfficerAuthenticating] = useState(false);

  // Citizen Form State
  const [citizenName, setCitizenName] = useState('');
  const [citizenPhone, setCitizenPhone] = useState('+91 98220 44112');
  const [citizenEmail, setCitizenEmail] = useState('citizen@kopargaon.demo');
  const [citizenWard, setCitizenWard] = useState('Ward 5 - Shivaji Chowk');
  const [citizenPassword, setCitizenPassword] = useState('');
  const [isCitizenAuthenticating, setIsCitizenAuthenticating] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Return destination if redirected from a protected route
  const from = (location.state as any)?.from?.pathname || (activeTab === 'OFFICER' ? '/dashboard' : '/citizen');

  const handleOfficerPresetLogin = (roleKey: AuthorityRole) => {
    loginAsSpecificOfficer(roleKey);
    navigate(from || '/dashboard', { replace: true });
  };

  const handleOfficerCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!officerEmail.trim()) {
      setErrorMessage('Please enter your official municipal email.');
      return;
    }
    if (!officerPassword) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsOfficerAuthenticating(true);
    try {
      const result = await loginOfficerWithCredentials(officerEmail, officerPassword);
      if (result.success) {
        navigate(from || '/dashboard', { replace: true });
      } else {
        setErrorMessage(result.error || 'Authentication failed. Please verify your municipal officer credentials.');
      }
    } finally {
      setIsOfficerAuthenticating(false);
    }
  };

  const handleCitizenLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!citizenPhone.trim() && !citizenEmail.trim()) {
      setErrorMessage('Please enter a valid mobile number or email.');
      return;
    }

    setIsCitizenAuthenticating(true);
    try {
      if (citizenEmail.includes('@')) {
        const result = await loginCitizenWithCredentials(citizenEmail, citizenPassword);
        if (result.success) {
          navigate('/citizen', { replace: true });
        } else {
          setErrorMessage(result.error || 'Citizen authentication failed.');
        }
      } else {
        loginCitizen(citizenPhone);
        navigate('/citizen', { replace: true });
      }
    } finally {
      setIsCitizenAuthenticating(false);
    }
  };

  const handleCitizenRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!citizenName.trim() || !citizenPhone.trim()) {
      setErrorMessage('Please fill in all mandatory fields.');
      return;
    }
    if (citizenEmail && !citizenPassword) {
      setErrorMessage('Please provide a password for your account.');
      return;
    }

    setIsCitizenAuthenticating(true);
    try {
      const result = await registerCitizen(citizenName, citizenPhone, citizenWard, citizenEmail, citizenPassword);
      if (result.success) {
        navigate('/citizen', { replace: true });
      } else {
        setErrorMessage(result.error || 'Registration failed.');
      }
    } finally {
      setIsCitizenAuthenticating(false);
    }
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
            KoparGov AI Secure Authentication Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Role-Based Municipal Officer Registry & Public Citizen Service Gateway for Kopargaon.
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
          <div className="p-4 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-xl max-w-lg mx-auto flex items-center gap-3 font-semibold shadow-lg">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div>{errorMessage}</div>
          </div>
        )}

        {/* OFFICER TAB */}
        {activeTab === 'OFFICER' && (
          <div className="space-y-6">
            {/* Municipal Officer Login Form */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl max-w-md mx-auto space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Pre-Provisioned Officer Login</h2>
                  <p className="text-[11px] text-slate-400">Authenticated via Firebase & Municipal Registry</p>
                </div>
              </div>

              {/* Quick-fill helpers for demo accounts */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Quick Fill Demo Account:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setOfficerEmail('chief@kopargaon.demo');
                      setErrorMessage(null);
                    }}
                    className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg font-mono transition-colors cursor-pointer"
                  >
                    chief@kopargaon.demo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOfficerEmail('sanitation@kopargaon.demo');
                      setErrorMessage(null);
                    }}
                    className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg font-mono transition-colors cursor-pointer"
                  >
                    sanitation@kopargaon.demo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOfficerEmail('officer@kopargaon.demo');
                      setErrorMessage(null);
                    }}
                    className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-300 rounded-lg font-mono transition-colors cursor-pointer"
                  >
                    officer@kopargaon.demo
                  </button>
                </div>
              </div>

              <form onSubmit={handleOfficerCredentialSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Official Municipal Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={officerEmail}
                      onChange={(e) => setOfficerEmail(e.target.value)}
                      placeholder="chief@kopargaon.demo"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Officer Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      value={officerPassword}
                      onChange={(e) => setOfficerPassword(e.target.value)}
                      placeholder="Enter Firebase Password"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isOfficerAuthenticating}
                  className="w-full mt-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isOfficerAuthenticating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Firebase ID Token & Registry...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Sign In with Firebase Credentials</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Quick Demo Presets Divider */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                🧪 1-Click Simulation Shortcuts (Jury Testing)
              </span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* 4 Officer Personas Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* TIER 1: Ward In-Charge */}
              <div
                onClick={() => handleOfficerPresetLogin('WARD_INCHARGE')}
                className="group relative bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                      <UserCheck className="w-3 h-3" />
                      <span>Step 1: Field Auth</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 font-semibold">Ward 5</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                      {OFFICER_PRESETS.WARD_INCHARGE.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">{OFFICER_PRESETS.WARD_INCHARGE.designation}</p>
                    <p className="text-[11px] text-blue-400/80 font-mono mt-0.5">
                      {OFFICER_PRESETS.WARD_INCHARGE.email}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {OFFICER_PRESETS.WARD_INCHARGE.description}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    Sanction: <strong className="text-blue-300 font-mono">Up to ₹10,000</strong>
                  </span>
                  <span className="font-bold text-blue-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>1-Click Sign In (Step 1)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

              {/* TIER 2: Department Officer */}
              <div
                onClick={() => handleOfficerPresetLogin('DEPARTMENT_OFFICER')}
                className="group relative bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                      <FileCheck className="w-3 h-3" />
                      <span>Step 2: Tech Sanction</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 font-semibold">Sanitation Dept</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {OFFICER_PRESETS.DEPARTMENT_OFFICER.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      {OFFICER_PRESETS.DEPARTMENT_OFFICER.designation}
                    </p>
                    <p className="text-[11px] text-emerald-400/80 font-mono mt-0.5">
                      {OFFICER_PRESETS.DEPARTMENT_OFFICER.email}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {OFFICER_PRESETS.DEPARTMENT_OFFICER.description}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    Sanction: <strong className="text-emerald-300 font-mono">Up to ₹25,000</strong>
                  </span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>1-Click Sign In (Step 2)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

              {/* TIER 3: Chief Municipal Officer */}
              <div
                onClick={() => handleOfficerPresetLogin('CHIEF_OFFICER')}
                className="group relative bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10 cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">
                      <Sparkles className="w-3 h-3" />
                      <span>Step 3: Executive Head</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 font-semibold">City-Wide</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                      {OFFICER_PRESETS.CHIEF_OFFICER.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">{OFFICER_PRESETS.CHIEF_OFFICER.designation}</p>
                    <p className="text-[11px] text-amber-400/80 font-mono mt-0.5">
                      {OFFICER_PRESETS.CHIEF_OFFICER.email}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {OFFICER_PRESETS.CHIEF_OFFICER.description}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    Sanction: <strong className="text-amber-300 font-mono">Discretionary Ceiling</strong>
                  </span>
                  <span className="font-bold text-amber-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>1-Click Sign In (Step 3)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

              {/* TIER 4: Tahsildar / SDM */}
              <div
                onClick={() => handleOfficerPresetLogin('TAHSILDAR_OR_RELEVANT_AUTHORITY')}
                className="group relative bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase">
                      <Layers className="w-3 h-3" />
                      <span>Step 4: Taluka Magistrate</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 font-semibold">Taluka Revenue</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                      {OFFICER_PRESETS.TAHSILDAR_OR_RELEVANT_AUTHORITY.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      {OFFICER_PRESETS.TAHSILDAR_OR_RELEVANT_AUTHORITY.designation}
                    </p>
                    <p className="text-[11px] text-purple-400/80 font-mono mt-0.5">
                      {OFFICER_PRESETS.TAHSILDAR_OR_RELEVANT_AUTHORITY.email}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {OFFICER_PRESETS.TAHSILDAR_OR_RELEVANT_AUTHORITY.description}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    Sanction: <strong className="text-purple-300 font-mono">Taluka Jurisdiction</strong>
                  </span>
                  <span className="font-bold text-purple-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>1-Click Sign In (Step 4)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CITIZEN TAB */}
        {activeTab === 'CITIZEN' && (
          <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Mode Switcher: Sign In vs Register */}
            <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setCitizenMode('LOGIN');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  citizenMode === 'LOGIN'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setCitizenMode('REGISTER');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  citizenMode === 'REGISTER'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                New Citizen Registration
              </button>
            </div>

            {/* Quick-fill helper for demo citizen */}
            {citizenMode === 'LOGIN' && (
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Quick Fill Demo Citizen:</span>
                <button
                  type="button"
                  onClick={() => {
                    setCitizenEmail('citizen@kopargaon.demo');
                    setErrorMessage(null);
                  }}
                  className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg font-mono transition-colors cursor-pointer"
                >
                  citizen@kopargaon.demo
                </button>
              </div>
            )}

            {citizenMode === 'LOGIN' ? (
              <form onSubmit={handleCitizenLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Registered Email or Phone
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={citizenEmail}
                      onChange={(e) => setCitizenEmail(e.target.value)}
                      placeholder="citizen@kopargaon.demo or +91 98220 44112"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      value={citizenPassword}
                      onChange={(e) => setCitizenPassword(e.target.value)}
                      placeholder="Enter Firebase Password"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isCitizenAuthenticating}
                  className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-sky-600/30 disabled:opacity-50"
                >
                  {isCitizenAuthenticating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing In with Firebase...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Access Citizen Services</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleCitizenRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={citizenName}
                      onChange={(e) => setCitizenName(e.target.value)}
                      placeholder="e.g. Ramesh Deshmukh"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mobile Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={citizenPhone}
                      onChange={(e) => setCitizenPhone(e.target.value)}
                      placeholder="+91 98220 00000"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={citizenEmail}
                      onChange={(e) => setCitizenEmail(e.target.value)}
                      placeholder="citizen@example.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      value={citizenPassword}
                      onChange={(e) => setCitizenPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Kopargaon Ward Location *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <select
                      value={citizenWard}
                      onChange={(e) => setCitizenWard(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="Ward 1 - Godavari Ghat">Ward 1 - Godavari Ghat</option>
                      <option value="Ward 2 - Station Road">Ward 2 - Station Road</option>
                      <option value="Ward 3 - Subhash Road">Ward 3 - Subhash Road</option>
                      <option value="Ward 4 - Shirdi Highway">Ward 4 - Shirdi Highway</option>
                      <option value="Ward 5 - Shivaji Chowk">Ward 5 - Shivaji Chowk</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isCitizenAuthenticating}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                >
                  {isCitizenAuthenticating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Account in Firebase...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Register Citizen Account</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
