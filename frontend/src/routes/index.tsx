import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { PageLoader } from '../components/ui';
import { ROUTES } from '../constants';

// ─── Lazy-loaded Pages ────────────────────────────────────────────────────────
// Each page is a separate chunk — only loaded when the route is visited.

const LoginPage         = lazy(() => import('@pages/auth/LoginPage'));
const DashboardPage     = lazy(() => import('@pages/dashboard/DashboardPage'));
const NotFoundPage      = lazy(() => import('@pages/NotFoundPage'));
const UnauthorizedPage  = lazy(() => import('@pages/UnauthorizedPage'));

// Phase 2+ pages (will be uncommented as modules are built)
const VehiclesPage    = lazy(() => import('@pages/vehicles/VehiclesPage'));
const DriversPage     = lazy(() => import('@pages/drivers/DriversPage'));
// const TripsPage       = lazy(() => import('../pages/trips/TripsPage'));
// const MaintenancePage = lazy(() => import('../pages/maintenance/MaintenancePage'));
// const FuelPage        = lazy(() => import('../pages/fuel/FuelPage'));
// const ReportsPage     = lazy(() => import('../pages/reports/ReportsPage'));
// const UsersPage       = lazy(() => import('../pages/admin/UsersPage'));
// const SettingsPage    = lazy(() => import('../pages/settings/SettingsPage'));

// ─── Suspense Wrapper ─────────────────────────────────────────────────────────

function SuspenseWrapper({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

// ─── Router Definition ────────────────────────────────────────────────────────

const router = createBrowserRouter([
  // ─── Public routes ────────────────────────────────────────────────────────
  {
    element: <AuthLayout />,
    children: [
      {
        path: ROUTES.LOGIN,
        element: (
          <SuspenseWrapper>
            <LoginPage />
          </SuspenseWrapper>
        ),
      },
    ],
  },

  // ─── Protected routes ─────────────────────────────────────────────────────
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to={ROUTES.DASHBOARD} replace />,
      },
      {
        path: ROUTES.DASHBOARD,
        element: (
          <SuspenseWrapper>
            <DashboardPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: ROUTES.VEHICLES,
        element: (
          <SuspenseWrapper>
            <VehiclesPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: ROUTES.DRIVERS,
        element: (
          <SuspenseWrapper>
            <DriversPage />
          </SuspenseWrapper>
        ),
      },
      // Phase 2+ routes will be added here
    ],
  },

  // ─── Utility routes ───────────────────────────────────────────────────────
  {
    path: ROUTES.UNAUTHORIZED,
    element: (
      <SuspenseWrapper>
        <UnauthorizedPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: ROUTES.NOT_FOUND,
    element: (
      <SuspenseWrapper>
        <NotFoundPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: '*',
    element: <Navigate to={ROUTES.NOT_FOUND} replace />,
  },
]);

// ─── App Router Provider ──────────────────────────────────────────────────────

export function AppRouter(): React.JSX.Element {
  return <RouterProvider router={router} />;
}
