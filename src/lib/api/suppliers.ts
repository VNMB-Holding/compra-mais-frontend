import { apiClient, cleanTenantParam } from "@/lib/api-client";
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

  // Informação bancária
  bankNumber?: string;
  bankCode?: string;
  pixKey?: string;
  registrationDate?: string;

  // Locais de entrega
  deliveryLocationName?: string;
  deliveryLocationCode?: string;
  deliveryLeadTime?: number;
  performanceScore?: number;
  segment?: string;

  // Integração / ERP
  integrationCode?: string;
  rawPayload?: any;

  createdAt: string;
  updatedAt: string;
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
      if (paramsOrTenant.status && paramsOrTenant.status !== 'Todos' && paramsOrTenant.status !== 'all') {
        params.append("status", paramsOrTenant.status);
      }
      if (paramsOrTenant.state && paramsOrTenant.state !== 'Todos' && paramsOrTenant.state !== 'all') {
        params.append("state", paramsOrTenant.state);
      }
      if (paramsOrTenant.segment && paramsOrTenant.segment !== 'Todos' && paramsOrTenant.segment !== 'all') {
        params.append("segment", paramsOrTenant.segment);
      }
      if (paramsOrTenant.search && paramsOrTenant.search.trim() !== '') {
        params.append("search", paramsOrTenant.search.trim());
      }
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
