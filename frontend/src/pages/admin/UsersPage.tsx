import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Search,
  SlidersHorizontal,
  Eye,
  Edit2,
  UserX,
  KeyRound,
  X,
  Shield,
  Mail,
  Phone,
  Building2,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userService, UpdateUserInput } from '../../services/user.service';
import { Card, CardBody, Button, Badge } from '../../components/ui';
import { User, UserRole, UserStatus } from '../../types';
import { ROLE_LABELS } from '../../constants';
import { formatDate, cn } from '../../utils';
import { SkListPage } from '../../components/skeleton';

// ─── Status / Role Badge Maps ─────────────────────────────────────────────────

const STATUS_MAP: Record<UserStatus, { label: string; variant: 'success' | 'danger' | 'warning' | 'neutral' }> = {
  ACTIVE:                { label: 'Active',             variant: 'success' },
  INACTIVE:              { label: 'Inactive',           variant: 'neutral' },
  SUSPENDED:             { label: 'Suspended',          variant: 'danger'  },
  PENDING_VERIFICATION:  { label: 'Pending',            variant: 'warning' },
};

const ROLE_VARIANT: Record<UserRole, 'success' | 'info' | 'warning' | 'danger' | 'neutral'> = {
  SUPER_ADMIN:      'danger',
  FLEET_MANAGER:    'info',
  SAFETY_OFFICER:   'warning',
  FINANCIAL_ANALYST:'success',
  DISPATCHER:       'info',
  DRIVER:           'neutral',
  VIEWER:           'neutral',
};

const ALL_ROLES: UserRole[] = [
  'SUPER_ADMIN','FLEET_MANAGER','SAFETY_OFFICER','FINANCIAL_ANALYST','DISPATCHER','DRIVER','VIEWER',
];
const ALL_STATUSES: UserStatus[] = ['ACTIVE','INACTIVE','SUSPENDED','PENDING_VERIFICATION'];

// ─── Component ────────────────────────────────────────────────────────────────

