import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../config/firebase';
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
  email?: string;
  ward: string;
  ward_number: number;
  registered_at: string;
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
    email: 'officer@kopargaon.demo',
  },
  DEPARTMENT_OFFICER: {
    id: 'DEPARTMENT_OFFICER',
    title: 'Department Head',
    name: 'Smt. Sunita More',
    designation: 'Sanitation & Public Health Superintendent',
    department: 'Sanitation & Solid Waste Management Dept.',
    description: 'Technical sanction & departmental unit deployment review (Step 2).',
    sanction_limit: 'Up to ₹25,000 / Departmental budget',
    email: 'sanitation@kopargaon.demo',
  },
  CHIEF_OFFICER: {
    id: 'CHIEF_OFFICER',
    title: 'Chief Municipal Officer (CMO)',
    name: 'Shri. Rajesh Kulkarni',
    designation: 'Chief Municipal Officer (CMO)',
    department: 'Kopargaon Municipal Council (KMC)',
    description: 'Executive authorization for high-budget, critical fleet mobilisation (Step 3).',
    sanction_limit: 'Full Municipal Discretionary Ceiling',
    email: 'chief@kopargaon.demo',
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
    email: 'citizen@kopargaon.demo',
    ward: 'Ward 5 - Shivaji Chowk',
    ward_number: 5,
    registered_at: '2026-08-01T10:00:00Z',
  },
  {
    name: 'Pooja Deshmukh',
    phone: '+91 94220 88990',
    email: 'pooja.deshmukh@example.com',
    ward: 'Ward 3 - Subhash Road',
    ward_number: 3,
    registered_at: '2026-08-10T11:30:00Z',
  },
];

const UNAUTHENTICATED_USER: UserSession = {
  role: 'CITIZEN',
  name: 'Unauthenticated User',
};

const AUTH_STORAGE_KEY = 'kopargov_auth_session_v4';
const CITIZENS_STORAGE_KEY = 'kopargov_registered_citizens_v3';
const TOKEN_STORAGE_KEY = 'kopargov_auth_token_v4';

