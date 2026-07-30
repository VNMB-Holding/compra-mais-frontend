import { apiClient } from "@/lib/api-client";

export interface PurchaseRequest {
  id: string;
  tenantId: string;
  code: string;
  description: string;
  requesterId: string;
  requesterName?: string;
  department?: string;
  purchaseType?: string;
  paymentTerms?: string;
  preferredSupplier?: string;
  notes?: string;
  category: string;
  justification: string;
  estimatedBudget: number;
  deliveryLocation: string;
  deadline: string;
  priority: "Low" | "Medium" | "High" | "Urgent" | "Critical";
  status: "Draft" | "AwaitingApproval" | "Approved" | "Rejected" | "InQuote" | "Finished" | "Pending" | "UnderAnalysis" | "Cancelled";
  createdAt: string;
  updatedAt: string;
  items?: RequestItem[];
  approvalHistories?: {
    id: string;
    action: string;
    comments?: string;
    actionDate: string;
    approverId: string;
  }[];
  rfqs?: {
    id: string;
    code: string;
  }[];
}

export interface RequestItem {
  id: string;
  requestId: string;
  description: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice?: number;
  costCenter?: string;
  requiredDate?: string;
}

export interface PurchaseRequestKpis {
  total: number;
  awaitingApproval: number;
  approved: number;
  rejected: number;
  categoryCount: number;
}

export const purchaseRequestsApi = {
  list: () => apiClient.get<PurchaseRequest[]>("/api/purchase-requests"),
  
  getById: (id: string) => apiClient.get<PurchaseRequest>(`/api/purchase-requests/${id}`),
  
  getKpis: () => apiClient.get<PurchaseRequestKpis>("/api/purchase-requests/kpis"),
  
  create: (data: Omit<Partial<PurchaseRequest>, 'items'> & { items?: Partial<Omit<RequestItem, 'id' | 'requestId'>>[] }) =>
    apiClient.post<PurchaseRequest>("/api/purchase-requests", data),
  
  updateStatus: (id: string, status: PurchaseRequest["status"]) =>
    apiClient.patch<PurchaseRequest>(`/api/purchase-requests/${id}/status`, { status }),
};
