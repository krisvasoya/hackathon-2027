import apiClient from './api';
import type { User, ApiSuccessResponse } from '../types';

// ─── Auth Service ─────────────────────────────────────────────────────────────

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  user: User;
}

interface RefreshResponse {
  accessToken: string;
}

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const { data } = await apiClient.post<ApiSuccessResponse<LoginResponse>>(
      '/auth/login',
      credentials
    );
    return data.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  refreshToken: async (): Promise<RefreshResponse> => {
    const { data } = await apiClient.post<ApiSuccessResponse<RefreshResponse>>(
      '/auth/refresh'
    );
    return data.data;
  },

  getMe: async (): Promise<User> => {
    const { data } = await apiClient.get<ApiSuccessResponse<{ user: User }>>(
      '/auth/me'
    );
    return data.data.user;
  },
};
