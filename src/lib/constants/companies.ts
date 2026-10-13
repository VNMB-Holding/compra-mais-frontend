export interface CompanyBranchMapping {
  code: string;
  name: string;
  acronym: string;
  unitName: string;
  parentCompanyCode?: string;
}

export interface PrimaryCompany {
  code: string;
  name: string;
  acronym: string;
  unitName: string;
  type: "Matriz";
}

export const PRIMARY_COMPANIES: PrimaryCompany[] = [
  {
    code: "TODAS",
    name: "Todas as Empresas (Padrão Global)",
    acronym: "ALL",
    unitName: "Corporativo Holding",
    type: "Matriz",
  },
  {
    code: "2313",
    name: "VB AGRO LTDA",
    acronym: "BRD",
    unitName: "Matriz / Corporativo",
    type: "Matriz",
  },
  {
    code: "PURAFE",
    name: "IGREJA PURA FÉ",
    acronym: "IPF",
    unitName: "Igreja Pura Fé - Sede",
    type: "Matriz",
  },
  {
    code: "LORENA",
    name: "VB IMÓVEIS E PARTICIPAÇÕES",
    acronym: "VBI",
    unitName: "Lorena",
    type: "Matriz",
  },
];

export function getCanonicalCompanyCode(codeOrSlug?: string | null): string {
  if (!codeOrSlug) return "TODAS";
  const clean = String(codeOrSlug).trim().toLowerCase();
  if (clean === "todas" || clean === "all" || clean === "global") return "TODAS";
  if (clean === "2313" || clean === "vb-agro" || clean === "vbagro" || clean === "brd") return "2313";
  if (clean === "purafe" || clean === "igreja-pura-fe" || clean === "igrejapurafe" || clean === "ipf") return "PURAFE";
  if (clean === "lorena" || clean === "vbi" || clean === "vb-imoveis") return "LORENA";

  const vbBranches = ["2345", "2346", "2363", "2364", "2394", "2395", "2396", "2397", "2419"];
  if (vbBranches.includes(String(codeOrSlug).trim())) {
    return "2313";
  }

  return String(codeOrSlug).trim();
}

export const COMPANY_BRANCHES: CompanyBranchMapping[] = [
  {
    code: "2313",
    name: "VB AGRO LTDA",
    acronym: "BRD",
    unitName: "Matriz / Corporativo",
    parentCompanyCode: "2313",
  },
  {
    code: "2345",
    name: "VB AGRO LTDA - Vargem Grande",
    acronym: "VBA",
    unitName: "Vargem Grande",
    parentCompanyCode: "2313",
  },
  {
    code: "2346",
    name: "VB AGRO LTDA - Colina",
    acronym: "VBB",
    unitName: "Colina",
    parentCompanyCode: "2313",
  },
  {
    code: "2363",
    name: "VB AGRO LTDA - CASTANHEIRA",
    acronym: "VBT",
    unitName: "Castanheira",
    parentCompanyCode: "2313",
  },
  {
    code: "2364",
    name: "VB AGRO LTDA - TERENOS",
    acronym: "VMS",
    unitName: "Terenos",
    parentCompanyCode: "2313",
  },
  {
    code: "2394",
    name: "VB AGRO LTDA - JUINA",
    acronym: "VBJ",
    unitName: "Juína",
    parentCompanyCode: "2313",
  },
  {
    code: "2395",
    name: "VB AGRO LTDA - VILA BELA DA SANTISSIMA TRINDADE",
    acronym: "VBV",
    unitName: "Vila Bela da Santíssima Trindade",
    parentCompanyCode: "2313",
  },
  {
    code: "2396",
    name: "VB AGRO LTDA - NOVA LACERDA",
    acronym: "VBN",
    unitName: "Nova Lacerda",
    parentCompanyCode: "2313",
  },
  {
    code: "2397",
    name: "VB AGRO LTDA - TAPURAH",
    acronym: "VBC",
    unitName: "Tapurah",
    parentCompanyCode: "2313",
  },
  {
    code: "2419",
    name: "VB AGRO LTDA - Jaraguari",
    acronym: "VBG",
    unitName: "Jaraguari",
    parentCompanyCode: "2313",
  },
  {
    code: "PURAFE",
    name: "IGREJA PURA FÉ",
    acronym: "IPF",
    unitName: "Igreja Pura Fé - Sede",
    parentCompanyCode: "PURAFE",
  },
  {
    code: "LORENA",
    name: "VB IMÓVEIS E PARTICIPAÇÕES",
    acronym: "VBI",
    unitName: "Lorena",
    parentCompanyCode: "LORENA",
  },
];

export const COMPANY_BY_CODE_MAP: Record<string, CompanyBranchMapping> = COMPANY_BRANCHES.reduce(
  (acc, item) => {
    acc[item.code] = item;
    return acc;
  },
  {} as Record<string, CompanyBranchMapping>,
);

export const COMPANY_BY_ACRONYM_MAP: Record<string, CompanyBranchMapping> = COMPANY_BRANCHES.reduce(
  (acc, item) => {
    acc[item.acronym.toUpperCase()] = item;
    return acc;
  },
  {} as Record<string, CompanyBranchMapping>,
);

export function getCompanyNameByCode(code?: string): string | undefined {
  if (!code) return undefined;
  return COMPANY_BY_CODE_MAP[code]?.name;
}

function normalizeBranchQuery(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

export function findCompanyBranch(query?: string): CompanyBranchMapping | undefined {
  if (!query) return undefined;
  const raw = query.trim().toUpperCase();
  const direct = COMPANY_BY_CODE_MAP[raw] || COMPANY_BY_ACRONYM_MAP[raw];
  if (direct) return direct;

  const normalized = normalizeBranchQuery(query);
  return COMPANY_BRANCHES.find((b) => {
    const bName = normalizeBranchQuery(b.name);
    const bUnit = normalizeBranchQuery(b.unitName);
    const bAcronym = normalizeBranchQuery(b.acronym);
    const bCode = normalizeBranchQuery(b.code);

    return (
      bCode === normalized ||
      bAcronym === normalized ||
      bName === normalized ||
      bUnit === normalized ||
      bName.includes(normalized) ||
      normalized.includes(bUnit) ||
      normalized.includes(bName)
    );
  });
}
