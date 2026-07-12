import apiClient from './api';
import { ApiResponse, PaginatedResult } from '../types';

export interface AuditLogItem {
  id: string;
  userId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: any;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  } | null;
}

export interface GetAuditLogsParams {
  page?: number;
  limit?: number;
  search?: string;
  action?: string;
  resource?: string;
  startDate?: string;
  endDate?: string;
}

export const auditService = {
  getAuditLogs: async (params: GetAuditLogsParams = {}): Promise<PaginatedResult<AuditLogItem>> => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== '')
    );
    const { data } = await apiClient.get<ApiResponse<PaginatedResult<AuditLogItem>>>('/audit-logs', {
      params: cleanParams,
    });
    if (!data.success) throw new Error(data.message);
    return data.data;
  },
};
