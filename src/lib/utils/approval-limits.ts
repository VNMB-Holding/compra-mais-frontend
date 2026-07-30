
export interface ApprovalChainLevel {
  level: number;
  roleOrName: string;
  maxLimit: number | null;
}

export function getApprovalChainForRequest(
  companyOrTenantName: string = "VB AGRO",
  estimatedBudget: number
): ApprovalChainLevel[] {
  const normalizedCompany = companyOrTenantName.toUpperCase();

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
