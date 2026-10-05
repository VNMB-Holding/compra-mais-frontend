import { purchaseRequestsApi } from "@/lib/api/purchase-requests";
import { getApprovalChainForRequest, type ApprovalChainLevel } from "@/lib/utils/approval-limits";

export const aprovacoesService = {
  getApprovalChain: async (companyName: string, estimatedBudget: number): Promise<ApprovalChainLevel[]> => {
    try {
      const remoteChain = await purchaseRequestsApi.getApprovalChain(companyName, estimatedBudget);
      if (remoteChain.length > 0) return remoteChain as ApprovalChainLevel[];
    } catch {}

    return getApprovalChainForRequest(companyName, estimatedBudget);
  },
  getByToken: (token: string) => purchaseRequestsApi.getApprovalByToken(token),
  approveByToken: (token: string, comments?: string) => purchaseRequestsApi.approveByToken(token, comments),
  rejectByToken: (token: string, comments?: string) => purchaseRequestsApi.rejectByToken(token, comments),
};

export type { ApprovalChainLevel };
