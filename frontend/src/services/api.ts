import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { STORAGE_KEYS } from '../constants';

// ─── Axios Instance ───────────────────────────────────────────────────────────

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Required for httpOnly refresh token cookie
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
// Attaches the stored access token to every outgoing request.

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
// Handles 401 responses by attempting a token refresh.
// If refresh fails, clears auth state and redirects to login.

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await apiClient.post<{
          success: boolean;
          data: { accessToken: string };
        }>('/auth/refresh');

        const newToken = data.data.accessToken;
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newToken);
        apiClient.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        window.location.href = '/login?session=expired';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
