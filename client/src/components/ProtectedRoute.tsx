// client/src/components/ProtectedRoute.tsx (CHECK/UPDATE)
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  element: React.ReactElement;
  adminOnly?: boolean; // NEW PROP
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element, adminOnly = false }) => {
  const { userInfo } = useAuth();

  if (!userInfo) {
    // Not logged in, redirect to login
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !userInfo.isAdmin) {
    // Logged in, but not an admin, redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return element;
};

export default ProtectedRoute;