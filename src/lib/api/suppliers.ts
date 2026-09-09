import { apiClient, cleanTenantParam, cleanFilterParam } from "@/lib/api-client";
import { CategoryType } from "@/lib/utils/category-icon";

export interface Supplier {
  id: string;
  tenantId: string;
  corporateName: string;
  tradeName: string;
  cnpj: string;
  stateRegistration?: string;
  zipCode?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  contactEmail?: string;
  contactPhone?: string;
  fax?: string;
  contactName?: string;
  status: "Active" | "Inactive" | "UnderCertification" | "Suspended" | "Pending";
  isActive?: boolean;
  foundationDate?: string;
  isPublicAgency?: boolean;
  suframa?: string;

  
  bankNumber?: string;
  bankCode?: string;
  pixKey?: string;
  registrationDate?: string;

  
  deliveryLocationName?: string;
  deliveryLocationCode?: string;
  deliveryLeadTime?: number;
  performanceScore?: number;
  segment?: string;

  
  integrationCode?: string;
  rawPayload?: any;

  createdAt: string;
  updatedAt: string;

  proposals?: Array<{
    id: string;
    totalValue?: number;
    status: string;
    isWinner: boolean;
    createdAt: string;
    rfq?: {
      code: string;
      title: string;
      createdAt: string;
    };
  }>;
  purchaseOrders?: Array<{
    id: string;
    code: string;
    totalAmount?: number;
    status: string;
    createdAt: string;
  }>;
}

export interface SupplierKpis {
  total: number;
  active: number;
  withPix: number;
  withBank: number;
  underCertification?: number;
  avgPerformanceScore?: string;
  segmentCount?: number;
}

export interface SupplierListParams {
  tenantId?: string;
  status?: string;
  state?: string;
  city?: string;
  segment?: string;
  search?: string;
}

export const suppliersApi = {
  list: (paramsOrTenant?: string | SupplierListParams) => {
    const params = new URLSearchParams();
    if (typeof paramsOrTenant === 'string') {
      const validTenant = cleanTenantParam(paramsOrTenant);
      if (validTenant) params.append("tenantId", validTenant);
    } else if (paramsOrTenant) {
      const status = cleanFilterParam(paramsOrTenant.status);
      if (status) params.append("status", status);

      const state = cleanFilterParam(paramsOrTenant.state);
      if (state) params.append("state", state);

      const city = cleanFilterParam(paramsOrTenant.city);
      if (city) params.append("city", city);

      const segment = cleanFilterParam(paramsOrTenant.segment);
      if (segment) params.append("segment", segment);

      const search = cleanFilterParam(paramsOrTenant.search);
      if (search) params.append("search", search);
    }
    const qs = params.toString();
    return apiClient.get<Supplier[]>(`/api/suppliers${qs ? `?${qs}` : ''}`);
  },
  
  getById: (id: string) => apiClient.get<Supplier>(`/api/suppliers/${id}`),
  
  getKpis: (tenantId?: string) => {
    const validTenant = cleanTenantParam(tenantId);
    const params = new URLSearchParams();
    if (validTenant) params.append("tenantId", validTenant);
    const qs = params.toString();
    return apiClient.get<SupplierKpis>(`/api/suppliers/kpis${qs ? `?${qs}` : ''}`);
  },
  
  create: (data: Partial<Supplier>) => apiClient.post<Supplier>("/api/suppliers", data),
  
  update: (id: string, data: Partial<Supplier>) => apiClient.patch<Supplier>(`/api/suppliers/${id}`, data),
  
  remove: (id: string) => apiClient.delete(`/api/suppliers/${id}`),
};

export interface SupplierScreeningResult {
  cnpj: string;
  companyName: string;
  cnpjStatus?: string;
  cnpjData?: Record<string, any>;
  sourceStatus: Record<string, string>;
  searchQuery: string;
  news: Array<Record<string, string>>;
  complaints: Array<Record<string, string>>;
  risks: string[];
  score: number;
  recommendations: string[];
}

export const homologacaoApi = {
  screen: (companyName: string, cnpj: string) =>
    apiClient.post<SupplierScreeningResult>("/api/homologacao-scraper/screen", { companyName, cnpj }),

  getStatus: (jobId: string) =>
    apiClient.get<any>(`/api/homologacao-scraper/status/${jobId}`),

  updateStatus: (supplierId: string, status: Supplier["status"], performanceScore?: number, rawPayload?: any) =>
    apiClient.patch<Supplier>(`/api/suppliers/${supplierId}`, {
      status,
      isActive: status === "Active",
      ...(performanceScore !== undefined ? { performanceScore } : {}),
      ...(rawPayload !== undefined ? { rawPayload } : {}),
    }),
};
