import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  purchaseRequestsApi,
  PurchaseRequest,
  RequestItem,
  PurchaseRequestListParams,
} from "@/lib/api/purchase-requests";
import { rfqsApi, RfqListParams } from "@/lib/api/rfqs";
import { suppliersApi, SupplierListParams } from "@/lib/api/suppliers";
import { purchaseOrdersApi, PurchaseOrderListParams } from "@/lib/api/purchase-orders";
import { dashboardApi } from "@/lib/api/dashboard";
import { itemsApi, CatalogItem } from "@/lib/api/items";

export const QUERY_KEYS = {
  purchaseRequests: (params?: string | PurchaseRequestListParams) =>
    ["purchase-requests", "list", params] as const,
  purchaseRequest: (id: string) => ["purchase-requests", "detail", id] as const,
  rfqs: (params?: string | RfqListParams) => ["rfqs", "list", params] as const,
  rfq: (id: string) => ["rfqs", "detail", id] as const,
  suppliers: (params?: SupplierListParams) => ["suppliers", "list", params] as const,
  supplier: (id: string) => ["suppliers", "detail", id] as const,
  purchaseOrders: (params?: string | PurchaseOrderListParams) =>
    ["purchase-orders", "list", params] as const,
  purchaseOrder: (id: string) => ["purchase-orders", "detail", id] as const,
  dashboardKpis: ["dashboard-kpis"] as const,
};

export function usePurchaseRequests(paramsOrTenant?: string | PurchaseRequestListParams) {
  return useQuery({
    queryKey: QUERY_KEYS.purchaseRequests(paramsOrTenant),
    queryFn: () => purchaseRequestsApi.list(paramsOrTenant),
    staleTime: 1000 * 30,
  });
}

export function usePurchaseRequest(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.purchaseRequest(id),
    queryFn: () => purchaseRequestsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreatePurchaseRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      data: Omit<Partial<PurchaseRequest>, "items"> & {
        items?: Partial<Omit<RequestItem, "id" | "requestId">>[];
      },
    ) => purchaseRequestsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-requests"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardKpis });
    },
  });
}

export function useRfqs(paramsOrTenant?: string | RfqListParams) {
  return useQuery({
    queryKey: QUERY_KEYS.rfqs(paramsOrTenant),
    queryFn: () => rfqsApi.list(paramsOrTenant),
    staleTime: 1000 * 30,
  });
}

export function useRfq(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.rfq(id),
    queryFn: () => rfqsApi.getById(id),
    enabled: !!id,
  });
}

export function useDashboardKpis() {
  return useQuery({
    queryKey: QUERY_KEYS.dashboardKpis,
    queryFn: () => dashboardApi.getKpis(),
    staleTime: 1000 * 60,
  });
}

export function useSuppliers(params?: SupplierListParams) {
  return useQuery({
    queryKey: QUERY_KEYS.suppliers(params),
    queryFn: () => suppliersApi.list(params),
    staleTime: 1000 * 60,
  });
}

export function useSupplier(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.supplier(id),
    queryFn: () => suppliersApi.getById(id),
    enabled: !!id,
  });
}

export function usePurchaseOrders(paramsOrTenant?: string | PurchaseOrderListParams) {
  return useQuery({
    queryKey: QUERY_KEYS.purchaseOrders(paramsOrTenant),
    queryFn: () => purchaseOrdersApi.list(paramsOrTenant),
    staleTime: 1000 * 30,
  });
}

export function usePurchaseOrder(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.purchaseOrder(id),
    queryFn: () => purchaseOrdersApi.getById(id),
    enabled: !!id,
  });
}

export function useApprovePurchaseRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comments }: { id: string; comments?: string }) =>
      purchaseRequestsApi.updateStatus(id, "Approved", comments),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-requests"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.purchaseRequest(variables.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardKpis });
    },
  });
}

export function useRejectPurchaseRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comments }: { id: string; comments?: string }) =>
      purchaseRequestsApi.updateStatus(id, "Rejected", comments),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-requests"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.purchaseRequest(variables.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardKpis });
    },
  });
}

export function useUpdatePurchaseOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: any; notes?: string }) =>
      purchaseOrdersApi.updateStatus(id, status, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.purchaseOrder(variables.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardKpis });
    },
  });
}

export function useItems(params?: { search?: string; category?: string; supplierId?: string }) {
  return useQuery({
    queryKey: ["catalog-items", "list", params] as const,
    queryFn: () => itemsApi.list(params),
    staleTime: 1000 * 30,
  });
}

export function useItemsPaginated(params?: {
  search?: string;
  category?: string;
  supplierId?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["catalog-items", "paginated", params] as const,
    queryFn: () => itemsApi.listPaginated(params),
    staleTime: 1000 * 30,
  });
}

export function useItem(id: string) {
  return useQuery({
    queryKey: ["catalog-items", "detail", id] as const,
    queryFn: () => itemsApi.getById(id),
    enabled: !!id,
  });
}

export function useItemKpis() {
  return useQuery({
    queryKey: ["catalog-items", "kpis"] as const,
    queryFn: () => itemsApi.getKpis(),
    staleTime: 1000 * 60,
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof itemsApi.create>[0]) => itemsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog-items"] });
    },
  });
}
