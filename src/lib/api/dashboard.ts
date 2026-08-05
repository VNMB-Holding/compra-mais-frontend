import { apiClient, cleanTenantParam } from "@/lib/api-client";

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

function buildQs(tenantId?: string): string {
  const valid = cleanTenantParam(tenantId);
  return valid ? `?tenantId=${encodeURIComponent(valid)}` : '';
}

export const dashboardApi = {
  getKpis: (tenantId?: string) => apiClient.get<DashboardKpis>(`/api/dashboard/kpis${buildQs(tenantId)}`),

  getRecentRfqs: (tenantId?: string) => apiClient.get<RecentRfqItem[]>(`/api/dashboard/recent-rfqs${buildQs(tenantId)}`),

  getCategories: (tenantId?: string) => apiClient.get<CategoryBreakdown[]>(`/api/dashboard/categories${buildQs(tenantId)}`),

  getMonthlyEconomy: (tenantId?: string) => apiClient.get<MonthlyEconomy[]>(`/api/dashboard/monthly-economy${buildQs(tenantId)}`),

  getSpendAnalytics: (tenantId?: string) => apiClient.get<SpendAnalyticsResponse>(`/api/dashboard/analytics/spend${buildQs(tenantId)}`),
  getEconomyAnalytics: (tenantId?: string) => apiClient.get<EconomyAnalyticsResponse>(`/api/dashboard/analytics/economia${buildQs(tenantId)}`),
};

