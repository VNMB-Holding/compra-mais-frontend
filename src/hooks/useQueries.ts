import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { purchaseRequestsApi } from "@/lib/api/purchase-requests";
import { rfqsApi } from "@/lib/api/rfqs";
import { suppliersApi } from "@/lib/api/suppliers";
import { categoriesApi } from "@/lib/api/categories";
import { dashboardApi } from "@/lib/api/dashboard";

export const QUERY_KEYS = {
  purchaseRequests: (tenantId?: string) => ["purchase-requests", tenantId] as const,
  purchaseRequest: (id: string) => ["purchase-requests", id] as const,
  rfqs: (tenantId?: string) => ["rfqs", tenantId] as const,
  rfq: (id: string) => ["rfqs", id] as const,
  suppliers: ["suppliers"] as const,
  categories: ["categories"] as const,
  dashboardKpis: ["dashboard-kpis"] as const,
};

export function usePurchaseRequests(tenantId?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.purchaseRequests(tenantId),
    queryFn: () => purchaseRequestsApi.list(tenantId),
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function usePurchaseRequest(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.purchaseRequest(id),
    queryFn: () => purchaseRequestsApi.getById(id),
    enabled: !!id,
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
