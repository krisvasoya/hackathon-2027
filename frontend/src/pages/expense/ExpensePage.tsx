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
  AlertTriangle,
  X,
  FileText,
  DollarSign,
  TrendingUp,
  Percent,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { expenseService, ExpenseInput } from '../../services/expense.service';
import { vehicleService } from '../../services/vehicle.service';
import { tripService } from '../../services/trip.service';
import { Card, CardBody, Button, Input, Badge, LoadingSpinner } from '../../components/ui';
import { QUERY_KEYS } from '../../constants';
import { Expense } from '../../types';
import { formatDate } from '../../utils';

// Zod Schema for Expense registration
const expenseSchema = z.object({
  vehicleId: z.string().uuid('Please select a valid vehicle'),
  tripId: z.string().uuid('Please select a valid trip').or(z.literal('')).optional(),
  expenseType: z.enum(['Toll', 'Parking', 'Insurance', 'Repair', 'Other']),
  amount: z.coerce
    .number()
    .positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().min(1, 'Date is required'),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export default function ExpensePage(): React.JSX.Element {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();

  const isEditor = hasRole(['SUPER_ADMIN', 'FLEET_MANAGER', 'FINANCIAL_ANALYST']);

  // Filters State
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [expenseTypeFilter, setExpenseTypeFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form Setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
  });

  // Queries - Expenses list
  const { data, isLoading, error } = useQuery({
    queryKey: [
      QUERY_KEYS.EXPENSES ?? 'expenses',
      page,
      search,
      vehicleFilter,
      expenseTypeFilter,
      startDateFilter,
      endDateFilter,
    ],
    queryFn: () =>
      expenseService.getExpenses({
        page,
        limit: 10,
        search,
        vehicleId: vehicleFilter || undefined,
        expenseType: expenseTypeFilter || undefined,
        startDate: startDateFilter || undefined,
        endDate: endDateFilter || undefined,
      }),
  });

  // Query vehicle list for dropdowns
  const { data: vehiclesData } = useQuery({
    queryKey: [QUERY_KEYS.VEHICLES, 'lookup'],
    queryFn: () => vehicleService.getVehicles({ page: 1, limit: 100 }),
  });

  const { data: tripsData } = useQuery({
    queryKey: [QUERY_KEYS.TRIPS, 'lookup'],
    queryFn: () => tripService.getTrips({ page: 1, limit: 100 }),
  });

  // Query vehicle ROI stats (if a vehicle filter is set)
  const { data: vehicleStats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['vehicle_financials', vehicleFilter],
    queryFn: () => expenseService.getVehicleFinancials(vehicleFilter),
    enabled: !!vehicleFilter,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: expenseService.createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EXPENSES ?? 'expenses'] });
      toast.success('Expense recorded in ledger');
      setIsCreateOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to submit expense log');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: expenseService.deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EXPENSES ?? 'expenses'] });
      toast.success('Expense record deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete expense record');
    },
  });

  const openCreateModal = () => {
    reset({
      vehicleId: '',
      tripId: '',
      expenseType: 'Other',
      amount: 0,
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
    setIsCreateOpen(true);
  };

  const onSubmit = (values: ExpenseFormValues) => {
    const cleanValues: ExpenseInput = {
      ...values,
      tripId: values.tripId || null,
    };
    createMutation.mutate(cleanValues);
  };

  // Badge variants
  const typeBadgeVariant = (type: string) => {
    switch (type) {
      case 'Fuel':
        return 'info';
      case 'Maintenance':
      case 'Repair':
        return 'warning';
      case 'Toll':
        return 'neutral';
      case 'Insurance':
        return 'success';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Expense & ROI Ledger</h1>
          <p className="page-subtitle">Compile operational costs, track toll/parking receipts, and audit vehicle ROI metrics</p>
        </div>
        {isEditor && (
          <Button variant="primary" onClick={openCreateModal} leftIcon={<Plus size={16} />}>
            Record Expense
          </Button>
        )}
      </div>

      {/* ─── Vehicle ROI Analysis Panel (Display when vehicle filter is selected) ─── */}
      {vehicleFilter ? (
        isStatsLoading ? (
          <Card>
            <CardBody className="py-8 flex flex-col items-center justify-center gap-2">
              <LoadingSpinner size="md" />
              <p className="text-xs text-text-secondary">Recalculating ROI metrics...</p>
            </CardBody>
          </Card>
        ) : vehicleStats ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in">
            {/* Operational Cost Card */}
            <Card className="border-l-4 border-l-status-warning bg-surface">
              <CardBody className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-2xs font-semibold text-text-secondary uppercase">Operational Cost</p>
                  <p className="text-lg font-bold mt-1 text-text-primary">
                    ${Number(vehicleStats.totalOperationalCost).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-text-muted mt-0.5">
                    Fuel: ${Number(vehicleStats.totalFuel).toLocaleString()} | Maint: ${Number(vehicleStats.totalMaintenance).toLocaleString()}
                  </p>
                </div>
                <div className="p-2.5 bg-status-warning-bg rounded">
                  <DollarSign size={18} className="text-status-warning" />
                </div>
              </CardBody>
            </Card>

            {/* Total Revenue Card */}
            <Card className="border-l-4 border-l-status-success bg-surface">
              <CardBody className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-2xs font-semibold text-text-secondary uppercase">Total Revenue</p>
                  <p className="text-lg font-bold mt-1 text-text-primary">
                    ${Number(vehicleStats.totalRevenue).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-text-muted mt-0.5">Completed transit logs</p>
                </div>
                <div className="p-2.5 bg-status-success-bg rounded">
                  <TrendingUp size={18} className="text-status-success" />
                </div>
              </CardBody>
            </Card>

            {/* ROI Card */}
            <Card className={`border-l-4 ${vehicleStats.roi >= 0 ? 'border-l-brand' : 'border-l-status-danger'} bg-surface`}>
              <CardBody className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-2xs font-semibold text-text-secondary uppercase">Vehicle ROI</p>
                  <p className={`text-lg font-bold mt-1 ${vehicleStats.roi >= 0 ? 'text-brand' : 'text-status-danger'}`}>
                    ${Number(vehicleStats.roi).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-text-muted mt-0.5">Revenue - Ops Cost</p>
                </div>
                <div className={`p-2.5 ${vehicleStats.roi >= 0 ? 'bg-brand-light' : 'bg-status-danger-bg'} rounded`}>
                  <DollarSign size={18} className={vehicleStats.roi >= 0 ? 'text-brand' : 'text-status-danger'} />
                </div>
              </CardBody>
            </Card>

            {/* Profit Margin Card */}
            <Card className="border-l-4 border-l-status-info bg-surface">
              <CardBody className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-2xs font-semibold text-text-secondary uppercase">Margin Rate</p>
                  <p className="text-lg font-bold mt-1 text-text-primary">
                    {vehicleStats.totalRevenue > 0
                      ? `${((vehicleStats.roi / vehicleStats.totalRevenue) * 100).toFixed(1)}%`
                      : '0.0%'}
                  </p>
                  <p className="text-[10px] text-text-muted mt-0.5">ROI / Revenue ratio</p>
                </div>
                <div className="p-2.5 bg-status-info-bg rounded">
                  <Percent size={18} className="text-status-info" />
                </div>
              </CardBody>
            </Card>
          </div>
        ) : null
      ) : (
        <Card className="bg-surface border-dashed border-border py-4 px-5 flex items-center justify-between">
          <p className="text-xs text-text-secondary">
            Select a vehicle in the filter toolbar below to audit aggregate Operational Cost, Revenue, and ROI.
          </p>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardBody className="flex flex-col md:flex-row items-center gap-4 py-4 px-5">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 text-text-muted" size={16} />
            <input
              type="text"
              placeholder="Search description..."
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

          {/* Expense Type Filter */}
          <select
            value={expenseTypeFilter}
            onChange={(e) => {
              setExpenseTypeFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 border border-border rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand w-full md:w-40"
          >
            <option value="">All Expense Types</option>
            <option value="Fuel">Fuel</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Toll">Toll</option>
            <option value="Parking">Parking</option>
            <option value="Insurance">Insurance</option>
            <option value="Repair">Repair</option>
            <option value="Other">Other</option>
          </select>

          {/* Date Range filters */}
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

          {/* Reset Filters */}
          {(search || vehicleFilter || expenseTypeFilter || startDateFilter || endDateFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setVehicleFilter('');
                setExpenseTypeFilter('');
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

      {/* Ledger Table */}
      <Card>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-text-secondary">Loading financial ledger...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-status-danger px-6">
            <AlertTriangle size={36} className="mb-2" />
            <h3 className="font-semibold">Failed to load ledger logs</h3>
            <p className="text-xs text-text-secondary mt-1">{(error as Error).message}</p>
          </div>
        ) : !data || data.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <FileText size={40} className="text-text-muted mb-3" />
            <h3 className="text-sm font-semibold text-text-primary">No expense entries found</h3>
            <p className="text-xs text-text-secondary mt-1">Record toll tickets, repair costs, or select a vehicle filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-text-primary">
              <thead className="bg-surface text-text-secondary border-b border-border font-medium font-sans">
                <tr>
                  <th className="px-6 py-3">Vehicle</th>
                  <th className="px-6 py-3">Trip Number</th>
                  <th className="px-6 py-3">Expense Type</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Transaction Date</th>
                  {hasRole(['SUPER_ADMIN', 'FLEET_MANAGER']) && <th className="px-6 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white font-sans">
                {data.data.map((expense: Expense) => (
                  <tr key={expense.id} className="table-row-hover">
                    <td className="px-6 py-3.5 font-medium">
                      {expense.vehicle ? `${expense.vehicle.vehicleName} (${expense.vehicle.registrationNumber})` : '—'}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs font-semibold text-brand">
                      {expense.trip ? expense.trip.tripNumber : '—'}
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge variant={typeBadgeVariant(expense.expenseType)}>
                        {expense.expenseType}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 text-text-secondary">{expense.description}</td>
                    <td className="px-6 py-3.5 font-semibold text-text-primary">${Number(expense.amount).toLocaleString()}</td>
                    <td className="px-6 py-3.5 text-text-secondary text-xs">{formatDate(expense.date)}</td>
                    {hasRole(['SUPER_ADMIN', 'FLEET_MANAGER']) && (
                      <td className="px-6 py-3.5 text-right">
                        {/* Auto expenses from Fuel and Maintenance are managed by their respective services */}
                        {expense.expenseType !== 'Fuel' && expense.expenseType !== 'Maintenance' ? (
                          <button
                            onClick={() => {
                              if (window.confirm('Delete this expense?')) {
                                deleteMutation.mutate(expense.id);
                              }
                            }}
                            className="text-text-muted hover:text-status-danger transition-colors p-1"
                          >
                            Delete
                          </button>
                        ) : (
                          <span className="text-2xs text-text-muted italic" title="Managed by source fuel/repair ticket">Auto</span>
                        )}
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

      {/* Record Expense Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="bg-white rounded border border-border w-full max-w-lg shadow-modal animate-slide-in overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
              <h3 className="font-semibold text-text-primary text-base flex items-center gap-2">
                <DollarSign size={18} className="text-brand" /> Record Ledger Expense
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-text-muted hover:text-text-primary">
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
                  <option value="">Select Associated Vehicle</option>
                  {vehiclesData?.data.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vehicleName} ({v.registrationNumber})
                    </option>
                  ))}
                </select>
                {errors.vehicleId && <p className="text-xs text-status-danger">{errors.vehicleId.message}</p>}
              </div>

              {/* Trip Selector (Optional) */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-text-primary">Associated Trip (Optional)</label>
                <select
                  {...register('tripId')}
                  className="h-9 border border-border rounded px-3 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
                >
                  <option value="">No Trip Association</option>
                  {tripsData?.data.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.tripNumber} ({t.source} → {t.destination})
                    </option>
                  ))}
                </select>
                {errors.tripId && <p className="text-xs text-status-danger">{errors.tripId.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Expense Type */}
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-text-primary">
                    Expense Category <span className="text-status-danger">*</span>
                  </label>
                  <select
                    {...register('expenseType')}
                    className="h-9 border border-border rounded px-3 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
                  >
                    <option value="Toll">Toll</option>
                    <option value="Parking">Parking</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Repair">Repair</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <Input
                  {...register('amount')}
                  label="Expense Amount ($)"
                  type="number"
                  step="any"
                  required
                  error={errors.amount?.message}
                />
              </div>

              <Input
                {...register('description')}
                label="Expense description"
                placeholder="e.g. Lincoln tunnel toll receipt"
                required
                error={errors.description?.message}
              />

              <Input
                {...register('date')}
                label="Transaction Date"
                type="date"
                required
                error={errors.date?.message}
              />

              <div className="pt-4 border-t border-border flex justify-end gap-3 bg-white">
                <Button variant="secondary" type="button" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" isLoading={createMutation.isPending}>
                  Record Ledger
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
