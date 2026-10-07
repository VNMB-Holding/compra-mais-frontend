import { apiClient, cleanTenantParam, cleanFilterParam } from "@/lib/api-client";

export interface Rfq {
  id: string;
  tenantId: string;
  code: string;
  requestId: string;
  title: string;
  closesAt: string;
  status:
    | "Draft"
    | "Open"
    | "UnderAnalysis"
    | "Finished"
    | "Closed"
    | "Cancelled"
    | "Pending"
    | "InQuote";
  createdAt: string;
  updatedAt: string;
  purchaseRequest?: {
    id: string;
    code: string;
    description: string;
    category: string;
    tenantId?: string;
    companyCode?: string;
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
      requestItemId?: string;
      unitPrice: number;
      freightCost?: number;
    }[];
  }[];
}

export interface RfqKpis {
  total: number;
  open: number;
  closingToday: number;
  closed: number;
  draft?: number;
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
  invitedSuppliers?: {
    id: string;
    name: string;
    corporateName?: string;
    cnpj?: string;
  }[];
}

export interface PublicProposalPayload {
  supplierId?: string;
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
  bankCode?: string;
  bankNumber?: string;
  pixKey?: string;
  bankDocumentImage?: string;
  bankDocumentFileName?: string;
}

export const rfqsApi = {
  list: (paramsOrTenant?: string | RfqListParams) => {
    const params = new URLSearchParams();
    if (typeof paramsOrTenant === "string") {
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
    return apiClient.get<Rfq[]>(`/api/rfqs${qs ? `?${qs}` : ""}`);
  },

  getById: async (id: string): Promise<Rfq> => {
    try {
      return await apiClient.get<Rfq>(`/api/rfqs/${id}`);
    } catch (err) {
      // 1. Tenta encontrar na listagem geral por id, código ou solicitação
      try {
        const list = await rfqsApi.list({ companyCode: "TODAS" });
        const found = list.find(
          (item) =>
            item.id === id ||
            item.code === id ||
            item.requestId === id ||
            item.purchaseRequest?.id === id ||
            item.purchaseRequest?.code === id,
        );
        if (found) return found;
      } catch {}

      // 2. Tenta recuperar dados via endpoint público caso o escopo autenticado bloqueie por tenant
      try {
        const pub = await rfqsApi.getPublicRfq(id);
        if (pub && pub.id) {
          const rfqAdapted: Rfq = {
            id: pub.id,
            tenantId: pub.companyCode || "",
            code: pub.code,
            requestId: "",
            title: pub.title,
            closesAt: pub.closesAt,
            status: (pub.status as any) || "Open",
            createdAt: pub.createdAt,
            updatedAt: pub.createdAt,
            purchaseRequest: {
              id: "",
              code: pub.code,
              description: pub.description || pub.title,
              category: pub.costCenterName || "",
              companyCode: pub.companyCode,
              items: pub.items || [],
            },
            rfqSuppliers: (pub.invitedSuppliers ?? []).map((s) => ({
              id: s.id,
              supplierId: s.id,
              supplier: {
                id: s.id,
                corporateName: s.corporateName || s.name,
                tradeName: s.name,
                cnpj: s.cnpj || "",
              },
            })),
            proposals: [],
          };
          return rfqAdapted;
        }
      } catch {}

      throw err;
    }
  },

  getPublicRfq: (id: string): Promise<PublicRfq> => {
    return apiClient.get<PublicRfq>(`/api/rfqs/public/${id}`);
  },

  submitPublicProposal: (id: string, data: PublicProposalPayload) => {
    return apiClient.post<{
      success: boolean;
      protocol: string;
      supplierName: string;
      message: string;
    }>(`/api/rfqs/public/${id}/proposal`, data);
  },

  getKpis: (companyCode?: string) => {
    const validTenant = cleanTenantParam(companyCode);
    const params = new URLSearchParams();
    if (validTenant) params.append("companyCode", validTenant);
    const qs = params.toString();
    return apiClient.get<RfqKpis>(`/api/rfqs/kpis${qs ? `?${qs}` : ""}`);
  },

  create: (data: {
    requestId: string;
    title: string;
    closesAt: string;
    supplierIds?: string[];
    status?: "Draft" | "Open";
    incoterm?: string;
    paymentTerms?: string;
    currency?: string;
    notes?: string;
  }) => apiClient.post<Rfq>("/api/rfqs", data),

  createProposal: (
    rfqId: string,
    data: {
      supplierId: string;
      unitPrice: number;
      freightCost?: number;
      freightType?: "CIF" | "FOB";
      paymentTerms?: string;
      deliveryTime?: number;
      validityDays?: number;
      warrantyMonths?: number;
      brandModel?: string;
      contactName?: string;
      contactEmail?: string;
      contactPhone?: string;
      notes?: string;
      items?: { requestItemId: string; unitPrice: number; notes?: string }[];
    },
  ) =>
    apiClient.post<{
      id: string;
      rfqId: string;
      supplierId: string;
      status: string;
      isWinner: boolean;
    }>(`/api/rfqs/${rfqId}/proposals`, data),

  selectWinner: (rfqId: string, proposalId: string) =>
    apiClient.patch(`/api/rfqs/${rfqId}/winner`, { proposalId }),

  createPo: (rfqId: string) => apiClient.post(`/api/rfqs/${rfqId}/create-po`, {}),

  updateStatus: (id: string, status: Rfq["status"], reason?: string) =>
    apiClient.patch<Rfq>(`/api/rfqs/${id}/status`, { status, reason }),

  inviteUnregisteredSupplier: (
    rfqId: string,
    data: {
      cnpj: string;
      corporateName: string;
      contactEmail: string;
      contactName?: string;
      contactPhone?: string;
    },
  ) =>
    apiClient.post<{ success: boolean; supplier: any }>(
      `/api/rfqs/${rfqId}/invite-unregistered`,
      data,
    ),
};
