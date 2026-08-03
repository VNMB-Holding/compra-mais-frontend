
const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export function isUuid(val: string | undefined | null): boolean {
  if (!val) return false;
  return UUID_REGEX.test(val.trim());
}

export function formatUserDisplayName(
  rawNameOrId: string | undefined | null,
  fallbackUser?: { name?: string; email?: string } | null
): string {
  if (fallbackUser?.name) {
    return fallbackUser.name;
  }

  if (!rawNameOrId || rawNameOrId.trim() === "") {
    return "—";
  }

  if (isUuid(rawNameOrId)) {
    return fallbackUser?.email || "—";
  }

  return rawNameOrId;
}

export function formatSupplierDisplayName(
  rawNameOrId: string | undefined | null,
  fallbackName?: string
): string {
  if (!rawNameOrId || rawNameOrId.trim() === "") {
    return fallbackName || "—";
  }

  if (isUuid(rawNameOrId)) {
    return fallbackName || "—";
  }

  return rawNameOrId;
}

export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return "R$ 0,00";
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
