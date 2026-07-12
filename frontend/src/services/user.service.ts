import apiClient from './api';
import { User, UserRole, UserStatus, PaginatedResult, ApiResponse } from '../types';

export interface GetUsersQueryParams {
  page: number;
  limit: number;
  search?: string;
  role?: UserRole | '';
  status?: UserStatus | '';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  status?: UserStatus;
  department?: string | null;
  phone?: string | null;
}

export const userService = {
  getUsers: async (params: GetUsersQueryParams): Promise<PaginatedResult<User>> => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== '')
    );
    const { data } = await apiClient.get<ApiResponse<PaginatedResult<User>>>('/users', {
      params: cleanParams,
    });
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  getUserById: async (id: string): Promise<User> => {
    const { data } = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  updateUser: async (id: string, input: UpdateUserInput): Promise<User> => {
    const { data } = await apiClient.put<ApiResponse<User>>(`/users/${id}`, input);
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  updateUserStatus: async (id: string, status: UserStatus): Promise<User> => {
    const { data } = await apiClient.patch<ApiResponse<User>>(`/users/${id}/status`, { status });
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  resetPassword: async (id: string): Promise<void> => {
    const { data } = await apiClient.post<ApiResponse<void>>(`/users/${id}/reset-password`);
    if (data && !data.success) throw new Error((data as any).message);
  },
};
