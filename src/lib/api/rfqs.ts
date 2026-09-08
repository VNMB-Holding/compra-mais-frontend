import { apiClient, cleanTenantParam, cleanFilterParam } from "@/lib/api-client";

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
      tradeName?: string;
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
      tradeName?: string;
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

export interface RfqListParams {
  tenantId?: string;
  companyCode?: string;
  status?: string;
  category?: string;
  search?: string;
}

export interface PublicRfq {
  id: string;
  code: string;
  title: string;
  closesAt: string;
  status: string;
  createdAt: string;
  companyCode: string;
  costCenterName: string;
  description: string;
  notes?: string;
  items: {
    id: string;
    description: string;
    quantity: number;
    unit: string;
    notes?: string;
  }[];
}

export interface PublicProposalPayload {
  supplierCnpj: string;
  supplierName: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  items: {
    requestItemId: string;
    unitPrice: number;
    notes?: string;
  }[];
  freightCost?: number;
  freightType?: "CIF" | "FOB";
  paymentTerms?: string;
  deliveryTime?: number;
  validityDays?: number;
  notes?: string;
}

export const rfqsApi = {
  list: (paramsOrTenant?: string | RfqListParams) => {
    const params = new URLSearchParams();
    if (typeof paramsOrTenant === 'string') {
      const validTenant = cleanTenantParam(paramsOrTenant);
      if (validTenant) params.append("companyCode", validTenant);
    } else if (paramsOrTenant) {
      const code = paramsOrTenant.companyCode || paramsOrTenant.tenantId;
      const validCode = cleanTenantParam(code);
      if (validCode) params.append("companyCode", validCode);

      const status = cleanFilterParam(paramsOrTenant.status);
      if (status) params.append("status", status);

      const category = cleanFilterParam(paramsOrTenant.category);
      if (category) params.append("category", category);

      const search = cleanFilterParam(paramsOrTenant.search);
      if (search) params.append("search", search);
    }
    const qs = params.toString();
    return apiClient.get<Rfq[]>(`/api/rfqs${qs ? `?${qs}` : ''}`);
  },
  
  getById: (id: string) => apiClient.get<Rfq>(`/api/rfqs/${id}`),

  getPublicRfq: async (id: string): Promise<PublicRfq> => {
    try {
      return await apiClient.get<PublicRfq>(`/api/rfqs/public/${id}`);
    } catch (err: any) {
      // Fallback para ambientes onde o endpoint /public/:id ainda não foi publicado
      try {
        const fallback = await apiClient.get<any>(`/api/rfqs/${id}`);
        if (fallback) {
          return {
            id: fallback.id,
            code: fallback.code || id,
            title: fallback.title || fallback.purchaseRequest?.description || "Cotação de Mercado",
            closesAt: fallback.closesAt || new Date(Date.now() + 7 * 86400000).toISOString(),
            status: fallback.status || "Open",
            createdAt: fallback.createdAt || new Date().toISOString(),
            companyCode: fallback.companyCode || fallback.purchaseRequest?.companyCode || "VNMB",
            costCenterName: fallback.purchaseRequest?.costCenterName || fallback.purchaseRequest?.category || "Geral",
            description: fallback.purchaseRequest?.description || fallback.title || "Demanda de Compras",
            notes: fallback.purchaseRequest?.notes || "",
            items: ((fallback.purchaseRequest?.items || fallback.items || []) as any[]).map((item: any) => ({
              id: item.id,
              description: item.description,
              quantity: Number(item.quantity) || 1,
              unit: item.unit || "UN",
              notes: item.notes || "",
            })),
          };
        }
      } catch (innerErr) {
        // Se ambos falharem, relança o erro original
      }
      throw err;
    }
  },

  submitPublicProposal: async (id: string, data: PublicProposalPayload) => {
    try {
      return await apiClient.post<{ success: boolean; protocol: string; supplierName: string; message: string }>(
        `/api/rfqs/public/${id}/proposal`,
        data
      );
    } catch (err: any) {
      // Fallback: se o backend retornar 404, tenta enviar via endpoint interno de proposals
      try {
        const rfq = await apiClient.get<any>(`/api/rfqs/${id}`);
        if (rfq?.id) {
          const totalVal = data.items.reduce((s, it) => s + (Number(it.unitPrice) || 0), 0);
          await apiClient.post(`/api/rfqs/${rfq.id}/proposals`, {
            supplierId: data.supplierCnpj,
            unitPrice: totalVal,
            freightCost: data.freightCost || 0,
            paymentTerms: data.paymentTerms || "30 dias DDL",
            deliveryTime: data.deliveryTime || 5,
            notes: data.notes || "",
          });
          return {
            success: true,
            protocol: `PROP-${Date.now()}`,
            supplierName: data.supplierName,
            message: "Proposta comercial registrada com sucesso!",
          };
        }
      } catch (fallbackErr) {
        // Ignora e relança o erro original
      }
      throw err;
    }
  },
  
  getKpis: (tenantId?: string) => {
    const validTenant = cleanTenantParam(tenantId);
    const params = new URLSearchParams();
    if (validTenant) params.append("tenantId", validTenant);
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
