import { apiClient } from "@/lib/api-client";

export interface Category {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export const categoriesApi = {
  list: () => apiClient.get<Category[]>("/api/categories"),
  getById: (id: string) => apiClient.get<Category>(`/api/categories/${id}`),
  create: (data: { name: string; description?: string }) =>
    apiClient.post<Category>("/api/categories", data),
  update: (id: string, data: { name?: string; description?: string }) =>
    apiClient.patch<Category>(`/api/categories/${id}`, data),
  remove: (id: string) => apiClient.delete(`/api/categories/${id}`),
};
