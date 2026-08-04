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

export function getStatusBadgeVariant(status: string): "success" | "warning" | "danger" | "gray" | "info" {
  switch (status) {
    case "Approved":
    case "Aprovada":
    case "Finished":
    case "Atendida":
    case "Active":
      return "success";
    case "AwaitingApproval":
    case "Aguardando aprovação":
    case "UnderAnalysis":
    case "Em Análise":
    case "Pending":
    case "Pendente":
      return "warning";
    case "InQuote":
    case "Em Cotação":
    case "Open":
    case "Aberta":
    case "Sent":
    case "Emitido":
      return "info";
    case "Rejected":
    case "Rejeitada":
    case "Cancelled":
    case "Cancelada":
      return "danger";
    default:
      return "gray";
  }
}
