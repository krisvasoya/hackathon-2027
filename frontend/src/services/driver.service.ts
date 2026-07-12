import apiClient from './api';
import { Driver, PaginatedResult, ApiResponse, DriverStatus } from '../types';

export interface GetDriversQueryParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: DriverStatus | '';
  licenseCategory?: string;
  minSafetyScore?: number;
  maxSafetyScore?: number;
  licenseExpiryBefore?: string;
}

export interface DriverInput {
  fullName: string;
  employeeId?: string | null;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: string;
  phoneNumber: string;
  email: string;
  safetyScore?: number;
  yearsOfExperience: number;
  address: string;
  emergencyContact: string;
  status?: DriverStatus;
  notes?: string | null;
}

export const driverService = {
  getDrivers: async (params: GetDriversQueryParams): Promise<PaginatedResult<Driver>> => {
    // Filter empty values from params
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== '')
    );
    const { data } = await apiClient.get<ApiResponse<PaginatedResult<Driver>>>('/drivers', {
      params: cleanParams,
    });
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  getDriverById: async (id: string): Promise<Driver> => {
    const { data } = await apiClient.get<ApiResponse<Driver>>(`/drivers/${id}`);
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  createDriver: async (input: DriverInput): Promise<Driver> => {
    const { data } = await apiClient.post<ApiResponse<Driver>>('/drivers', input);
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  updateDriver: async (id: string, input: Partial<DriverInput>): Promise<Driver> => {
    const { data } = await apiClient.put<ApiResponse<Driver>>(`/drivers/${id}`, input);
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  updateDriverStatus: async (id: string, status: DriverStatus): Promise<Driver> => {
    const { data } = await apiClient.patch<ApiResponse<Driver>>(`/drivers/${id}/status`, { status });
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  deleteDriver: async (id: string): Promise<void> => {
    const { data } = await apiClient.delete<ApiResponse<void>>(`/drivers/${id}`);
    if (data && !data.success) throw new Error(data.message);
  },
};
