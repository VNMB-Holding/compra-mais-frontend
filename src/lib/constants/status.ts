export const PURCHASE_REQUEST_STATUS_MAP: Record<string, string> = {
  Draft: "Rascunho",
  AwaitingApproval: "Aguardando aprovação",
  Approved: "Aprovada",
  Rejected: "Rejeitada",
  InQuote: "Em Cotação",
  Finished: "Atendida",
  Pending: "Pendente",
  UnderAnalysis: "Em Análise",
  Cancelled: "Cancelada",
};

export const PRIORITY_MAP: Record<string, string> = {
  Low: "Baixa",
  Medium: "Média",
  High: "Alta",
  Urgent: "Urgente",
  Critical: "Crítica",
};

export const PURCHASE_ORDER_STATUS_MAP: Record<string, "Emitido" | "Faturado" | "Entregue"> = {
  Sent: "Emitido",
  AwaitingSignature: "Emitido",
  Signed: "Faturado",
  Delivered: "Entregue",
};

export function mapRfqStatus(rfq: { status: string; closesAt?: string | null }): string {
  if (rfq.status === "Closed" || rfq.status === "Finished") return "Encerrada";
  if (rfq.status === "Cancelled") return "Cancelada";
  if (rfq.status === "UnderAnalysis") return "Em análise";
  if (rfq.closesAt) {
    const today = new Date().toISOString().split("T")[0];
    const closes = new Date(rfq.closesAt).toISOString().split("T")[0];
    if (today === closes) return "Encerrando hoje";
  }
  return "Aberta";
}

export type BadgeVariant = "primary" | "secondary" | "success" | "warning" | "danger" | "gray";

export function getStatusBadgeVariant(status?: string | null): BadgeVariant {
  if (!status) return "gray";
  const s = status.trim().toLowerCase();

  switch (s) {
    case "approved":
    case "aprovada":
    case "finished":
    case "atendida":
    case "active":
    case "homologado":
    case "entregue":
    case "delivered":
    case "concluído":
    case "concluida":
    case "sucesso":
      return "success";

    case "awaitingapproval":
    case "aguardando aprovação":
    case "aguardando aprovacao":
    case "underanalysis":
    case "em análise":
    case "em analise":
    case "pending":
    case "pendente":
    case "encerrando hoje":
    case "em transporte":
    case "intransit":
    case "aguardando docs.":
    case "aguardando documentos":
      return "warning";

    case "inquote":
    case "em cotação":
    case "em cotacao":
    case "open":
    case "aberta":
    case "sent":
    case "emitido":
    case "faturado":
    case "signed":
    case "awaitingsignature":
    case "em análise (homologação)":
      return "primary";

    case "rejected":
    case "rejeitada":
    case "rejeitado":
    case "cancelled":
    case "cancelada":
    case "suspended":
    case "bloqueado":
    case "crítico":
    case "critico":
    case "alto":
      return "danger";

    case "draft":
    case "rascunho":
    case "encerrada":
    case "closed":
    case "inactive":
    case "inativo":
    default:
      return "gray";
  }
}
