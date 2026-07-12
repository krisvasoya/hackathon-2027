import apiClient from './api';
import { Expense, PaginatedResult, ApiResponse } from '../types';

export interface GetExpenseQueryParams {
  page: number;
  limit: number;
  search?: string;
  vehicleId?: string;
  tripId?: string;
  expenseType?: string;
  startDate?: string;
  endDate?: string;
}

export interface ExpenseInput {
  vehicleId: string;
  tripId?: string | null;
  expenseType: string;
  amount: number;
  description: string;
  date: string;
}

export interface VehicleFinancialsResult {
  totalFuel: number;
  totalMaintenance: number;
  totalToll: number;
  totalOther: number;
  totalOperationalCost: number;
  totalRevenue: number;
  roi: number;
}

export const expenseService = {
  getExpenses: async (params: GetExpenseQueryParams): Promise<PaginatedResult<Expense>> => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== '')
    );
    const { data } = await apiClient.get<ApiResponse<PaginatedResult<Expense>>>('/expenses', {
      params: cleanParams,
    });
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  getExpenseById: async (id: string): Promise<Expense> => {
    const { data } = await apiClient.get<ApiResponse<Expense>>(`/expenses/${id}`);
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  createExpense: async (input: ExpenseInput): Promise<Expense> => {
    const { data } = await apiClient.post<ApiResponse<Expense>>('/expenses', input);
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  updateExpense: async (id: string, input: Partial<ExpenseInput>): Promise<Expense> => {
    const { data } = await apiClient.put<ApiResponse<Expense>>(`/expenses/${id}`, input);
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  deleteExpense: async (id: string): Promise<void> => {
    const { data } = await apiClient.delete<ApiResponse<void>>(`/expenses/${id}`);
    if (!data.success) throw new Error(data.message);
  },

  getVehicleFinancials: async (vehicleId: string): Promise<VehicleFinancialsResult> => {
    const { data } = await apiClient.get<ApiResponse<VehicleFinancialsResult>>(`/expenses/vehicle/${vehicleId}/financials`);
    if (!data.success) throw new Error(data.message);
    return data.data;
  },
};
