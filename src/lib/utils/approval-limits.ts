export interface ApprovalChainLevel {
  level: number;
  roleOrName: string;
  maxLimit: number | null;
}

/**
 * Retorna a cadeia sequencial de aprovação para Requisições (Solicitações de Compra).
 * Conforme matriz corporativa:
 * - VB AGRO: Até 10k (Henrique) | Até 100k (Henrique -> Celso) | Acima 100k (Celso -> Vanessa -> JAB -> Andressa)
 * - Imóveis: Até 5k (Paula) | Acima 5k (Paula -> Vanessa -> JAB -> Andressa)
 * - Igreja PuraFé: Até 1k (Jane) | Acima 1k (Jane -> Bispo Bruno)
 */
export function getApprovalChainForRequest(
  companyOrTenantName: string = "VB AGRO",
  estimatedBudget: number
): ApprovalChainLevel[] {
  const normalizedCompany = (companyOrTenantName || "").toUpperCase();

  if (normalizedCompany.includes("VB AGRO") || normalizedCompany.includes("AGRO")) {
    if (estimatedBudget <= 10000) {
      return [
        { level: 1, roleOrName: "Henrique", maxLimit: 10000 },
      ];
    }
    if (estimatedBudget <= 100000) {
      return [
        { level: 1, roleOrName: "Henrique", maxLimit: 10000 },
        { level: 2, roleOrName: "Celso", maxLimit: 100000 },
      ];
    }
    return [
      { level: 1, roleOrName: "Celso", maxLimit: 100000 },
      { level: 2, roleOrName: "Vanessa", maxLimit: 250000 },
      { level: 3, roleOrName: "JAB", maxLimit: 500000 },
      { level: 4, roleOrName: "Andressa", maxLimit: null },
    ];
  }

  if (normalizedCompany.includes("IMÓVEIS") || normalizedCompany.includes("IMOVEIS") || normalizedCompany.includes("LORENA")) {
    if (estimatedBudget <= 5000) {
      return [
        { level: 1, roleOrName: "Paula", maxLimit: 5000 },
      ];
    }
    return [
      { level: 1, roleOrName: "Paula", maxLimit: 5000 },
      { level: 2, roleOrName: "Vanessa", maxLimit: 250000 },
      { level: 3, roleOrName: "JAB", maxLimit: 500000 },
      { level: 4, roleOrName: "Andressa", maxLimit: null },
    ];
  }

  if (normalizedCompany.includes("PURA") || normalizedCompany.includes("IGREJA")) {
    if (estimatedBudget <= 1000) {
      return [
        { level: 1, roleOrName: "Jane", maxLimit: 1000 },
      ];
    }
    return [
      { level: 1, roleOrName: "Jane", maxLimit: 1000 },
      { level: 2, roleOrName: "Bispo Bruno", maxLimit: null },
    ];
  }

  // Padrão / Holding
  if (estimatedBudget <= 10000) {
    return [{ level: 1, roleOrName: "Henrique", maxLimit: 10000 }];
  }
  if (estimatedBudget <= 100000) {
    return [
      { level: 1, roleOrName: "Henrique", maxLimit: 10000 },
      { level: 2, roleOrName: "Celso", maxLimit: 100000 },
    ];
  }
  return [
    { level: 1, roleOrName: "Celso", maxLimit: 100000 },
    { level: 2, roleOrName: "Vanessa", maxLimit: 250000 },
    { level: 3, roleOrName: "JAB", maxLimit: 500000 },
    { level: 4, roleOrName: "Andressa", maxLimit: null },
  ];
}

/**
 * Retorna a cadeia sequencial de aprovação para Pedidos de Compra (Ordens de Compra).
 * Conforme matriz corporativa:
 * - VB AGRO:
 *     Até 10k: Celso
 *     De 10k até 100k: Celso -> Eduardo
 *     Acima 100k: Celso -> Eduardo -> Vanessa -> JAB -> Andressa
 * - Imóveis:
 *     Até 10k: Eduardo
 *     Acima 10k: Eduardo -> Vanessa -> JAB -> Andressa
 * - Igreja PuraFé:
 *     Até 1k: Jane
 *     Acima 1k: Jane -> Bispo Bruno
 */
export function getApprovalChainForOrder(
  companyOrTenantName: string = "VB AGRO",
  orderTotal: number
): ApprovalChainLevel[] {
  const normalizedCompany = (companyOrTenantName || "").toUpperCase();

  if (normalizedCompany.includes("VB AGRO") || normalizedCompany.includes("AGRO")) {
    if (orderTotal <= 10000) {
      return [
        { level: 1, roleOrName: "Celso", maxLimit: 10000 },
      ];
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
      return [
        { level: 1, roleOrName: "Eduardo", maxLimit: 10000 },
      ];
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
      return [
        { level: 1, roleOrName: "Jane", maxLimit: 1000 },
      ];
    }
    return [
      { level: 1, roleOrName: "Jane", maxLimit: 1000 },
      { level: 2, roleOrName: "Bispo Bruno", maxLimit: null },
    ];
  }

  // Padrão / Holding
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

/**
 * Valida se um usuário logado possui legitimidade para aprovar a alçada da vez.
 * Suporta correspondência por:
 * 1. Perfil Admin de sistema
 * 2. Primeiro nome ou nome completo (ex: "Celso", "Henrique Silva")
 * 3. E-mail corporativo (ex: "celso@vbagro.com.br")
 * 4. Role ou grupo cadastrado no VNMB Identity
 */
export function isUserEligibleToApprove(
  user: { name?: string | null; role?: string | null; roles?: string[]; email?: string | null; scopes?: string[] } | null | undefined,
  approverRoleOrName: string
): boolean {
  if (!user || !approverRoleOrName) return false;

  // Admin possui override de governança
  if (user.role === "admin" || user.roles?.includes("Admin") || user.scopes?.includes("admin")) {
    return true;
  }

  // Decompõe possíveis múltiplos nomes da esteira
  const approverTargets = approverRoleOrName
    .split(/[\/,]| e /i)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const userName = (user.name || "").toLowerCase();
  const userEmail = (user.email || "").toLowerCase();
  const userRoles = (user.roles || []).map((r) => r.toLowerCase());

  return approverTargets.some((target) => {
    // 1. Match por nome completo ou primeiro nome
    if (userName.includes(target) || (userName.split(" ")[0] && target.includes(userName.split(" ")[0]))) {
      return true;
    }
    // 2. Match por e-mail corporativo
    if (userEmail.includes(target)) {
      return true;
    }
    // 3. Match por role
    if (userRoles.some((r) => r.includes(target) || target.includes(r))) {
      return true;
    }
    return false;
  });
}
