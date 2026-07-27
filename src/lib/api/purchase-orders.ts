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
  status: "AwaitingSignature" | "Signed" | "Delivered" | "Cancelled";
  createdAt: string;
  updatedAt: string;
  supplier?: {
    id: string;
    tradeName: string;
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

  generatePdf: (id: string) =>
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/purchase-order/${id}/pdf`, {
      credentials: "include",
    }),
};
