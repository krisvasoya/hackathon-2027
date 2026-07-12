import apiClient from './api';
import { FuelLog, PaginatedResult, ApiResponse } from '../types';

export interface GetFuelLogQueryParams {
  page: number;
  limit: number;
  search?: string;
  vehicleId?: string;
  tripId?: string;
  startDate?: string;
  endDate?: string;
}

export interface FuelLogInput {
  vehicleId: string;
  tripId?: string | null;
  liters: number;
  pricePerLiter: number;
  totalCost: number;
  odometer: number;
  fuelStation: string;
  date: string;
}

export interface FuelEfficiencyResult {
  totalDistance: number;
  totalLiters: number;
  efficiencyKml: number;
}

export const fuelService = {
  getFuelLogs: async (params: GetFuelLogQueryParams): Promise<PaginatedResult<FuelLog>> => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== '')
    );
    const { data } = await apiClient.get<ApiResponse<PaginatedResult<FuelLog>>>('/fuel', {
      params: cleanParams,
    });
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  getFuelLogById: async (id: string): Promise<FuelLog> => {
    const { data } = await apiClient.get<ApiResponse<FuelLog>>(`/fuel/${id}`);
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  createFuelLog: async (input: FuelLogInput): Promise<FuelLog> => {
    const { data } = await apiClient.post<ApiResponse<FuelLog>>('/fuel', input);
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  updateFuelLog: async (id: string, input: Partial<FuelLogInput>): Promise<FuelLog> => {
    const { data } = await apiClient.put<ApiResponse<FuelLog>>(`/fuel/${id}`, input);
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  deleteFuelLog: async (id: string): Promise<void> => {
    const { data } = await apiClient.delete<ApiResponse<void>>(`/fuel/${id}`);
    if (!data.success) throw new Error(data.message);
  },

  getFuelEfficiency: async (vehicleId: string): Promise<FuelEfficiencyResult> => {
    const { data } = await apiClient.get<ApiResponse<FuelEfficiencyResult>>(`/fuel/vehicle/${vehicleId}/efficiency`);
    if (!data.success) throw new Error(data.message);
    return data.data;
  },
};
