import { apiClient } from "@/lib/api-client";

export interface PurchaseOrder {
  id: string;
  tenantId: string;
  code: string;
  supplierId: string;
  buyerId: string;
  totalValue: number;
  paymentTerms: string;
  estimatedDeliveryDate: string;
  shippingType?: "CIF" | "FOB" | "EXW" | "DDP";
  status: "AwaitingSignature" | "Signed" | "InTransit" | "Delivered" | "Cancelled" | "Sent" | "Processing";
  createdAt: string;
  updatedAt: string;
  supplier?: {
    id: string;
    tradeName: string;
    corporateName: string;
    cnpj: string;
  };
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice?: number;
}

export const purchaseOrdersApi = {
  list: (tenantId?: string) => {
    const params = new URLSearchParams();
    if (tenantId) params.append("tenantId", tenantId);
    const qs = params.toString();
    return apiClient.get<PurchaseOrder[]>(`/api/purchase-orders${qs ? `?${qs}` : ''}`);
  },

  getById: (id: string) => apiClient.get<PurchaseOrder>(`/api/purchase-orders/${id}`),

  generatePdf: (id: string) => apiClient.getRaw(`/api/purchase-orders/${id}/pdf`),
};
