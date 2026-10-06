import { User } from "@/types/auth";
import { isUuid } from "@/lib/utils/format-display";
import {
  COMPANY_BRANCHES,
  COMPANY_BY_CODE_MAP,
  COMPANY_BY_ACRONYM_MAP,
  findCompanyBranch,
} from "@/lib/constants/companies";

export interface TenantOption {
  id: string;
  name: string;
  type?: "Matriz" | "Filial";
  code?: string;
  acronym?: string;
}

export function isVnmbUser(_user: User | null): boolean {
  return true;
}

export function getCompanyFilterOptions(): { label: string; value: string }[] {
  return [
    { label: "Unidade: Todas as Unidades", value: "TODAS" },
    ...COMPANY_BRANCHES.map((b) => ({
      label: `${b.code} - ${b.name} (${b.acronym})`,
      value: b.code,
    })),
  ];
}

export function getPrimaryCompanyOptions(_user?: User | null): TenantOption[] {
  return COMPANY_BRANCHES.map((b) => ({
    id: b.code,
    name: `${b.name} (${b.acronym})`,
    type: b.code === "2313" ? "Matriz" : "Filial",
    code: b.code,
    acronym: b.acronym,
  }));
}

export function getBranchCompanyOptions(_user?: User | null, selectedCompanyId?: string): TenantOption[] {
  if (selectedCompanyId && selectedCompanyId !== "TODAS" && selectedCompanyId !== "2313") {
    return COMPANY_BRANCHES.filter((b) => b.code === selectedCompanyId).map((b) => ({
      id: b.code,
      name: `${b.name} (${b.acronym})`,
      type: "Filial",
      code: b.code,
      acronym: b.acronym,
    }));
  }

  return COMPANY_BRANCHES.filter((b) => b.code !== "2313").map((b) => ({
    id: b.code,
    name: `${b.name} (${b.acronym})`,
    type: "Filial",
    code: b.code,
    acronym: b.acronym,
  }));
}

export function getTenantDisplayName(tenantId?: string, user?: User | null): string {
  if (!tenantId || tenantId === "TODAS") {
    return "Todas as Unidades";
  }

  const branch = findCompanyBranch(tenantId);
  if (branch) {
    return `${branch.name} (${branch.acronym})`;
  }

  if (tenantId.toUpperCase().includes("VNMB")) {
    return "VB AGRO LTDA";
  }

  const foundInUser = user?.availableTenants?.find((t) => t.id === tenantId);
  if (foundInUser) {
    const matchInUser = findCompanyBranch(foundInUser.name) || findCompanyBranch(foundInUser.id);
    if (matchInUser) return `${matchInUser.name} (${matchInUser.acronym})`;
    if (!foundInUser.name.toUpperCase().includes("VNMB")) return foundInUser.name;
  }

  return tenantId;
}

export function formatCorporateBranch(
  coligada?: string | number,
  filial?: string | number,
  tenantId?: string,
  user?: User | null
): string {
  const filialStr = filial !== undefined && filial !== null ? String(filial).trim() : "";
  if (filialStr) {
    const branch = findCompanyBranch(filialStr);
    if (branch) {
      return `${branch.name} (${branch.acronym})`;
    }
  }

  if (tenantId) {
    const branch = findCompanyBranch(tenantId);
    if (branch) {
      return `${branch.name} (${branch.acronym})`;
    }
    const resolved = getTenantDisplayName(tenantId, user);
    if (resolved && !resolved.toUpperCase().includes("VNMB")) return resolved;
  }

  if (coligada && filialStr) {
    return `Coligada ${coligada} / Filial ${filialStr}`;
  }

  if (filialStr && !isUuid(filialStr) && filialStr.length >= 3 && !filialStr.toUpperCase().includes("VNMB")) {
    return filialStr;
  }

  return "VB AGRO LTDA";
}

export function resolvePurchaseRequestBranch(
  pr?: {
    corporateColigada?: string | number;
    corporateFilial?: string | number;
    filialCode?: string | number;
    companyCode?: string;
    branchName?: string;
    tenantId?: string;
    notes?: string;
  } | null,
  user?: User | null
): string {
  if (!pr) return formatCorporateBranch(undefined, undefined, undefined, user);

  if (pr.notes) {
    const match = pr.notes.match(/Empresa\/Unidade:\s*([^\n\r]+)/i);
    if (match && match[1]) {
      const parsed = match[1].trim();
      const branchFromNotes = findCompanyBranch(parsed);
      if (branchFromNotes) {
        return `${branchFromNotes.name} (${branchFromNotes.acronym})`;
      }
      if (parsed && !parsed.toUpperCase().includes("VNMB")) {
        return parsed;
      }
    }
  }

  const rawBranch = (pr as any).branchName || pr.branchName;
  if (rawBranch) {
    const b = findCompanyBranch(rawBranch);
    if (b) return `${b.name} (${b.acronym})`;
    if (!rawBranch.toUpperCase().includes("VNMB")) return rawBranch;
  }

  if (pr.companyCode) {
    const b = findCompanyBranch(pr.companyCode);
    if (b) return `${b.name} (${b.acronym})`;
  }

  if (pr.filialCode) {
    const b = findCompanyBranch(String(pr.filialCode));
    if (b) return `${b.name} (${b.acronym})`;
  }

  if (pr.corporateFilial) {
    const b = findCompanyBranch(String(pr.corporateFilial));
    if (b) return `${b.name} (${b.acronym})`;
  }

  if (pr.tenantId) {
    const b = findCompanyBranch(pr.tenantId);
    if (b) return `${b.name} (${b.acronym})`;
  }

  return formatCorporateBranch(
    pr.corporateColigada,
    pr.corporateFilial || pr.filialCode || pr.companyCode,
    pr.tenantId,
    user
  );
}

