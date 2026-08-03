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

export interface RecentRfqItem {
  id: string;
  code: string;
  title?: string;
  status: string;
  createdAt: string;
  purchaseRequest?: {
    description?: string;
  };
}

export interface SpendAnalyticsResponse {
  totalSpend: number;
  monthlyTrend: { month: string; spend: number }[];
  byCategory: { category: string; spend: number }[];
}

export interface EconomyAnalyticsResponse {
  totalEconomy: number;
  monthlyTrend: { month: string; economy: number }[];
}

export const dashboardApi = {
  getKpis: () => apiClient.get<DashboardKpis>("/api/dashboard/kpis"),

  getRecentRfqs: () => apiClient.get<RecentRfqItem[]>("/api/dashboard/recent-rfqs"),

  getCategories: () => apiClient.get<CategoryBreakdown[]>("/api/dashboard/categories"),

  getMonthlyEconomy: () => apiClient.get<MonthlyEconomy[]>("/api/dashboard/monthly-economy"),

  getSpendAnalytics: () => apiClient.get<SpendAnalyticsResponse>('/api/dashboard/analytics/spend'),
  getEconomyAnalytics: () => apiClient.get<EconomyAnalyticsResponse>('/api/dashboard/analytics/economia'),
};