interface AuthResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: UserSession;
  token: string | null;
  isAuthenticated: boolean;
  isOfficer: boolean;
  loginAsSpecificOfficer: (roleType: AuthorityRole) => void;
  loginAsOfficer: (name?: string, designation?: string, roleType?: AuthorityRole) => void;
  loginOfficerWithCredentials: (email: string, password?: string) => Promise<AuthResult>;
  loginCitizen: (phone: string, name?: string) => boolean;
  loginCitizenWithCredentials: (email: string, password?: string) => Promise<AuthResult>;
  registerCitizen: (name: string, phone: string, ward: string, email?: string, password?: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  switchRole: () => void;
  getAuthHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function formatFirebaseAuthError(error: any): string {
  if (!error) return 'Authentication failed. Please try again.';
  const code = error.code || '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password. Please verify your credentials.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This user account has been disabled by the municipal administrator.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please sign in.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Please wait a few moments and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    default:
      return error.message || 'Authentication failed. Please try again.';
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  });

  const [user, setUser] = useState<UserSession>(() => {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing stored user session:', e);
      }
    }
    return UNAUTHENTICATED_USER;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('kopargov_is_authenticated') === 'true' && Boolean(localStorage.getItem(TOKEN_STORAGE_KEY));
  });

  const isOfficer = user.role === 'OFFICER';

  // Synchronize active session to localStorage
  useEffect(() => {
    if (isAuthenticated && token) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem('kopargov_is_authenticated', 'true');
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.setItem('kopargov_is_authenticated', 'false');
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }, [user, isAuthenticated, token]);

  // Firebase Auth State Listener as Source of Truth
  useEffect(() => {
    if (!auth || !isFirebaseConfigured) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);

          // Verify with Backend /api/auth/me
          const apiUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
          const res = await fetch(`${apiUrl}/api/auth/me`, {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          });

          if (res.ok) {
            const data = await res.json();
            if (data && data.is_officer) {
              const officerData = data.officer || {};
              setUser({
                role: 'OFFICER',
                name: officerData.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Municipal Officer',
                designation: officerData.designation || 'Municipal Officer',
                department: officerData.department || 'Municipal Administration',
                officer_role: (officerData.role as AuthorityRole) || (officerData.id as AuthorityRole) || 'CHIEF_OFFICER',
                ward_number: officerData.ward_number,
              });
              setIsAuthenticated(true);
              return;
            }
          }

          // Check if citizen in Firestore users collection
          if (db) {
            try {
              const userDocRef = doc(db, 'users', firebaseUser.uid);
              const userDocSnap = await getDoc(userDocRef);
              if (userDocSnap.exists()) {
                const citizenData = userDocSnap.data();
                setUser({
                  role: 'CITIZEN',
                  name: citizenData.name || firebaseUser.displayName || 'Registered Citizen',
                  phone: citizenData.phone || '',
                  ward_number: citizenData.ward_number || 5,
                });
                setIsAuthenticated(true);
                return;
              }
            } catch (fsErr) {
              console.warn('[Firestore] Profile lookup error:', fsErr);
            }
          }

          // Fallback citizen state if authenticated via Firebase
          setUser({
            role: 'CITIZEN',
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Registered Citizen',
            phone: firebaseUser.phoneNumber || '',
            ward_number: 5,
          });
          setIsAuthenticated(true);
        } catch (err) {
          console.error('[Firebase Auth] Session verification error:', err);
        }
      } else {
        // If Firebase says not logged in and session was not a demo persona
        const currentToken = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (currentToken && !currentToken.startsWith('demo-preset-')) {
          setIsAuthenticated(false);
          setToken(null);
          setUser(UNAUTHENTICATED_USER);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Demo Persona 1-Click Simulation Login (Testing only)
  const loginAsSpecificOfficer = (roleType: AuthorityRole) => {
    const preset = OFFICER_PRESETS[roleType] || OFFICER_PRESETS.CHIEF_OFFICER;
    const sessionToken = `demo-preset-OFFICER-${roleType}`;
    setToken(sessionToken);
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
    const sessionToken = `demo-preset-OFFICER-001`;
    setToken(sessionToken);
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

  // Real Credential Login for Municipal Officers
  const loginOfficerWithCredentials = async (email: string, password = ''): Promise<AuthResult> => {
    try {
      if (!isFirebaseConfigured || !auth) {
        return {
          success: false,
          error: 'Firebase is not yet configured with real project credentials in frontend/.env.local.',
        };
      }

      // 1. Authenticate with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const idToken = await userCredential.user.getIdToken();

      // 2. Call FastAPI backend /api/auth/me with Bearer token for strict Officer Registry authorization
      const apiUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const res = await fetch(`${apiUrl}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        return {
          success: false,
          error: errJson.detail || 'Officer authorization check failed. Please verify with municipal IT.',
        };
      }

      const data = await res.json();
      if (data && data.is_officer) {
        const officerData = data.officer || {};
        setToken(idToken);
        setUser({
          role: 'OFFICER',
          name: officerData.name || userCredential.user.displayName || email.split('@')[0],
          designation: officerData.designation || 'Municipal Officer',
          department: officerData.department || 'Municipal Administration',
          officer_role: (officerData.role as AuthorityRole) || (officerData.id as AuthorityRole) || 'CHIEF_OFFICER',
          ward_number: officerData.ward_number,
        });
        setIsAuthenticated(true);
        return { success: true };
      } else {
        return {
          success: false,
          error: 'Access Denied: This account is authenticated but not registered as an authorized municipal officer.',
        };
      }
    } catch (fbErr: any) {
      console.error('[Firebase Auth] Officer login failed:', fbErr);
      return {
        success: false,
        error: formatFirebaseAuthError(fbErr),
      };
    }
  };

  // Citizen Local / Phone Login
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

    const citizenToken = `demo-citizen-${cleanPhone.replace(/[^0-9]/g, '') || '9822044112'}`;
    setToken(citizenToken);

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

  // Real Credential Login for Citizens
  const loginCitizenWithCredentials = async (emailOrPhone: string, password = ''): Promise<AuthResult> => {
    const isEmail = emailOrPhone.includes('@');
    if (!isEmail) {
      loginCitizen(emailOrPhone);
      return { success: true };
    }

    if (!isFirebaseConfigured || !auth) {
      return {
        success: false,
        error: 'Firebase is not yet configured with real project credentials in frontend/.env.local.',
      };
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, emailOrPhone.trim(), password);
      const idToken = await userCredential.user.getIdToken();

      let citizenName = userCredential.user.displayName || emailOrPhone.split('@')[0];
      let citizenPhone = '';
      let wardNumber = 5;

      // Lookup profile in Firestore
      if (db) {
        try {
          const userDocRef = doc(db, 'users', userCredential.user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            citizenName = data.name || citizenName;
            citizenPhone = data.phone || citizenPhone;
            wardNumber = data.ward_number || wardNumber;
          }
        } catch (fsErr) {
          console.warn('[Firestore] Error reading citizen document:', fsErr);
        }
      }

      setToken(idToken);
      setUser({
        role: 'CITIZEN',
        name: citizenName,
        phone: citizenPhone || '+91 98220 44112',
        ward_number: wardNumber,
      });
      setIsAuthenticated(true);
      return { success: true };
    } catch (fbErr: any) {
      console.error('[Firebase Auth] Citizen login failed:', fbErr);
      return {
        success: false,
        error: formatFirebaseAuthError(fbErr),
      };
    }
  };

  // Citizen Registration with Firebase Auth & Firestore Profile
  const registerCitizen = async (
    name: string,
    phone: string,
    ward: string,
    email?: string,
    password?: string
  ): Promise<AuthResult> => {
    try {
      const wardNum = parseInt(ward.replace(/\D/g, ''), 10) || 5;

      if (email && password && isFirebaseConfigured && auth && db) {
        // 1. Create Firebase Authentication Account
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const idToken = await userCredential.user.getIdToken();

        // 2. Create Citizen Document in Firestore users collection
        const userDocRef = doc(db, 'users', userCredential.user.uid);
        await setDoc(userDocRef, {
          uid: userCredential.user.uid,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          role: 'CITIZEN',
          ward: ward.trim(),
          ward_number: wardNum,
          registered_at: new Date().toISOString(),
        });

        setToken(idToken);
        setUser({
          role: 'CITIZEN',
          name: name.trim(),
          phone: phone.trim(),
          ward_number: wardNum,
        });
        setIsAuthenticated(true);
        return { success: true };
      }

      // Offline / Local Registration Fallback
      let citizens: CitizenAccount[] = INITIAL_CITIZENS;
      try {
        const stored = localStorage.getItem(CITIZENS_STORAGE_KEY);
        if (stored) citizens = JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }

      const newCitizen: CitizenAccount = {
        name: name.trim(),
        phone: phone.trim(),
        email: email?.trim(),
        ward: ward.trim(),
        ward_number: wardNum,
        registered_at: new Date().toISOString(),
      };

      citizens.push(newCitizen);
      localStorage.setItem(CITIZENS_STORAGE_KEY, JSON.stringify(citizens));

      const citizenToken = `demo-citizen-${newCitizen.phone.replace(/[^0-9]/g, '')}`;
      setToken(citizenToken);

      setUser({
        role: 'CITIZEN',
        name: newCitizen.name,
        phone: newCitizen.phone,
        ward_number: newCitizen.ward_number,
      });
      setIsAuthenticated(true);
      return { success: true };
    } catch (fbErr: any) {
      console.error('[Firebase Auth] Citizen registration error:', fbErr);
      return {
        success: false,
        error: formatFirebaseAuthError(fbErr),
      };
    }
  };

  const logout = async () => {
    if (auth && isFirebaseConfigured) {
      try {
        await signOut(auth);
      } catch (e) {
        console.warn('Firebase signOut error:', e);
      }
    }
    setIsAuthenticated(false);
    setToken(null);
    setUser(UNAUTHENTICATED_USER);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.setItem('kopargov_is_authenticated', 'false');
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  };

  const switchRole = () => {
    if (user.role === 'OFFICER') {
      loginCitizen('+91 98220 44112', 'Rahul Patil');
    } else {
      loginAsSpecificOfficer('CHIEF_OFFICER');
    }
  };

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (user.role === 'OFFICER') {
      headers['X-Officer-Role'] = user.officer_role || 'CHIEF_OFFICER';
      headers['X-Officer-ID'] = user.name || 'Officer';
    } else {
      headers['X-Officer-Role'] = 'CITIZEN';
      headers['X-Officer-ID'] = user.phone || 'Citizen';
    }
    return headers;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isOfficer,
        loginAsOfficer,
        loginAsSpecificOfficer,
        loginOfficerWithCredentials,
        loginCitizen,
        loginCitizenWithCredentials,
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
