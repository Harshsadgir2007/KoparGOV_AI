import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Building2, ShieldCheck, User, ArrowRight, Sparkles, Check } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginAsOfficer, loginAsCitizen } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<'OFFICER' | 'CITIZEN'>('OFFICER');
  const [officerName, setOfficerName] = useState('Shri. Rajesh Kulkarni');
  const [designation, setDesignation] = useState('Chief Municipal Officer (CMO)');
  const [citizenName, setCitizenName] = useState('Anand Patil');
  const [citizenPhone, setCitizenPhone] = useState('+91 98220 44112');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'OFFICER') {
      loginAsOfficer(officerName, designation);
      navigate('/dashboard');
    } else {
      loginAsCitizen(citizenName, citizenPhone);
      navigate('/citizen');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-sky-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-sky-600/30">
          <Building2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white">
          KoparGov AI
        </h1>
        <p className="text-xs text-slate-400">
          Civic Decision-Support Platform • Kopargaon Municipal Council
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-200 text-xs">
          {/* Role Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setRole('OFFICER')}
              className={`py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                role === 'OFFICER'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Municipal Officer</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('CITIZEN')}
              className={`py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                role === 'CITIZEN'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Citizen Portal</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {role === 'OFFICER' ? (
              <>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Officer Name
                  </label>
                  <input
                    type="text"
                    required
                    value={officerName}
                    onChange={e => setOfficerName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Designation / Department
                  </label>
                  <select
                    value={designation}
                    onChange={e => setDesignation(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                  >
                    <option value="Chief Municipal Officer (CMO)">Chief Municipal Officer (CMO)</option>
                    <option value="Executive Engineer (Civil & Works)">Executive Engineer (Civil & Works)</option>
                    <option value="Chief Sanitation Officer">Chief Sanitation Officer</option>
                    <option value="Water Supply Superintendent">Water Supply Superintendent</option>
                    <option value="Ward 5 Administrative Officer">Ward 5 Administrative Officer</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Citizen Name
                  </label>
                  <input
                    type="text"
                    required
                    value={citizenName}
                    onChange={e => setCitizenName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Mobile Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={citizenPhone}
                    onChange={e => setCitizenPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                  />
                </div>
              </>
            )}

            <div className="p-3 rounded-lg bg-sky-50 border border-sky-200 text-sky-900 text-[11px] leading-relaxed">
              <strong className="font-bold">Hackathon Demo Access: </strong>
              One-click preset authorization is enabled for instant testing of all CIE recommendation and assignment flows.
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer text-xs"
            >
              <span>ENTER {role === 'OFFICER' ? 'OFFICER DASHBOARD' : 'CITIZEN PORTAL'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
