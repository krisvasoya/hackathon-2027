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
  Layers,
  Scale,
  MapPin,
  Clock,
  Compass,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { vehicleService, VehicleInput } from '../../services/vehicle.service';
import { Card, CardBody, Button, Input, Badge } from '../../components/ui';
import { QUERY_KEYS } from '../../constants';
import { Vehicle, VehicleStatus } from '../../types';
import { formatDate, formatCurrency } from '../../utils';
import { SkListPage } from '../../components/skeleton';

// ─── Zod Schema for Vehicle ───────────────────────────────────────────────────
const vehicleSchema = z.object({
  registrationNumber: z
    .string()
    .min(1, 'Registration number is required')
    .max(20, 'Max 20 characters')
    .toUpperCase(),
  vehicleName: z.string().min(1, 'Vehicle name is required'),
  vehicleModel: z.string().min(1, 'Vehicle model is required'),
  vehicleType: z.string().min(1, 'Vehicle type is required'),
  manufacturer: z.string().min(1, 'Manufacturer is required'),
  manufacturingYear: z.coerce
    .number()
    .int('Must be an integer')
    .min(1900, 'Min year is 1900')
    .max(new Date().getFullYear() + 1, `Max year is ${new Date().getFullYear() + 1}`),
  maximumLoadCapacity: z.coerce
    .number()
    .positive('Must be greater than zero'),
  currentOdometer: z.coerce
    .number()
    .nonnegative('Cannot be negative'),
  acquisitionCost: z.coerce
    .number()
    .nonnegative('Must be a non-negative number'),
  purchaseDate: z
    .string()
    .min(1, 'Purchase date is required')
    .refine((val) => new Date(val) <= new Date(), {
      message: 'Purchase date cannot be in the future',
    }),
  insuranceExpiry: z.string().min(1, 'Insurance expiry is required'),
  registrationExpiry: z.string().min(1, 'Registration expiry is required'),
  region: z.string().min(1, 'Region is required'),
  notes: z.string().nullable().optional(),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

// ─── Default Filters ──────────────────────────────────────────────────────────
const REGIONS = ['North', 'South', 'East', 'West', 'Midwest', 'Central'];
const VEHICLE_TYPES = ['Truck', 'Van', 'Semi-Trailer', 'Sedan', 'Bus', 'Container'];

export default function VehiclesPage(): React.JSX.Element {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();

  const isEditor = hasRole(['SUPER_ADMIN', 'FLEET_MANAGER']);

  // State
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [viewingVehicle, setViewingVehicle] = useState<Vehicle | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);

  // Form Setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
  });

  // Query vehicles
  const { data, isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.VEHICLES, page, search, statusFilter, typeFilter, regionFilter, sortBy, sortOrder],
    queryFn: () =>
      vehicleService.getVehicles({
        page,
        limit: 10,
        search,
        status: statusFilter,
        type: typeFilter,
        region: regionFilter,
        sortBy,
        sortOrder,
      }),
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: vehicleService.createVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VEHICLES] });
      toast.success('Vehicle registered successfully');
      closeForm();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to register vehicle');
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<VehicleInput> }) =>
      vehicleService.updateVehicle(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VEHICLES] });
      toast.success('Vehicle updated successfully');
      closeForm();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update vehicle');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: vehicleService.deleteVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VEHICLES] });
      toast.success('Vehicle deleted successfully');
      setIsDeleteOpen(false);
      setDeletingVehicle(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete vehicle');
    },
  });

  // Status Change Mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: VehicleStatus }) =>
      vehicleService.updateVehicleStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VEHICLES] });
      toast.success('Vehicle status updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update status');
    },
  });

  // Modal Handlers
  const openCreateForm = () => {
    setEditingVehicle(null);
    reset({
      registrationNumber: '',
      vehicleName: '',
      vehicleModel: '',
      vehicleType: '',
      manufacturer: '',
      manufacturingYear: new Date().getFullYear(),
      maximumLoadCapacity: 0,
      currentOdometer: 0,
      acquisitionCost: 0,
      purchaseDate: new Date().toISOString().split('T')[0],
      insuranceExpiry: new Date().toISOString().split('T')[0],
      registrationExpiry: new Date().toISOString().split('T')[0],
      region: '',
      notes: '',
    });
    setIsFormOpen(true);
  };

  const openEditForm = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    reset({
      registrationNumber: vehicle.registrationNumber,
      vehicleName: vehicle.vehicleName,
      vehicleModel: vehicle.vehicleModel,
      vehicleType: vehicle.vehicleType,
      manufacturer: vehicle.manufacturer,
      manufacturingYear: vehicle.manufacturingYear,
      maximumLoadCapacity: vehicle.maximumLoadCapacity,
      currentOdometer: vehicle.currentOdometer,
      acquisitionCost: Number(vehicle.acquisitionCost),
      purchaseDate: vehicle.purchaseDate.split('T')[0],
      insuranceExpiry: vehicle.insuranceExpiry.split('T')[0],
      registrationExpiry: vehicle.registrationExpiry.split('T')[0],
      region: vehicle.region,
      notes: vehicle.notes || '',
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingVehicle(null);
  };

  const openView = (vehicle: Vehicle) => {
    setViewingVehicle(vehicle);
    setIsViewOpen(true);
  };

  const openDelete = (vehicle: Vehicle) => {
    setDeletingVehicle(vehicle);
    setIsDeleteOpen(true);
  };

  // Submit Handler
  const onSubmit = (values: VehicleFormValues) => {
    const cleanValues: VehicleInput = {
      ...values,
      notes: values.notes || null,
    };

    if (editingVehicle) {
      updateMutation.mutate({ id: editingVehicle.id, input: cleanValues });
    } else {
      createMutation.mutate({ ...cleanValues, status: 'AVAILABLE' });
    }
  };

  // Badge Color Map
  const statusBadgeVariant = (status: VehicleStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return 'success';
      case 'ON_TRIP':
        return 'info';
      case 'IN_SHOP':
        return 'warning';
      case 'RETIRED':
        return 'neutral';
    }
  };

  // Region and Type sorting headers helper
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  if (isLoading || !data) {
    return <SkListPage rows={10} cols={6} filters={3} hasButton={isEditor} />;
  }

  return (
    <div className="space-y-6">
      {/* ─── Page Header ─── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Fleet Vehicles</h1>
          <p className="page-subtitle">Track, filter and manage fleet vehicle assets</p>
        </div>
        {isEditor && (
          <Button variant="primary" onClick={openCreateForm} leftIcon={<Plus size={16} />}>
            Register Vehicle
          </Button>
        )}
      </div>

      {/* ─── Search & Filters Panel ─── */}
      <Card>
        <CardBody className="flex flex-col md:flex-row items-center gap-4 py-4 px-5">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <span className="absolute left-3 top-0 bottom-0 flex items-center text-text-muted pointer-events-none">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search registration, name, model..."
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
              setStatusFilter(e.target.value as VehicleStatus | '');
              setPage(1);
            }}
            className="h-9 px-3 border border-border rounded bg-white text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand w-full md:w-40"
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="ON_TRIP">On Trip</option>
            <option value="IN_SHOP">In Shop</option>
            <option value="RETIRED">Retired</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 border border-border rounded bg-white text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand w-full md:w-40"
          >
            <option value="">All Types</option>
            {VEHICLE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Region Filter */}
          <select
            value={regionFilter}
            onChange={(e) => {
              setRegionFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 border border-border rounded bg-white text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand w-full md:w-40"
          >
            <option value="">All Regions</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {/* Reset Filters */}
          {(search || statusFilter || typeFilter || regionFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setTypeFilter('');
                setRegionFilter('');
                setPage(1);
              }}
              className="text-xs text-brand hover:text-brand-hover font-semibold transition-colors h-9 px-2"
            >
              Reset Filters
            </button>
          )}
        </CardBody>
      </Card>

      {/* ─── Table / Grid Area ─── */}
      <Card>
        {error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-status-danger px-6">
            <AlertTriangle size={36} className="mb-2" />
            <h3 className="font-semibold">Failed to load vehicle list</h3>
            <p className="text-xs text-text-secondary mt-1">{(error as Error).message || 'Database connection error'}</p>
          </div>
        ) : !data || data.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <Compass size={40} className="text-text-muted mb-3" />
            <h3 className="text-sm font-semibold text-text-primary">No vehicles found</h3>
            <p className="text-xs text-text-secondary mt-1">Try resetting filters or registering a new vehicle asset.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-text-primary">
              <thead className="bg-surface text-text-secondary border-b border-border font-medium">
                <tr>
                  <th
                    className="px-6 py-3 cursor-pointer select-none hover:text-text-primary"
                    onClick={() => handleSort('registrationNumber')}
                  >
                    Reg. Number {sortBy === 'registrationNumber' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th
                    className="px-6 py-3 cursor-pointer select-none hover:text-text-primary"
                    onClick={() => handleSort('vehicleName')}
                  >
                    Vehicle Name {sortBy === 'vehicleName' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th
                    className="px-6 py-3 cursor-pointer select-none hover:text-text-primary"
                    onClick={() => handleSort('vehicleModel')}
                  >
                    Model {sortBy === 'vehicleModel' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th
                    className="px-6 py-3 cursor-pointer select-none hover:text-text-primary"
                    onClick={() => handleSort('vehicleType')}
                  >
                    Type {sortBy === 'vehicleType' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th
                    className="px-6 py-3 cursor-pointer select-none hover:text-text-primary"
                    onClick={() => handleSort('region')}
                  >
                    Region {sortBy === 'region' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th
                    className="px-6 py-3 cursor-pointer select-none hover:text-text-primary"
                    onClick={() => handleSort('maximumLoadCapacity')}
                  >
                    Capacity {sortBy === 'maximumLoadCapacity' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th
                    className="px-6 py-3 cursor-pointer select-none hover:text-text-primary"
                    onClick={() => handleSort('status')}
                  >
                    Status {sortBy === 'status' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="px-6 py-3 text-xs text-text-secondary">Ins. Expiry</th>
                  <th className="px-6 py-3 text-xs text-text-secondary">Reg. Expiry</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {data.data.map((vehicle) => (
                  <tr key={vehicle.id} className="table-row-hover">
                    <td className="px-6 py-3.5 font-mono text-xs font-semibold text-brand">
                      {vehicle.registrationNumber}
                    </td>
                    <td className="px-6 py-3.5 font-medium">{vehicle.vehicleName}</td>
                    <td className="px-6 py-3.5 text-text-secondary">{vehicle.vehicleModel}</td>
                    <td className="px-6 py-3.5 text-text-secondary text-xs">{vehicle.vehicleType}</td>
                    <td className="px-6 py-3.5 text-text-secondary text-xs">{vehicle.region}</td>
                    <td className="px-6 py-3.5 text-text-secondary">{vehicle.maximumLoadCapacity} kg</td>
                    <td className="px-6 py-3.5">
                      <Badge variant={statusBadgeVariant(vehicle.status)} dot>
                        {vehicle.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-text-secondary">{formatDate(vehicle.insuranceExpiry)}</td>
                    <td className="px-6 py-3.5 text-xs text-text-secondary">{formatDate(vehicle.registrationExpiry)}</td>
                    <td className="px-6 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => openView(vehicle)}
                        className="text-text-secondary hover:text-brand transition-colors p-1"
                        title="View Details"
                      >
                        <Eye size={15} />
                      </button>

                      {isEditor && (
                        <>
                          <button
                            onClick={() => openEditForm(vehicle)}
                            className="text-text-secondary hover:text-brand transition-colors p-1"
                            title="Edit Vehicle"
                          >
                            <Edit2 size={15} />
                          </button>

                          {/* Quick Status Toggle */}
                          <select
                            value={vehicle.status}
                            onChange={(e) =>
                              statusMutation.mutate({ id: vehicle.id, status: e.target.value as VehicleStatus })
                            }
                            className="h-7 px-1.5 border border-border rounded bg-white text-xs focus:ring-1 focus:ring-brand text-text-primary"
                            title="Quick status change"
                          >
                            <option value="AVAILABLE">Available</option>
                            <option value="ON_TRIP">On Trip</option>
                            <option value="IN_SHOP">In Shop</option>
                            <option value="RETIRED">Retired</option>
                          </select>

                          <button
                            onClick={() => openDelete(vehicle)}
                            disabled={vehicle.status === 'ON_TRIP'}
                            className={`${
                              vehicle.status === 'ON_TRIP'
                                ? 'text-text-muted cursor-not-allowed opacity-50'
                                : 'text-text-secondary hover:text-status-danger'
                            } transition-colors p-1`}
                            title={vehicle.status === 'ON_TRIP' ? 'Vehicles on a trip cannot be deleted' : 'Delete Vehicle'}
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-surface text-sm text-text-secondary">
                <div>
                  Showing page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} assets)
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

      {/* ─── View Details Modal ─── */}
      {isViewOpen && viewingVehicle && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="bg-white rounded border border-border w-full max-w-2xl shadow-modal animate-slide-in overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
              <div>
                <h3 className="font-semibold text-text-primary text-base">Vehicle Details</h3>
                <p className="text-2xs text-text-secondary mt-0.5">Asset identifier: {viewingVehicle.id}</p>
              </div>
              <button onClick={() => setIsViewOpen(false)} className="text-text-muted hover:text-text-primary transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div className="flex items-center gap-3">
                <FileText size={16} className="text-text-muted" />
                <div>
                  <p className="text-xs text-text-secondary">Registration Number</p>
                  <p className="font-semibold font-mono text-brand mt-0.5">{viewingVehicle.registrationNumber}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Layers size={16} className="text-text-muted" />
                <div>
                  <p className="text-xs text-text-secondary">Vehicle Name</p>
                  <p className="font-semibold mt-0.5">{viewingVehicle.vehicleName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Compass size={16} className="text-text-muted" />
                <div>
                  <p className="text-xs text-text-secondary">Manufacturer / Model</p>
                  <p className="mt-0.5">{viewingVehicle.manufacturer} {viewingVehicle.vehicleModel}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Layers size={16} className="text-text-muted" />
                <div>
                  <p className="text-xs text-text-secondary">Vehicle Type</p>
                  <p className="mt-0.5">{viewingVehicle.vehicleType}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Scale size={16} className="text-text-muted" />
                <div>
                  <p className="text-xs text-text-secondary">Maximum Load Capacity</p>
                  <p className="mt-0.5">{viewingVehicle.maximumLoadCapacity} kg</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Layers size={16} className="text-text-muted" />
                <div>
                  <p className="text-xs text-text-secondary">Acquisition Cost</p>
                  <p className="mt-0.5 font-medium">{formatCurrency(viewingVehicle.acquisitionCost)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-text-muted" />
                <div>
                  <p className="text-xs text-text-secondary">Current Odometer / Region</p>
                  <p className="mt-0.5">{viewingVehicle.currentOdometer} km ({viewingVehicle.region})</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-text-muted" />
                <div>
                  <p className="text-xs text-text-secondary">Registration Expiry Date</p>
                  <p className="mt-0.5 font-medium">{formatDate(viewingVehicle.registrationExpiry)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-text-muted" />
                <div>
                  <p className="text-xs text-text-secondary">Insurance Expiry Date</p>
                  <p className="mt-0.5 font-medium">{formatDate(viewingVehicle.insuranceExpiry)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock size={16} className="text-text-muted" />
                <div>
                  <p className="text-xs text-text-secondary">Current Status</p>
                  <div className="mt-0.5">
                    <Badge variant={statusBadgeVariant(viewingVehicle.status)} dot>
                      {viewingVehicle.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="col-span-2 pt-2 border-t border-border mt-2">
                <p className="text-xs text-text-secondary">Operational Notes</p>
                <p className="mt-1 bg-surface p-2.5 rounded border border-border text-xs text-text-secondary italic">
                  {viewingVehicle.notes || 'No operational notes attached to this vehicle.'}
                </p>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-border bg-surface flex justify-end">
              <Button variant="secondary" onClick={() => setIsViewOpen(false)}>
                Close Panel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Create/Edit Modal Form ─── */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="bg-white rounded border border-border w-full max-w-xl shadow-modal animate-slide-in overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
              <h3 className="font-semibold text-text-primary text-base">
                {editingVehicle ? 'Edit Vehicle Profile' : 'Register Vehicle Asset'}
              </h3>
              <button onClick={closeForm} className="text-text-muted hover:text-text-primary transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  {...register('registrationNumber')}
                  label="Registration Number"
                  placeholder="e.g. CA-992-XY"
                  required
                  error={errors.registrationNumber?.message}
                />
                <Input
                  {...register('vehicleName')}
                  label="Vehicle Name"
                  placeholder="e.g. Ford Transit F-2"
                  required
                  error={errors.vehicleName?.message}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  {...register('manufacturer')}
                  label="Manufacturer"
                  placeholder="e.g. Ford"
                  required
                  error={errors.manufacturer?.message}
                />
                <Input
                  {...register('vehicleModel')}
                  label="Model"
                  placeholder="e.g. Transit Cargo"
                  required
                  error={errors.vehicleModel?.message}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Type Selection */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-text-primary">
                    Vehicle Type <span className="text-status-danger">*</span>
                  </label>
                  <select
                    {...register('vehicleType')}
                    className="h-9 border border-border rounded px-3 text-sm focus:ring-2 focus:ring-brand focus:border-brand focus:outline-none"
                  >
                    <option value="">Select Type</option>
                    {VEHICLE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  {errors.vehicleType && <p className="text-xs text-status-danger">{errors.vehicleType.message}</p>}
                </div>

                <Input
                  {...register('manufacturingYear')}
                  label="Manufacturing Year"
                  type="number"
                  required
                  error={errors.manufacturingYear?.message}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input
                  {...register('maximumLoadCapacity')}
                  label="Max Capacity (kg)"
                  type="number"
                  step="any"
                  required
                  error={errors.maximumLoadCapacity?.message}
                />
                <Input
                  {...register('currentOdometer')}
                  label="Odometer (km)"
                  type="number"
                  step="any"
                  required
                  error={errors.currentOdometer?.message}
                />
                <Input
                  {...register('acquisitionCost')}
                  label="Acquisition Cost (₹)"
                  type="number"
                  step="any"
                  required
                  error={errors.acquisitionCost?.message}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input
                  {...register('purchaseDate')}
                  label="Purchase Date"
                  type="date"
                  required
                  error={errors.purchaseDate?.message}
                />
                <Input
                  {...register('insuranceExpiry')}
                  label="Insurance Expiry"
                  type="date"
                  required
                  error={errors.insuranceExpiry?.message}
                />
                <Input
                  {...register('registrationExpiry')}
                  label="Registration Expiry"
                  type="date"
                  required
                  error={errors.registrationExpiry?.message}
                />
              </div>

              {/* Region Selection */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-text-primary">
                  Operating Region <span className="text-status-danger">*</span>
                </label>
                <select
                  {...register('region')}
                  className="h-9 border border-border rounded px-3 text-sm focus:ring-2 focus:ring-brand focus:border-brand focus:outline-none"
                >
                  <option value="">Select Region</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                {errors.region && <p className="text-xs text-status-danger">{errors.region.message}</p>}
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-text-primary">Operational Notes</label>
                <textarea
                  {...register('notes')}
                  placeholder="Any damages, maintenance rules or warnings..."
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
                  {editingVehicle ? 'Save Changes' : 'Register Vehicle'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Dialog ─── */}
      {isDeleteOpen && deletingVehicle && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="bg-white rounded border border-border w-full max-w-md shadow-modal animate-slide-in overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-status-danger-bg rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} className="text-status-danger" />
              </div>
              <h3 className="font-semibold text-text-primary text-base">De-register Vehicle Asset?</h3>
              <p className="text-sm text-text-secondary mt-2">
                Are you sure you want to delete vehicle{' '}
                <strong className="text-text-primary font-semibold">{deletingVehicle.vehicleName}</strong> (
                <span className="font-mono text-xs font-semibold">{deletingVehicle.registrationNumber}</span>)?
              </p>
              <p className="text-2xs text-text-muted mt-1">This action cannot be undone. Audit log entries will be generated.</p>
            </div>
            <div className="px-6 py-3.5 border-t border-border bg-surface flex justify-center gap-3">
              <Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                isLoading={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deletingVehicle.id)}
              >
                Delete Vehicle
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
