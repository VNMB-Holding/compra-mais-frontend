import { adminApi, ApprovalRuleConfig } from "@/lib/api/admin";

export interface ApprovalChainLevel {
  level: number;
  roleOrName: string;
  maxLimit: number | null;
  approverType?: "user" | "role" | "group";
}

function resolveCompanyCode(companyOrTenantName: string = "VB AGRO"): string {
  const norm = (companyOrTenantName || "").toUpperCase();
  if (norm.includes("VB AGRO") || norm.includes("AGRO") || norm === "2313") return "2313";
  if (norm.includes("IMÓVEIS") || norm.includes("IMOVEIS") || norm.includes("LORENA")) return "LORENA";
  if (norm.includes("PURA") || norm.includes("IGREJA")) return "PURAFE";
  return "2313";
}

export function calculateChainFromRules(
  rules: ApprovalRuleConfig[],
  budget: number,
  companyCode: string = "2313",
  flowType: "solicitacao" | "pedido" = "solicitacao"
): ApprovalChainLevel[] {
  if (!Array.isArray(rules) || rules.length === 0) return [];

  const filtered = rules.filter(
    (r) =>
      r.active &&
      (r.companyCode === companyCode || r.companyCode === "TODAS") &&
      (r.flowType || "solicitacao") === flowType
  );

  const sorted = [...filtered].sort((a, b) => a.minAmount - b.minAmount || a.level - b.level || (a.order || 0) - (b.order || 0));

  const applicable: ApprovalChainLevel[] = [];
  for (const r of sorted) {
    if (budget >= r.minAmount) {
      applicable.push({
        level: r.level,
        roleOrName: r.approverName || r.approverIdentifier,
        maxLimit: r.maxAmount,
        approverType: r.approverType,
      });
      if (r.maxAmount !== null && budget <= r.maxAmount) {
        break;
      }
    }
  }

  return applicable;
}

export function getApprovalChainForRequest(
  companyOrTenantName: string = "VB AGRO",
  estimatedBudget: number,
  customRules?: ApprovalRuleConfig[]
): ApprovalChainLevel[] {
  const companyCode = resolveCompanyCode(companyOrTenantName);

  if (customRules && customRules.length > 0) {
    const chain = calculateChainFromRules(customRules, estimatedBudget, companyCode, "solicitacao");
    if (chain.length > 0) return chain;
  }

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("compra_mais_admin_rules");
      if (raw) {
        const parsed = JSON.parse(raw) as ApprovalRuleConfig[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const chain = calculateChainFromRules(parsed, estimatedBudget, companyCode, "solicitacao");
          if (chain.length > 0) return chain;
        }
      }
    } catch {}
  }

  // Fallback padrão proporcional por nível caso ainda não haja regras cadastradas no backend
  if (estimatedBudget <= 10000) {
    return [{ level: 1, roleOrName: "Gestor Imediato", maxLimit: 10000 }];
  }
  if (estimatedBudget <= 100000) {
    return [
      { level: 1, roleOrName: "Gestor Imediato", maxLimit: 10000 },
      { level: 2, roleOrName: "Gerência da Área", maxLimit: 100000 },
    ];
  }
  return [
    { level: 1, roleOrName: "Gerência da Área", maxLimit: 100000 },
    { level: 2, roleOrName: "Controladoria", maxLimit: 250000 },
    { level: 3, roleOrName: "Diretoria Financeira", maxLimit: 500000 },
    { level: 4, roleOrName: "Diretoria Executiva", maxLimit: null },
  ];
}


