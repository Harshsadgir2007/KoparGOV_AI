import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, UserSession } from '../types';

interface AuthContextType {
  user: UserSession;
  loginAsOfficer: (name?: string, designation?: string) => void;
  loginAsCitizen: (name?: string, phone?: string) => void;
  logout: () => void;
  switchRole: () => void;
}

const DEFAULT_OFFICER: UserSession = {
  role: 'OFFICER',
  name: 'Shri. Rajesh Kulkarni',
  designation: 'Chief Municipal Officer (CMO)',
  department: 'Kopargaon Municipal Council (KMC)',
};

const DEFAULT_CITIZEN: UserSession = {
  role: 'CITIZEN',
  name: 'Anand Patil',
  phone: '+91 98220 44112',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession>(() => {
    const saved = localStorage.getItem('kopargov_auth_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_OFFICER;
  });

  useEffect(() => {
    localStorage.setItem('kopargov_auth_user', JSON.stringify(user));
  }, [user]);

  const loginAsOfficer = (name = 'Shri. Rajesh Kulkarni', designation = 'Chief Municipal Officer (CMO)') => {
    setUser({
      role: 'OFFICER',
      name,
      designation,
      department: 'Kopargaon Municipal Council (KMC)',
    });
  };

  const loginAsCitizen = (name = 'Anand Patil', phone = '+91 98220 44112') => {
    setUser({
      role: 'CITIZEN',
      name,
      phone,
    });
  };

  const logout = () => {
    setUser(DEFAULT_CITIZEN);
  };

  const switchRole = () => {
    if (user.role === 'OFFICER') {
      loginAsCitizen();
    } else {
      loginAsOfficer();
    }
  };

  return (
    <AuthContext.Provider value={{ user, loginAsOfficer, loginAsCitizen, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
