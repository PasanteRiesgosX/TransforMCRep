import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const RequireAdmin: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user || user.appRole !== 'ADMIN') {
    return <Navigate to="/survey" replace />;
  }

  return <Outlet />;
};
