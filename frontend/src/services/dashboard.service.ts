import apiClient from './api';
import { ApiResponse } from '../types';

export interface DashboardStatsParams {
  preset?: 'today' | '7days' | '30days' | 'custom';
  startDate?: string;
  endDate?: string;
}

export interface DashboardStatsResult {
  kpis: {
    totalVehicles: number;
    availableVehicles: number;
    vehiclesOnTrip: number;
    vehiclesInMaintenance: number;
    totalDrivers: number;
    availableDrivers: number;
    activeTrips: number;
    completedTripsToday: number;
    fuelCostToday: number;
    maintenanceCostThisMonth: number;
    totalOperationalCost: number;
    fleetUtilization: number;
    fleetHealth: number;
  };
  charts: {
    tripsPerDay: Array<{ date: string; count: number }>;
    monthlyCosts: Array<{ month: string; fuel: number; maintenance: number }>;
    utilizationTrend: Array<{ date: string; rate: number }>;
    revenueVsCosts: Array<{ date: string; revenue: number; cost: number }>;
    vehicleStatus: Array<{ name: string; value: number }>;
  };
  alerts: Array<{
    id: string;
    type: 'warning' | 'danger' | 'info' | 'neutral';
    message: string;
    link: string;
  }>;
  activity: Array<{
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
    } | null;
  }>;
}

export const dashboardService = {
  getStats: async (params: DashboardStatsParams = {}): Promise<DashboardStatsResult> => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== '')
    );
    const { data } = await apiClient.get<ApiResponse<DashboardStatsResult>>('/dashboard', {
      params: cleanParams,
    });
    if (!data.success) throw new Error(data.message);
    return data.data;
  },
};
