export interface CompanyBranchMapping {
  code: string;
  name: string;
  acronym: string; // Sigla (ex: VBA, VBB, etc.)
  unitName: string;
}

export const COMPANY_BRANCHES: CompanyBranchMapping[] = [
  {
    code: "2313",
    name: "VB AGRO LTDA",
    acronym: "BRD",
    unitName: "Matriz / Corporativo",
  },
  {
    code: "2345",
    name: "VB AGRO LTDA - Vargem Grande",
    acronym: "VBA",
    unitName: "Vargem Grande",
  },
  {
    code: "2346",
    name: "VB AGRO LTDA - Colina",
    acronym: "VBB",
    unitName: "Colina",
  },
  {
    code: "2363",
    name: "VB AGRO LTDA - CASTANHEIRA",
    acronym: "VBT",
    unitName: "Castanheira",
  },
  {
    code: "2364",
    name: "VB AGRO LTDA - TERENOS",
    acronym: "VMS",
    unitName: "Terenos",
  },
  {
    code: "2394",
    name: "VB AGRO LTDA - JUINA",
    acronym: "VBJ",
    unitName: "Juína",
  },
  {
    code: "2395",
    name: "VB AGRO LTDA - VILA BELA DA SANTISSIMA TRINDADE",
    acronym: "VBV",
    unitName: "Vila Bela da Santíssima Trindade",
  },
  {
    code: "2396",
    name: "VB AGRO LTDA - NOVA LACERDA",
    acronym: "VBN",
    unitName: "Nova Lacerda",
  },
  {
    code: "2397",
    name: "VB AGRO LTDA - TAPURAH",
    acronym: "VBC",
    unitName: "Tapurah",
  },
  {
    code: "2419",
    name: "VB AGRO LTDA - Jaraguari",
    acronym: "VBG",
    unitName: "Jaraguari",
  },
];

/**
 * Mapa rápido indexado por código ERP (ex: "2345" -> CompanyBranchMapping)
 */
export const COMPANY_BY_CODE_MAP: Record<string, CompanyBranchMapping> =
  COMPANY_BRANCHES.reduce((acc, item) => {
    acc[item.code] = item;
    return acc;
  }, {} as Record<string, CompanyBranchMapping>);

/**
 * Mapa rápido indexado por sigla (ex: "VBA" -> CompanyBranchMapping)
 */
export const COMPANY_BY_ACRONYM_MAP: Record<string, CompanyBranchMapping> =
  COMPANY_BRANCHES.reduce((acc, item) => {
    acc[item.acronym.toUpperCase()] = item;
    return acc;
  }, {} as Record<string, CompanyBranchMapping>);

/**
 * Retorna o nome amigável/completo da empresa por código
 */
export function getCompanyNameByCode(code?: string): string | undefined {
  if (!code) return undefined;
  return COMPANY_BY_CODE_MAP[code]?.name;
}

/**
 * Retorna os dados da unidade/empresa a partir do código ou sigla
 */
export function findCompanyBranch(query?: string): CompanyBranchMapping | undefined {
  if (!query) return undefined;
  const normalized = query.trim().toUpperCase();
  return COMPANY_BY_CODE_MAP[normalized] || COMPANY_BY_ACRONYM_MAP[normalized];
}
