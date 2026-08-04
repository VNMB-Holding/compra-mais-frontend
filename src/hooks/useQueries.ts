import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { purchaseRequestsApi, PurchaseRequest, RequestItem } from "@/lib/api/purchase-requests";
import { rfqsApi } from "@/lib/api/rfqs";
import { suppliersApi } from "@/lib/api/suppliers";
import { purchaseOrdersApi } from "@/lib/api/purchase-orders";
import { categoriesApi } from "@/lib/api/categories";
import { dashboardApi } from "@/lib/api/dashboard";

export const QUERY_KEYS = {
  purchaseRequests: (tenantId?: string) => ["purchase-requests", "list", tenantId] as const,
  purchaseRequest: (id: string) => ["purchase-requests", "detail", id] as const,
  rfqs: (tenantId?: string) => ["rfqs", "list", tenantId] as const,
  rfq: (id: string) => ["rfqs", "detail", id] as const,
  suppliers: ["suppliers"] as const,
  supplier: (id: string) => ["suppliers", "detail", id] as const,
  purchaseOrders: (tenantId?: string) => ["purchase-orders", "list", tenantId] as const,
  purchaseOrder: (id: string) => ["purchase-orders", "detail", id] as const,
  categories: ["categories"] as const,
  dashboardKpis: ["dashboard-kpis"] as const,
};

export function usePurchaseRequests(tenantId?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.purchaseRequests(tenantId),
    queryFn: () => purchaseRequestsApi.list(tenantId),
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
    mutationFn: (data: Omit<Partial<PurchaseRequest>, 'items'> & { items?: Partial<Omit<RequestItem, 'id' | 'requestId'>>[] }) =>
      purchaseRequestsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-requests"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboardKpis });
    },
  });
}

export function useRfqs(tenantId?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.rfqs(tenantId),
    queryFn: () => rfqsApi.list(tenantId),
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

export function useSuppliers() {
  return useQuery({
    queryKey: QUERY_KEYS.suppliers,
    queryFn: () => suppliersApi.list(),
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

export function usePurchaseOrders(tenantId?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.purchaseOrders(tenantId),
    queryFn: () => purchaseOrdersApi.list(tenantId),
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

export function useCategories() {
  return useQuery({
    queryKey: QUERY_KEYS.categories,
    queryFn: () => categoriesApi.list(),
    staleTime: 1000 * 60 * 5,
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
