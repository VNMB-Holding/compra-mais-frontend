import { apiClient } from "@/lib/api-client";

export interface Rfq {
  id: string;
  tenantId: string;
  code: string;
  requestId: string;
  title: string;
  closesAt: string;
  status: "Draft" | "Open" | "UnderAnalysis" | "Finished" | "Closed" | "Cancelled" | "Pending" | "InQuote";
  createdAt: string;
  updatedAt: string;
  purchaseRequest?: {
    id: string;
    code: string;
    description: string;
    category: string;
    tenantId?: string;
    items?: { id: string; description: string; quantity: number; unit: string }[];
  };
  rfqSuppliers?: {
    id: string;
    supplierId: string;
    supplier: {
      id: string;
      corporateName: string;
      cnpj: string;
    };
  }[];
  proposals?: {
    id: string;
    supplierId: string;
    status: "Draft" | "Submitted" | "Declined";
    isWinner: boolean;
    totalValue?: number;
    paymentTerms?: string;
    deliveryTime?: number;
    supplier: {
      id: string;
      corporateName: string;
      cnpj: string;
    };
    items?: {
      id: string;
      unitPrice: number;
      freightCost: number;
    }[];
  }[];
}

export interface RfqKpis {
  total: number;
  open: number;
  closingToday: number;
  closed: number;
  proposalCount: number;
}

export const rfqsApi = {
  list: (tenantId?: string) => {
    const params = new URLSearchParams();
    if (tenantId) params.append("tenantId", tenantId);
    const qs = params.toString();
    return apiClient.get<Rfq[]>(`/api/rfqs${qs ? `?${qs}` : ''}`);
  },
  
  getById: (id: string) => apiClient.get<Rfq>(`/api/rfqs/${id}`),
  
  getKpis: (tenantId?: string) => {
    const params = new URLSearchParams();
    if (tenantId) params.append("tenantId", tenantId);
    const qs = params.toString();
    return apiClient.get<RfqKpis>(`/api/rfqs/kpis${qs ? `?${qs}` : ''}`);
  },
  
  create: (data: { requestId: string; title: string; closesAt: string; supplierIds?: string[] }) =>
    apiClient.post<Rfq>("/api/rfqs", data),
  
  createProposal: (rfqId: string, data: { supplierId: string; unitPrice: number; freightCost?: number; paymentTerms?: string; deliveryTime?: number; notes?: string }) =>
    apiClient.post<{ id: string; rfqId: string; supplierId: string; status: string; isWinner: boolean }>(`/api/rfqs/${rfqId}/proposals`, data),


  selectWinner: (rfqId: string, proposalId: string) =>
    apiClient.patch(`/api/rfqs/${rfqId}/winner`, { proposalId }),

  createPo: (rfqId: string) =>
    apiClient.post(`/api/rfqs/${rfqId}/create-po`, {}),

  updateStatus: (id: string, status: Rfq["status"]) =>
    apiClient.patch<Rfq>(`/api/rfqs/${id}/status`, { status }),
};
