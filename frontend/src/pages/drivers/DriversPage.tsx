import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  SlidersHorizontal,
  Eye,
  Edit2,
  Trash2,
  AlertTriangle,
  X,
  FileText,
  Calendar,
  Phone,
  Mail,
  Award,
  Clock,
  Compass,
  MapPin,
  Heart,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { driverService, DriverInput } from '../../services/driver.service';
import { Card, CardBody, Button, Input, Badge, LoadingSpinner } from '../../components/ui';
import { QUERY_KEYS } from '../../constants';
import { Driver, DriverStatus } from '../../types';
import { formatDate } from '../../utils';

// ─── Zod Schema for Driver ────────────────────────────────────────────────────
const driverSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  employeeId: z.string().optional(),
  licenseNumber: z
    .string()
    .min(5, 'License number must be at least 5 characters')
    .max(30, 'Max 30 characters')
    .toUpperCase(),
  licenseCategory: z.string().min(1, 'License category is required'),
  licenseExpiryDate: z.string().min(1, 'License expiry date is required'),
  phoneNumber: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^\+?[0-9\s\-()]{7,20}$/, 'Invalid phone number format'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  safetyScore: z.coerce
    .number()
    .int('Must be an integer')
    .min(0, 'Min score is 0')
    .max(100, 'Max score is 100'),
  yearsOfExperience: z.coerce
    .number()
    .int('Must be an integer')
    .nonnegative('Cannot be negative'),
  address: z.string().min(1, 'Address is required'),
  emergencyContact: z.string().min(1, 'Emergency contact is required'),
  notes: z.string().optional(),
});

type DriverFormValues = z.infer<typeof driverSchema>;

const LICENSE_CATEGORIES = ['Class A CDL', 'Class B CDL', 'Class C CDL', 'Standard Class C', 'Heavy Truck Class 1', 'Heavy Truck Class 2'];

