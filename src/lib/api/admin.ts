import { apiClient, cleanCompanyParam } from "@/lib/api-client";
import { getTenantsApi, IdentityTenant } from "@/lib/auth/api";

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
  active: boolean;
  order: number;
}

const STORAGE_KEY_COMPANIES = "compra_mais_admin_companies";
const STORAGE_KEY_RULES = "compra_mais_admin_rules";

export const INITIAL_COMPANIES_SEED: CompanyBranchConfig[] = [
  { id: "comp-2313", code: "2313", name: "VB AGRO LTDA", acronym: "BRD", unitName: "Matriz / Corporativo", type: "Matriz", active: true },
  { id: "comp-2345", code: "2345", name: "VB AGRO LTDA - Vargem Grande", acronym: "VBA", unitName: "Vargem Grande", type: "Filial", active: true },
  { id: "comp-2346", code: "2346", name: "VB AGRO LTDA - Colina", acronym: "VBB", unitName: "Colina", type: "Filial", active: true },
  { id: "comp-2363", code: "2363", name: "VB AGRO LTDA - CASTANHEIRA", acronym: "VBT", unitName: "Castanheira", type: "Filial", active: true },
  { id: "comp-2364", code: "2364", name: "VB AGRO LTDA - TERENOS", acronym: "VMS", unitName: "Terenos", type: "Filial", active: true },
  { id: "comp-2394", code: "2394", name: "VB AGRO LTDA - JUINA", acronym: "VBJ", unitName: "Juína", type: "Filial", active: true },
  { id: "comp-2395", code: "2395", name: "VB AGRO LTDA - VILA BELA DA SANTISSIMA TRINDADE", acronym: "VBV", unitName: "Vila Bela", type: "Filial", active: true },
  { id: "comp-2396", code: "2396", name: "VB AGRO LTDA - NOVA LACERDA", acronym: "VBN", unitName: "Nova Lacerda", type: "Filial", active: true },
  { id: "comp-2397", code: "2397", name: "VB AGRO LTDA - TAPURAH", acronym: "VBC", unitName: "Tapurah", type: "Filial", active: true },
  { id: "comp-2419", code: "2419", name: "VB AGRO LTDA - Jaraguari", acronym: "VBG", unitName: "Jaraguari", type: "Filial", active: true },
  { id: "comp-PURAFE", code: "PURAFE", name: "IGREJA PURA FÉ", acronym: "IPF", unitName: "Igreja Pura Fé - Sede", type: "Filial", active: true },
];

