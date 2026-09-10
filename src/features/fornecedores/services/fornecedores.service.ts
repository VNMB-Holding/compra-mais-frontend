import {
  suppliersApi,
  homologacaoApi,
  type Supplier,
  type SupplierListParams,
  type SupplierKpis,
  type SupplierScreeningResult,
} from "@/lib/api/suppliers";

export const fornecedoresService = {
  list: (params?: SupplierListParams | string) => suppliersApi.list(params),
  getById: (id: string) => suppliersApi.getById(id),
  getKpis: (tenantId?: string) => suppliersApi.getKpis(tenantId),
  create: (data: Partial<Supplier>) => suppliersApi.create(data),
  update: (id: string, data: Partial<Supplier>) => suppliersApi.update(id, data),
  remove: (id: string) => suppliersApi.remove(id),
  updateStatus: (supplierId: string, status: Supplier["status"], performanceScore?: number) =>
    homologacaoApi.updateStatus(supplierId, status, performanceScore),
  screen: (companyName: string, cnpj: string) => homologacaoApi.screen(companyName, cnpj),
  getScreenStatus: (jobId: string) => homologacaoApi.getStatus(jobId),
};

export type { Supplier, SupplierListParams, SupplierKpis, SupplierScreeningResult };
