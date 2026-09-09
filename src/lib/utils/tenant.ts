import { User } from "@/types/auth";
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
    return "VB AGRO LTDA";
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

  return "VB AGRO LTDA";
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

  return "VB AGRO LTDA";
}


