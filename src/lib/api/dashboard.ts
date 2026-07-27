import { apiClient } from "@/lib/api-client";

export interface DashboardKpis {
  rfqsInProgress: number;
  approvalsPending: number;
  economy: number;
  ordersEmitted: number;
  suppliersActive: number;
}

export interface CategoryBreakdown {
  name: string;
  value: number;
  count: number;
}

export interface MonthlyEconomy {
  name: string;
  value: number;
}

export const dashboardApi = {
  getKpis: () => apiClient.get<DashboardKpis>("/api/dashboard/kpis"),
  
  getRecentRfqs: () => apiClient.get<any[]>("/api/dashboard/recent-rfqs"),
  
  getCategories: () => apiClient.get<CategoryBreakdown[]>("/api/dashboard/categories"),
  
  getMonthlyEconomy: () => apiClient.get<MonthlyEconomy[]>("/api/dashboard/monthly-economy"),
};
