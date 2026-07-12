import apiClient from './api';
import { Vehicle, PaginatedResult, ApiResponse, VehicleStatus } from '../types';

export interface GetVehiclesQueryParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: VehicleStatus | '';
  type?: string;
  region?: string;
}

export interface VehicleInput {
  registrationNumber: string;
  vehicleName: string;
  vehicleModel: string;
  vehicleType: string;
  manufacturer: string;
  manufacturingYear: number;
  maximumLoadCapacity: number;
  currentOdometer: number;
  acquisitionCost: number;
  purchaseDate: string;
  insuranceExpiry: string;
  registrationExpiry: string;
  status?: VehicleStatus;
  region: string;
  notes?: string | null;
}

export const vehicleService = {
  getVehicles: async (params: GetVehiclesQueryParams): Promise<PaginatedResult<Vehicle>> => {
    // Filter empty values from params
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== '')
    );
    const { data } = await apiClient.get<ApiResponse<PaginatedResult<Vehicle>>>('/vehicles', {
      params: cleanParams,
    });
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  getVehicleById: async (id: string): Promise<Vehicle> => {
    const { data } = await apiClient.get<ApiResponse<Vehicle>>(`/vehicles/${id}`);
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  createVehicle: async (input: VehicleInput): Promise<Vehicle> => {
    const { data } = await apiClient.post<ApiResponse<Vehicle>>('/vehicles', input);
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  updateVehicle: async (id: string, input: Partial<VehicleInput>): Promise<Vehicle> => {
    const { data } = await apiClient.put<ApiResponse<Vehicle>>(`/vehicles/${id}`, input);
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  updateVehicleStatus: async (id: string, status: VehicleStatus): Promise<Vehicle> => {
    const { data } = await apiClient.patch<ApiResponse<Vehicle>>(`/vehicles/${id}/status`, { status });
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  deleteVehicle: async (id: string): Promise<void> => {
    const { data } = await apiClient.delete<ApiResponse<void>>(`/vehicles/${id}`);
    if (data && !data.success) throw new Error(data.message);
  },
};
