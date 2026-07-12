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
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  X,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { maintenanceService, MaintenanceInput, CompleteMaintenanceInput } from '../../services/maintenance.service';
import { vehicleService } from '../../services/vehicle.service';
import { Card, CardBody, Button, Input, Badge, LoadingSpinner } from '../../components/ui';
import { QUERY_KEYS } from '../../constants';
import { Maintenance, MaintenanceStatus } from '../../types';
import { formatDate } from '../../utils';

// Zod Schema for Scheduling
const scheduleSchema = z.object({
  vehicleId: z.string().uuid('Please select a valid vehicle'),
  maintenanceType: z.string().min(1, 'Maintenance type is required'),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']),
  scheduledDate: z.string().min(1, 'Scheduled date is required'),
  estimatedCost: z.coerce
    .number()
    .nonnegative('Estimated cost cannot be negative'),
  workshopName: z.string().min(1, 'Workshop name is required'),
  technicianName: z.string().min(1, 'Technician name is required'),
  notes: z.string().nullable().optional(),
});

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

// Zod Schema for Completion
const completionSchema = z.object({
  actualCost: z.coerce
    .number()
    .nonnegative('Actual cost cannot be negative'),
  completedDate: z.string().min(1, 'Completed date is required'),
  notes: z.string().nullable().optional(),
});

type CompletionFormValues = z.infer<typeof completionSchema>;

