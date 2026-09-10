export type SolicitacaoStatus =
  | "Draft"
  | "AwaitingApproval"
  | "Approved"
  | "Rejected"
  | "InQuote"
  | "Finished"
  | "Pending"
  | "UnderAnalysis"
  | "Cancelled";

export interface SolicitacaoItem {
  id?: string;
  description: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice?: number;
  costCenterCode?: string;
  costCenterName?: string;
  requiredDate?: string;
  corporateItemCode?: string;
}

export interface Solicitacao {
  id: string;
  code: string;
  description: string;
  tenantId: string;
  estimatedBudget: number;
  status: SolicitacaoStatus;
  requesterName?: string;
  requesterId?: string;
  notes?: string;
  companyCode?: string;
  filialCode?: string;
  costCenterCode?: string;
  createdAt: string;
  updatedAt: string;
  items?: SolicitacaoItem[];
}
