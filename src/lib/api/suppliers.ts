import { apiClient } from "@/lib/api-client";

export interface Supplier {
  id: string;
  tenantId: string;
  corporateName: string;
  tradeName: string;
  cnpj: string;
  segment: string;
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
  list: () => apiClient.get<Supplier[]>("/api/suppliers"),
  
  getById: (id: string) => apiClient.get<Supplier>(`/api/suppliers/${id}`),
  
  getKpis: () => apiClient.get<SupplierKpis>("/api/suppliers/kpis"),
  
  create: (data: Partial<Supplier>) => apiClient.post<Supplier>("/api/suppliers", data),
  
  update: (id: string, data: Partial<Supplier>) => apiClient.patch<Supplier>(`/api/suppliers/${id}`, data),
  
  remove: (id: string) => apiClient.delete(`/api/suppliers/${id}`),
};
