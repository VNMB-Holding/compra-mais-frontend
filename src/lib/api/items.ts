import { apiClient } from "@/lib/api-client";

export interface ItemPurchaseAudit {
  id: string;
  catalogItemId: string;
  supplierId: string;
  purchaseOrderId?: string;
  orderCode?: string;
  unitPrice: number;
  quantity?: number;
  totalPrice?: number;
  buyerId?: string;
  companyCode?: string;
  purchasedAt: string;
  notes?: string;
  supplier?: {
    id: string;
    corporateName: string;
    tradeName: string;
    cnpj: string;
  };
  purchaseOrder?: {
    id: string;
    code: string;
    companyCode?: string;
    status: string;
    createdAt: string;
  };
}

export interface CatalogItem {
  id: string;
  code?: string;
  description: string;
  category?: string;
  unit: string;
  lastSupplierId?: string;
  lastUnitPrice?: number;
  lastPurchaseDate?: string;
  totalPurchases: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastSupplier?: {
    id: string;
    corporateName: string;
    tradeName: string;
    cnpj: string;
    segment?: string;
    status?: string;
  };
  purchaseAudits?: ItemPurchaseAudit[];
  _count?: {
    purchaseAudits: number;
  };
}

export interface ItemKpis {
  totalItems: number;
  itemsWithSupplier: number;
  itemsWithoutSupplier: number;
  totalAudits: number;
  totalCategories: number;
}

export const itemsApi = {
  list: async (params?: {
    search?: string;
    category?: string;
    supplierId?: string;
  }): Promise<CatalogItem[]> => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.set("search", params.search);
      if (params?.category && params.category !== "Todas")
        searchParams.set("category", params.category);
      if (params?.supplierId && params.supplierId !== "Todos")
        searchParams.set("supplierId", params.supplierId);

      const qs = searchParams.toString();
      const res = await apiClient.get<CatalogItem[]>(`/api/items${qs ? `?${qs}` : ""}`);
      return res || [];
    } catch {
      return [];
    }
  },

  search: async (query: string): Promise<CatalogItem[]> => {
    try {
      if (!query || query.trim().length === 0) return [];
      const res = await apiClient.get<CatalogItem[]>(
        `/api/items/search?q=${encodeURIComponent(query.trim())}`,
      );
      return res || [];
    } catch {
      return [];
    }
  },

  getById: async (id: string): Promise<CatalogItem> => {
    return apiClient.get<CatalogItem>(`/api/items/${id}`);
  },

  getKpis: async (): Promise<ItemKpis> => {
    try {
      return await apiClient.get<ItemKpis>("/api/items/kpis");
    } catch {
      return {
        totalItems: 0,
        itemsWithSupplier: 0,
        itemsWithoutSupplier: 0,
        totalAudits: 0,
        totalCategories: 0,
      };
    }
  },

  create: async (data: {
    description: string;
    code?: string;
    category?: string;
    unit?: string;
    lastSupplierId?: string;
    lastUnitPrice?: number;
    notes?: string;
  }): Promise<CatalogItem> => {
    return apiClient.post<CatalogItem>("/api/items", data);
  },

  update: async (id: string, data: Partial<CatalogItem>): Promise<CatalogItem> => {
    return apiClient.patch<CatalogItem>(`/api/items/${id}`, data);
  },

  remove: async (id: string): Promise<void> => {
    return apiClient.delete(`/api/items/${id}`);
  },

  auditPurchase: async (data: {
    description: string;
    code?: string;
    category?: string;
    unit?: string;
    supplierId: string;
    unitPrice: number;
    quantity?: number;
    totalPrice?: number;
    purchaseOrderId?: string;
    orderCode?: string;
    buyerId?: string;
    companyCode?: string;
    notes?: string;
  }): Promise<{ item: CatalogItem; audit: ItemPurchaseAudit }> => {
    return apiClient.post<{ item: CatalogItem; audit: ItemPurchaseAudit }>(
      "/api/items/audit",
      data,
    );
  },
};
