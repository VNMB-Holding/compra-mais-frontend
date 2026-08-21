import { apiClient, cleanTenantParam } from "@/lib/api-client";

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
  companyCode?: string;
  filialCode?: string;
  corporateCode?: string;
  corporateColigada?: string;
  corporateFilial?: string;
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

export interface PurchaseOrderListParams {
  tenantId?: string;
  companyCode?: string;
  status?: string;
  supplier?: string;
  search?: string;
}

export const purchaseOrdersApi = {
  list: (paramsOrTenant?: string | PurchaseOrderListParams) => {
    const params = new URLSearchParams();
    if (typeof paramsOrTenant === 'string') {
      const validTenant = cleanTenantParam(paramsOrTenant);
      if (validTenant) params.append("companyCode", validTenant);
    } else if (paramsOrTenant) {
      const code = paramsOrTenant.companyCode || paramsOrTenant.tenantId;
      const validCode = cleanTenantParam(code);
      if (validCode) params.append("companyCode", validCode);
      if (paramsOrTenant.status && paramsOrTenant.status !== 'Todos') params.append("status", paramsOrTenant.status);
      if (paramsOrTenant.supplier && paramsOrTenant.supplier !== 'Todas' && paramsOrTenant.supplier !== 'Todos') params.append("supplier", paramsOrTenant.supplier);
      if (paramsOrTenant.search && paramsOrTenant.search.trim() !== '') params.append("search", paramsOrTenant.search.trim());
    }
    const qs = params.toString();
    return apiClient.get<PurchaseOrder[]>(`/api/purchase-orders${qs ? `?${qs}` : ''}`);
  },

  getById: (id: string) => apiClient.get<PurchaseOrder>(`/api/purchase-orders/${id}`),

  generatePdf: (id: string) => apiClient.getRaw(`/api/purchase-orders/${id}/pdf`),
};
