import { apiClient, cleanCompanyParam } from "@/lib/api-client";
import { getTenantsApi } from "@/lib/auth/api";

export interface CompanyBranchConfig {
  id: string;
  code: string;
  name: string;
  acronym: string;
  unitName: string;
  type: "Matriz" | "Filial";
  active: boolean;
  cnpj?: string;
}

export type ApproverType = "user" | "role" | "group";
export type ApprovalFlowType = "solicitacao" | "pedido";

export interface ApprovalRuleConfig {
  id: string;
  companyCode: string;
  flowType?: ApprovalFlowType;
  level: number;
  minAmount: number;
  maxAmount: number | null;
  approverType: ApproverType;
  approverIdentifier: string;
  approverName: string;
  department?: string;
  active: boolean;
  order: number;
}

export interface ApproverOption {
  id: string;
  name: string;
  email?: string;
  role?: string;
}

export interface CostCenterOption {
  code: string;
  name: string;
}

export const adminApi = {
  async getCompanies(): Promise<CompanyBranchConfig[]> {
    try {
      const remote = await apiClient.get<CompanyBranchConfig[]>("/api/admin/companies");
      if (remote && Array.isArray(remote)) {
        return remote;
      }
    } catch (err: any) {
      console.warn("Falha ao consultar /api/admin/companies:", err?.message);
    }

    const tenants = await getTenantsApi();
    if (tenants && Array.isArray(tenants)) {
      return tenants.map((t) => ({
        id: t.id,
        code: t.slug || t.id.slice(0, 4),
        name: t.name,
        acronym: t.slug?.slice(0, 3).toUpperCase() || "FIL",
        unitName: t.name,
        type: t.type || (t.parent_tenant_id ? "Filial" : "Matriz"),
        active: t.status === "Active",
        cnpj: t.document_number,
      }));
    }

    return [];
  },

  async getApprovers(): Promise<ApproverOption[]> {
    const remote = await apiClient.get<ApproverOption[]>("/api/admin/approvers");
    if (remote && Array.isArray(remote)) {
      return remote;
    }
    return [];
  },

  async getCostCenters(): Promise<CostCenterOption[]> {
    const remote = await apiClient.get<CostCenterOption[]>("/api/admin/cost-centers");
    if (remote && Array.isArray(remote)) {
      return remote;
    }
    return [];
  },

  async createCompany(data: Omit<CompanyBranchConfig, "id">): Promise<CompanyBranchConfig> {
    return apiClient.post<CompanyBranchConfig>("/api/admin/companies", data);
  },

  async updateCompany(id: string, data: Partial<CompanyBranchConfig>): Promise<CompanyBranchConfig> {
    return apiClient.put<CompanyBranchConfig>(`/api/admin/companies/${id}`, data);
  },

  async toggleCompanyStatus(id: string, active: boolean): Promise<CompanyBranchConfig> {
    return this.updateCompany(id, { active });
  },

  async getApprovalRules(companyCode?: string, flowType?: ApprovalFlowType): Promise<ApprovalRuleConfig[]> {
    const validCompany = cleanCompanyParam(companyCode);
    const params = new URLSearchParams();
    if (validCompany) params.set("companyCode", validCompany);
    if (flowType) params.set("flowType", flowType);
    const qs = params.toString() ? `?${params.toString()}` : "";
    const remote = await apiClient.get<ApprovalRuleConfig[]>(`/api/admin/approval-rules${qs}`);
    if (remote && Array.isArray(remote)) {
      return remote;
    }
    return [];
  },

  async createApprovalRule(data: Omit<ApprovalRuleConfig, "id">): Promise<ApprovalRuleConfig> {
    return apiClient.post<ApprovalRuleConfig>("/api/admin/approval-rules", data);
  },

  async updateApprovalRule(id: string, data: Partial<ApprovalRuleConfig>): Promise<ApprovalRuleConfig> {
    return apiClient.put<ApprovalRuleConfig>(`/api/admin/approval-rules/${id}`, data);
  },

  async deleteApprovalRule(id: string): Promise<boolean> {
    await apiClient.delete(`/api/admin/approval-rules/${id}`);
    return true;
  },

  async batchSaveApprovalRules(companyCode: string, newRules: ApprovalRuleConfig[], flowType?: ApprovalFlowType): Promise<ApprovalRuleConfig[]> {
    const remote = await apiClient.put<ApprovalRuleConfig[]>(`/api/admin/approval-rules/batch`, {
      companyCode,
      flowType,
      rules: newRules,
    });
    if (!remote || !Array.isArray(remote)) {
      throw new Error(`Falha ao salvar regras: o servidor não retornou uma lista válida. Resposta: ${JSON.stringify(remote)}`);
    }
    return remote;
  },
};
