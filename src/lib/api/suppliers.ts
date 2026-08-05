import { apiClient, cleanTenantParam } from "@/lib/api-client";
import { CategoryType } from "@/lib/utils/category-icon";

export interface Supplier {
  id: string;
  tenantId: string;
  corporateName: string;
  tradeName: string;
  cnpj: string;
  segment: string;
  categoryType?: CategoryType | string;
  stateRegistration?: string;
  zipCode: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  contactName?: string;
  status: "Active" | "Inactive" | "UnderCertification" | "Suspended" | "Pending";
  performanceScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierKpis {
  total: number;
  active: number;
  underCertification: number;
  avgPerformanceScore: string | null;
  segmentCount: number;
}

export const suppliersApi = {
  list: (tenantId?: string) => {
    const validTenant = cleanTenantParam(tenantId);
    const params = new URLSearchParams();
    if (validTenant) params.append("tenantId", validTenant);
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