export default function MaintenancePage(): React.JSX.Element {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();

  const isEditor = hasRole(['SUPER_ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER']);

  // Filters State
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | ''>('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [completingTicket, setCompletingTicket] = useState<Maintenance | null>(null);

  // Forms
  const {
    register: registerSchedule,
    handleSubmit: handleSubmitSchedule,
    reset: resetSchedule,
    formState: { errors: scheduleErrors },
  } = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
  });

  const {
    register: registerComplete,
    handleSubmit: handleSubmitComplete,
    reset: resetComplete,
    formState: { errors: completeErrors },
  } = useForm<CompletionFormValues>({
    resolver: zodResolver(completionSchema),
  });

  // Queries
  const { data, isLoading, error } = useQuery({
    queryKey: [
      QUERY_KEYS.MAINTENANCE ?? 'maintenance',
      page,
      search,
      statusFilter,
      vehicleFilter,
      priorityFilter,
      typeFilter,
    ],
    queryFn: () =>
      maintenanceService.getMaintenances({
        page,
        limit: 10,
        search,
        status: statusFilter || undefined,
        vehicleId: vehicleFilter || undefined,
        priority: priorityFilter || undefined,
        maintenanceType: typeFilter || undefined,
      }),
  });

  const { data: vehiclesData } = useQuery({
    queryKey: [QUERY_KEYS.VEHICLES, 'lookup'],
    queryFn: () => vehicleService.getVehicles({ page: 1, limit: 100 }),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: maintenanceService.createMaintenance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MAINTENANCE ?? 'maintenance'] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VEHICLES] });
      toast.success('Maintenance ticket scheduled. Vehicle locked to IN SHOP.');
      setIsScheduleOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to schedule maintenance');
    },
  });

  const startMutation = useMutation({
    mutationFn: maintenanceService.startMaintenance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MAINTENANCE ?? 'maintenance'] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VEHICLES] });
      toast.success('Maintenance initiated. Vehicle set to IN SHOP.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to start maintenance');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: maintenanceService.cancelMaintenance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MAINTENANCE ?? 'maintenance'] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VEHICLES] });
      toast.success('Maintenance cancelled successfully. Vehicle released.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to cancel maintenance');
    },
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CompleteMaintenanceInput }) =>
      maintenanceService.completeMaintenance(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MAINTENANCE ?? 'maintenance'] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VEHICLES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EXPENSES ?? 'expenses'] });
      toast.success('Maintenance ticket closed. Actual cost written to Expenses.');
      setIsCompleteOpen(false);
      setCompletingTicket(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to complete maintenance');
    },
  });

  // Modal Openers
  const openScheduleModal = () => {
    resetSchedule({
      vehicleId: '',
      maintenanceType: '',
      description: '',
      priority: 'Medium',
      scheduledDate: new Date().toISOString().split('T')[0],
      estimatedCost: 0,
      workshopName: '',
      technicianName: '',
      notes: '',
    });
    setIsScheduleOpen(true);
  };

  const openCompleteModal = (ticket: Maintenance) => {
    setCompletingTicket(ticket);
    resetComplete({
      actualCost: Number(ticket.estimatedCost),
      completedDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setIsCompleteOpen(true);
  };

  // Submit handlers
  const onScheduleSubmit = (values: ScheduleFormValues) => {
    const cleanValues: MaintenanceInput = {
      ...values,
      notes: values.notes || null,
    };
    createMutation.mutate(cleanValues);
  };

  const onCompleteSubmit = (values: CompletionFormValues) => {
    if (!completingTicket) return;
    const cleanValues: CompleteMaintenanceInput = {
      ...values,
      notes: values.notes || null,
    };
    completeMutation.mutate({ id: completingTicket.id, input: cleanValues });
  };

  // Badge configs
  const statusBadgeVariant = (status: MaintenanceStatus) => {
    switch (status) {
      case 'PENDING':
        return 'neutral';
      case 'IN_PROGRESS':
        return 'info';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'danger';
    }
  };

  const priorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'danger';
      case 'High':
        return 'warning';
      case 'Medium':
        return 'info';
      default:
        return 'neutral';
    }
  };

  // Filter list of vehicles down to AVAILABLE ones for scheduling form
  const availableVehicles = vehiclesData?.data.filter((v) => v.status === 'AVAILABLE') || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Maintenance & Workshop Management</h1>
          <p className="page-subtitle">Schedule repair tickets, log workshop operations, and monitor vehicle active locks</p>
        </div>
        {isEditor && (
          <Button variant="primary" onClick={openScheduleModal} leftIcon={<Plus size={16} />}>
            Schedule Maintenance
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardBody className="flex flex-col md:flex-row items-center gap-4 py-4 px-5">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 text-text-muted" size={16} />
            <input
              type="text"
              placeholder="Search ticket, workshop, technician..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full h-9 pl-9 pr-3 rounded border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <SlidersHorizontal size={16} className="text-text-muted hidden md:block" />

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as MaintenanceStatus | '');
              setPage(1);
            }}
            className="h-9 px-3 border border-border rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand w-full md:w-40"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
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
            className="h-9 px-3 border border-border rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand w-full md:w-44"
          >
            <option value="">All Vehicles</option>
            {vehiclesData?.data.map((v) => (
              <option key={v.id} value={v.id}>
                {v.vehicleName} ({v.registrationNumber})
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 border border-border rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand w-full md:w-40"
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 border border-border rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand w-full md:w-40"
          >
            <option value="">All Types</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Unscheduled">Unscheduled</option>
            <option value="Preventive">Preventive</option>
            <option value="Breakdown">Breakdown</option>
          </select>

          {/* Reset Filters */}
          {(search || statusFilter || vehicleFilter || priorityFilter || typeFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setVehicleFilter('');
                setPriorityFilter('');
                setTypeFilter('');
                setPage(1);
              }}
              className="text-xs text-brand hover:text-brand-hover font-semibold transition-colors h-9 px-2"
            >
              Reset
            </button>
          )}
        </CardBody>
      </Card>

      {/* Data Table */}
      <Card>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-text-secondary">Loading maintenance dossier...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-status-danger px-6">
            <AlertTriangle size={36} className="mb-2" />
            <h3 className="font-semibold">Failed to load maintenance logs</h3>
            <p className="text-xs text-text-secondary mt-1">{(error as Error).message}</p>
          </div>
        ) : !data || data.data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <Wrench size={40} className="text-text-muted mb-3" />
            <h3 className="text-sm font-semibold text-text-primary">No maintenance records found</h3>
            <p className="text-xs text-text-secondary mt-1">Schedule a ticket to book repair bays.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-text-primary">
              <thead className="bg-surface text-text-secondary border-b border-border font-medium">
                <tr>
                  <th className="px-6 py-3">Ticket ID</th>
                  <th className="px-6 py-3">Vehicle</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Scheduled Date</th>
                  <th className="px-6 py-3">Workshop / tech</th>
                  <th className="px-6 py-3">Priority</th>
                  <th className="px-6 py-3">Est. Cost</th>
                  <th className="px-6 py-3">Actual Cost</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {data.data.map((ticket: Maintenance) => (
                  <tr key={ticket.id} className="table-row-hover">
                    <td className="px-6 py-3.5 font-mono text-xs font-semibold text-brand">
                      {ticket.maintenanceNumber}
                    </td>
                    <td className="px-6 py-3.5 font-medium">
                      {ticket.vehicle ? `${ticket.vehicle.vehicleName} (${ticket.vehicle.registrationNumber})` : '—'}
                    </td>
                    <td className="px-6 py-3.5 text-text-secondary">{ticket.maintenanceType}</td>
                    <td className="px-6 py-3.5 text-text-secondary text-xs">{formatDate(ticket.scheduledDate)}</td>
                    <td className="px-6 py-3.5 text-text-secondary text-xs">
                      <div>{ticket.workshopName}</div>
                      <div className="text-2xs text-text-muted">{ticket.technicianName}</div>
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge variant={priorityBadgeVariant(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 text-text-secondary">${Number(ticket.estimatedCost).toLocaleString()}</td>
                    <td className="px-6 py-3.5 text-text-secondary">
                      {ticket.actualCost !== null ? `$${Number(ticket.actualCost).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge variant={statusBadgeVariant(ticket.status)} dot>
                        {ticket.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      {isEditor && (
                        <>
                          {ticket.status === 'PENDING' && (
                            <button
                              onClick={() => startMutation.mutate(ticket.id)}
                              className="text-brand hover:text-brand-hover p-1"
                              title="Start Maintenance"
                            >
                              <Play size={15} />
                            </button>
                          )}

                          {(ticket.status === 'PENDING' || ticket.status === 'IN_PROGRESS') && (
                            <button
                              onClick={() => openCompleteModal(ticket)}
                              className="text-status-success hover:text-status-success-hover p-1"
                              title="Complete Maintenance"
                            >
                              <CheckCircle size={15} />
                            </button>
                          )}

                          {(ticket.status === 'PENDING' || ticket.status === 'IN_PROGRESS') && (
                            <button
                              onClick={() => cancelMutation.mutate(ticket.id)}
                              className="text-text-secondary hover:text-status-danger p-1"
                              title="Cancel Ticket"
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

      {/* Schedule Modal */}
      {isScheduleOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="bg-white rounded border border-border w-full max-w-lg shadow-modal animate-slide-in overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
              <h3 className="font-semibold text-text-primary text-base">Schedule Maintenance Ticket</h3>
              <button onClick={() => setIsScheduleOpen(false)} className="text-text-muted hover:text-text-primary">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitSchedule(onScheduleSubmit)} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                {/* Vehicle Selector */}
                <div className="flex flex-col gap-1 col-span-2">
                  <label className="text-sm font-medium text-text-primary">
                    Vehicle Asset <span className="text-status-danger">*</span>
                  </label>
                  <select
                    {...registerSchedule('vehicleId')}
                    className="h-9 border border-border rounded px-3 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
                  >
                    <option value="">Select Available Vehicle</option>
                    {availableVehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vehicleName} ({v.registrationNumber}) — Status: {v.status}
                      </option>
                    ))}
                  </select>
                  {scheduleErrors.vehicleId && <p className="text-xs text-status-danger">{scheduleErrors.vehicleId.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  {...registerSchedule('maintenanceType')}
                  label="Maintenance Type"
                  placeholder="e.g. 50,000 Mile Service, Oil Change"
                  required
                  error={scheduleErrors.maintenanceType?.message}
                />
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-text-primary">
                    Priority Rating <span className="text-status-danger">*</span>
                  </label>
                  <select
                    {...registerSchedule('priority')}
                    className="h-9 border border-border rounded px-3 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  {...registerSchedule('scheduledDate')}
                  label="Scheduled Date"
                  type="date"
                  required
                  error={scheduleErrors.scheduledDate?.message}
                />
                <Input
                  {...registerSchedule('estimatedCost')}
                  label="Estimated Cost ($)"
                  type="number"
                  step="any"
                  required
                  error={scheduleErrors.estimatedCost?.message}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  {...registerSchedule('workshopName')}
                  label="Workshop Facility"
                  placeholder="e.g. Mid-west Hub Repairs"
                  required
                  error={scheduleErrors.workshopName?.message}
                />
                <Input
                  {...registerSchedule('technicianName')}
                  label="Technician Assignee"
                  placeholder="e.g. Dave Miller"
                  required
                  error={scheduleErrors.technicianName?.message}
                />
              </div>

              <Input
                {...registerSchedule('description')}
                label="Repair description / issues list"
                placeholder="Explain vehicle symptoms or service instructions..."
                required
                error={scheduleErrors.description?.message}
              />

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-text-primary">Notes</label>
                <textarea
                  {...registerSchedule('notes')}
                  placeholder="Additional logistics or gate keys..."
                  rows={2}
                  className="border border-border rounded p-2.5 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-3 bg-white">
                <Button variant="secondary" type="button" onClick={() => setIsScheduleOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" isLoading={createMutation.isPending}>
                  Schedule ticket
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {isCompleteOpen && completingTicket && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="bg-white rounded border border-border w-full max-w-md shadow-modal animate-slide-in overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
              <h3 className="font-semibold text-text-primary text-base">Close Repair Ticket</h3>
              <button onClick={() => setIsCompleteOpen(false)} className="text-text-muted hover:text-text-primary">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitComplete(onCompleteSubmit)} className="p-6 space-y-4">
              <div className="bg-surface p-3 rounded border border-border text-xs text-text-secondary space-y-1">
                <p>Ticket Number: <strong className="text-text-primary">{completingTicket.maintenanceNumber}</strong></p>
                <p>Scheduled cost forecast: <strong>${Number(completingTicket.estimatedCost).toLocaleString()}</strong></p>
              </div>

              <Input
                {...registerComplete('actualCost')}
                label="Actual Cost ($)"
                type="number"
                step="any"
                required
                error={completeErrors.actualCost?.message}
              />

              <Input
                {...registerComplete('completedDate')}
                label="Completed Date"
                type="date"
                required
                error={completeErrors.completedDate?.message}
              />

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-text-primary">Closure / workshop notes</label>
                <textarea
                  {...registerComplete('notes')}
                  placeholder="Record what parts were replaced, warranty logs..."
                  rows={2}
                  className="border border-border rounded p-2.5 text-sm focus:ring-2 focus:ring-brand focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-3 bg-white">
                <Button variant="secondary" type="button" onClick={() => setIsCompleteOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" isLoading={completeMutation.isPending}>
                  Complete Ticket
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
