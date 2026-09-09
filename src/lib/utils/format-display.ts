
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

const MONTH_MAP_PT: Record<string, string> = {
  jan: "Jan",
  feb: "Fev",
  fev: "Fev",
  mar: "Mar",
  apr: "Abr",
  abr: "Abr",
  may: "Mai",
  mai: "Mai",
  jun: "Jun",
  jul: "Jul",
  aug: "Ago",
  ago: "Ago",
  sep: "Set",
  set: "Set",
  oct: "Out",
  out: "Out",
  nov: "Nov",
  dec: "Dez",
  dez: "Dez",
};

export function formatMonthLabel(label: string | undefined | null): string {
  if (!label) return "";
  const trimmed = label.trim();
  const lower = trimmed.toLowerCase();
  
  if (MONTH_MAP_PT[lower]) {
    return MONTH_MAP_PT[lower];
  }

  // Se vier no formato "Sep/26" ou "Sep 2026"
  const parts = trimmed.split(/[\s\/-]+/);
  if (parts.length >= 2 && MONTH_MAP_PT[parts[0].toLowerCase()]) {
    return `${MONTH_MAP_PT[parts[0].toLowerCase()]}/${parts[1]}`;
  }

  return trimmed;
}
