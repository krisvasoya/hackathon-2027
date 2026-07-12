import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  Wrench,
  Fuel,
  DollarSign,
  BarChart3,
  Settings,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES, ROLE_LABELS } from '../../constants';
import { Badge } from '../ui';
import { cn } from '../../utils';
import type { NavItem, UserRole } from '../../types';

// ─── Navigation Items ─────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    path: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
  },
  {
    label: 'Vehicles',
    path: ROUTES.VEHICLES,
    icon: Truck,
    allowedRoles: ['SUPER_ADMIN', 'FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER'],
  },
  {
    label: 'Drivers',
    path: ROUTES.DRIVERS,
    icon: Users,
    allowedRoles: ['SUPER_ADMIN', 'FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER'],
  },
  {
    label: 'Trips',
    path: ROUTES.TRIPS,
    icon: Route,
    allowedRoles: ['SUPER_ADMIN', 'FLEET_MANAGER', 'DISPATCHER', 'DRIVER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'],
  },
  {
    label: 'Maintenance',
    path: ROUTES.MAINTENANCE,
    icon: Wrench,
    allowedRoles: ['SUPER_ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER'],
  },
  {
    label: 'Fuel',
    path: ROUTES.FUEL,
    icon: Fuel,
    allowedRoles: ['SUPER_ADMIN', 'FLEET_MANAGER', 'FINANCIAL_ANALYST', 'DRIVER'],
  },
  {
    label: 'Expenses',
    path: ROUTES.EXPENSES,
    icon: DollarSign,
    allowedRoles: ['SUPER_ADMIN', 'FLEET_MANAGER', 'FINANCIAL_ANALYST'],
  },
  {
    label: 'Reports',
    path: ROUTES.REPORTS,
    icon: BarChart3,
    allowedRoles: ['SUPER_ADMIN', 'FLEET_MANAGER', 'FINANCIAL_ANALYST', 'SAFETY_OFFICER'],
  },
];

const ADMIN_ITEMS: NavItem[] = [
  {
    label: 'User Management',
    path: ROUTES.USERS,
    icon: ShieldCheck,
    allowedRoles: ['SUPER_ADMIN'],
  },
  {
    label: 'Settings',
    path: ROUTES.SETTINGS,
    icon: Settings,
  },
];

// ─── Sidebar Component ────────────────────────────────────────────────────────

export function Sidebar(): React.JSX.Element {
  const { user } = useAuth();
  const location = useLocation();

  const isAllowed = (item: NavItem): boolean => {
    if (!item.allowedRoles) return true;
    if (!user) return false;
    return item.allowedRoles.includes(user.role as UserRole);
  };

  const isActive = (path: string): boolean => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <aside className="fixed top-0 left-0 h-full w-[240px] bg-surface-sidebar border-r border-border flex flex-col z-30">
      {/* ─── Logo ─── */}
      <div className="flex items-center gap-2.5 px-4 h-[60px] border-b border-border flex-shrink-0">
        <img src="/assets/logo.png" alt="TransitOps Logo" className="h-7 w-7 object-contain flex-shrink-0" />
        <div>
          <p className="text-sm font-bold text-text-primary leading-none">TransitOps</p>
          <p className="text-2xs text-text-muted mt-0.5">Fleet Operations</p>
        </div>
      </div>

      {/* ─── Navigation ─── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <div className="mb-4">
          <p className="text-2xs font-semibold uppercase tracking-wider text-text-muted px-2 mb-1">
            Operations
          </p>
          <ul className="space-y-0.5">
            {NAV_ITEMS.filter(isAllowed).map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={cn(
                    'nav-item w-full',
                    isActive(item.path) && 'active'
                  )}
                >
                  <item.icon size={16} className="flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {isActive(item.path) && (
                    <ChevronRight size={12} className="text-brand flex-shrink-0" />
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-2xs font-semibold uppercase tracking-wider text-text-muted px-2 mb-1">
            Administration
          </p>
          <ul className="space-y-0.5">
            {ADMIN_ITEMS.filter(isAllowed).map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={cn(
                    'nav-item w-full',
                    isActive(item.path) && 'active'
                  )}
                >
                  <item.icon size={16} className="flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* ─── User Info ─── */}
      {user && (
        <div className="border-t border-border px-3 py-3 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-brand-light border border-brand/20 flex items-center justify-center flex-shrink-0">
              <span className="text-2xs font-semibold text-brand">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-text-primary truncate">
                {user.firstName} {user.lastName}
              </p>
              <Badge variant="neutral" className="mt-0.5 text-2xs">
                {ROLE_LABELS[user.role]}
              </Badge>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
