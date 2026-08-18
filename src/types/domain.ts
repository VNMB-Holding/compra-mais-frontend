export interface PurchaseRequestRow {
  id: string;
  code: string;
  codigo: string;
  description: string;
  descricao: string;
  requesterName: string;
  solicitante: string;
  createdAt: string;
  data: string;
  status: string;
  priority: string;
  prioridade: string;
  categoryName: string;
  categoria: string;
  companyName: string;
  empresa: string;
}

export interface RfqRow {
  id: string;
  code: string;
  codigo: string;
  description: string;
  descricao: string;
  categoryName: string;
  categoria: string;
  openedAt: string;
  dataAbertura: string;
  closesAt: string;
  dataEncerramento: string;
  segmentType: string;
  tipoSegmento: string;
  status: string;
  companyName: string;
  empresa: string;
}

export interface PurchaseOrderRow {
  id: string;
  code: string;
  codigo: string;
  requestCode: string;
  solicitacaoCodigo: string;
  supplierName: string;
  fornecedorNome: string;
  categoryName: string;
  categoria: string;
  createdAt: string;
  dataCriacao: string;
  totalValue: string;
  valorTotal: string;
  status: string;
  companyName: string;
  empresa: string;
}

export interface SupplierRow {
  id: string;
  corporateName: string;
  razaoSocial: string;
  tradeName: string;
  nomeFantasia: string;
  cnpj: string;
  categoryName: string;
  categoria: string;
  contactName: string;
  contatoNome: string;
  contactEmail: string;
  contatoEmail: string;
  status: string;
  companyName: string;
  empresa: string;
}

export interface SupplierProposalRow {
  supplierId: string;
  proposalId?: string;
  supplierName: string;
  cnpj: string;
  status: "awaiting" | "received" | "declined";
  unitPrice?: number;
  freightCost?: number;
  deliveryTime?: number;
  paymentTerms?: string;
}

export type SolicitationRow = PurchaseRequestRow;
export type RFQRow = RfqRow;
