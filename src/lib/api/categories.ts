import { apiClient, cleanTenantParam } from "@/lib/api-client";

export interface Category {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export const categoriesApi = {
  list: (tenantId?: string) => {
    const validTenant = cleanTenantParam(tenantId);
    const params = new URLSearchParams();
    if (validTenant) params.append("tenantId", validTenant);
    const qs = params.toString();
    return apiClient.get<Category[]>(`/api/categories${qs ? `?${qs}` : ''}`);
  },
  getById: (id: string) => apiClient.get<Category>(`/api/categories/${id}`),
  create: (data: { name: string; description?: string }) =>
    apiClient.post<Category>("/api/categories", data),
  update: (id: string, data: { name?: string; description?: string }) =>
    apiClient.patch<Category>(`/api/categories/${id}`, data),
  remove: (id: string) => apiClient.delete(`/api/categories/${id}`),
};
