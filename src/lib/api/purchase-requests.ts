import { apiClient, cleanTenantParam } from "@/lib/api-client";

export interface PurchaseRequest {
  id: string;
  tenantId: string;
  code: string;
  description: string;
  requesterId?: string;
  requesterName?: string;
  notes?: string;
  estimatedBudget: number;
  status: "Draft" | "AwaitingApproval" | "Approved" | "Rejected" | "InQuote" | "Finished" | "Pending" | "UnderAnalysis" | "Cancelled";
  companyCode?: string;
  filialCode?: string;
  corporateCode?: string;
  corporateColigada?: string;
  corporateFilial?: string;
  corporateCompanyId?: string;
  corporateRequester?: string;
  corporateStockLocation?: string;
  corporateOriginReq?: string;
  corporateIntegration?: string;
  costCenterCode?: string;
  costCenterName?: string;
  source?: string;
  rawPayload?: any;
  createdAt: string;
  updatedAt: string;
  items?: RequestItem[];
  approvalHistories?: {
    id: string;
    action: string;
    comments?: string;
    actionDate: string;
    approverId: string;
  }[];
  rfqs?: {
    id: string;
    code: string;
  }[];
}

export interface RequestItem {
  id: string;
  requestId: string;
  description: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice?: number;
  costCenterCode?: string;
  costCenterName?: string;
  requiredDate?: string;
  corporateItemCode?: string;
  corporateItemNumber?: number;
  corporateWorkSite?: string;
}

export interface PurchaseRequestKpis {
  total: number;
  awaitingApproval: number;
  approved: number;
  inQuote: number;
  finished: number;
}

export interface PurchaseRequestListParams {
  tenantId?: string;
  companyCode?: string;
  status?: string;
  search?: string;
}

export const purchaseRequestsApi = {
  list: (paramsOrTenant?: string | PurchaseRequestListParams) => {
    const params = new URLSearchParams();
    if (typeof paramsOrTenant === 'string') {
      const validTenant = cleanTenantParam(paramsOrTenant);
      if (validTenant) params.append("companyCode", validTenant);
    } else if (paramsOrTenant) {
      const code = paramsOrTenant.companyCode || paramsOrTenant.tenantId;
      const validCode = cleanTenantParam(code);
      if (validCode) params.append("companyCode", validCode);
      if (paramsOrTenant.status && paramsOrTenant.status !== 'Todos') params.append("status", paramsOrTenant.status);
      if (paramsOrTenant.search && paramsOrTenant.search.trim() !== '') params.append("search", paramsOrTenant.search.trim());
    }
    const qs = params.toString();
    return apiClient.get<PurchaseRequest[]>(`/api/purchase-requests${qs ? `?${qs}` : ''}`);
  },
  
  getById: (id: string) => apiClient.get<PurchaseRequest>(`/api/purchase-requests/${id}`),
  
  getKpis: (tenantId?: string) => {
    const validTenant = cleanTenantParam(tenantId);
    const params = new URLSearchParams();
    if (validTenant) params.append("tenantId", validTenant);
    const qs = params.toString();
    return apiClient.get<PurchaseRequestKpis>(`/api/purchase-requests/kpis${qs ? `?${qs}` : ''}`);
  },
  
  create: (data: Omit<Partial<PurchaseRequest>, 'items'> & { items?: Partial<Omit<RequestItem, 'id' | 'requestId'>>[] }) =>
    apiClient.post<PurchaseRequest>("/api/purchase-requests", data),
  
  updateStatus: (id: string, status: PurchaseRequest["status"], comments?: string) =>
    apiClient.patch<PurchaseRequest>(`/api/purchase-requests/${id}/status`, { status, comments }),
};
