import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, Search, LogOut, ChevronDown, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../ui';
import { ROUTES, ROLE_LABELS } from '../../constants';
import { cn } from '../../utils';

// ─── Page Title Map ───────────────────────────────────────────────────────────

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':          'Dashboard',
  '/vehicles':           'Fleet Management',
  '/drivers':            'Driver Management',
  '/trips':              'Trip Management',
  '/maintenance':        'Maintenance',
  '/fuel':               'Fuel Management',
  '/reports':            'Reports & Analytics',
  '/admin/users':        'User Management',
  '/settings':           'Settings',
};

// ─── Top Navbar ───────────────────────────────────────────────────────────────

export function TopNavbar(): React.JSX.Element {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'TransitOps';

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <header
      className={cn(
        'fixed top-0 left-[240px] right-0 h-[60px] z-20',
        'bg-white border-b border-border',
        'flex items-center justify-between px-6'
      )}
    >
      {/* ─── Left: Page Title ─── */}
      <div>
        <h1 className="text-base font-semibold text-text-primary">{pageTitle}</h1>
      </div>

      {/* ─── Right: Actions ─── */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <button
          className={cn(
            'flex items-center gap-2 px-3 h-8 text-sm text-text-secondary',
            'border border-border rounded bg-surface',
            'hover:border-border-strong transition-colors',
            'w-48'
          )}
          aria-label="Search"
        >
          <Search size={14} />
          <span className="text-text-muted text-xs">Search...</span>
          <span className="ml-auto text-2xs text-text-muted border border-border rounded px-1">⌘K</span>
        </button>

        {/* Notifications */}
        <button
          className={cn(
            'relative w-8 h-8 flex items-center justify-center rounded',
            'text-text-secondary hover:bg-surface hover:text-text-primary transition-colors'
          )}
          aria-label="Notifications"
        >
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-status-danger rounded-full" />
        </button>

        {/* User Menu */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className={cn(
                'flex items-center gap-2 px-2 py-1.5 rounded',
                'hover:bg-surface transition-colors',
                'text-sm text-text-primary'
              )}
              aria-haspopup="true"
              aria-expanded={isUserMenuOpen}
            >
              <Avatar
                firstName={user.firstName}
                lastName={user.lastName}
                avatarUrl={user.avatarUrl}
                size="sm"
              />
              <span className="hidden md:block font-medium">
                {user.firstName}
              </span>
              <ChevronDown
                size={14}
                className={cn(
                  'text-text-muted transition-transform',
                  isUserMenuOpen && 'rotate-180'
                )}
              />
            </button>

            {/* Dropdown */}
            {isUserMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsUserMenuOpen(false)}
                />
                <div
                  className={cn(
                    'absolute right-0 top-full mt-1 w-56',
                    'bg-white border border-border rounded shadow-dropdown z-20',
                    'animate-slide-in'
                  )}
                >
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-medium text-text-primary">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-text-secondary truncate">{user.email}</p>
                    <p className="text-2xs text-text-muted mt-0.5">
                      {ROLE_LABELS[user.role]} · {user.employeeId}
                    </p>
                  </div>

                  <div className="py-1">
                    <button
                      className={cn(
                        'w-full flex items-center gap-2 px-4 py-2 text-sm',
                        'text-text-secondary hover:bg-surface hover:text-text-primary transition-colors'
                      )}
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        navigate(ROUTES.SETTINGS);
                      }}
                    >
                      <User size={14} />
                      Profile & Settings
                    </button>

                    <button
                      className={cn(
                        'w-full flex items-center gap-2 px-4 py-2 text-sm',
                        'text-status-danger hover:bg-status-danger-bg transition-colors'
                      )}
                      onClick={handleLogout}
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