export const INITIAL_APPROVAL_RULES_SEED: ApprovalRuleConfig[] = [
  
  { id: "rule-vb-sol-1", companyCode: "2313", flowType: "solicitacao", level: 1, minAmount: 0, maxAmount: 10000, approverType: "role", approverIdentifier: "gerente", approverName: "Henrique (Gerente da Área)", active: true, order: 1 },
  { id: "rule-vb-sol-2", companyCode: "2313", flowType: "solicitacao", level: 1, minAmount: 10000.01, maxAmount: 100000, approverType: "role", approverIdentifier: "gerente", approverName: "Henrique (Gerente da Área)", active: true, order: 1 },
  { id: "rule-vb-sol-3", companyCode: "2313", flowType: "solicitacao", level: 2, minAmount: 10000.01, maxAmount: 100000, approverType: "role", approverIdentifier: "diretor", approverName: "Celso (Diretoria de Operações)", active: true, order: 2 },
  { id: "rule-vb-sol-4", companyCode: "2313", flowType: "solicitacao", level: 1, minAmount: 100000.01, maxAmount: null, approverType: "role", approverIdentifier: "diretor", approverName: "Celso (Diretoria de Operações)", active: true, order: 1 },
  { id: "rule-vb-sol-5", companyCode: "2313", flowType: "solicitacao", level: 2, minAmount: 100000.01, maxAmount: 250000, approverType: "role", approverIdentifier: "cfo", approverName: "Vanessa (Diretoria Financeira)", active: true, order: 2 },
  { id: "rule-vb-sol-6", companyCode: "2313", flowType: "solicitacao", level: 3, minAmount: 250000.01, maxAmount: 500000, approverType: "role", approverIdentifier: "conselho", approverName: "JAB (Comitê Executivo / VP)", active: true, order: 3 },
  { id: "rule-vb-sol-7", companyCode: "2313", flowType: "solicitacao", level: 4, minAmount: 500000.01, maxAmount: null, approverType: "role", approverIdentifier: "admin", approverName: "Andressa (Presidência / CEO)", active: true, order: 4 },

  
  { id: "rule-vb-ped-1", companyCode: "2313", flowType: "pedido", level: 1, minAmount: 0, maxAmount: 10000, approverType: "role", approverIdentifier: "diretor", approverName: "Celso (Diretoria de Operações)", active: true, order: 1 },
  { id: "rule-vb-ped-2", companyCode: "2313", flowType: "pedido", level: 1, minAmount: 10000.01, maxAmount: 100000, approverType: "role", approverIdentifier: "diretor", approverName: "Celso (Diretoria de Operações)", active: true, order: 1 },
  { id: "rule-vb-ped-3", companyCode: "2313", flowType: "pedido", level: 2, minAmount: 10000.01, maxAmount: 100000, approverType: "role", approverIdentifier: "suprimentos", approverName: "Eduardo (Gerente de Suprimentos)", active: true, order: 2 },
  { id: "rule-vb-ped-4", companyCode: "2313", flowType: "pedido", level: 1, minAmount: 100000.01, maxAmount: null, approverType: "role", approverIdentifier: "diretor", approverName: "Celso (Diretoria de Operações)", active: true, order: 1 },
  { id: "rule-vb-ped-5", companyCode: "2313", flowType: "pedido", level: 2, minAmount: 100000.01, maxAmount: 250000, approverType: "role", approverIdentifier: "suprimentos", approverName: "Eduardo (Gerente de Suprimentos)", active: true, order: 2 },
  { id: "rule-vb-ped-6", companyCode: "2313", flowType: "pedido", level: 3, minAmount: 250000.01, maxAmount: 500000, approverType: "role", approverIdentifier: "cfo", approverName: "Vanessa (Diretoria Financeira)", active: true, order: 3 },
  { id: "rule-vb-ped-7", companyCode: "2313", flowType: "pedido", level: 4, minAmount: 500000.01, maxAmount: null, approverType: "role", approverIdentifier: "conselho", approverName: "JAB (Comitê Executivo / VP)", active: true, order: 4 },
  { id: "rule-vb-ped-8", companyCode: "2313", flowType: "pedido", level: 5, minAmount: 500000.01, maxAmount: null, approverType: "role", approverIdentifier: "admin", approverName: "Andressa (Presidência / CEO)", active: true, order: 5 },
];

function getStoredCompanies(): CompanyBranchConfig[] {
  if (typeof window === "undefined") return INITIAL_COMPANIES_SEED;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COMPANIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return INITIAL_COMPANIES_SEED;
}

function setStoredCompanies(companies: CompanyBranchConfig[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_COMPANIES, JSON.stringify(companies));
  } catch {}
}

function getStoredRules(): ApprovalRuleConfig[] {
  if (typeof window === "undefined") return INITIAL_APPROVAL_RULES_SEED;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RULES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return INITIAL_APPROVAL_RULES_SEED;
}

function setStoredRules(rules: ApprovalRuleConfig[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_RULES, JSON.stringify(rules));
  } catch {}
}

