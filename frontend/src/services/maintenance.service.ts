import apiClient from './api';
import { Maintenance, PaginatedResult, ApiResponse } from '../types';

export interface GetMaintenanceQueryParams {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  vehicleId?: string;
  priority?: string;
  maintenanceType?: string;
}

export interface MaintenanceInput {
  vehicleId: string;
  maintenanceType: string;
  description: string;
  priority: string;
  scheduledDate: string;
  estimatedCost: number;
  workshopName: string;
  technicianName: string;
  notes?: string | null;
}

export interface CompleteMaintenanceInput {
  actualCost: number;
  completedDate: string;
  notes?: string | null;
}

export const maintenanceService = {
  getMaintenances: async (params: GetMaintenanceQueryParams): Promise<PaginatedResult<Maintenance>> => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== '')
    );
    const { data } = await apiClient.get<ApiResponse<PaginatedResult<Maintenance>>>('/maintenance', {
      params: cleanParams,
    });
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  getMaintenanceById: async (id: string): Promise<Maintenance> => {
    const { data } = await apiClient.get<ApiResponse<Maintenance>>(`/maintenance/${id}`);
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  createMaintenance: async (input: MaintenanceInput): Promise<Maintenance> => {
    const { data } = await apiClient.post<ApiResponse<Maintenance>>('/maintenance', input);
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  updateMaintenance: async (id: string, input: Partial<MaintenanceInput>): Promise<Maintenance> => {
    const { data } = await apiClient.put<ApiResponse<Maintenance>>(`/maintenance/${id}`, input);
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  startMaintenance: async (id: string): Promise<Maintenance> => {
    const { data } = await apiClient.patch<ApiResponse<Maintenance>>(`/maintenance/${id}/start`);
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  completeMaintenance: async (id: string, input: CompleteMaintenanceInput): Promise<Maintenance> => {
    const { data } = await apiClient.patch<ApiResponse<Maintenance>>(`/maintenance/${id}/complete`, input);
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  cancelMaintenance: async (id: string): Promise<Maintenance> => {
    const { data } = await apiClient.patch<ApiResponse<Maintenance>>(`/maintenance/${id}/cancel`);
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  deleteMaintenance: async (id: string): Promise<void> => {
    const { data } = await apiClient.delete<ApiResponse<void>>(`/maintenance/${id}`);
    if (!data.success) throw new Error(data.message);
  },
};
