import React, { useState, useEffect } from 'react';
import { citizenService } from '../../services/citizenService';
import { CitizenProfile, CitizenIdentityMode } from '../../types';
import { useToast } from '../../context/ToastContext';
import {
  User,
  ShieldCheck,
  EyeOff,
  Trophy,
  Phone,
  MapPin,
  Save,
  CheckCircle2,
  Info,
  Sliders,
  Sparkles,
} from 'lucide-react';

export const CitizenProfilePage: React.FC = () => {
  const { showToast } = useToast();
  const [profile, setProfile] = useState<CitizenProfile | null>(null);
  const [identityMode, setIdentityMode] = useState<CitizenIdentityMode>('ANONYMOUS');
  const [leaderboardEnabled, setLeaderboardEnabled] = useState(false);
  const [alias, setAlias] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const p = await citizenService.getProfile();
      setProfile(p);
      setIdentityMode(p.identity_mode || 'ANONYMOUS');
      setLeaderboardEnabled(p.leaderboard_enabled || false);
      setAlias(p.alias || 'CivicChampion');
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (identityMode === 'ANONYMOUS' && leaderboardEnabled && !alias.trim()) {
      showToast('error', 'Alias Required', 'Please enter a public alias to appear on the leaderboard.');
      return;
    }

    setIsSaving(true);
    await citizenService.updateProfile({
      identity_mode: identityMode,
      leaderboard_enabled: leaderboardEnabled,
      alias: alias.trim() || 'CivicChampion',
    });
    setIsSaving(false);
    showToast('success', 'Preferences Saved', 'Your civic identity and privacy settings have been updated.');
  };

  if (!profile) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Citizen Profile & Privacy
          </h1>
          <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 font-bold border border-sky-200">
            SETTINGS
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
          Manage how your identity appears across civic complaints and community leaderboards.
        </p>
      </div>

      {/* Account Info Card (Internal Municipal Records) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
          <User className="w-4 h-4 text-slate-600" />
          <span>Registered Citizen Details</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Real Name</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">{profile.real_name}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Phone Number</span>
            <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">{profile.phone}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 sm:col-span-2">
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Primary Ward & Address</span>
            <span className="font-semibold text-slate-800 mt-0.5 block">{profile.ward} • {profile.address}</span>
          </div>
        </div>
      </div>

      {/* Identity & Privacy Form */}
      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        <div>
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4.5 h-4.5 text-sky-600" />
            <span>Identity & Privacy Controls</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Configure complaint visibility and public leaderboard representation.
          </p>
        </div>

        {/* 1. Complaint Identity Choice */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-900 block">
            Default Complaint Identity
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Anonymous */}
            <div
              onClick={() => setIdentityMode('ANONYMOUS')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                identityMode === 'ANONYMOUS'
                  ? 'bg-sky-50/70 border-sky-600 ring-2 ring-sky-600 text-slate-900 shadow-2xs'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <input
                type="radio"
                id="profile-anon"
                name="profileIdentityMode"
                checked={identityMode === 'ANONYMOUS'}
                onChange={() => setIdentityMode('ANONYMOUS')}
                className="w-4 h-4 mt-0.5 text-sky-600 focus:ring-sky-500"
              />
              <div>
                <label htmlFor="profile-anon" className="text-xs font-bold text-slate-900 block cursor-pointer flex items-center gap-1.5">
                  <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                  <span>Report anonymously</span>
                </label>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                  Your real name will not be displayed publicly on reports.
                </p>
              </div>
            </div>

            {/* Public */}
            <div
              onClick={() => setIdentityMode('PUBLIC')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                identityMode === 'PUBLIC'
                  ? 'bg-sky-50/70 border-sky-600 ring-2 ring-sky-600 text-slate-900 shadow-2xs'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <input
                type="radio"
                id="profile-public"
                name="profileIdentityMode"
                checked={identityMode === 'PUBLIC'}
                onChange={() => setIdentityMode('PUBLIC')}
                className="w-4 h-4 mt-0.5 text-sky-600 focus:ring-sky-500"
              />
              <div>
                <label htmlFor="profile-public" className="text-xs font-bold text-slate-900 block cursor-pointer flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-sky-700" />
                  <span>Show my name</span>
                </label>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                  Displays your real name ({profile.real_name}) with civic reports.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Civic Leaderboard Toggle */}
        <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 pr-4">
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-900">
                  Participate in Civic Leaderboard
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Display your contribution score on the community ranking board.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={leaderboardEnabled}
                onChange={e => setLeaderboardEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
            </label>
          </div>

          {/* Conditional Alias Input (Only when Anonymous + Leaderboard ON) */}
          {identityMode === 'ANONYMOUS' && leaderboardEnabled && (
            <div className="pt-3 mt-2 border-t border-slate-200/80 space-y-1.5 animate-in fade-in">
              <label className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
                <span>Public Leaderboard Alias</span>
                <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={alias}
                onChange={e => setAlias(e.target.value)}
                placeholder="e.g. CivicChampion"
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 font-bold placeholder:text-slate-400 focus:ring-1 focus:ring-sky-600"
              />
              <p className="text-[11px] text-slate-500">
                Your real name will remain completely private. Only this alias will appear on the public leaderboard.
              </p>
            </div>
          )}

          {identityMode === 'PUBLIC' && leaderboardEnabled && (
            <div className="pt-2 text-[11px] text-sky-800 bg-sky-50 p-2.5 rounded-lg border border-sky-200">
              <span>Leaderboard will display your real name: <strong>{profile.real_name}</strong></span>
            </div>
          )}
        </div>

        {/* Privacy Note */}
        <div className="flex items-start gap-2 p-3 bg-sky-50/50 rounded-xl border border-sky-200/60 text-[11px] text-slate-600">
          <Info className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
          <p>
            <strong>Your choice controls what other citizens can see. Anonymous reports never reveal your real name.</strong>
          </p>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-3.5 px-6 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-xl text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving Changes...' : 'Save Privacy Preferences'}</span>
        </button>
      </form>
    </div>
  );
};
