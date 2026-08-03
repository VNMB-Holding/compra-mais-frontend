export interface SolicitationRow {
  id: string;
  codigo: string;
  descricao: string;
  solicitante: string;
  data: string;
  status: string;
  prioridade: string;
  categoria: string;
  empresa: string;
}

export interface RFQRow {
  id: string;
  codigo: string;
  descricao: string;
  categoria: string;
  dataAbertura: string;
  dataEncerramento: string;
  tipoSegmento: string;
  status: string;
  empresa: string;
}

export interface PurchaseOrderRow {
  id: string;
  codigo: string;
  solicitacaoCodigo: string;
  fornecedorNome: string;
  categoria: string;
  dataCriacao: string;
  valorTotal: string;
  status: string;
  empresa: string;
}

export interface SupplierRow {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  categoria: string;
  contatoNome: string;
  contatoEmail: string;
  status: string;
  empresa: string;
}