export const adminApi = {
  async getCompanies(): Promise<CompanyBranchConfig[]> {
    try {
      const remote = await apiClient.get<CompanyBranchConfig[]>("/api/admin/companies");
      if (remote && Array.isArray(remote) && remote.length > 0) {
        setStoredCompanies(remote);
        return remote;
      }
    } catch {
      try {
        const tenants = await getTenantsApi();
        if (tenants && Array.isArray(tenants) && tenants.length > 0) {
          const stored = getStoredCompanies();
          const merged: CompanyBranchConfig[] = tenants.map((t) => {
            const match = stored.find((s) => s.id === t.id || s.code === t.slug || s.name === t.name);
            return {
              id: t.id,
              code: match?.code || t.slug || t.id.slice(0, 4),
              name: t.name,
              acronym: match?.acronym || t.slug?.slice(0, 3).toUpperCase() || "FIL",
              unitName: match?.unitName || t.name,
              type: t.type || (t.parent_tenant_id ? "Filial" : "Matriz"),
              active: t.status === "Active",
              cnpj: t.document_number,
            };
          });
          setStoredCompanies(merged);
          return merged;
        }
      } catch {}
    }
    return getStoredCompanies();
  },

  async createCompany(data: Omit<CompanyBranchConfig, "id">): Promise<CompanyBranchConfig> {
    const id = `comp-${Date.now()}`;
    const newCompany: CompanyBranchConfig = { ...data, id };
    try {
      const remote = await apiClient.post<CompanyBranchConfig>("/api/admin/companies", newCompany);
      if (remote?.id) return remote;
    } catch {}
    const list = getStoredCompanies();
    const updated = [...list, newCompany];
    setStoredCompanies(updated);
    return newCompany;
  },

  async updateCompany(id: string, data: Partial<CompanyBranchConfig>): Promise<CompanyBranchConfig> {
    try {
      const remote = await apiClient.put<CompanyBranchConfig>(`/api/admin/companies/${id}`, data);
      if (remote?.id) return remote;
    } catch {}
    const list = getStoredCompanies();
    const updated = list.map((c) => (c.id === id ? { ...c, ...data } : c));
    setStoredCompanies(updated);
    const found = updated.find((c) => c.id === id);
    if (!found) throw new Error("Empresa não encontrada");
    return found;
  },

  async toggleCompanyStatus(id: string, active: boolean): Promise<CompanyBranchConfig> {
    return this.updateCompany(id, { active });
  },

  async getApprovalRules(companyCode?: string, flowType?: ApprovalFlowType): Promise<ApprovalRuleConfig[]> {
    const validCompany = cleanCompanyParam(companyCode);
    try {
      const params = new URLSearchParams();
      if (validCompany) params.set("companyCode", validCompany);
      if (flowType) params.set("flowType", flowType);
      const qs = params.toString() ? `?${params.toString()}` : "";
      const remote = await apiClient.get<ApprovalRuleConfig[]>(`/api/admin/approval-rules${qs}`);
      if (remote && Array.isArray(remote)) {
        return remote;
      }
    } catch {}
    let all = getStoredRules();
    if (validCompany && validCompany !== "TODAS") {
      all = all.filter((r) => r.companyCode === validCompany);
    }
    if (flowType) {
      all = all.filter((r) => (r.flowType || "solicitacao") === flowType);
    }
    return all;
  },

  async createApprovalRule(data: Omit<ApprovalRuleConfig, "id">): Promise<ApprovalRuleConfig> {
    const id = `rule-${Date.now()}`;
    const newRule: ApprovalRuleConfig = { ...data, id };
    try {
      const remote = await apiClient.post<ApprovalRuleConfig>("/api/admin/approval-rules", newRule);
      if (remote?.id) return remote;
    } catch {}
    const list = getStoredRules();
    const updated = [...list, newRule];
    setStoredRules(updated);
    return newRule;
  },

  async updateApprovalRule(id: string, data: Partial<ApprovalRuleConfig>): Promise<ApprovalRuleConfig> {
    try {
      const remote = await apiClient.put<ApprovalRuleConfig>(`/api/admin/approval-rules/${id}`, data);
      if (remote?.id) return remote;
    } catch {}
    const list = getStoredRules();
    const updated = list.map((r) => (r.id === id ? { ...r, ...data } : r));
    setStoredRules(updated);
    const found = updated.find((r) => r.id === id);
    if (!found) throw new Error("Regra não encontrada");
    return found;
  },

  async deleteApprovalRule(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/api/admin/approval-rules/${id}`);
    } catch {}
    const list = getStoredRules();
    const updated = list.filter((r) => r.id !== id);
    setStoredRules(updated);
    return true;
  },

  async batchSaveApprovalRules(companyCode: string, newRules: ApprovalRuleConfig[], flowType?: ApprovalFlowType): Promise<ApprovalRuleConfig[]> {
    try {
      await apiClient.put(`/api/admin/approval-rules/batch`, { companyCode, flowType, rules: newRules });
    } catch {}
    const list = getStoredRules();
    const otherRules = list.filter(
      (r) => r.companyCode !== companyCode || (flowType && (r.flowType || "solicitacao") !== flowType)
    );
    const merged = [...otherRules, ...newRules];
    setStoredRules(merged);
    return newRules;
  },
};
