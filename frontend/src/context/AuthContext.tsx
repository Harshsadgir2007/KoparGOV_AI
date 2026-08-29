import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, UserSession, AuthorityRole } from '../types';

export interface OfficerPreset {
  id: AuthorityRole;
  title: string;
  name: string;
  designation: string;
  department: string;
  ward_number?: number;
  description: string;
  sanction_limit: string;
  email: string;
}

export interface CitizenAccount {
  name: string;
  phone: string;
  ward: string;
  ward_number: number;
  registered_at: string;
  password_hash?: string;
}

export const OFFICER_PRESETS: Record<AuthorityRole, OfficerPreset> = {
  WARD_INCHARGE: {
    id: 'WARD_INCHARGE',
    title: 'Ward In-Charge',
    name: 'Shri. Sunil Jadhav',
    designation: 'Junior Engineer & Ward 5 Field In-Charge',
    department: 'Ward 5 Field Administration',
    ward_number: 5,
    description: 'Initial on-site assessment and local field verification (Step 1).',
    sanction_limit: 'Up to ₹10,000 / Routine containment',
    email: 'sunil.jadhav@kopargaon.gov.in',
  },
  DEPARTMENT_OFFICER: {
    id: 'DEPARTMENT_OFFICER',
    title: 'Department Head',
    name: 'Smt. Sunita More',
    designation: 'Sanitation & Public Health Superintendent',
    department: 'Sanitation & Solid Waste Management Dept.',
    description: 'Technical sanction & departmental unit deployment review (Step 2).',
    sanction_limit: 'Up to ₹25,000 / Departmental budget',
    email: 'sunita.more@kopargaon.gov.in',
  },
  CHIEF_OFFICER: {
    id: 'CHIEF_OFFICER',
    title: 'Chief Municipal Officer (CMO)',
    name: 'Shri. Rajesh Kulkarni',
    designation: 'Chief Municipal Officer (CMO)',
    department: 'Kopargaon Municipal Council (KMC)',
    description: 'Executive authorization for high-budget, critical fleet mobilisation (Step 3).',
    sanction_limit: 'Full Municipal Discretionary Ceiling',
    email: 'rajesh.kulkarni@kopargaon.gov.in',
  },
  TAHSILDAR_OR_RELEVANT_AUTHORITY: {
    id: 'TAHSILDAR_OR_RELEVANT_AUTHORITY',
    title: 'Tahsildar & Taluka Magistrate',
    name: 'Shri. Deepak Shinde',
    designation: 'Tahsildar & Sub-Divisional Magistrate',
    department: 'Sub-Divisional Revenue & Taluka Administration',
    description: 'Inter-governmental jurisdiction, land disputes, and taluka disaster relief (Step 4).',
    sanction_limit: 'Taluka / Revenue Jurisdiction',
    email: 'deepak.shinde@maharashtra.gov.in',
  },
};

const INITIAL_CITIZENS: CitizenAccount[] = [
  {
    name: 'Rahul Patil',
    phone: '+91 98220 44112',
    ward: 'Ward 5 - Shivaji Chowk',
    ward_number: 5,
    registered_at: '2026-08-01T10:00:00Z',
  },
  {
    name: 'Pooja Deshmukh',
    phone: '+91 94220 88990',
    ward: 'Ward 3 - Subhash Road',
    ward_number: 3,
    registered_at: '2026-08-10T11:30:00Z',
  },
];

const DEFAULT_OFFICER: UserSession = {
  role: 'OFFICER',
  name: OFFICER_PRESETS.CHIEF_OFFICER.name,
  designation: OFFICER_PRESETS.CHIEF_OFFICER.designation,
  department: OFFICER_PRESETS.CHIEF_OFFICER.department,
  officer_role: 'CHIEF_OFFICER',
};

const AUTH_STORAGE_KEY = 'kopargov_auth_session_v2';
const CITIZENS_STORAGE_KEY = 'kopargov_registered_citizens_v1';

interface AuthContextType {
  user: UserSession;
  isAuthenticated: boolean;
  loginAsSpecificOfficer: (roleType: AuthorityRole) => void;
  loginAsOfficer: (name?: string, designation?: string, roleType?: AuthorityRole) => void;
  loginCitizen: (phone: string, name?: string) => boolean;
  registerCitizen: (name: string, phone: string, ward: string) => boolean;
  logout: () => void;
  switchRole: () => void;
  getAuthHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession>(() => {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_OFFICER;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('kopargov_is_authenticated') !== 'false';
  });

