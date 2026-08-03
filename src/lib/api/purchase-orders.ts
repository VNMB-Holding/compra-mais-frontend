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
  list: () => apiClient.get<PurchaseOrder[]>("/api/purchase-orders"),

  getById: (id: string) => apiClient.get<PurchaseOrder>(`/api/purchase-orders/${id}`),

  generatePdf: (id: string) => apiClient.getRaw(`/api/purchase-orders/${id}/pdf`),
};
