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
  if (upper.includes("IMÓVEIS") || upper.includes("IMOVEIS") || upper.includes("LORENA"))
    return "LORENA";
  if (upper.includes("PURA") || upper.includes("IGREJA")) return "PURAFE";
  if (upper.includes("VB AGRO") || upper.includes("AGRO")) return "2313";
  return norm;
}

export function calculateChainFromRules(
  rules: ApprovalRuleConfig[],
  budget: number,
  companyCode?: string,
  flowType: "solicitacao" | "pedido" = "solicitacao",
): ApprovalChainLevel[] {
  if (!Array.isArray(rules) || rules.length === 0) return [];

  const targetCode = companyCode ? companyCode.trim() : "";

  const companySpecific = targetCode
    ? rules.filter(
        (r) =>
          r.active !== false &&
          r.companyCode === targetCode &&
          (r.flowType || "solicitacao") === flowType,
      )
    : [];

  const candidateRules =
    companySpecific.length > 0
      ? companySpecific
      : rules.filter(
          (r) =>
            r.active !== false &&
            (r.companyCode === "TODAS" || !r.companyCode || !targetCode) &&
            (r.flowType || "solicitacao") === flowType,
        );

  if (candidateRules.length === 0) return [];

  const rangeMap = new Map<
    string,
    { minAmount: number; maxAmount: number | null; rules: ApprovalRuleConfig[] }
  >();
  for (const r of candidateRules) {
    const key = `${r.minAmount}_${r.maxAmount ?? "inf"}`;
    if (!rangeMap.has(key)) {
      rangeMap.set(key, { minAmount: r.minAmount, maxAmount: r.maxAmount, rules: [] });
    }
    rangeMap.get(key)!.rules.push(r);
  }

  const sortedRanges = Array.from(rangeMap.values()).sort((a, b) => a.minAmount - b.minAmount);

  const matchingRangeIndex = sortedRanges.findIndex(
    (rg) => budget >= rg.minAmount && (rg.maxAmount === null || budget <= rg.maxAmount),
  );

  let targetRange:
    { minAmount: number; maxAmount: number | null; rules: ApprovalRuleConfig[] } | undefined;
  if (matchingRangeIndex !== -1) {
    targetRange = sortedRanges[matchingRangeIndex];
  } else if (budget >= sortedRanges[sortedRanges.length - 1].minAmount) {
    targetRange = sortedRanges[sortedRanges.length - 1];
  } else {
    return [];
  }

  if (!targetRange) return [];

  const hasSelfContainedLevel1 = targetRange.rules.some((r) => r.level === 1);

  if (hasSelfContainedLevel1) {
    return targetRange.rules
      .sort((a, b) => a.level - b.level || (a.order || 0) - (b.order || 0))
      .map((r) => ({
        level: r.level,
        roleOrName: r.approverName || r.approverIdentifier,
        maxLimit: r.maxAmount,
        approverType: r.approverType,
        approverIdentifier: r.approverIdentifier,
      }));
  }

  const levelMap = new Map<number, ApprovalChainLevel>();
  const rangesToConsider = sortedRanges.slice(
    0,
    matchingRangeIndex !== -1 ? matchingRangeIndex + 1 : sortedRanges.length,
  );

  for (const rg of rangesToConsider) {
    for (const r of rg.rules) {
      if (!levelMap.has(r.level)) {
        levelMap.set(r.level, {
          level: r.level,
          roleOrName: r.approverName || r.approverIdentifier,
          maxLimit: r.maxAmount,
          approverType: r.approverType,
          approverIdentifier: r.approverIdentifier,
        });
      }
    }
  }

  return Array.from(levelMap.values()).sort((a, b) => a.level - b.level);
}

export function getApprovalChainForRequest(
  companyOrTenantName: string,
  estimatedBudget: number,
  customRules?: ApprovalRuleConfig[],
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
  customRules?: ApprovalRuleConfig[],
): ApprovalChainLevel[] {
  const companyCode = resolveCompanyCode(companyOrTenantName);

  if (customRules && customRules.length > 0) {
    const chain = calculateChainFromRules(customRules, orderTotal, companyCode, "pedido");
    if (chain.length > 0) return chain;
  }

  return [];
}

export function isUserEligibleToApprove(
  user:
    | {
        name?: string | null;
        role?: string | null;
        roles?: string[];
        email?: string | null;
        scopes?: string[];
        id?: string | null;
      }
    | null
    | undefined,
  approverRoleOrName: string,
  assignedApproverId?: string,
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

  const exactUserValues = new Set(
    [
      normalize(user.id),
      normalize(user.email),
      normalize(user.name),
      normalize(user.role),
      ...(user.roles || []).map(normalize),
    ].filter(Boolean),
  );

  if (approverTargets.some((target) => exactUserValues.has(target))) {
    return true;
  }

  const isDiretor =
    user.role?.toLowerCase().includes("diretor") ||
    (user.roles || []).some((r) => r.toLowerCase().includes("diretor"));

  if (
    isDiretor &&
    approverTargets.some((target) => target.includes("diretor") || target.includes("diretoria"))
  ) {
    return true;
  }

  const isGerente =
    user.role?.toLowerCase().includes("gerente") ||
    (user.roles || []).some((r) => r.toLowerCase().includes("gerente"));

  if (
    isGerente &&
    approverTargets.some((target) => target.includes("gerente") || target.includes("gestor"))
  ) {
    return true;
  }

  return false;
}
