// Regras de Governança e Alçadas de Aprovação por Empresa e Faixa de Valor
// Matriz de aprovação referente a Requisições/Solicitações (Purchase Requests) e RFQs

export interface ApprovalChainLevel {
  level: number;
  roleOrName: string;
  maxLimit: number | null; // null significa sem limite (acima de X)
}

export function getApprovalChainForRequest(
  companyOrTenantName: string = "VB AGRO",
  estimatedBudget: number
): ApprovalChainLevel[] {
  const normalizedCompany = companyOrTenantName.toUpperCase();

  // -------------------------------------------------------------------------
  // 1. Regra para VB AGRO
  // -------------------------------------------------------------------------
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
    // Acima de R$ 100.000,00 -> Celso / Vanessa / JAB / Andressa
    return [
      { level: 1, roleOrName: "Celso", maxLimit: 100000 },
      { level: 2, roleOrName: "Vanessa", maxLimit: 250000 },
      { level: 3, roleOrName: "JAB", maxLimit: 500000 },
      { level: 4, roleOrName: "Andressa", maxLimit: null },
    ];
  }

  // -------------------------------------------------------------------------
  // 2. Regra para Imóveis (LORENA, PANORAMA, etc.)
  // -------------------------------------------------------------------------
  if (normalizedCompany.includes("IMÓVEIS") || normalizedCompany.includes("IMOVEIS") || normalizedCompany.includes("LORENA")) {
    if (estimatedBudget <= 5000) {
      return [
        { level: 1, roleOrName: "Paula", maxLimit: 5000 },
      ];
    }
    // Acima de R$ 5.000,00 -> Paula / Vanessa / JAB / Andressa
    return [
      { level: 1, roleOrName: "Paula", maxLimit: 5000 },
      { level: 2, roleOrName: "Vanessa", maxLimit: 250000 },
      { level: 3, roleOrName: "JAB", maxLimit: 500000 },
      { level: 4, roleOrName: "Andressa", maxLimit: null },
    ];
  }

  // -------------------------------------------------------------------------
  // 3. Regra para Igreja PuraFé
  // -------------------------------------------------------------------------
  if (normalizedCompany.includes("PURA") || normalizedCompany.includes("IGREJA")) {
    if (estimatedBudget <= 1000) {
      return [
        { level: 1, roleOrName: "Jane", maxLimit: 1000 },
      ];
    }
    // Acima de R$ 1.000,00 -> Jane / Bispo Bruno
    return [
      { level: 1, roleOrName: "Jane", maxLimit: 1000 },
      { level: 2, roleOrName: "Bispo Bruno", maxLimit: null },
    ];
  }

  // Fallback Padrão Grupo VNMB Holding
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
