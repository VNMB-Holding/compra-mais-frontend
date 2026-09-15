import { apiClient, cleanCompanyParam } from "@/lib/api-client";
import { purchaseRequestsApi, PurchaseRequest } from "./purchase-requests";
import { rfqsApi, Rfq } from "./rfqs";
import { purchaseOrdersApi, PurchaseOrder } from "./purchase-orders";
import { suppliersApi, Supplier } from "./suppliers";

export interface SearchSolicitacao {
  id: string;
  code: string;
  description: string;
  status: string;
  requesterName?: string;
  createdAt: string;
  totalBudget?: number;
  url: string;
}

export interface SearchRfq {
  id: string;
  code: string;
  title: string;
  status: string;
  closesAt?: string;
  url: string;
}

export interface SearchPedido {
  id: string;
  code: string;
  supplierName: string;
  status: string;
  totalValue: number;
  createdAt: string;
  url: string;
}

export interface SearchFornecedor {
  id: string;
  corporateName: string;
  tradeName?: string;
  cnpj: string;
  segment?: string;
  status: string;
  url: string;
}

export interface GlobalSearchResults {
  solicitacoes: SearchSolicitacao[];
  rfqs: SearchRfq[];
  pedidos: SearchPedido[];
  fornecedores: SearchFornecedor[];
}

export interface SearchItem {
  id: string;
  title: string;
  category: "Solicitações" | "Cotações (RFQs)" | "Pedidos de Compra" | "Fornecedores" | "Ações" | "Páginas";
  description: string;
  url: string;
  icon: string;
  status?: string;
  badgeVariant?: "primary" | "gray" | "success" | "warning" | "danger" | "dark";
  meta?: string;
  shortcut?: string;
}

/**
 * Maps raw backend status to Portuguese display text and badge variant
 */
export function formatSearchStatus(status?: string): { label: string; variant: "primary" | "gray" | "success" | "warning" | "danger" | "dark" } {
  if (!status) return { label: "N/A", variant: "gray" };
  switch (status.toLowerCase()) {
    case "approved":
    case "signed":
    case "delivered":
    case "homologated":
    case "active":
    case "ativo":
    case "concluido":
    case "finalizado":
      return { label: "Aprovado", variant: "success" };
    case "awaitingapproval":
    case "awaitingsignature":
    case "pending":
    case "pendente":
    case "em_aprovacao":
      return { label: "Pendente", variant: "warning" };
    case "open":
    case "inquote":
    case "em_cotacao":
    case "published":
      return { label: "Em Cotação", variant: "primary" };
    case "intransit":
    case "sent":
    case "processing":
      return { label: "Em Andamento", variant: "primary" };
    case "rejected":
    case "cancelled":
    case "bloqueado":
    case "inativo":
      return { label: "Cancelado / Inativo", variant: "danger" };
    default:
      return { label: status, variant: "gray" };
  }
}

export const searchApi = {
  /**
   * Performs global real-time search querying dedicated /api/search endpoint,
   * falling back smoothly to parallel entity search if the endpoint is not yet available.
   */
  globalSearch: async (query: string, companyCode?: string, limit: number = 5): Promise<GlobalSearchResults> => {
    const trimmed = query.trim();
    if (!trimmed) {
      return { solicitacoes: [], rfqs: [], pedidos: [], fornecedores: [] };
    }

    const cleanCompany = cleanCompanyParam(companyCode);
    const params = new URLSearchParams();
    params.append("q", trimmed);
    if (cleanCompany) params.append("companyCode", cleanCompany);
    if (limit) params.append("limit", limit.toString());

    // 1. Try dedicated unified backend endpoint
    try {
      const directResults = await apiClient.get<GlobalSearchResults>(`/api/search?${params.toString()}`);
      if (directResults && typeof directResults === "object") {
        return {
          solicitacoes: directResults.solicitacoes || [],
          rfqs: directResults.rfqs || [],
          pedidos: directResults.pedidos || [],
          fornecedores: directResults.fornecedores || [],
        };
      }
    } catch (err: any) {
      // If 404 or backend search module unavailable, gracefully fallback to parallel queries
    }

    // 2. Resilient fallback: Parallel querying existing endpoints
    const [reqsSettled, rfqsSettled, ordersSettled, supsSettled] = await Promise.allSettled([
      purchaseRequestsApi.list({ search: trimmed, companyCode: cleanCompany }).catch(() => [] as PurchaseRequest[]),
      rfqsApi.list({ search: trimmed, companyCode: cleanCompany }).catch(() => [] as Rfq[]),
      purchaseOrdersApi.list({ search: trimmed, companyCode: cleanCompany }).catch(() => [] as PurchaseOrder[]),
      suppliersApi.list({ search: trimmed }).catch(() => [] as Supplier[]),
    ]);

    const solicitacoesRaw = reqsSettled.status === "fulfilled" ? (reqsSettled.value as PurchaseRequest[]) || [] : [];
    const rfqsRaw = rfqsSettled.status === "fulfilled" ? (rfqsSettled.value as Rfq[]) || [] : [];
    const pedidosRaw = ordersSettled.status === "fulfilled" ? (ordersSettled.value as PurchaseOrder[]) || [] : [];
    const supsRaw = supsSettled.status === "fulfilled" ? (supsSettled.value as Supplier[]) || [] : [];

    const solicitacoes: SearchSolicitacao[] = solicitacoesRaw.slice(0, limit).map((r) => ({
      id: r.id,
      code: r.code || r.id.substring(0, 8),
      description: r.description || "Solicitação de Compra",
      status: r.status,
      requesterName: r.requesterName,
      createdAt: r.createdAt,
      totalBudget: r.estimatedBudget,
      url: `/compras/solicitacoes?id=${r.id}`,
    }));

    const rfqs: SearchRfq[] = rfqsRaw.slice(0, limit).map((q) => ({
      id: q.id,
      code: q.code || q.id.substring(0, 8),
      title: q.title || "Processo de Cotação",
      status: q.status,
      closesAt: q.closesAt,
      url: `/compras/rfqs/${q.id}`,
    }));

    const pedidos: SearchPedido[] = pedidosRaw.slice(0, limit).map((p) => ({
      id: p.id,
      code: p.code || p.id.substring(0, 8),
      supplierName: p.supplier?.tradeName || p.supplier?.corporateName || "Fornecedor",
      status: p.status,
      totalValue: p.totalValue || 0,
      createdAt: p.createdAt,
      url: `/compras/pedidos/${p.id}`,
    }));

    const fornecedores: SearchFornecedor[] = supsRaw.slice(0, limit).map((s) => ({
      id: s.id,
      corporateName: s.corporateName || s.tradeName || "Fornecedor",
      tradeName: s.tradeName,
      cnpj: s.cnpj || "CNPJ não informado",
      segment: s.segment,
      status: s.status || "Ativo",
      url: `/fornecedores/${s.id}`,
    }));

    return {
      solicitacoes,
      rfqs,
      pedidos,
      fornecedores,
    };
  },
};
