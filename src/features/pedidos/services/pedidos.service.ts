import {
  purchaseOrdersApi,
  type PurchaseOrder,
  type OrderItem,
  type PurchaseOrderListParams,
} from "@/lib/api/purchase-orders";

export const pedidosService = {
  list: (params?: PurchaseOrderListParams | string) => purchaseOrdersApi.list(params),
  getById: (id: string) => purchaseOrdersApi.getById(id),
  updateStatus: (id: string, status: PurchaseOrder["status"], notes?: string) =>
    purchaseOrdersApi.updateStatus(id, status, notes),
  generatePdf: (id: string) => purchaseOrdersApi.generatePdf(id),
};

export type { PurchaseOrder, OrderItem, PurchaseOrderListParams };
