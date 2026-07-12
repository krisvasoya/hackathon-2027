import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Compass,
  AlertTriangle,
  Play,
  CheckCircle,
  XCircle,
  Truck,
  User as UserIcon,
  Scale,
  MapPin,
  X,
  Check,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { tripService } from '../../services/trip.service';
import { Card, CardBody, Button, Input, Badge } from '../../components/ui';
import { QUERY_KEYS, ROUTES } from '../../constants';
import { Trip, TripStatus } from '../../types';
import { formatDate, formatCurrency } from '../../utils';
import { SkDetails } from '../../components/skeleton';

// Zod Schema for Trip Completion
const completionSchema = z.object({
  endOdometer: z.coerce
    .number()
    .nonnegative('Odometer cannot be negative'),
  actualDistance: z.coerce
    .number()
    .positive('Actual distance must be greater than zero'),
});

type CompletionFormValues = z.infer<typeof completionSchema>;

export default function TripDetailPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();

  const isEditor = hasRole(['SUPER_ADMIN', 'FLEET_MANAGER', 'DISPATCHER']);
  const canComplete = hasRole(['SUPER_ADMIN', 'FLEET_MANAGER', 'DISPATCHER', 'DRIVER']);

  // Modals
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);

  // Completion Form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompletionFormValues>({
    resolver: zodResolver(completionSchema),
  });

  // Query trip by ID
  const { data: trip, isLoading, error } = useQuery<Trip>({
    queryKey: [QUERY_KEYS.TRIPS, id],
    queryFn: () => tripService.getTripById(id as string),
    enabled: !!id,
  });

  // Mutations
  const dispatchMutation = useMutation({
    mutationFn: () => tripService.dispatchTrip(id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRIPS, id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRIPS] });
      toast.success('Trip DISPATCHED successfully. Odometer lock registered.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Dispatch failed');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => tripService.cancelTrip(id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRIPS, id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRIPS] });
      toast.success('Trip CANCELLED successfully. Operator and Vehicle assets released.');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Cancellation failed');
    },
  });

  const completeMutation = useMutation({
    mutationFn: (values: CompletionFormValues) => tripService.completeTrip(id as string, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRIPS, id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRIPS] });
      toast.success('Trip COMPLETED successfully.');
      setIsCompleteOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Completion failed');
    },
  });

  // Submit Completion
  const onCompleteSubmit = (values: CompletionFormValues) => {
    if (trip && values.endOdometer < (trip.startOdometer || 0)) {
      toast.error(`Odometer cannot be less than trip start odometer (${trip.startOdometer} km)`);
      return;
    }
    completeMutation.mutate(values);
  };

  if (isLoading) {
    return <SkDetails rows={8} />;
  }

  if (error || !trip) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center text-status-danger px-6">
        <AlertTriangle size={36} className="mb-2" />
        <h3 className="font-semibold">Trip Dossier Not Found</h3>
        <p className="text-xs text-text-secondary mt-1">{(error as Error)?.message || 'Trip does not exist.'}</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate(ROUTES.TRIPS)}>
          Back to list
        </Button>
      </div>
    );
  }

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

  // Timeline check status helper
  const isStepDone = (step: TripStatus) => {
    if (trip.status === 'CANCELLED') {
      return step === 'DRAFT' || step === 'CANCELLED';
    }
    if (trip.status === 'COMPLETED') {
      return true;
    }
    if (trip.status === 'DISPATCHED') {
      return step === 'DRAFT' || step === 'DISPATCHED';
    }
    return step === 'DRAFT';
  };

  return (
    <div className="space-y-6">
      {/* ─── Breadcrumb Back Navigation ─── */}
      <button
        onClick={() => navigate(ROUTES.TRIPS)}
        className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-brand font-semibold transition-colors"
      >
        <ArrowLeft size={14} /> Back to Trips list
      </button>

      {/* ─── Header Info ─── */}
      <div className="page-header mt-1">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="page-title">{trip.tripNumber}</h1>
            <Badge variant={statusBadgeVariant(trip.status)}>
              {trip.status}
            </Badge>
          </div>
          <p className="page-subtitle">Route: {trip.source} → {trip.destination}</p>
        </div>

        {/* Action Controls */}
        {isEditor && (
          <div className="flex gap-3">
            {trip.status === 'DRAFT' && (
              <Button
                variant="primary"
                onClick={() => dispatchMutation.mutate()}
                isLoading={dispatchMutation.isPending}
                leftIcon={<Play size={16} />}
              >
                Dispatch Route
              </Button>
            )}

            {trip.status === 'DISPATCHED' && canComplete && (
              <Button
                variant="primary"
                onClick={() => setIsCompleteOpen(true)}
                leftIcon={<CheckCircle size={16} />}
              >
                Complete Route
              </Button>
            )}

            {(trip.status === 'DRAFT' || trip.status === 'DISPATCHED') && (
              <Button
                variant="danger"
                onClick={() => cancelMutation.mutate()}
                isLoading={cancelMutation.isPending}
                leftIcon={<XCircle size={16} />}
              >
                Cancel Route
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ─── Timeline ─── */}
      <Card>
        <CardBody className="py-6 px-8 flex items-center justify-between max-w-xl mx-auto">
          {/* Draft Step */}
          <div className="flex flex-col items-center relative">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border font-bold text-xs ${
                isStepDone('DRAFT') ? 'bg-brand border-brand text-white' : 'bg-white border-border text-text-muted'
              }`}
            >
              {isStepDone('DRAFT') ? <Check size={14} /> : '1'}
            </div>
            <span className="text-2xs mt-1.5 font-semibold text-text-primary">Draft</span>
          </div>

          <div className={`flex-1 h-0.5 mx-2 ${isStepDone('DISPATCHED') ? 'bg-brand' : 'bg-border'}`} />

          {/* Dispatched Step */}
          <div className="flex flex-col items-center relative">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border font-bold text-xs ${
                isStepDone('DISPATCHED') ? 'bg-brand border-brand text-white' : 'bg-white border-border text-text-muted'
              }`}
            >
              {isStepDone('DISPATCHED') ? <Check size={14} /> : '2'}
            </div>
            <span className="text-2xs mt-1.5 font-semibold text-text-primary">Dispatched</span>
          </div>

          <div className={`flex-1 h-0.5 mx-2 ${isStepDone('COMPLETED') || trip.status === 'CANCELLED' ? 'bg-brand' : 'bg-border'}`} />

          {/* Final Step (Completed or Cancelled) */}
          {trip.status === 'CANCELLED' ? (
            <div className="flex flex-col items-center relative">
              <div className="w-8 h-8 rounded-full flex items-center justify-center border font-bold text-xs bg-status-danger border-status-danger text-white">
                <X size={14} />
              </div>
              <span className="text-2xs mt-1.5 font-semibold text-status-danger">Cancelled</span>
            </div>
          ) : (
            <div className="flex flex-col items-center relative">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border font-bold text-xs ${
                  isStepDone('COMPLETED') ? 'bg-brand border-brand text-white' : 'bg-white border-border text-text-muted'
                }`}
              >
                {isStepDone('COMPLETED') ? <Check size={14} /> : '3'}
              </div>
              <span className="text-2xs mt-1.5 font-semibold text-text-primary">Completed</span>
            </div>
          )}
        </CardBody>
      </Card>

      {/* ─── Details Dossier Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Core Trip Specs */}
        <Card className="col-span-1 md:col-span-2">
          <CardBody className="p-6 space-y-6">
            <h3 className="font-semibold text-text-primary text-base flex items-center gap-2 pb-2 border-b border-border">
              <Compass size={18} className="text-brand" /> Route & Transit specs
            </h3>

            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <p className="text-xs text-text-secondary">Source terminal</p>
                <p className="font-medium mt-0.5 flex items-center gap-1.5">
                  <MapPin size={14} className="text-text-muted" /> {trip.source}
                </p>
              </div>

              <div>
                <p className="text-xs text-text-secondary">Destination terminal</p>
                <p className="font-medium mt-0.5 flex items-center gap-1.5">
                  <MapPin size={14} className="text-text-muted" /> {trip.destination}
                </p>
              </div>

              <div>
                <p className="text-xs text-text-secondary">Planned distance</p>
                <p className="font-medium mt-0.5">{trip.plannedDistance} km</p>
              </div>

              <div>
                <p className="text-xs text-text-secondary">Actual distance covered</p>
                <p className="font-medium mt-0.5 text-brand">{trip.actualDistance !== null ? `${trip.actualDistance} km` : 'Pending completion'}</p>
              </div>

              <div>
                <p className="text-xs text-text-secondary">Cargo Weight</p>
                <p className="font-medium mt-0.5 flex items-center gap-1.5">
                  <Scale size={14} className="text-text-muted" /> {trip.cargoWeight} kg
                </p>
              </div>

              <div>
                <p className="text-xs text-text-secondary">Estimated Duration</p>
                <p className="font-medium mt-0.5 flex items-center gap-1.5">
                  <Clock size={14} className="text-text-muted" /> {trip.estimatedDuration} minutes
                </p>
              </div>

              <div>
                <p className="text-xs text-text-secondary">Odometers (Start / End)</p>
                <p className="font-medium mt-0.5">
                  {trip.startOdometer !== null ? `${trip.startOdometer} km` : '—'} /{' '}
                  {trip.endOdometer !== null ? `${trip.endOdometer} km` : '—'}
                </p>
              </div>

              <div>
                <p className="text-xs text-text-secondary">Foresighted Revenue</p>
                <p className="font-semibold text-status-success mt-0.5">{formatCurrency(trip.tripRevenue)}</p>
              </div>

              <div className="col-span-2 pt-2 border-t border-border">
                <p className="text-xs text-text-secondary">Operational Timestamps</p>
                <div className="grid grid-cols-2 mt-1.5 text-xs text-text-secondary gap-2">
                  <span className="flex items-center gap-1"><Calendar size={12} /> Dispatched: {trip.tripStartTime ? formatDate(trip.tripStartTime) : 'Not Dispatched'}</span>
                  <span className="flex items-center gap-1"><Calendar size={12} /> Completed: {trip.tripEndTime ? formatDate(trip.tripEndTime) : 'Not Completed'}</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-xs text-text-secondary">Dispatched remarks</p>
              <p className="mt-1 bg-surface p-3 rounded border border-border text-xs text-text-secondary italic">
                {trip.remarks || 'No remarks recorded for this dispatch.'}
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Assigned Vehicle & Driver profiles */}
        <div className="space-y-6">
          {/* Driver Card */}
          <Card>
            <CardBody className="p-5">
              <h3 className="font-semibold text-text-primary text-sm flex items-center gap-2 pb-2 border-b border-border">
                <UserIcon size={16} className="text-brand" /> Operator Profile
              </h3>
              {trip.driver ? (
                <div className="mt-3.5 space-y-3 text-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-brand-light border border-brand/20 flex items-center justify-center font-bold text-brand text-xs">
                      {trip.driver.fullName.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary">{trip.driver.fullName}</p>
                      <p className="text-2xs text-text-secondary">Emp ID: {trip.driver.employeeId || '—'}</p>
                    </div>
                  </div>
                  <div className="text-xs text-text-secondary space-y-1 bg-surface p-2.5 rounded border border-border">
                    <p>License: <strong className="font-semibold">{trip.driver.licenseNumber}</strong> ({trip.driver.licenseCategory})</p>
                    <p>Contact: {trip.driver.phoneNumber}</p>
                    <p>Safety Rating: <span className="text-brand font-bold">{trip.driver.safetyScore}/100</span></p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-text-secondary italic mt-3">No driver details associated.</p>
              )}
            </CardBody>
          </Card>

          {/* Vehicle Card */}
          <Card>
            <CardBody className="p-5">
              <h3 className="font-semibold text-text-primary text-sm flex items-center gap-2 pb-2 border-b border-border">
                <Truck size={16} className="text-brand" /> Vehicle Specs
              </h3>
              {trip.vehicle ? (
                <div className="mt-3.5 space-y-3 text-sm">
                  <div>
                    <p className="font-semibold text-text-primary">{trip.vehicle.vehicleName}</p>
                    <p className="text-2xs text-text-secondary">Model: {trip.vehicle.vehicleModel} ({trip.vehicle.vehicleType})</p>
                  </div>
                  <div className="text-xs text-text-secondary space-y-1 bg-surface p-2.5 rounded border border-border">
                    <p>Reg Plate: <strong className="font-mono">{trip.vehicle.registrationNumber}</strong></p>
                    <p>Max Load capacity: {trip.vehicle.maximumLoadCapacity} kg</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-text-secondary italic mt-3">No vehicle details associated.</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* ─── Complete Trip Form Modal ─── */}
      {isCompleteOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="bg-white rounded border border-border w-full max-w-md shadow-modal animate-slide-in overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
              <h3 className="font-semibold text-text-primary text-base">Complete Transit Route</h3>
              <button onClick={() => setIsCompleteOpen(false)} className="text-text-muted hover:text-text-primary transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onCompleteSubmit)} className="p-6 space-y-4">
              <div className="bg-brand-light/40 p-3 rounded border border-brand/10 text-xs text-brand space-y-1">
                <p>Planned distance of dispatch: <strong className="font-bold">{trip.plannedDistance} km</strong></p>
                <p>Odometer reading at start: <strong className="font-bold">{trip.startOdometer} km</strong></p>
              </div>

              <Input
                {...register('endOdometer')}
                label="End Odometer Reading (km)"
                type="number"
                step="any"
                required
                error={errors.endOdometer?.message}
              />

              <Input
                {...register('actualDistance')}
                label="Actual Distance Traveled (km)"
                type="number"
                step="any"
                required
                error={errors.actualDistance?.message}
              />

              <div className="pt-4 border-t border-border flex justify-end gap-3 bg-white">
                <Button variant="secondary" type="button" onClick={() => setIsCompleteOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  isLoading={completeMutation.isPending}
                >
                  Submit Completion
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
