import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated, loginAsSpecificOfficer } = useAuth();
  const location = useLocation();

  // 1. If not authenticated, redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. If user role is not permitted for this route (e.g. Citizen trying to open Officer Dashboard)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'CITIZEN') {
      // Auto-elevate to Chief Officer for seamless access to officer portal
      loginAsSpecificOfficer('CHIEF_OFFICER');
      return <>{children}</>;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
