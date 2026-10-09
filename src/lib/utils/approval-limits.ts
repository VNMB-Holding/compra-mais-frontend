import { ApprovalRuleConfig } from "@/lib/api/admin";

export interface ApprovalChainLevel {
  level: number;
  roleOrName: string;
  maxLimit: number | null;
  approverType?: "user" | "role" | "group";
  approverIdentifier?: string;
}

import { findCompanyBranch } from "@/lib/constants/companies";

export function normalizeCompanyKey(code?: string | null): string {
  if (!code) return "";
  const c = code.trim().toLowerCase();
  if (c === "purafe" || c === "igreja-pura-fe" || c.includes("pura") || c.includes("igreja")) {
    return "PURAFE";
  }
  if (c === "2313" || c === "vb-agro" || c.includes("vb agro") || c.includes("vbagro")) {
    return "2313";
  }
  if (c === "vnmb" || c === "vnmb holding") {
    return "VNMB";
  }
  if (c === "lorena" || c.includes("lorena") || c.includes("imoveis")) {
    return "LORENA";
  }
  return code.trim().toUpperCase();
}

function resolveCompanyCode(companyOrTenantName?: string): string {
  if (!companyOrTenantName) return "";
  const norm = companyOrTenantName.trim();
  const branch = findCompanyBranch(norm);
  if (branch) return branch.code;

  return normalizeCompanyKey(norm);
}

export function calculateChainFromRules(
  rules: ApprovalRuleConfig[],
  budget: number,
  companyCode?: string,
  flowType: "solicitacao" | "pedido" = "solicitacao",
): ApprovalChainLevel[] {
  if (!Array.isArray(rules) || rules.length === 0) return [];

  const targetCode = companyCode ? companyCode.trim() : "";
  const normalizedTarget = normalizeCompanyKey(targetCode);

  const companySpecific = targetCode
    ? rules.filter(
        (r) =>
          r.active !== false &&
          (r.companyCode === targetCode ||
            normalizeCompanyKey(r.companyCode) === normalizedTarget ||
            r.companyCode?.toLowerCase() === targetCode.toLowerCase()) &&
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

  if (!targetRange || !targetRange.rules || targetRange.rules.length === 0) return [];

  const hasOwnLevel1 = targetRange.rules.some((r) => r.level === 1);
  if (hasOwnLevel1) {
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

  const rangesToConsider = sortedRanges.slice(
    0,
    matchingRangeIndex !== -1 ? matchingRangeIndex + 1 : sortedRanges.length,
  );
  const levelMap = new Map<number, ApprovalChainLevel>();
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

  const normalize = (value?: string | null) => (value || "").trim().toLowerCase();

  const userId = normalize(user.id);
  const userEmail = normalize(user.email);
  const userName = normalize(user.name);
  const userRole = normalize(user.role);
  const allUserRoles = new Set([userRole, ...(user.roles || []).map(normalize)].filter(Boolean));

  if (assignedApproverId && (userId === normalize(assignedApproverId) || userEmail === normalize(assignedApproverId))) {
    return true;
  }

  if (
    user.role === "admin" ||
    allUserRoles.has("admin") ||
    allUserRoles.has("administrator") ||
    user.scopes?.includes("admin")
  ) {
    return true;
  }

  if (!approverRoleOrName) return false;

  const normalizedApprover = normalize(approverRoleOrName);

  if (userId && (userId === normalizedApprover || normalizedApprover.includes(userId))) {
    return true;
  }
  if (userEmail && (userEmail === normalizedApprover || normalizedApprover.includes(userEmail))) {
    return true;
  }

  if (userName && userName === normalizedApprover) {
    return true;
  }

  const targetTokens = normalizedApprover
    .split(/[\/,]| e /i)
    .map(normalize)
    .filter(Boolean);

  for (const token of targetTokens) {
    if (allUserRoles.has(token)) {
      return true;
    }
    if ((token === "gerente" || token === "gestor") && (allUserRoles.has("gerente") || userRole === "gerente")) {
      return true;
    }
    if ((token === "diretor" || token === "diretoria") && (allUserRoles.has("diretor") || userRole === "diretor")) {
      return true;
    }
  }

  return false;
}
