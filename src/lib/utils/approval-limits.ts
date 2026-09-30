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
  approverRoleOrName: string
): boolean {
  if (!user || !approverRoleOrName) return false;

  if (
    user.role === "admin" ||
    user.roles?.includes("Admin") ||
    user.roles?.includes("admin") ||
    user.scopes?.includes("admin")
  ) {
    return true;
  }

  const approverTargets = approverRoleOrName
    .split(/[\/,]| e /i)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const userName = (user.name || "").toLowerCase();
  const userEmail = (user.email || "").toLowerCase();
  const userRole = (user.role || "").toLowerCase();
  const userRoles = (user.roles || []).map((r) => r.toLowerCase());
  const userId = (user.id || "").toLowerCase();

  return approverTargets.some((target) => {
    if (userRole && (userRole === target || userRole.includes(target) || target.includes(userRole))) {
      return true;
    }

    if (userId && userId === target) {
      return true;
    }

    if (
      userName &&
      (userName === target || userName.includes(target))
    ) {
      return true;
    }

    if (userEmail && userEmail.includes(target)) {
      return true;
    }

    if (userRoles.some((r) => r && (r.includes(target) || target.includes(r)))) {
      return true;
    }

    return false;
  });
}