export default function DriversPage(): React.JSX.Element {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();

  const isEditor = hasRole(['SUPER_ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER']);
  const isSuperAdmin = hasRole(['SUPER_ADMIN']);

  // State
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DriverStatus | ''>('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [minSafetyScore, setMinSafetyScore] = useState<number | ''>('');
  const [expiryBeforeFilter, setExpiryBeforeFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [viewingDriver, setViewingDriver] = useState<Driver | null>(null);
  const [deletingDriver, setDeletingDriver] = useState<Driver | null>(null);

  // Form Setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
  });

  // Query drivers
  const { data, isLoading, error } = useQuery({
    queryKey: [
      QUERY_KEYS.DRIVERS,
      page,
      search,
      statusFilter,
      categoryFilter,
      minSafetyScore,
      expiryBeforeFilter,
      sortBy,
      sortOrder,
    ],
    queryFn: () =>
      driverService.getDrivers({
        page,
        limit: 10,
        search,
        status: statusFilter,
        licenseCategory: categoryFilter,
        minSafetyScore: minSafetyScore !== '' ? Number(minSafetyScore) : undefined,
        licenseExpiryBefore: expiryBeforeFilter || undefined,
        sortBy,
        sortOrder,
      }),
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: driverService.createDriver,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DRIVERS] });
      toast.success('Driver registered successfully');
      closeForm();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to register driver');
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<DriverInput> }) =>
      driverService.updateDriver(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DRIVERS] });
      toast.success('Driver profile updated successfully');
      closeForm();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update driver profile');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: driverService.deleteDriver,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DRIVERS] });
      toast.success('Driver profile deleted successfully');
      setIsDeleteOpen(false);
      setDeletingDriver(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete driver');
    },
  });

  // Status Change Mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: DriverStatus }) =>
      driverService.updateDriverStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DRIVERS] });
      toast.success('Driver status updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update driver status');
    },
  });

  // Modal Handlers
  const openCreateForm = () => {
    setEditingDriver(null);
    reset({
      fullName: '',
      employeeId: '',
      licenseNumber: '',
      licenseCategory: '',
      licenseExpiryDate: new Date().toISOString().split('T')[0],
      phoneNumber: '',
      email: '',
      safetyScore: 100,
      yearsOfExperience: 0,
      address: '',
      emergencyContact: '',
      notes: '',
    });
    setIsFormOpen(true);
  };

  const openEditForm = (driver: Driver) => {
    setEditingDriver(driver);
    reset({
      fullName: driver.fullName,
      employeeId: driver.employeeId || '',
      licenseNumber: driver.licenseNumber,
      licenseCategory: driver.licenseCategory,
      licenseExpiryDate: driver.licenseExpiryDate.split('T')[0],
      phoneNumber: driver.phoneNumber,
      email: driver.email,
      safetyScore: driver.safetyScore,
      yearsOfExperience: driver.yearsOfExperience,
      address: driver.address,
      emergencyContact: driver.emergencyContact,
      notes: driver.notes || '',
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingDriver(null);
  };

  const openView = (driver: Driver) => {
    setViewingDriver(driver);
    setIsViewOpen(true);
  };

  const openDelete = (driver: Driver) => {
    setDeletingDriver(driver);
    setIsDeleteOpen(true);
  };

  // Submit Handler
  const onSubmit = (values: DriverFormValues) => {
    const cleanValues: DriverInput = {
      ...values,
      employeeId: values.employeeId ? (values.employeeId as string) : null,
      notes: values.notes ? (values.notes as string) : null,
    };

    if (editingDriver) {
      updateMutation.mutate({ id: editingDriver.id, input: cleanValues });
    } else {
      createMutation.mutate({ ...cleanValues, status: 'AVAILABLE' });
    }
  };

  // Status Badge Colors
  const statusBadgeVariant = (status: DriverStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return 'success';
      case 'ON_TRIP':
        return 'info';
      case 'OFF_DUTY':
        return 'neutral';
      case 'SUSPENDED':
        return 'danger';
    }
  };

  // Safety Score Color coding
  const safetyScoreBadgeColor = (score: number) => {
    if (score >= 90) return 'text-status-success bg-status-success-bg border-status-success/20';
    if (score >= 75) return 'text-status-info bg-status-info-bg border-status-info/20';
    if (score >= 60) return 'text-status-warning bg-status-warning-bg border-status-warning/20';
    return 'text-status-danger bg-status-danger-bg border-status-danger/20';
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Page Header ─── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Driver Registry</h1>
          <p className="page-subtitle">Manage driver assignments, credentials, and safety profiles</p>
        </div>
        {isEditor && (
          <Button variant="primary" onClick={openCreateForm} leftIcon={<Plus size={16} />}>
            Register Driver
          </Button>
        )}
      </div>

      {/* ─── Filters toolbar ─── */}
      <Card>
        <CardBody className="flex flex-col md:flex-row items-center gap-4 py-4 px-5">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 text-text-muted" size={16} />
            <input
              type="text"
              placeholder="Search name, license, phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full h-9 pl-9 pr-3 rounded border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>

          <SlidersHorizontal size={16} className="text-text-muted hidden md:block" />

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as DriverStatus | '');
              setPage(1);
            }}
            className="h-9 px-3 border border-border rounded bg-white text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand w-full md:w-40"
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="ON_TRIP">On Trip</option>
            <option value="OFF_DUTY">Off Duty</option>
            <option value="SUSPENDED">Suspended</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 border border-border rounded bg-white text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand w-full md:w-40"
          >
            <option value="">All Categories</option>
            {LICENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Safety Score Filter */}
          <select
            value={minSafetyScore}
            onChange={(e) => {
              setMinSafetyScore(e.target.value ? Number(e.target.value) : '');
              setPage(1);
            }}
            className="h-9 px-3 border border-border rounded bg-white text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand w-full md:w-40"
          >
            <option value="">Min Safety Score</option>
            <option value="90">90+ (Excellent)</option>
            <option value="75">75+ (Good)</option>
            <option value="60">60+ (Average)</option>
          </select>

          {/* Expiry filter */}
          <div className="flex items-center gap-1.5 w-full md:w-auto">
            <span className="text-xs text-text-secondary whitespace-nowrap">Expires Before:</span>
            <input
              type="date"
              value={expiryBeforeFilter}
              onChange={(e) => {
                setExpiryBeforeFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 px-2.5 border border-border rounded bg-white text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          {/* Reset Filters */}
          {(search || statusFilter || categoryFilter || minSafetyScore || expiryBeforeFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setCategoryFilter('');
                setMinSafetyScore('');
                setExpiryBeforeFilter('');
                setPage(1);
              }}
              className="text-xs text-brand hover:text-brand-hover font-semibold transition-colors h-9 px-2"
            >
              Reset Filters
            </button>
          )}
        </CardBody>
      </Card>

      {/* ─── Drivers Table Grid ─── */}
      <Card>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-text-secondary">Fetching driver profiles...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-status-danger px-6">
            <AlertTriangle size={36} className="mb-2" />
            <h3 className="font-semibold">Failed to load drivers database</h3>
            <p className="text-xs text-text-secondary mt-1">{(error as Error).message || 'Database connection error'}</p>
          </div>
        ) : !data || data.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <Compass size={40} className="text-text-muted mb-3" />
            <h3 className="text-sm font-semibold text-text-primary">No drivers found</h3>
            <p className="text-xs text-text-secondary mt-1">Try resetting filters or registering a new operator.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-text-primary">
              <thead className="bg-surface text-text-secondary border-b border-border font-medium">
                <tr>
                  <th
                    className="px-6 py-3 cursor-pointer select-none hover:text-text-primary"
                    onClick={() => handleSort('fullName')}
                  >
                    Name {sortBy === 'fullName' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th
                    className="px-6 py-3 cursor-pointer select-none hover:text-text-primary"
                    onClick={() => handleSort('employeeId')}
                  >
                    Emp ID {sortBy === 'employeeId' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th
                    className="px-6 py-3 cursor-pointer select-none hover:text-text-primary"
                    onClick={() => handleSort('licenseNumber')}
                  >
                    License Number {sortBy === 'licenseNumber' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Phone</th>
                  <th
                    className="px-6 py-3 cursor-pointer select-none hover:text-text-primary"
                    onClick={() => handleSort('safetyScore')}
                  >
                    Safety Score {sortBy === 'safetyScore' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th
                    className="px-6 py-3 cursor-pointer select-none hover:text-text-primary"
                    onClick={() => handleSort('status')}
                  >
                    Status {sortBy === 'status' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th
                    className="px-6 py-3 cursor-pointer select-none hover:text-text-primary"
                    onClick={() => handleSort('licenseExpiryDate')}
                  >
                    License Expiry {sortBy === 'licenseExpiryDate' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {data.data.map((driver) => (
                  <tr key={driver.id} className="table-row-hover">
                    <td className="px-6 py-3.5 font-medium">{driver.fullName}</td>
                    <td className="px-6 py-3.5 text-text-secondary">{driver.employeeId || '—'}</td>
                    <td className="px-6 py-3.5 font-mono text-xs font-semibold">{driver.licenseNumber}</td>
                    <td className="px-6 py-3.5 text-text-secondary">{driver.licenseCategory}</td>
                    <td className="px-6 py-3.5 text-text-secondary text-xs">{driver.phoneNumber}</td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${safetyScoreBadgeColor(driver.safetyScore)}`}>
                        {driver.safetyScore}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge variant={statusBadgeVariant(driver.status)} dot>
                        {driver.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-text-secondary">{formatDate(driver.licenseExpiryDate)}</td>
                    <td className="px-6 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => openView(driver)}
                        className="text-text-secondary hover:text-brand transition-colors p-1"
                        title="View Profile"
                      >
                        <Eye size={15} />
                      </button>

                      {isEditor && (
                        <>
                          <button
                            onClick={() => openEditForm(driver)}
                            className="text-text-secondary hover:text-brand transition-colors p-1"
                            title="Edit Driver Profile"
                          >
                            <Edit2 size={15} />
                          </button>

                          {/* Quick Status Control */}
                          <select
                            value={driver.status}
                            onChange={(e) =>
                              statusMutation.mutate({ id: driver.id, status: e.target.value as DriverStatus })
                            }
                            className="h-7 px-1.5 border border-border rounded bg-white text-xs focus:ring-1 focus:ring-brand text-text-primary font-medium"
                            title="Quick status change"
                          >
                            <option value="AVAILABLE">Available</option>
                            <option value="ON_TRIP">On Trip</option>
                            <option value="OFF_DUTY">Off Duty</option>
                            <option value="SUSPENDED">Suspended</option>
                          </select>

                          {isSuperAdmin && (
                            <button
                              onClick={() => openDelete(driver)}
                              disabled={driver.status === 'ON_TRIP'}
                              className={`${
                                driver.status === 'ON_TRIP'
                                  ? 'text-text-muted cursor-not-allowed opacity-50'
                                  : 'text-text-secondary hover:text-status-danger'
                              } transition-colors p-1`}
                              title={driver.status === 'ON_TRIP' ? 'Active drivers cannot be deleted' : 'Delete Driver'}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-surface text-sm text-text-secondary">
                <div>
                  Showing page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} drivers)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={!data.pagination.hasPrevPage}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={!data.pagination.hasNextPage}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* ─── View Detail Modal ─── */}
      {isViewOpen && viewingDriver && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="bg-white rounded border border-border w-full max-w-2xl shadow-modal animate-slide-in overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
              <div>
                <h3 className="font-semibold text-text-primary text-base">Driver Profile Card</h3>
                <p className="text-2xs text-text-secondary mt-0.5">Reference ID: {viewingDriver.id}</p>
              </div>
              <button onClick={() => setIsViewOpen(false)} className="text-text-muted hover:text-text-primary transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div className="flex items-center gap-3 col-span-2 pb-2 border-b border-border">
                <div className="w-12 h-12 rounded-full bg-brand-light border border-brand/20 flex items-center justify-center font-bold text-brand text-lg">
                  {viewingDriver.fullName.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary text-base">{viewingDriver.fullName}</h4>
                  <p className="text-xs text-text-secondary">Employee ID: {viewingDriver.employeeId || 'Not Assigned'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FileText size={16} className="text-text-muted" />
                <div>
                  <p className="text-xs text-text-secondary">License Details</p>
                  <p className="font-semibold font-mono text-brand mt-0.5">
                    {viewingDriver.licenseNumber} ({viewingDriver.licenseCategory})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-text-muted" />
                <div>
                  <p className="text-xs text-text-secondary">License Expiry Date</p>
                  <p className="mt-0.5 font-medium">{formatDate(viewingDriver.licenseExpiryDate)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone size={16} className="text-text-muted" />
                <div>
                  <p className="text-xs text-text-secondary">Contact Number</p>
                  <p className="mt-0.5 font-medium">{viewingDriver.phoneNumber}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail size={16} className="text-text-muted" />
                <div>
                  <p className="text-xs text-text-secondary">Email Address</p>
                  <p className="mt-0.5 font-medium truncate max-w-[200px]">{viewingDriver.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Award size={16} className="text-text-muted" />
                <div>
                  <p className="text-xs text-text-secondary">Safety Score / Experience</p>
                  <p className="mt-0.5 font-medium">
                    {viewingDriver.safetyScore}/100 ({viewingDriver.yearsOfExperience} years)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock size={16} className="text-text-muted" />
                <div>
                  <p className="text-xs text-text-secondary">Status</p>
                  <div className="mt-0.5">
                    <Badge variant={statusBadgeVariant(viewingDriver.status)} dot>
                      {viewingDriver.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 col-span-2">
                <MapPin size={16} className="text-text-muted flex-shrink-0" />
                <div>
                  <p className="text-xs text-text-secondary">Registered Address</p>
                  <p className="mt-0.5 text-text-secondary">{viewingDriver.address}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 col-span-2">
                <Heart size={16} className="text-text-muted flex-shrink-0" />
                <div>
                  <p className="text-xs text-text-secondary">Emergency Contact Information</p>
                  <p className="mt-0.5 font-semibold text-text-primary">{viewingDriver.emergencyContact}</p>
                </div>
              </div>

              <div className="col-span-2 pt-2 border-t border-border mt-2">
                <p className="text-xs text-text-secondary">Operations Notes</p>
                <p className="mt-1 bg-surface p-2.5 rounded border border-border text-xs text-text-secondary italic">
                  {viewingDriver.notes || 'No notes on file.'}
                </p>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-border bg-surface flex justify-end">
              <Button variant="secondary" onClick={() => setIsViewOpen(false)}>
                Close Profile
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Create/Edit Modal ─── */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="bg-white rounded border border-border w-full max-w-xl shadow-modal animate-slide-in overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
              <h3 className="font-semibold text-text-primary text-base">
                {editingDriver ? 'Edit Driver Profile' : 'Register Operator Asset'}
              </h3>
              <button onClick={closeForm} className="text-text-muted hover:text-text-primary transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  {...register('fullName')}
                  label="Full Name"
                  placeholder="e.g. John Doe"
                  required
                  error={errors.fullName?.message}
                />
                <Input
                  {...register('employeeId')}
                  label="Employee ID (Optional)"
                  placeholder="e.g. DRV-9018"
                  error={errors.employeeId?.message}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  {...register('licenseNumber')}
                  label="License Number"
                  placeholder="e.g. DL-1901826"
                  required
                  error={errors.licenseNumber?.message}
                />
                {/* Category Selection */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-text-primary">
                    License Category <span className="text-status-danger">*</span>
                  </label>
                  <select
                    {...register('licenseCategory')}
                    className="h-9 border border-border rounded px-3 text-sm focus:ring-2 focus:ring-brand focus:border-brand focus:outline-none"
                  >
                    <option value="">Select Category</option>
                    {LICENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {errors.licenseCategory && <p className="text-xs text-status-danger">{errors.licenseCategory.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  {...register('licenseExpiryDate')}
                  label="License Expiry Date"
                  type="date"
                  required
                  error={errors.licenseExpiryDate?.message}
                />
                <Input
                  {...register('phoneNumber')}
                  label="Contact Phone"
                  placeholder="e.g. +1 555-0199"
                  required
                  error={errors.phoneNumber?.message}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  {...register('email')}
                  label="Email Address"
                  type="email"
                  placeholder="e.g. john@transitops.com"
                  required
                  error={errors.email?.message}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    {...register('safetyScore')}
                    label="Safety Score"
                    type="number"
                    required
                    error={errors.safetyScore?.message}
                  />
                  <Input
                    {...register('yearsOfExperience')}
                    label="Experience (yrs)"
                    type="number"
                    required
                    error={errors.yearsOfExperience?.message}
                  />
                </div>
              </div>

              <Input
                {...register('address')}
                label="Home Address"
                placeholder="123 Main St, City, Region"
                required
                error={errors.address?.message}
              />

              <Input
                {...register('emergencyContact')}
                label="Emergency Contact Info"
                placeholder="e.g. Jane Doe (Wife) - +1 555-0198"
                required
                error={errors.emergencyContact?.message}
              />

              {/* Notes */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-text-primary">Operational Notes</label>
                <textarea
                  {...register('notes')}
                  placeholder="Medical conditions, routing restrictions, shift bounds..."
                  rows={3}
                  className="border border-border rounded p-2.5 text-sm focus:ring-2 focus:ring-brand focus:border-brand focus:outline-none"
                />
                {errors.notes && <p className="text-xs text-status-danger">{errors.notes.message}</p>}
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-3 bg-white">
                <Button variant="secondary" type="button" onClick={closeForm}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  isLoading={createMutation.isPending || updateMutation.isPending}
                >
                  {editingDriver ? 'Save Changes' : 'Register Operator'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Delete Dialog ─── */}
      {isDeleteOpen && deletingDriver && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="bg-white rounded border border-border w-full max-w-md shadow-modal animate-slide-in overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-status-danger-bg rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} className="text-status-danger" />
              </div>
              <h3 className="font-semibold text-text-primary text-base">De-register Driver Profile?</h3>
              <p className="text-sm text-text-secondary mt-2">
                Are you sure you want to delete driver{' '}
                <strong className="text-text-primary font-semibold">{deletingDriver.fullName}</strong> (
                <span className="font-mono text-xs font-semibold">{deletingDriver.licenseNumber}</span>)?
              </p>
              <p className="text-2xs text-text-muted mt-1">This action cannot be undone. Audit records will be created.</p>
            </div>
            <div className="px-6 py-3.5 border-t border-border bg-surface flex justify-center gap-3">
              <Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                isLoading={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deletingDriver.id)}
              >
                Delete Driver
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
