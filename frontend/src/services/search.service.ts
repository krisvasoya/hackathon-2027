import apiClient from './api';
import { ApiResponse } from '../types';

export interface SearchResult {
  vehicles: any[];
  drivers: any[];
  trips: any[];
  maintenance: any[];
  fuel: any[];
  expenses: any[];
}

export const searchService = {
  search: async (q: string): Promise<SearchResult> => {
    const { data } = await apiClient.get<ApiResponse<SearchResult>>('/search', {
      params: { q },
    });
    if (!data.success) throw new Error(data.message);
    return data.data;
  },
};
