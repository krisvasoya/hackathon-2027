import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PageLoader } from '../components/ui';
import { ROUTES } from '../constants';
import type { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

// ─── Protected Route ──────────────────────────────────────────────────────────
// 1. While auth is resolving (initial page load): show full-page loader
// 2. Not authenticated → redirect to login with return URL preserved
// 3. Authenticated but wrong role → redirect to /unauthorized
// 4. Authenticated with correct role → render children

export function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps): React.JSX.Element {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`${ROUTES.LOGIN}?returnTo=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  }

  return <>{children}</>;
}
