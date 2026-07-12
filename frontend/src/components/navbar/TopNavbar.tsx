import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bell, Search, LogOut, ChevronDown, User, X, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar, LoadingSpinner } from '../ui';
import { ROUTES, ROLE_LABELS } from '../../constants';
import { cn, formatCurrency } from '../../utils';
import { notificationService } from '../../services/notification.service';
import { searchService, SearchResult } from '../../services/search.service';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':          'Dashboard',
  '/vehicles':           'Fleet Management',
  '/drivers':            'Driver Management',
  '/trips':              'Trip Management',
  '/maintenance':        'Maintenance',
  '/fuel':               'Fuel Management',
  '/expenses':           'Expense & General Ledger',
  '/reports':            'Reports & Analytics',
  '/admin/users':        'User Management',
  '/settings':           'Settings',
};

export function TopNavbar(): React.JSX.Element {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Page Title mapping
  const pageTitle = PAGE_TITLES[location.pathname] ?? 'TransitOps';

  // Toggle Dropdowns States
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Search Input State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<'all' | 'vehicles' | 'drivers' | 'trips' | 'maintenance' | 'fuel' | 'expenses'>('all');

  // Local storage for read notifications timestamp
  const [lastReadTime, setLastReadTime] = useState<string>(() => {
    return localStorage.getItem('last_read_notifications_time') || new Date(0).toISOString();
  });

  // Queries - Fetch notifications
  const { data: notifications = [], refetch: refetchNotifications } = useQuery({
    queryKey: ['in_app_notifications'],
    queryFn: notificationService.getNotifications,
    refetchInterval: 15000, // Poll notifications every 15 seconds
  });

  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Queries - Global Search
  const { data: searchResults, isLoading: isSearching } = useQuery<SearchResult>({
    queryKey: ['global_search', debouncedSearchQuery],
    queryFn: ({ signal }) => searchService.search(debouncedSearchQuery, signal),
    enabled: isSearchOpen && debouncedSearchQuery.trim().length >= 1,
  });

  const isSearchingOrPending = isSearching || (searchQuery.trim().length >= 1 && searchQuery !== debouncedSearchQuery);

  // Hotkey listener for Search: Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const handleNotificationClick = (link: string) => {
    setIsNotificationsOpen(false);
    navigate(link);
  };

  const markAllAsRead = () => {
    const nowStr = new Date().toISOString();
    localStorage.setItem('last_read_notifications_time', nowStr);
    setLastReadTime(nowStr);
  };

  // Determine unread count
  const unreadCount = notifications.filter(
    (n) => new Date(n.createdAt).getTime() > new Date(lastReadTime).getTime()
  ).length;

  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case 'danger':
        return 'bg-status-danger text-white';
      case 'warning':
        return 'bg-status-warning text-text-primary';
      case 'success':
        return 'bg-status-success text-white';
      default:
        return 'bg-status-info text-white';
    }
  };

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-[240px] right-0 h-[60px] z-20',
          'bg-white border-b border-border',
          'flex items-center justify-between px-6'
        )}
      >
        {/* Left: Page Title */}
        <div>
          <h1 className="text-base font-semibold text-text-primary">{pageTitle}</h1>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Search Trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
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

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setIsNotificationsOpen((prev) => !prev);
                if (!isNotificationsOpen) {
                  refetchNotifications();
                }
              }}
              className={cn(
                'relative w-8 h-8 flex items-center justify-center rounded',
                'text-text-secondary hover:bg-surface hover:text-text-primary transition-colors'
              )}
              aria-label="Notifications"
              aria-expanded={isNotificationsOpen}
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-status-danger text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsNotificationsOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-80 bg-white border border-border rounded shadow-dropdown z-20 animate-slide-in max-h-[400px] overflow-y-auto">
                  <div className="px-4 py-2 border-b border-border flex justify-between items-center bg-surface">
                    <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Alerts & Notifications</span>
                    <button onClick={markAllAsRead} className="text-3xs text-brand font-semibold hover:underline">
                      Mark as read
                    </button>
                  </div>

                  <div className="divide-y divide-border">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-text-muted">No recent notifications.</div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n.link)}
                          className="px-4 py-3 hover:bg-surface cursor-pointer transition-colors text-xs flex gap-2.5 items-start"
                        >
                          <span className={`w-1.5 h-1.5 mt-1.5 rounded-full flex-shrink-0 ${getNotificationBadgeColor(n.type)}`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-text-primary leading-tight">{n.title}</p>
                            <p className="text-text-secondary mt-0.5 leading-snug">{n.message}</p>
                          </div>
                          <ChevronDown size={12} className="-rotate-90 text-text-muted mt-1.5 flex-shrink-0" />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

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

      {/* ─── Global Search Modal Overlay ─── */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-start justify-center p-6 z-50 animate-fade-in pt-20">
          <div className="bg-white rounded border border-border w-full max-w-2xl shadow-modal animate-slide-in overflow-hidden flex flex-col max-h-[70vh]">
            {/* Search Input bar */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface">
              <Search size={18} className="text-text-muted" />
              <input
                type="text"
                placeholder="Search across vehicles, drivers, trips, repairs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 text-sm bg-transparent border-0 focus:outline-none text-text-primary"
                autoFocus
              />
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }}
                className="text-text-muted hover:text-text-primary p-1"
              >
                <X size={16} />
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1 px-4 py-2 border-b border-border bg-surface/50">
              {([
                { key: 'all', label: 'All Results' },
                { key: 'vehicles', label: 'Vehicles' },
                { key: 'drivers', label: 'Drivers' },
                { key: 'trips', label: 'Trips' },
                { key: 'maintenance', label: 'Maintenance' },
                { key: 'fuel', label: 'Fuel logs' },
                { key: 'expenses', label: 'Expenses' },
              ] as const).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSearchFilter(tab.key)}
                  className={cn(
                    'px-2 py-1 rounded text-3xs font-bold uppercase tracking-wider transition-colors',
                    searchFilter === tab.key
                      ? 'bg-brand text-white'
                      : 'text-text-secondary hover:bg-surface'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Results lists */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isSearchingOrPending && (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <LoadingSpinner size="md" />
                  <p className="text-xs text-text-secondary animate-pulse">Running enterprise search...</p>
                </div>
              )}

              {!isSearchingOrPending && !searchQuery.trim() && (
                <div className="text-center py-10 text-xs text-text-muted flex flex-col items-center gap-1.5">
                  <Search size={24} className="text-text-muted" />
                  <p className="font-bold text-text-primary">Global Fleet Search</p>
                  <p className="text-2xs text-text-secondary">Type to search plates, drivers, trip routes, repair tickets...</p>
                </div>
              )}

              {!isSearchingOrPending && searchQuery.trim() && searchResults && (
                <div className="space-y-4">
                  {/* Vehicles */}
                  {(searchFilter === 'all' || searchFilter === 'vehicles') && searchResults.vehicles.length > 0 && (
                    <div>
                      <h4 className="text-3xs font-bold text-text-muted uppercase tracking-wider mb-1.5 pl-1.5 border-l-2 border-brand">Vehicles</h4>
                      <div className="bg-surface rounded border border-border divide-y divide-border">
                        {searchResults.vehicles.map((v) => (
                          <div
                            key={v.id}
                            onClick={() => {
                              setIsSearchOpen(false);
                              navigate('/vehicles');
                            }}
                            className="px-3 py-2 hover:bg-white cursor-pointer transition-colors text-xs flex justify-between items-center"
                          >
                            <span className="font-medium">{v.vehicleName} ({v.vehicleModel})</span>
                            <span className="font-mono text-3xs text-brand font-bold bg-white border border-border px-1 rounded">{v.registrationNumber}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Drivers */}
                  {(searchFilter === 'all' || searchFilter === 'drivers') && searchResults.drivers.length > 0 && (
                    <div>
                      <h4 className="text-3xs font-bold text-text-muted uppercase tracking-wider mb-1.5 pl-1.5 border-l-2 border-status-success">Drivers</h4>
                      <div className="bg-surface rounded border border-border divide-y divide-border">
                        {searchResults.drivers.map((d) => (
                          <div
                            key={d.id}
                            onClick={() => {
                              setIsSearchOpen(false);
                              navigate('/drivers');
                            }}
                            className="px-3 py-2 hover:bg-white cursor-pointer transition-colors text-xs flex justify-between items-center"
                          >
                            <span className="font-medium">{d.fullName}</span>
                            <span className="text-2xs text-text-secondary font-mono">{d.licenseNumber}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trips */}
                  {(searchFilter === 'all' || searchFilter === 'trips') && searchResults.trips.length > 0 && (
                    <div>
                      <h4 className="text-3xs font-bold text-text-muted uppercase tracking-wider mb-1.5 pl-1.5 border-l-2 border-status-info">Trips</h4>
                      <div className="bg-surface rounded border border-border divide-y divide-border">
                        {searchResults.trips.map((t) => (
                          <div
                            key={t.id}
                            onClick={() => {
                              setIsSearchOpen(false);
                              navigate(`/trips/${t.id}`);
                            }}
                            className="px-3 py-2 hover:bg-white cursor-pointer transition-colors text-xs flex justify-between items-center"
                          >
                            <div>
                              <span className="font-mono font-bold text-brand mr-2">{t.tripNumber}</span>
                              <span className="text-text-secondary">{t.source} → {t.destination}</span>
                            </div>
                            <ExternalLink size={12} className="text-text-muted" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Maintenance */}
                  {(searchFilter === 'all' || searchFilter === 'maintenance') && searchResults.maintenance.length > 0 && (
                    <div>
                      <h4 className="text-3xs font-bold text-text-muted uppercase tracking-wider mb-1.5 pl-1.5 border-l-2 border-status-danger">Maintenance</h4>
                      <div className="bg-surface rounded border border-border divide-y divide-border">
                        {searchResults.maintenance.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => {
                              setIsSearchOpen(false);
                              navigate('/maintenance');
                            }}
                            className="px-3 py-2 hover:bg-white cursor-pointer transition-colors text-xs flex justify-between items-center"
                          >
                            <div>
                              <span className="font-mono font-bold text-brand mr-2">{m.maintenanceNumber}</span>
                              <span className="text-text-secondary">{m.maintenanceType}</span>
                            </div>
                            <span className="text-3xs text-text-muted">{m.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fuel */}
                  {(searchFilter === 'all' || searchFilter === 'fuel') && searchResults.fuel.length > 0 && (
                    <div>
                      <h4 className="text-3xs font-bold text-text-muted uppercase tracking-wider mb-1.5 pl-1.5 border-l-2 border-status-warning">Fuel logs</h4>
                      <div className="bg-surface rounded border border-border divide-y divide-border">
                        {searchResults.fuel.map((f) => (
                          <div
                            key={f.id}
                            onClick={() => {
                              setIsSearchOpen(false);
                              navigate('/fuel');
                            }}
                            className="px-3 py-2 hover:bg-white cursor-pointer transition-colors text-xs flex justify-between items-center"
                          >
                            <span className="font-medium">{f.fuelStation}</span>
                            <span className="font-semibold text-text-primary">{formatCurrency(f.totalCost)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expenses */}
                  {(searchFilter === 'all' || searchFilter === 'expenses') && searchResults.expenses.length > 0 && (
                    <div>
                      <h4 className="text-3xs font-bold text-text-muted uppercase tracking-wider mb-1.5 pl-1.5 border-l-2 border-brand">Expenses</h4>
                      <div className="bg-surface rounded border border-border divide-y divide-border">
                        {searchResults.expenses.map((e) => (
                          <div
                            key={e.id}
                            onClick={() => {
                              setIsSearchOpen(false);
                              navigate('/expenses');
                            }}
                            className="px-3 py-2 hover:bg-white cursor-pointer transition-colors text-xs flex justify-between items-center"
                          >
                            <span className="text-text-secondary">{e.description} ({e.expenseType})</span>
                            <span className="font-bold text-text-primary">{formatCurrency(e.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty state within query search */}
                  {searchResults.vehicles.length === 0 &&
                    searchResults.drivers.length === 0 &&
                    searchResults.trips.length === 0 &&
                    searchResults.maintenance.length === 0 &&
                    searchResults.fuel.length === 0 &&
                    searchResults.expenses.length === 0 && (
                      <div className="text-center py-10 text-xs text-text-muted">
                        No matches found for "{searchQuery}". Try adjusting your keywords.
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
