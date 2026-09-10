import { purchaseRequestsApi, type PurchaseRequest, type PurchaseRequestListParams } from "@/lib/api/purchase-requests";

export const solicitacoesService = {
  list: (params?: PurchaseRequestListParams | string) => purchaseRequestsApi.list(params),
  getById: (id: string) => purchaseRequestsApi.getById(id),
  getKpis: (tenantId?: string) => purchaseRequestsApi.getKpis(tenantId),
  create: (data: Parameters<typeof purchaseRequestsApi.create>[0]) => purchaseRequestsApi.create(data),
  updateStatus: (id: string, status: PurchaseRequest["status"], comments?: string) =>
    purchaseRequestsApi.updateStatus(id, status, comments),
};
