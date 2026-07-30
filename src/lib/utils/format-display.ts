// Helper utilitário para formatar nomes de usuários e fornecedores
// evitando a exibição de UUIDs brutos na interface do usuário.

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export function isUuid(val: string | undefined | null): boolean {
  if (!val) return false;
  return UUID_REGEX.test(val.trim());
}

export function formatUserDisplayName(
  rawNameOrId: string | undefined | null,
  fallbackUser?: { name?: string; email?: string } | null
): string {
  if (!rawNameOrId || rawNameOrId.trim() === "") {
    return fallbackUser?.name || "Solicitante";
  }

  if (isUuid(rawNameOrId)) {
    // Se for um UUID, usa o nome do usuário logado ou um fallback amigável
    if (fallbackUser?.name) return fallbackUser.name;
    return "Solicitante";
  }

  return rawNameOrId;
}

export function formatSupplierDisplayName(
  rawNameOrId: string | undefined | null,
  fallbackName?: string
): string {
  if (!rawNameOrId || rawNameOrId.trim() === "") {
    return fallbackName || "Fornecedor";
  }

  if (isUuid(rawNameOrId)) {
    return fallbackName || "Fornecedor Parceiro";
  }

  return rawNameOrId;
}
