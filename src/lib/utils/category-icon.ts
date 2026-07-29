/**
 * Enum oficial de Categorias do Sistema (conforme enum CategoryType no PostgreSQL / Prisma)
 */
export enum CategoryType {
  IT_SOFTWARE = "IT_SOFTWARE",
  FUEL_LUBRICANTS = "FUEL_LUBRICANTS",
  SERVICES = "SERVICES",
  MRO_MAINTENANCE = "MRO_MAINTENANCE",
  RAW_MATERIALS = "RAW_MATERIALS",
  LOGISTICS = "LOGISTICS",
  INFRASTRUCTURE = "INFRASTRUCTURE",
  GENERAL = "GENERAL",
}

/**
 * Mapeamento oficial e estrito de ícones por Enum de Categoria
 */
export const CATEGORY_ICON_MAP: Record<CategoryType | string, string> = {
  [CategoryType.IT_SOFTWARE]: "monitor-01",
  [CategoryType.FUEL_LUBRICANTS]: "drop",
  [CategoryType.SERVICES]: "briefcase-01",
  [CategoryType.MRO_MAINTENANCE]: "tool-01",
  [CategoryType.RAW_MATERIALS]: "box",
  [CategoryType.LOGISTICS]: "truck-01",
  [CategoryType.INFRASTRUCTURE]: "building-01",
  [CategoryType.GENERAL]: "folder",
};

/**
 * Rótulos formatados (Labels) por Enum
 */
export const CATEGORY_LABEL_MAP: Record<CategoryType | string, string> = {
  [CategoryType.IT_SOFTWARE]: "TI & Software",
  [CategoryType.FUEL_LUBRICANTS]: "Combustíveis & Lubrificantes",
  [CategoryType.SERVICES]: "Serviços & Consultoria",
  [CategoryType.MRO_MAINTENANCE]: "MRO & Manutenção",
  [CategoryType.RAW_MATERIALS]: "Matérias-Primas",
  [CategoryType.LOGISTICS]: "Logística & Transporte",
  [CategoryType.INFRASTRUCTURE]: "Infraestrutura & Obras",
  [CategoryType.GENERAL]: "Geral / Outros",
};

/**
 * Função utilitária para obter o ícone com suporte tanto a valores Enum quanto string/fallback
 */
export function getCategoryIcon(category?: CategoryType | string): string {
  if (!category) return CATEGORY_ICON_MAP[CategoryType.GENERAL];

  // Se já for uma chave direta do Enum
  if (CATEGORY_ICON_MAP[category]) {
    return CATEGORY_ICON_MAP[category];
  }

  const cat = String(category).toLowerCase().trim();

  if (cat.includes("mista") || cat.includes("múltipla") || cat.includes("multipla") || cat.includes("diversa")) {
    return "layers-01";
  }

  if (cat.includes("ti") || cat.includes("tecnologia") || cat.includes("software") || cat.includes("cloud") || cat.includes("sistema")) {
    return CATEGORY_ICON_MAP[CategoryType.IT_SOFTWARE];
  }
  if (cat.includes("combust") || cat.includes("diesel") || cat.includes("óleo") || cat.includes("lubrificant") || cat.includes("gasolina")) {
    return CATEGORY_ICON_MAP[CategoryType.FUEL_LUBRICANTS];
  }
  if (cat.includes("serviço") || cat.includes("consultoria") || cat.includes("mão de obra") || cat.includes("terceiriza")) {
    return CATEGORY_ICON_MAP[CategoryType.SERVICES];
  }
  if (cat.includes("mro") || cat.includes("ferramenta") || cat.includes("manutenção") || cat.includes("peça") || cat.includes("equipamento")) {
    return CATEGORY_ICON_MAP[CategoryType.MRO_MAINTENANCE];
  }
  if (cat.includes("matéria") || cat.includes("prima") || cat.includes("insumo") || cat.includes("químico") || cat.includes("material")) {
    return CATEGORY_ICON_MAP[CategoryType.RAW_MATERIALS];
  }
  if (cat.includes("logística") || cat.includes("transporte") || cat.includes("frete") || cat.includes("frotas")) {
    return CATEGORY_ICON_MAP[CategoryType.LOGISTICS];
  }
  if (cat.includes("infra") || cat.includes("obras") || cat.includes("construção") || cat.includes("instalaç")) {
    return CATEGORY_ICON_MAP[CategoryType.INFRASTRUCTURE];
  }

  return CATEGORY_ICON_MAP[CategoryType.GENERAL];
}
