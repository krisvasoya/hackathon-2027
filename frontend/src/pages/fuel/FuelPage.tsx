import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  SlidersHorizontal,
  AlertTriangle,
  X,
  Fuel,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { fuelService, FuelLogInput } from '../../services/fuel.service';
import { vehicleService } from '../../services/vehicle.service';
import { tripService } from '../../services/trip.service';
import { Card, CardBody, Button, Input, LoadingSpinner } from '../../components/ui';
import { QUERY_KEYS } from '../../constants';
import { FuelLog } from '../../types';
import { formatDate } from '../../utils';

// Zod Schema for Fuel logging
const fuelSchema = z.object({
  vehicleId: z.string().uuid('Please select a valid vehicle'),
  tripId: z.string().uuid('Please select a valid trip').or(z.literal('')).optional(),
  liters: z.coerce
    .number()
    .positive('Liters must be positive')
    .max(1500, 'Liters cannot exceed vehicle reasonable limit of 1500L'),
  pricePerLiter: z.coerce
    .number()
    .positive('Price must be greater than zero'),
  totalCost: z.coerce
    .number()
    .positive('Total cost must be greater than zero'),
  odometer: z.coerce
    .number()
    .nonnegative('Odometer cannot be negative'),
  fuelStation: z.string().min(1, 'Fuel station is required'),
  date: z.string().min(1, 'Refuel date is required'),
});

type FuelFormValues = z.infer<typeof fuelSchema>;

