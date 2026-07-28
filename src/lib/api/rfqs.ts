import { apiClient } from "@/lib/api-client";

export interface Rfq {
  id: string;
  tenantId: string;
  code: string;
  requestId: string;
  title: string;
  closesAt: string;
  status: "Draft" | "Open" | "Closed" | "Cancelled";
  createdAt: string;
  updatedAt: string;
  purchaseRequest?: {
    id: string;
    code: string;
    description: string;
    category: string;
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
  list: () => apiClient.get<Rfq[]>("/api/rfqs"),
  
  getById: (id: string) => apiClient.get<Rfq>(`/api/rfqs/${id}`),
  
  getKpis: () => apiClient.get<RfqKpis>("/api/rfqs/kpis"),
  
  create: (data: { requestId: string; title: string; closesAt: string; supplierIds?: string[] }) =>
    apiClient.post<Rfq>("/api/rfqs", data),
  
  updateStatus: (id: string, status: Rfq["status"]) =>
    apiClient.patch<Rfq>(`/api/rfqs/${id}/status`, { status }),
};
