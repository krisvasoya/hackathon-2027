import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  SlidersHorizontal,
  Eye,
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  X,
  Compass,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { tripService, TripInput } from '../../services/trip.service';
import { vehicleService } from '../../services/vehicle.service';
import { driverService } from '../../services/driver.service';
import { Card, CardBody, Button, Input, Badge, LoadingSpinner } from '../../components/ui';
import { QUERY_KEYS, ROUTES } from '../../constants';
import { Trip, TripStatus } from '../../types';
import { formatDate } from '../../utils';

// ─── Zod Schema for Trip Creation ─────────────────────────────────────────────
const tripSchema = z.object({
  source: z.string().min(1, 'Source is required'),
  destination: z.string().min(1, 'Destination is required'),
  vehicleId: z.string().uuid('Please select a valid vehicle'),
  driverId: z.string().uuid('Please select a valid driver'),
  cargoWeight: z.coerce
    .number()
    .positive('Cargo weight must be greater than zero'),
  plannedDistance: z.coerce
    .number()
    .positive('Planned distance must be greater than zero'),
  estimatedDuration: z.coerce
    .number()
    .int('Must be an integer')
    .positive('Estimated duration must be greater than zero'),
  tripRevenue: z.coerce
    .number()
    .nonnegative('Revenue cannot be negative'),
  remarks: z.string().nullable().optional(),
});

type TripFormValues = z.infer<typeof tripSchema>;

