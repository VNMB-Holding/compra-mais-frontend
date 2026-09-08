import { apiClient, cleanCompanyParam, cleanFilterParam } from "@/lib/api-client";

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
    economiaPotencial?: number;
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
  monthlyEconomy?: { name: string; value: number }[];
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
    economiaPct?: string;
    economiaPotencial?: string;
    negociacoesCount?: string;
  };
}

function buildQs(companyCode?: string): string {
  const valid = cleanCompanyParam(companyCode);
  return valid ? `?companyCode=${encodeURIComponent(valid)}` : '';
}

export interface DateFilterParams {
  companyCode?: string;
  category?: string;
  supplier?: string;
  period?: string;
  startDate?: string;
  endDate?: string;
}

export interface FilterOptionsResponse {
  categories: string[];
  suppliers: string[];
}

export const dashboardApi = {
  getKpis: (companyCode?: string) => apiClient.get<DashboardKpis>(`/api/dashboard/kpis${buildQs(companyCode)}`),

  getRecentRfqs: (companyCode?: string) => apiClient.get<RecentRfqItem[]>(`/api/dashboard/recent-rfqs${buildQs(companyCode)}`),

  getCategories: (companyCode?: string) => apiClient.get<CategoryBreakdown[]>(`/api/dashboard/categories${buildQs(companyCode)}`),

  getFilterOptions: (companyCode?: string) => apiClient.get<FilterOptionsResponse>(`/api/dashboard/filter-options${buildQs(companyCode)}`),

  getMonthlyEconomy: (companyCode?: string, period?: string, startDate?: string, endDate?: string, category?: string, supplier?: string) => {
    const params = new URLSearchParams();
    const valid = cleanCompanyParam(companyCode);
    if (valid) params.append("companyCode", valid);
    const cat = cleanFilterParam(category);
    if (cat) params.append("category", cat);
    const sup = cleanFilterParam(supplier);
    if (sup) params.append("supplier", sup);
    if (period && period !== 'all') params.append("period", period);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    const qs = params.toString();
    return apiClient.get<MonthlyEconomy[]>(`/api/dashboard/monthly-economy${qs ? `?${qs}` : ''}`);
  },

  getSpendAnalytics: (companyCode?: string, category?: string, supplier?: string, period?: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    const valid = cleanCompanyParam(companyCode);
    if (valid) params.append("companyCode", valid);
    const cat = cleanFilterParam(category);
    if (cat) params.append("category", cat);
    const sup = cleanFilterParam(supplier);
    if (sup) params.append("supplier", sup);
    const per = cleanFilterParam(period);
    if (per) params.append("period", per);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    const qs = params.toString();
    return apiClient.get<SpendAnalyticsResponse>(`/api/dashboard/analytics/spend${qs ? `?${qs}` : ''}`);
  },

  getEconomyAnalytics: (companyCode?: string, category?: string, supplier?: string, period?: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    const valid = cleanCompanyParam(companyCode);
    if (valid) params.append("companyCode", valid);
    const cat = cleanFilterParam(category);
    if (cat) params.append("category", cat);
    const sup = cleanFilterParam(supplier);
    if (sup) params.append("supplier", sup);
    const per = cleanFilterParam(period);
    if (per) params.append("period", per);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    const qs = params.toString();
    return apiClient.get<EconomyAnalyticsResponse>(`/api/dashboard/analytics/economia${qs ? `?${qs}` : ''}`);
  },

  generateReport: (
    type: 'orders' | 'spend' | 'rfqs' | 'savings',
    companyCode?: string,
    startDate?: string,
    endDate?: string,
    period?: string,
  ) => {
    const params = new URLSearchParams();
    params.append('type', type);
    const valid = cleanCompanyParam(companyCode);
    if (valid) params.append('companyCode', valid);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (period && period !== 'all') params.append('period', period);
    return apiClient.get<{
      filename: string;
      name: string;
      type: string;
      format: string;
      rows: string[][];
    }>(`/api/dashboard/reports/generate?${params.toString()}`);
  },

  downloadReportFile: async (
    type: 'orders' | 'spend' | 'rfqs' | 'savings',
    format: 'excel' | 'pdf',
    companyCode?: string,
    startDate?: string,
    endDate?: string,
    period?: string,
  ) => {
    const params = new URLSearchParams();
    params.append('type', type);
    const valid = cleanCompanyParam(companyCode);
    if (valid) params.append('companyCode', valid);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (period && period !== 'all') params.append('period', period);
    const endpoint = `/api/dashboard/reports/download/${format}?${params.toString()}`;
    const res = await apiClient.getRaw(endpoint);
    if (!res.ok) {
      throw new Error(`Falha ao exportar relatório em ${format.toUpperCase()}`);
    }
    const blob = await res.blob();
    const contentDisposition = res.headers.get('content-disposition');
    let filename = `relatorio_${type}_${Date.now()}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    return filename;
  },
};

