import {
  rfqsApi,
  type Rfq,
  type RfqListParams,
  type RfqKpis,
  type PublicRfq,
  type PublicProposalPayload,
} from "@/lib/api/rfqs";

export const rfqsService = {
  list: (params?: RfqListParams | string) => rfqsApi.list(params),
  getById: (id: string) => rfqsApi.getById(id),
  getPublicRfq: (id: string) => rfqsApi.getPublicRfq(id),
  getKpis: (tenantId?: string) => rfqsApi.getKpis(tenantId),
  create: (data: Parameters<typeof rfqsApi.create>[0]) => rfqsApi.create(data),
  createProposal: (rfqId: string, data: Parameters<typeof rfqsApi.createProposal>[1]) =>
    rfqsApi.createProposal(rfqId, data),
  submitPublicProposal: (id: string, data: PublicProposalPayload) =>
    rfqsApi.submitPublicProposal(id, data),
  selectWinner: (rfqId: string, proposalId: string) => rfqsApi.selectWinner(rfqId, proposalId),
  createPo: (rfqId: string) => rfqsApi.createPo(rfqId),
  updateStatus: (id: string, status: Rfq["status"]) => rfqsApi.updateStatus(id, status),
  inviteUnregisteredSupplier: (
    rfqId: string,
    data: Parameters<typeof rfqsApi.inviteUnregisteredSupplier>[1],
  ) => rfqsApi.inviteUnregisteredSupplier(rfqId, data),
};


export type { Rfq, RfqListParams, RfqKpis, PublicRfq, PublicProposalPayload };