export default function TripsPage(): React.JSX.Element {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const isEditor = hasRole(['SUPER_ADMIN', 'FLEET_MANAGER', 'DISPATCHER']);

  // Listing State
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TripStatus | ''>('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [driverFilter, setDriverFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancellingTrip, setCancellingTrip] = useState<Trip | null>(null);

  // Form Setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TripFormValues>({
    resolver: zodResolver(tripSchema),
  });

  // Query trips
  const { data, isLoading, error } = useQuery({
    queryKey: [
      QUERY_KEYS.TRIPS,
      page,
      search,
      statusFilter,
      vehicleFilter,
      driverFilter,
      startDateFilter,
      endDateFilter,
      sortBy,
      sortOrder,
    ],
    queryFn: () =>
      tripService.getTrips({
        page,
        limit: 10,
        search,
        status: statusFilter,
        vehicleId: vehicleFilter || undefined,
        driverId: driverFilter || undefined,
        startDate: startDateFilter || undefined,
        endDate: endDateFilter || undefined,
        sortBy,
        sortOrder,
      }),
  });

  // Query Vehicles and Drivers list for filters and form dropdowns
  const { data: vehiclesData } = useQuery({
    queryKey: [QUERY_KEYS.VEHICLES, 'lookup'],
    queryFn: () => vehicleService.getVehicles({ page: 1, limit: 100 }),
  });

  const { data: driversData } = useQuery({
    queryKey: [QUERY_KEYS.DRIVERS, 'lookup'],
    queryFn: () => driverService.getDrivers({ page: 1, limit: 100 }),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: tripService.createTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRIPS] });
      toast.success('Trip registered in DRAFT state successfully');
      setIsCreateOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to register trip');
    },
  });

  const dispatchMutation = useMutation({
    mutationFn: tripService.dispatchTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRIPS] });
      toast.success('Trip status changed to DISPATCHED. Driver and Vehicle status set to ON TRIP.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Dispatch failed');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: tripService.cancelTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRIPS] });
      toast.success('Trip cancelled successfully. Driver and Vehicle released.');
      setIsCancelOpen(false);
      setCancellingTrip(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Cancellation failed');
    },
  });

  // Modal handlers
  const openCreateModal = () => {
    reset({
      source: '',
      destination: '',
      vehicleId: '',
      driverId: '',
      cargoWeight: 0,
      plannedDistance: 0,
      estimatedDuration: 60,
      tripRevenue: 0,
      remarks: '',
    });
    setIsCreateOpen(true);
  };

  const onSubmit = (values: TripFormValues) => {
    const cleanValues: TripInput = {
      ...values,
      remarks: values.remarks || null,
    };
    createMutation.mutate(cleanValues);
  };

  // Badge variants
  const statusBadgeVariant = (status: TripStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'neutral';
      case 'DISPATCHED':
        return 'info';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'danger';
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Filter lists down to AVAILABLE ones for creation form
  const availableVehicles = vehiclesData?.data.filter(v => v.status === 'AVAILABLE') || [];
  const availableDrivers = driversData?.data.filter(d => d.status === 'AVAILABLE' && new Date(d.licenseExpiryDate) >= new Date()) || [];

  return (
    <div className="space-y-6">
      {/* ─── Page Header ─── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Trip Management</h1>
          <p className="page-subtitle">Schedule dispatches, review workflows, and monitor active transit logs</p>
        </div>
        {isEditor && (
          <Button variant="primary" onClick={openCreateModal} leftIcon={<Plus size={16} />}>
            Create Trip Draft
          </Button>
        )}
      </div>

      {/* ─── Search and Filters ─── */}
      <Card>
        <CardBody className="flex flex-col md:flex-row items-center gap-4 py-4 px-5">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 text-text-muted" size={16} />
            <input
              type="text"
              placeholder="Search trip number, driver, vehicle..."
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
              setStatusFilter(e.target.value as TripStatus | '');
              setPage(1);
            }}
            className="h-9 px-3 border border-border rounded bg-white text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand w-full md:w-40"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Vehicle Filter */}
          <select
            value={vehicleFilter}
            onChange={(e) => {
              setVehicleFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 border border-border rounded bg-white text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand w-full md:w-40"
          >
            <option value="">All Vehicles</option>
            {vehiclesData?.data.map((v) => (
              <option key={v.id} value={v.id}>
                {v.vehicleName} ({v.registrationNumber})
              </option>
            ))}
          </select>

          {/* Driver Filter */}
          <select
            value={driverFilter}
            onChange={(e) => {
              setDriverFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 border border-border rounded bg-white text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand w-full md:w-40"
          >
            <option value="">All Drivers</option>
            {driversData?.data.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName}
              </option>
            ))}
          </select>

          {/* Date Range Filters */}
          <div className="flex items-center gap-1.5 w-full md:w-auto">
            <span className="text-xs text-text-secondary whitespace-nowrap">From:</span>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => {
                setStartDateFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 px-2.5 border border-border rounded bg-white text-sm text-text-primary focus:outline-none"
            />
            <span className="text-xs text-text-secondary whitespace-nowrap">To:</span>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => {
                setEndDateFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 px-2.5 border border-border rounded bg-white text-sm text-text-primary focus:outline-none"
            />
          </div>

          {/* Reset Filters */}
          {(search || statusFilter || vehicleFilter || driverFilter || startDateFilter || endDateFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setVehicleFilter('');
                setDriverFilter('');
                setStartDateFilter('');
                setEndDateFilter('');
                setPage(1);
              }}
              className="text-xs text-brand hover:text-brand-hover font-semibold transition-colors h-9 px-2"
            >
              Reset
            </button>
          )}
        </CardBody>
      </Card>

      {/* ─── Table Grid ─── */}
      <Card>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-text-secondary">Loading transit logs...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-status-danger px-6">
            <AlertTriangle size={36} className="mb-2" />
            <h3 className="font-semibold">Failed to load Trip logs</h3>
            <p className="text-xs text-text-secondary mt-1">{(error as Error).message || 'Database connection error'}</p>
          </div>
        ) : !data || data.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <Compass size={40} className="text-text-muted mb-3" />
            <h3 className="text-sm font-semibold text-text-primary">No trip dispatches found</h3>
            <p className="text-xs text-text-secondary mt-1">Create a new trip draft to schedule dispatches.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-text-primary">
              <thead className="bg-surface text-text-secondary border-b border-border font-medium">
                <tr>
                  <th
                    className="px-6 py-3 cursor-pointer select-none hover:text-text-primary"
                    onClick={() => handleSort('tripNumber')}
                  >
                    Trip ID {sortBy === 'tripNumber' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="px-6 py-3">Vehicle</th>
                  <th className="px-6 py-3">Driver</th>
                  <th className="px-6 py-3">Source Route</th>
                  <th className="px-6 py-3">Destination</th>
                  <th
                    className="px-6 py-3 cursor-pointer select-none hover:text-text-primary"
                    onClick={() => handleSort('cargoWeight')}
                  >
                    Cargo (kg) {sortBy === 'cargoWeight' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th
                    className="px-6 py-3 cursor-pointer select-none hover:text-text-primary"
                    onClick={() => handleSort('plannedDistance')}
                  >
                    Distance {sortBy === 'plannedDistance' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th
                    className="px-6 py-3 cursor-pointer select-none hover:text-text-primary"
                    onClick={() => handleSort('status')}
                  >
                    Status {sortBy === 'status' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th
                    className="px-6 py-3 cursor-pointer select-none hover:text-text-primary"
                    onClick={() => handleSort('tripStartTime')}
                  >
                    Start Time {sortBy === 'tripStartTime' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {data.data.map((trip: Trip) => (
                  <tr key={trip.id} className="table-row-hover">
                    <td className="px-6 py-3.5 font-mono text-xs font-semibold text-brand">
                      <button onClick={() => navigate(ROUTES.TRIP_DETAILS.replace(':id', trip.id))} className="hover:underline text-left">
                        {trip.tripNumber}
                      </button>
                    </td>
                    <td className="px-6 py-3.5 font-medium">
                      {trip.vehicle ? `${trip.vehicle.vehicleName} (${trip.vehicle.registrationNumber})` : '—'}
                    </td>
                    <td className="px-6 py-3.5 text-text-secondary">{trip.driver ? trip.driver.fullName : '—'}</td>
                    <td className="px-6 py-3.5 text-text-secondary">{trip.source}</td>
                    <td className="px-6 py-3.5 text-text-secondary">{trip.destination}</td>
                    <td className="px-6 py-3.5 text-text-secondary">{trip.cargoWeight} kg</td>
                    <td className="px-6 py-3.5 text-text-secondary">{trip.plannedDistance} km</td>
                    <td className="px-6 py-3.5">
                      <Badge variant={statusBadgeVariant(trip.status)} dot>
                        {trip.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-text-secondary">
                      {trip.tripStartTime ? formatDate(trip.tripStartTime) : '—'}
                    </td>
                    <td className="px-6 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => navigate(ROUTES.TRIP_DETAILS.replace(':id', trip.id))}
                        className="text-text-secondary hover:text-brand transition-colors p-1"
                        title="View Details"
                      >
                        <Eye size={15} />
                      </button>

                      {isEditor && (
                        <>
                          {trip.status === 'DRAFT' && (
                            <button
                              onClick={() => dispatchMutation.mutate(trip.id)}
                              className="text-status-success hover:text-status-success-hover transition-colors p-1"
                              title="Dispatch Trip"
                            >
                              <Play size={15} />
                            </button>
                          )}

                          {trip.status === 'DISPATCHED' && (
                            <button
                              onClick={() => navigate(ROUTES.TRIP_DETAILS.replace(':id', trip.id))}
                              className="text-status-info hover:text-status-info-hover transition-colors p-1"
                              title="Resolve Completion"
                            >
                              <CheckCircle size={15} />
                            </button>
                          )}

                          {(trip.status === 'DRAFT' || trip.status === 'DISPATCHED') && (
                            <button
                              onClick={() => {
                                setCancellingTrip(trip);
                                setIsCancelOpen(true);
                              }}
                              className="text-text-secondary hover:text-status-danger transition-colors p-1"
                              title="Cancel Trip"
                            >
                              <XCircle size={15} />
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
                  Showing page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} records)
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

      {/* ─── Create Modal Form ─── */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="bg-white rounded border border-border w-full max-w-xl shadow-modal animate-slide-in overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
              <h3 className="font-semibold text-text-primary text-base">Schedule New Dispatch Draft</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-text-muted hover:text-text-primary transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  {...register('source')}
                  label="Source Route"
                  placeholder="e.g. Chicago terminal A"
                  required
                  error={errors.source?.message}
                />
                <Input
                  {...register('destination')}
                  label="Destination terminal"
                  placeholder="e.g. New York depot C"
                  required
                  error={errors.destination?.message}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Vehicle Selection */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-text-primary">
                    Vehicle Asset <span className="text-status-danger">*</span>
                  </label>
                  <select
                    {...register('vehicleId')}
                    className="h-9 border border-border rounded px-3 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
                  >
                    <option value="">Select Available Vehicle</option>
                    {availableVehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vehicleName} ({v.registrationNumber}) — Cap: {v.maximumLoadCapacity} kg
                      </option>
                    ))}
                  </select>
                  {errors.vehicleId && <p className="text-xs text-status-danger">{errors.vehicleId.message}</p>}
                </div>

                {/* Driver Selection */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-text-primary">
                    Assigned Driver <span className="text-status-danger">*</span>
                  </label>
                  <select
                    {...register('driverId')}
                    className="h-9 border border-border rounded px-3 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
                  >
                    <option value="">Select Available Driver</option>
                    {availableDrivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.fullName} — Safety: {d.safetyScore}/100
                      </option>
                    ))}
                  </select>
                  {errors.driverId && <p className="text-xs text-status-danger">{errors.driverId.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  {...register('cargoWeight')}
                  label="Cargo Weight (kg)"
                  type="number"
                  step="any"
                  required
                  error={errors.cargoWeight?.message}
                />
                <Input
                  {...register('plannedDistance')}
                  label="Distance (km)"
                  type="number"
                  step="any"
                  required
                  error={errors.plannedDistance?.message}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  {...register('estimatedDuration')}
                  label="Est. Duration (minutes)"
                  type="number"
                  required
                  error={errors.estimatedDuration?.message}
                />
                <Input
                  {...register('tripRevenue')}
                  label="Revenue Forecast ($)"
                  type="number"
                  step="any"
                  required
                  error={errors.tripRevenue?.message}
                />
              </div>

              {/* Remarks */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-text-primary">Dispatched remarks</label>
                <textarea
                  {...register('remarks')}
                  placeholder="Special instructions, gate key codes..."
                  rows={2}
                  className="border border-border rounded p-2.5 text-sm focus:ring-2 focus:ring-brand focus:border-brand focus:outline-none"
                />
                {errors.remarks && <p className="text-xs text-status-danger">{errors.remarks.message}</p>}
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-3 bg-white">
                <Button variant="secondary" type="button" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  isLoading={createMutation.isPending}
                >
                  Create Draft
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Cancel Confirmation Modal ─── */}
      {isCancelOpen && cancellingTrip && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="bg-white rounded border border-border w-full max-w-md shadow-modal animate-slide-in overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-status-danger-bg rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} className="text-status-danger" />
              </div>
              <h3 className="font-semibold text-text-primary text-base">Cancel Dispatched Route?</h3>
              <p className="text-sm text-text-secondary mt-2">
                Are you sure you want to cancel trip{' '}
                <strong className="text-text-primary font-semibold">{cancellingTrip.tripNumber}</strong>?
              </p>
              <p className="text-2xs text-text-muted mt-1">
                The driver ({cancellingTrip.driver?.fullName}) and vehicle asset will automatically revert to AVAILABLE state.
              </p>
            </div>
            <div className="px-6 py-3.5 border-t border-border bg-surface flex justify-center gap-3">
              <Button variant="secondary" onClick={() => setIsCancelOpen(false)}>
                Go Back
              </Button>
              <Button
                variant="danger"
                isLoading={cancelMutation.isPending}
                onClick={() => cancelMutation.mutate(cancellingTrip.id)}
              >
                Cancel Trip
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
