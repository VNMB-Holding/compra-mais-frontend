/**
 * Mapeamento padronizado de ícones com base na categoria/segmento.
 * Retorna um ícone semântico apropriado para cada categoria de compra ou fornecimento.
 */
export function getCategoryIcon(categoryName?: string): string {
  if (!categoryName) return "folder";

  const cat = categoryName.toLowerCase().trim();

  // TI, Tecnologia e Software
  if (cat.includes("ti") || cat.includes("tecnologia") || cat.includes("software") || cat.includes("cloud") || cat.includes("sistema")) {
    return "monitor-01";
  }

  // Combustíveis, Óleos e Lubrificantes
  if (cat.includes("combust") || cat.includes("diesel") || cat.includes("óleo") || cat.includes("lubrificant") || cat.includes("gasolina")) {
    return "drop";
  }

  // Serviços e Consultoria
  if (cat.includes("serviço") || cat.includes("consultoria") || cat.includes("mão de obra") || cat.includes("terceiriza")) {
    return "briefcase-01";
  }

  // MRO, Ferramentas e Manutenção
  if (cat.includes("mro") || cat.includes("ferramenta") || cat.includes("manutenção") || cat.includes("peça") || cat.includes("equipamento")) {
    return "tool-01";
  }

  // Matérias-Primas e Insumos
  if (cat.includes("matéria") || cat.includes("prima") || cat.includes("insumo") || cat.includes("químico") || cat.includes("material")) {
    return "box";
  }

  // Logística e Transporte
  if (cat.includes("logística") || cat.includes("transporte") || cat.includes("frete") || cat.includes("frotas")) {
    return "truck-01";
  }

  // Instalações e Infraestrutura
  if (cat.includes("infra") || cat.includes("obras") || cat.includes("construção") || cat.includes("instalaç")) {
    return "building-01";
  }

  // Default fallback
  return "folder";
}