export default function UsersPage(): React.JSX.Element {
  const { hasRole, user: authUser } = useAuth();
  const queryClient = useQueryClient();
  const isSuperAdmin = hasRole(['SUPER_ADMIN']);

  // Filters
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState('');
  const [roleFilter, setRoleFilter]   = useState<UserRole | ''>('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('');

  // Modals
  const [viewUser, setViewUser]       = useState<User | null>(null);
  const [editUser, setEditUser]       = useState<User | null>(null);
  const [editForm, setEditForm]       = useState<UpdateUserInput>({});
  const [confirmDeactivate, setConfirmDeactivate] = useState<User | null>(null);

  // ─── Query ────────────────────────────────────────────────────────────────

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['users', page, search, roleFilter, statusFilter],
    queryFn: () =>
      userService.getUsers({
        page,
        limit: 20,
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
    // If backend /users doesn't exist yet, fall back gracefully
    retry: false,
  });

  if (isLoading) {
    return <SkListPage rows={10} cols={6} filters={3} hasButton={false} />;
  }

  if (isError) {
    return (
      <div className="space-y-6 font-sans">
        <div className="page-header">
          <div>
            <h1 className="page-title">User Management</h1>
            <p className="page-subtitle">Configure enterprise roles, audit privilege scopes, and toggle active status</p>
          </div>
        </div>
        <Card>
          <CardBody className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-sm font-semibold text-status-danger">Failed to load user management records.</p>
            <Button variant="primary" onClick={() => refetch()}>
              Retry Loading
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  // ─── Mutations ────────────────────────────────────────────────────────────

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) =>
      userService.updateUser(id, input),
    onSuccess: () => {
      toast.success('User updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditUser(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => userService.updateUserStatus(id, 'INACTIVE'),
    onSuccess: () => {
      toast.success('User deactivated.');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setConfirmDeactivate(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const resetPwMutation = useMutation({
    mutationFn: (id: string) => userService.resetPassword(id),
    onSuccess: () => toast.success('Password reset email sent.'),
    onError: () => toast.info('Reset password: feature available in production.'),
  });

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const openEdit = (u: User) => {
    setEditUser(u);
    setEditForm({
      firstName: u.firstName,
      lastName:  u.lastName,
      role:      u.role,
      status:    u.status,
      department: u.department ?? '',
      phone:     u.phone ?? '',
    });
  };

  const users: User[] = data?.data ?? [];

  return (
    <div className="space-y-6">
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage system users, roles, and access permissions</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-secondary bg-white border border-border rounded px-3 py-1.5">
          <Shield size={13} className="text-brand" />
          {isSuperAdmin ? 'Full Admin Access' : 'Read-Only Access'}
        </div>
      </div>

      {/* ─── Filters ─────────────────────────────────────────────────────── */}
      <Card>
        <CardBody className="flex flex-col md:flex-row items-center gap-3 py-4 px-5">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={15} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full h-9 pl-9 pr-3 rounded border border-border bg-white text-sm focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          <SlidersHorizontal size={15} className="text-text-muted hidden md:block" />

          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value as UserRole | ''); setPage(1); }}
            className="h-9 px-3 border border-border rounded bg-white text-sm focus:outline-none focus:ring-1 focus:ring-brand w-full md:w-44"
          >
            <option value="">All Roles</option>
            {ALL_ROLES.map(r => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as UserStatus | ''); setPage(1); }}
            className="h-9 px-3 border border-border rounded bg-white text-sm focus:outline-none focus:ring-1 focus:ring-brand w-full md:w-40"
          >
            <option value="">All Statuses</option>
            {ALL_STATUSES.map(s => (
              <option key={s} value={s}>{STATUS_MAP[s].label}</option>
            ))}
          </select>

          {(search || roleFilter || statusFilter) && (
            <button
              onClick={() => { setSearch(''); setRoleFilter(''); setStatusFilter(''); setPage(1); }}
              className="text-xs text-text-secondary hover:text-text-primary underline whitespace-nowrap"
            >
              Clear filters
            </button>
          )}
        </CardBody>
      </Card>

      {/* ─── Table ────────────────────────────────────────────────────────── */}
      <Card>
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-full bg-surface flex items-center justify-center border border-border">
              <Shield size={24} className="text-text-muted" />
            </div>
            <p className="text-sm font-semibold text-text-primary">No users found.</p>
            <p className="text-xs text-text-secondary">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-text-primary">
              <thead className="bg-surface text-text-secondary border-b border-border font-medium text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Last Login</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-surface transition-colors">
                    {/* User cell */}
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-light border border-brand/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-brand">
                            {(u.firstName?.[0] ?? '?')}{(u.lastName?.[0] ?? '')}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-text-primary truncate">
                            {u.firstName} {u.lastName}
                            {u.id === authUser?.id && (
                              <span className="ml-1.5 text-2xs text-brand font-semibold">(You)</span>
                            )}
                          </p>
                          <p className="text-xs text-text-secondary truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-3.5">
                      <Badge variant={ROLE_VARIANT[u.role]}>
                        {ROLE_LABELS[u.role]}
                      </Badge>
                    </td>

                    {/* Department */}
                    <td className="px-6 py-3.5 text-text-secondary text-xs">
                      {u.department ?? '—'}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-3.5">
                      <Badge variant={STATUS_MAP[u.status].variant} dot>
                        {STATUS_MAP[u.status].label}
                      </Badge>
                    </td>

                    {/* Last Login */}
                    <td className="px-6 py-3.5 text-text-secondary text-xs">
                      {u.lastLoginAt ? formatDate(u.lastLoginAt) : 'Never'}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewUser(u)}
                          className="p-1.5 rounded text-text-secondary hover:bg-surface hover:text-text-primary transition-colors"
                          title="View"
                        >
                          <Eye size={15} />
                        </button>
                        {isSuperAdmin && (
                          <>
                            <button
                              onClick={() => openEdit(u)}
                              className="p-1.5 rounded text-text-secondary hover:bg-surface hover:text-brand transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => resetPwMutation.mutate(u.id)}
                              className="p-1.5 rounded text-text-secondary hover:bg-surface hover:text-status-info transition-colors"
                              title="Reset Password"
                            >
                              <KeyRound size={15} />
                            </button>
                            {u.status === 'ACTIVE' && u.id !== authUser?.id && (
                              <button
                                onClick={() => setConfirmDeactivate(u)}
                                className="p-1.5 rounded text-text-secondary hover:bg-status-danger-bg hover:text-status-danger transition-colors"
                                title="Deactivate"
                              >
                                <UserX size={15} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── Pagination ─────────────────────────────────────────────────── */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-surface/50">
            <p className="text-xs text-text-secondary">
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, data.pagination.total)} of {data.pagination.total} users
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={!data.pagination.hasPrevPage}
                className="p-1.5 rounded text-text-secondary hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-xs font-medium px-2">
                {page} / {data.pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                disabled={!data.pagination.hasNextPage}
                className="p-1.5 rounded text-text-secondary hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* ─── View Drawer ──────────────────────────────────────────────────── */}
      {viewUser && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setViewUser(null)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white border-l border-border shadow-modal z-50 flex flex-col animate-slide-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-sm font-semibold text-text-primary">User Profile</h3>
              <button onClick={() => setViewUser(null)} className="p-1 rounded hover:bg-surface text-text-secondary">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Avatar + name */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-brand-light border border-brand/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-brand">
                    {(viewUser.firstName?.[0] ?? '?')}{(viewUser.lastName?.[0] ?? '')}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-text-primary">{viewUser.firstName} {viewUser.lastName}</p>
                  <Badge variant={ROLE_VARIANT[viewUser.role]} className="mt-1">{ROLE_LABELS[viewUser.role]}</Badge>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <DetailRow icon={<Mail size={14} />} label="Email" value={viewUser.email} mono />
                <DetailRow icon={<Phone size={14} />} label="Phone" value={viewUser.phone ?? '—'} />
                <DetailRow icon={<Building2 size={14} />} label="Department" value={viewUser.department ?? '—'} />
                <DetailRow icon={<Shield size={14} />} label="Status">
                  <Badge variant={STATUS_MAP[viewUser.status].variant} dot>{STATUS_MAP[viewUser.status].label}</Badge>
                </DetailRow>
                <DetailRow icon={<Clock size={14} />} label="Last Login" value={viewUser.lastLoginAt ? formatDate(viewUser.lastLoginAt) : 'Never'} />
                {viewUser.employeeId && (
                  <DetailRow icon={<Shield size={14} />} label="Employee ID" value={viewUser.employeeId} mono />
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── Edit Modal ───────────────────────────────────────────────────── */}
      {editUser && isSuperAdmin && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setEditUser(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded border border-border shadow-modal w-full max-w-md animate-slide-in">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h3 className="text-sm font-semibold">Edit User</h3>
                <button onClick={() => setEditUser(null)} className="p-1 rounded hover:bg-surface text-text-secondary"><X size={16} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">First Name</label>
                    <input
                      className="w-full h-9 px-3 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                      value={editForm.firstName ?? ''}
                      onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Last Name</label>
                    <input
                      className="w-full h-9 px-3 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                      value={editForm.lastName ?? ''}
                      onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Role</label>
                  <select
                    className="w-full h-9 px-3 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-brand bg-white"
                    value={editForm.role ?? editUser.role}
                    onChange={e => setEditForm(f => ({ ...f, role: e.target.value as UserRole }))}
                  >
                    {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Status</label>
                  <select
                    className="w-full h-9 px-3 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-brand bg-white"
                    value={editForm.status ?? editUser.status}
                    onChange={e => setEditForm(f => ({ ...f, status: e.target.value as UserStatus }))}
                  >
                    {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_MAP[s].label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Department</label>
                  <input
                    className="w-full h-9 px-3 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                    value={editForm.department ?? ''}
                    onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))}
                    placeholder="e.g. Operations"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Phone</label>
                  <input
                    className="w-full h-9 px-3 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                    value={editForm.phone ?? ''}
                    onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setEditUser(null)}>Cancel</Button>
                <Button
                  variant="primary"
                  onClick={() => updateMutation.mutate({ id: editUser.id, input: editForm })}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── Deactivate Confirm Modal ─────────────────────────────────────── */}
      {confirmDeactivate && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setConfirmDeactivate(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded border border-border shadow-modal w-full max-w-sm animate-slide-in">
              <div className="p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-status-danger-bg flex items-center justify-center mx-auto">
                  <UserX size={20} className="text-status-danger" />
                </div>
                <div>
                  <p className="font-semibold text-text-primary">Deactivate User</p>
                  <p className="text-xs text-text-secondary mt-1">
                    Are you sure you want to deactivate <strong>{confirmDeactivate.firstName} {confirmDeactivate.lastName}</strong>? They will lose access immediately.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" className="flex-1" onClick={() => setConfirmDeactivate(null)}>Cancel</Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    onClick={() => deactivateMutation.mutate(confirmDeactivate.id)}
                    disabled={deactivateMutation.isPending}
                  >
                    {deactivateMutation.isPending ? 'Deactivating...' : 'Deactivate'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Small helper ─────────────────────────────────────────────────────────────

function DetailRow({
  icon, label, value, mono, children,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  mono?: boolean;
  children?: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 text-text-muted flex-shrink-0">{icon}</span>
      <div className="flex-1">
        <p className="text-2xs text-text-muted uppercase tracking-wider font-semibold mb-0.5">{label}</p>
        {children ?? (
          <p className={cn('text-text-primary', mono && 'font-mono text-xs')}>{value}</p>
        )}
      </div>
    </div>
  );
}