export default function FuelPage(): React.JSX.Element {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();

  const isEditor = hasRole(['SUPER_ADMIN', 'FLEET_MANAGER', 'FINANCIAL_ANALYST', 'DRIVER']);

  // Filters State
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // Modals
  const [isLogOpen, setIsLogOpen] = useState(false);

  // Form Setup
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FuelFormValues>({
    resolver: zodResolver(fuelSchema),
  });

  // Watch Liters and Price to auto-calculate total cost
  const watchedLiters = watch('liters');
  const watchedPrice = watch('pricePerLiter');

  useEffect(() => {
    const liters = Number(watchedLiters || 0);
    const price = Number(watchedPrice || 0);
    if (liters > 0 && price > 0) {
      setValue('totalCost', parseFloat((liters * price).toFixed(2)));
    }
  }, [watchedLiters, watchedPrice, setValue]);

  // Queries
  const { data, isLoading, error } = useQuery({
    queryKey: [
      QUERY_KEYS.FUEL ?? 'fuel',
      page,
      search,
      vehicleFilter,
      startDateFilter,
      endDateFilter,
    ],
    queryFn: () =>
      fuelService.getFuelLogs({
        page,
        limit: 10,
        search,
        vehicleId: vehicleFilter || undefined,
        startDate: startDateFilter || undefined,
        endDate: endDateFilter || undefined,
      }),
  });

  const { data: vehiclesData } = useQuery({
    queryKey: [QUERY_KEYS.VEHICLES, 'lookup'],
    queryFn: () => vehicleService.getVehicles({ page: 1, limit: 100 }),
  });

  const { data: tripsData } = useQuery({
    queryKey: [QUERY_KEYS.TRIPS, 'lookup'],
    queryFn: () => tripService.getTrips({ page: 1, limit: 100 }),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: fuelService.createFuelLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FUEL ?? 'fuel'] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EXPENSES ?? 'expenses'] });
      toast.success('Fuel log receipt registered. Syncing operational expenses...');
      setIsLogOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to submit fuel log');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: fuelService.deleteFuelLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FUEL ?? 'fuel'] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EXPENSES ?? 'expenses'] });
      toast.success('Fuel log deleted. Reversing expense...');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete fuel log');
    },
  });

  const openLogModal = () => {
    reset({
      vehicleId: '',
      tripId: '',
      liters: 0,
      pricePerLiter: 0,
      totalCost: 0,
      odometer: 0,
      fuelStation: '',
      date: new Date().toISOString().split('T')[0],
    });
    setIsLogOpen(true);
  };

  const onSubmit = (values: FuelFormValues) => {
    const cleanValues: FuelLogInput = {
      ...values,
      tripId: values.tripId || null,
    };
    createMutation.mutate(cleanValues);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Fuel Registry & Audits</h1>
          <p className="page-subtitle">Record fuel logs, monitor tank statistics, and audit refuel costs</p>
        </div>
        {isEditor && (
          <Button variant="primary" onClick={openLogModal} leftIcon={<Plus size={16} />}>
            Log Refuel Receipt
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardBody className="flex flex-col md:flex-row items-center gap-4 py-4 px-5">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 text-text-muted" size={16} />
            <input
              type="text"
              placeholder="Search fuel station, vehicle..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full h-9 pl-9 pr-3 rounded border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <SlidersHorizontal size={16} className="text-text-muted hidden md:block" />

          {/* Vehicle Filter */}
          <select
            value={vehicleFilter}
            onChange={(e) => {
              setVehicleFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 border border-border rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand w-full md:w-44"
          >
            <option value="">All Vehicles</option>
            {vehiclesData?.data.map((v) => (
              <option key={v.id} value={v.id}>
                {v.vehicleName} ({v.registrationNumber})
              </option>
            ))}
          </select>

          {/* Date range */}
          <div className="flex items-center gap-1.5 w-full md:w-auto">
            <span className="text-xs text-text-secondary whitespace-nowrap">From:</span>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => {
                setStartDateFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 px-2.5 border border-border rounded bg-white text-sm focus:outline-none"
            />
            <span className="text-xs text-text-secondary whitespace-nowrap">To:</span>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => {
                setEndDateFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 px-2.5 border border-border rounded bg-white text-sm focus:outline-none"
            />
          </div>

          {/* Reset */}
          {(search || vehicleFilter || startDateFilter || endDateFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setVehicleFilter('');
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

      {/* Grid List */}
      <Card>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-text-secondary">Loading refuel ledger...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-status-danger px-6">
            <AlertTriangle size={36} className="mb-2" />
            <h3 className="font-semibold">Failed to load fuel logs</h3>
            <p className="text-xs text-text-secondary mt-1">{(error as Error).message}</p>
          </div>
        ) : !data || data.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <Fuel size={40} className="text-text-muted mb-3" />
            <h3 className="text-sm font-semibold text-text-primary">No refuel logs registered</h3>
            <p className="text-xs text-text-secondary mt-1">Log fuel receipts to compile vehicle efficiencies.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-text-primary">
              <thead className="bg-surface text-text-secondary border-b border-border font-medium font-sans">
                <tr>
                  <th className="px-6 py-3">Vehicle</th>
                  <th className="px-6 py-3">Trip Number</th>
                  <th className="px-6 py-3">Fuel Station</th>
                  <th className="px-6 py-3">Liters (L)</th>
                  <th className="px-6 py-3">Price / Liter</th>
                  <th className="px-6 py-3">Total Cost</th>
                  <th className="px-6 py-3">Odometer</th>
                  <th className="px-6 py-3">Refuel Date</th>
                  {hasRole(['SUPER_ADMIN', 'FLEET_MANAGER']) && <th className="px-6 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white font-sans">
                {data.data.map((log: FuelLog) => (
                  <tr key={log.id} className="table-row-hover">
                    <td className="px-6 py-3.5 font-medium">
                      {log.vehicle ? `${log.vehicle.vehicleName} (${log.vehicle.registrationNumber})` : '—'}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs font-semibold text-brand">
                      {log.trip ? log.trip.tripNumber : '—'}
                    </td>
                    <td className="px-6 py-3.5 text-text-secondary">{log.fuelStation}</td>
                    <td className="px-6 py-3.5 text-text-secondary">{log.liters} L</td>
                    <td className="px-6 py-3.5 text-text-secondary">${Number(log.pricePerLiter).toFixed(2)}</td>
                    <td className="px-6 py-3.5 font-semibold text-text-primary">${Number(log.totalCost).toLocaleString()}</td>
                    <td className="px-6 py-3.5 text-text-secondary">{log.odometer} km</td>
                    <td className="px-6 py-3.5 text-text-secondary text-xs">{formatDate(log.date)}</td>
                    {hasRole(['SUPER_ADMIN', 'FLEET_MANAGER']) && (
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => {
                            if (window.confirm('Delete this fuel log? The synchronized expense will also be reverted.')) {
                              deleteMutation.mutate(log.id);
                            }
                          }}
                          className="text-text-muted hover:text-status-danger transition-colors p-1"
                        >
                          Delete
                        </button>
                      </td>
                    )}
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

      {/* Log refuel modal */}
      {isLogOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="bg-white rounded border border-border w-full max-w-lg shadow-modal animate-slide-in overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
              <h3 className="font-semibold text-text-primary text-base flex items-center gap-2">
                <Fuel size={18} className="text-brand" /> Log Fuel Receipt
              </h3>
              <button onClick={() => setIsLogOpen(false)} className="text-text-muted hover:text-text-primary">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Vehicle Selector */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-text-primary">
                  Vehicle Asset <span className="text-status-danger">*</span>
                </label>
                <select
                  {...register('vehicleId')}
                  className="h-9 border border-border rounded px-3 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
                >
                  <option value="">Select Refueling Vehicle</option>
                  {vehiclesData?.data.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vehicleName} ({v.registrationNumber}) — Odo: {v.currentOdometer} km
                    </option>
                  ))}
                </select>
                {errors.vehicleId && <p className="text-xs text-status-danger">{errors.vehicleId.message}</p>}
              </div>

              {/* Trip Selector (Optional) */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-text-primary">Associated Active Trip (Optional)</label>
                <select
                  {...register('tripId')}
                  className="h-9 border border-border rounded px-3 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
                >
                  <option value="">No Trip Association</option>
                  {tripsData?.data.filter(t => t.status === 'DISPATCHED').map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.tripNumber} ({t.source} → {t.destination})
                    </option>
                  ))}
                </select>
                {errors.tripId && <p className="text-xs text-status-danger">{errors.tripId.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  {...register('liters')}
                  label="Liters (L)"
                  type="number"
                  step="any"
                  required
                  error={errors.liters?.message}
                />
                <Input
                  {...register('pricePerLiter')}
                  label="Price per Liter ($)"
                  type="number"
                  step="any"
                  required
                  error={errors.pricePerLiter?.message}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  {...register('totalCost')}
                  label="Total Cost ($)"
                  type="number"
                  step="any"
                  required
                  error={errors.totalCost?.message}
                />
                <Input
                  {...register('odometer')}
                  label="Odometer reading (km)"
                  type="number"
                  step="any"
                  required
                  error={errors.odometer?.message}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  {...register('fuelStation')}
                  label="Fuel Station Name"
                  placeholder="e.g. Shell Station NYC"
                  required
                  error={errors.fuelStation?.message}
                />
                <Input
                  {...register('date')}
                  label="Refuel Date"
                  type="date"
                  required
                  error={errors.date?.message}
                />
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-3 bg-white">
                <Button variant="secondary" type="button" onClick={() => setIsLogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" isLoading={createMutation.isPending}>
                  Submit Log
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