  useEffect(() => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem('kopargov_is_authenticated', isAuthenticated ? 'true' : 'false');

    // Best effort Firebase Auth background session connection
    const connectFirebaseAuth = async () => {
      try {
        const { auth, isFirebaseConfigured } = await import('../config/firebase');
        if (auth && isFirebaseConfigured) {
          const { signInAnonymously } = await import('firebase/auth');
          if (!auth.currentUser) {
            await signInAnonymously(auth);
          }
        }
      } catch (err) {
        // Silent fallback for hackathon local mode
      }
    };
    connectFirebaseAuth();
  }, [user, isAuthenticated]);

  const loginAsSpecificOfficer = (roleType: AuthorityRole) => {
    const preset = OFFICER_PRESETS[roleType] || OFFICER_PRESETS.CHIEF_OFFICER;
    setUser({
      role: 'OFFICER',
      name: preset.name,
      designation: preset.designation,
      department: preset.department,
      officer_role: preset.id,
      ward_number: preset.ward_number,
    });
    setIsAuthenticated(true);
  };

  const loginAsOfficer = (
    name = 'Shri. Rajesh Kulkarni',
    designation = 'Chief Municipal Officer (CMO)',
    roleType: AuthorityRole = 'CHIEF_OFFICER'
  ) => {
    const preset = OFFICER_PRESETS[roleType] || OFFICER_PRESETS.CHIEF_OFFICER;
    setUser({
      role: 'OFFICER',
      name: name || preset.name,
      designation: designation || preset.designation,
      department: preset.department,
      officer_role: roleType,
      ward_number: preset.ward_number,
    });
    setIsAuthenticated(true);
  };

  const loginCitizen = (phone: string, fallbackName = 'Rahul Patil'): boolean => {
    let citizens: CitizenAccount[] = INITIAL_CITIZENS;
    try {
      const stored = localStorage.getItem(CITIZENS_STORAGE_KEY);
      if (stored) citizens = JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }

    const cleanPhone = phone.trim();
    const found = citizens.find(c => c.phone === cleanPhone || c.phone.includes(cleanPhone.slice(-10)));

    if (found) {
      setUser({
        role: 'CITIZEN',
        name: found.name,
        phone: found.phone,
        ward_number: found.ward_number,
      });
    } else {
      setUser({
        role: 'CITIZEN',
        name: fallbackName,
        phone: cleanPhone || '+91 98220 44112',
        ward_number: 5,
      });
    }
    setIsAuthenticated(true);
    return true;
  };

  const registerCitizen = (name: string, phone: string, ward: string): boolean => {
    let citizens: CitizenAccount[] = INITIAL_CITIZENS;
    try {
      const stored = localStorage.getItem(CITIZENS_STORAGE_KEY);
      if (stored) citizens = JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }

    const wardNum = parseInt(ward.replace(/\D/g, ''), 10) || 5;
    const newCitizen: CitizenAccount = {
      name: name.trim(),
      phone: phone.trim(),
      ward: ward.trim(),
      ward_number: wardNum,
      registered_at: new Date().toISOString(),
    };

    citizens.push(newCitizen);
    localStorage.setItem(CITIZENS_STORAGE_KEY, JSON.stringify(citizens));

    setUser({
      role: 'CITIZEN',
      name: newCitizen.name,
      phone: newCitizen.phone,
      ward_number: newCitizen.ward_number,
    });
    setIsAuthenticated(true);
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser({
      role: 'CITIZEN',
      name: 'Unauthenticated User',
    });
    localStorage.setItem('kopargov_is_authenticated', 'false');
  };

  const switchRole = () => {
    if (user.role === 'OFFICER') {
      loginCitizen('+91 98220 44112', 'Rahul Patil');
    } else {
      loginAsSpecificOfficer('CHIEF_OFFICER');
    }
  };

  const getAuthHeaders = (): Record<string, string> => {
    if (user.role === 'OFFICER') {
      return {
        'X-Officer-Role': user.officer_role || 'CHIEF_OFFICER',
        'X-Officer-ID': user.name || 'Officer',
      };
    }
    return {
      'X-Officer-Role': 'CITIZEN',
      'X-Officer-ID': user.phone || 'Citizen',
    };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loginAsOfficer,
        loginAsSpecificOfficer,
        loginCitizen,
        registerCitizen,
        logout,
        switchRole,
        getAuthHeaders,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
