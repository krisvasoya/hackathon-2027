import apiClient from './api';
import { Trip, PaginatedResult, ApiResponse, TripStatus } from '../types';

export interface GetTripsQueryParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: TripStatus | '';
  vehicleId?: string;
  driverId?: string;
  startDate?: string;
  endDate?: string;
}

export interface TripInput {
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeight: number;
  plannedDistance: number;
  estimatedDuration: number;
  tripRevenue: number;
  remarks?: string | null;
}

export interface CompleteTripInput {
  endOdometer: number;
  actualDistance: number;
}

export const tripService = {
  getTrips: async (params: GetTripsQueryParams): Promise<PaginatedResult<Trip>> => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== '')
    );
    const { data } = await apiClient.get<ApiResponse<PaginatedResult<Trip>>>('/trips', {
      params: cleanParams,
    });
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  getTripById: async (id: string): Promise<Trip> => {
    const { data } = await apiClient.get<ApiResponse<Trip>>(`/trips/${id}`);
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  createTrip: async (input: TripInput): Promise<Trip> => {
    const { data } = await apiClient.post<ApiResponse<Trip>>('/trips', input);
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  updateTrip: async (id: string, input: Partial<TripInput>): Promise<Trip> => {
    const { data } = await apiClient.put<ApiResponse<Trip>>(`/trips/${id}`, input);
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  dispatchTrip: async (id: string): Promise<Trip> => {
    const { data } = await apiClient.patch<ApiResponse<Trip>>(`/trips/${id}/dispatch`);
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  completeTrip: async (id: string, input: CompleteTripInput): Promise<Trip> => {
    const { data } = await apiClient.patch<ApiResponse<Trip>>(`/trips/${id}/complete`, input);
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  cancelTrip: async (id: string): Promise<Trip> => {
    const { data } = await apiClient.patch<ApiResponse<Trip>>(`/trips/${id}/cancel`);
    if (!data.success) throw new Error(data.message);
    return data.data;
  },
};
