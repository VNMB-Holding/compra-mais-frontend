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
  monthlySpend: { name: string; value: number }[];
  categories: {
    categoria: string;
    spendTotal: number;
    pctTotal: number;
    pedidos: number | string;
    color: string;
  }[];
  suppliers: {
    nome: string;
    valor: number;
    pct: number;
  }[];
  kpis: {
    spendTotal?: string;
    pedidosEmitidos?: string;
    fornecedoresAtivos?: string;
  };
}

export interface EconomyAnalyticsResponse {
  initiatives: {
    iniciativa: string;
    valor: number;
    pct: number;
  }[];
  categories: {
    categoria: string;
    valor: number;
    pct: number;
    color: string;
  }[];
  suppliers: {
    fornecedor: string;
    valor: number;
    pct: number;
    itens: number | string;
  }[];
  details?: {
    iniciativa: string;
    categoria: string;
    fornecedor: string;
    valor: number;
    data: string;
  }[];
  kpis: {
    economiaGerada?: string;
  };
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

