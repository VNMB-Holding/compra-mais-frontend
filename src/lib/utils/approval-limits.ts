import { ApprovalRuleConfig } from "@/lib/api/admin";

export interface ApprovalChainLevel {
  level: number;
  roleOrName: string;
  maxLimit: number | null;
  approverType?: "user" | "role" | "group";
  approverIdentifier?: string;
}

import { findCompanyBranch } from "@/lib/constants/companies";

function resolveCompanyCode(companyOrTenantName?: string): string {
  if (!companyOrTenantName) return "";
  const norm = companyOrTenantName.trim();
  const branch = findCompanyBranch(norm);
  if (branch) return branch.code;

  const upper = norm.toUpperCase();
  if (upper.includes("IMÓVEIS") || upper.includes("IMOVEIS") || upper.includes("LORENA")) return "LORENA";
  if (upper.includes("PURA") || upper.includes("IGREJA")) return "PURAFE";
  if (upper.includes("VB AGRO") || upper.includes("AGRO")) return "2313";
  return norm;
}

export function calculateChainFromRules(
  rules: ApprovalRuleConfig[],
  budget: number,
  companyCode?: string,
  flowType: "solicitacao" | "pedido" = "solicitacao"
): ApprovalChainLevel[] {
  if (!Array.isArray(rules) || rules.length === 0) return [];

  const targetCode = companyCode ? companyCode.trim() : "";

  const filtered = rules.filter(
    (r) =>
      r.active &&
      (r.companyCode === targetCode || r.companyCode === "TODAS" || !targetCode) &&
      (r.flowType || "solicitacao") === flowType
  );

  const sorted = [...filtered].sort(
    (a, b) => a.level - b.level || (a.order || 0) - (b.order || 0)
  );

  const applicable: ApprovalChainLevel[] = [];
  for (const r of sorted) {
    if (budget >= r.minAmount) {
      applicable.push({
        level: r.level,
        roleOrName: r.approverName || r.approverIdentifier,
        maxLimit: r.maxAmount,
        approverType: r.approverType,
        approverIdentifier: r.approverIdentifier,
      });
      if (r.maxAmount !== null && budget <= r.maxAmount) {
        break;
      }
    }
  }

  return applicable;
}

export function getApprovalChainForRequest(
  companyOrTenantName: string,
  estimatedBudget: number,
  customRules?: ApprovalRuleConfig[]
): ApprovalChainLevel[] {
  const companyCode = resolveCompanyCode(companyOrTenantName);

  if (customRules && customRules.length > 0) {
    const chain = calculateChainFromRules(customRules, estimatedBudget, companyCode, "solicitacao");
    if (chain.length > 0) return chain;
  }

  
  return [];
}

export function getApprovalChainForOrder(
  companyOrTenantName: string,
  orderTotal: number,
  customRules?: ApprovalRuleConfig[]
): ApprovalChainLevel[] {
  const companyCode = resolveCompanyCode(companyOrTenantName);

  if (customRules && customRules.length > 0) {
    const chain = calculateChainFromRules(customRules, orderTotal, companyCode, "pedido");
    if (chain.length > 0) return chain;
  }

  return [];
}

export function isUserEligibleToApprove(
  user: {
    name?: string | null;
    role?: string | null;
    roles?: string[];
    email?: string | null;
    scopes?: string[];
    id?: string | null;
  } | null | undefined,
  approverRoleOrName: string,
  assignedApproverId?: string
): boolean {
  if (!user) return false;

  if (assignedApproverId && user.id && user.id === assignedApproverId) {
    return true;
  }

  if (
    user.role === "admin" ||
    user.roles?.includes("Admin") ||
    user.roles?.includes("admin") ||
    user.scopes?.includes("admin")
  ) {
    return true;
  }

  if (!approverRoleOrName) return false;

  const normalize = (value?: string | null) => (value || "").trim().toLowerCase();
  const approverTargets = approverRoleOrName
    .split(/[\/,]| e /i)
    .map(normalize)
    .filter(Boolean);

  const exactUserValues = new Set([
    normalize(user.id),
    normalize(user.email),
    normalize(user.name),
    normalize(user.role),
    ...(user.roles || []).map(normalize),
  ].filter(Boolean));

  if (approverTargets.some((target) => exactUserValues.has(target))) {
    return true;
  }

  const isDiretor =
    user.role?.toLowerCase().includes("diretor") ||
    (user.roles || []).some((r) => r.toLowerCase().includes("diretor"));

  if (isDiretor && approverTargets.some((target) => target.includes("diretor") || target.includes("diretoria"))) {
    return true;
  }

  const isGerente =
    user.role?.toLowerCase().includes("gerente") ||
    (user.roles || []).some((r) => r.toLowerCase().includes("gerente"));

  if (isGerente && approverTargets.some((target) => target.includes("gerente") || target.includes("gestor"))) {
    return true;
  }

  return false;
}
