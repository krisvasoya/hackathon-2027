import apiClient from './api';
import { ApiResponse } from '../types';

export interface NotificationItem {
  id: string;
  type: 'info' | 'warning' | 'danger' | 'success';
  title: string;
  message: string;
  createdAt: string;
  link: string;
}

export const notificationService = {
  getNotifications: async (): Promise<NotificationItem[]> => {
    const { data } = await apiClient.get<ApiResponse<NotificationItem[]>>('/notifications');
    if (!data.success) throw new Error(data.message);
    return data.data;
  },
};