export function getApprovalChainForOrder(
  companyOrTenantName: string = "VB AGRO",
  orderTotal: number,
  customRules?: ApprovalRuleConfig[]
): ApprovalChainLevel[] {
  const companyCode = resolveCompanyCode(companyOrTenantName);
  const normalizedCompany = (companyOrTenantName || "").toUpperCase();

  let rulesToUse = customRules;
  if (!rulesToUse && typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("compra_mais_admin_rules");
      if (raw) {
        const parsed = JSON.parse(raw) as ApprovalRuleConfig[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const compRules = parsed.filter(
            (r) =>
              r.active &&
              (r.companyCode === companyCode || r.companyCode === "2313") &&
              r.flowType === "pedido"
          );
          if (compRules.length > 0 && companyCode === "2313" && !normalizedCompany.includes("IMÓVEIS") && !normalizedCompany.includes("PURA")) {
            const sorted = [...compRules].sort((a, b) => a.level - b.level || a.order - b.order);
            const applicable: ApprovalChainLevel[] = [];
            for (const r of sorted) {
              if (orderTotal >= r.minAmount) {
                applicable.push({
                  level: r.level,
                  roleOrName: r.approverName || r.approverIdentifier,
                  maxLimit: r.maxAmount,
                  approverType: r.approverType,
                });
                if (r.maxAmount !== null && orderTotal <= r.maxAmount) {
                  break;
                }
              }
            }
            if (applicable.length > 0) return applicable;
          }
        }
      }
    } catch {}
  }

  if (normalizedCompany.includes("VB AGRO") || normalizedCompany.includes("AGRO")) {
    if (orderTotal <= 10000) {
      return [{ level: 1, roleOrName: "Celso", maxLimit: 10000 }];
    }
    if (orderTotal <= 100000) {
      return [
        { level: 1, roleOrName: "Celso", maxLimit: 10000 },
        { level: 2, roleOrName: "Eduardo", maxLimit: 100000 },
      ];
    }
    return [
      { level: 1, roleOrName: "Celso", maxLimit: 10000 },
      { level: 2, roleOrName: "Eduardo", maxLimit: 100000 },
      { level: 3, roleOrName: "Vanessa", maxLimit: 250000 },
      { level: 4, roleOrName: "JAB", maxLimit: 500000 },
      { level: 5, roleOrName: "Andressa", maxLimit: null },
    ];
  }

  if (normalizedCompany.includes("IMÓVEIS") || normalizedCompany.includes("IMOVEIS") || normalizedCompany.includes("LORENA")) {
    if (orderTotal <= 10000) {
      return [{ level: 1, roleOrName: "Eduardo", maxLimit: 10000 }];
    }
    return [
      { level: 1, roleOrName: "Eduardo", maxLimit: 10000 },
      { level: 2, roleOrName: "Vanessa", maxLimit: 250000 },
      { level: 3, roleOrName: "JAB", maxLimit: 500000 },
      { level: 4, roleOrName: "Andressa", maxLimit: null },
    ];
  }

  if (normalizedCompany.includes("PURA") || normalizedCompany.includes("IGREJA")) {
    if (orderTotal <= 1000) {
      return [{ level: 1, roleOrName: "Jane", maxLimit: 1000 }];
    }
    return [
      { level: 1, roleOrName: "Jane", maxLimit: 1000 },
      { level: 2, roleOrName: "Bispo Bruno", maxLimit: null },
    ];
  }

  if (orderTotal <= 10000) {
    return [{ level: 1, roleOrName: "Celso", maxLimit: 10000 }];
  }
  if (orderTotal <= 100000) {
    return [
      { level: 1, roleOrName: "Celso", maxLimit: 10000 },
      { level: 2, roleOrName: "Eduardo", maxLimit: 100000 },
    ];
  }
  return [
    { level: 1, roleOrName: "Celso", maxLimit: 10000 },
    { level: 2, roleOrName: "Eduardo", maxLimit: 100000 },
    { level: 3, roleOrName: "Vanessa", maxLimit: 250000 },
    { level: 4, roleOrName: "JAB", maxLimit: 500000 },
    { level: 5, roleOrName: "Andressa", maxLimit: null },
  ];
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
      userName && (userName.includes(target) || (userName.split(" ")[0] && target.includes(userName.split(" ")[0])))
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
