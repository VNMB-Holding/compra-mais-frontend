export function unmask(value: string | undefined | null): string {
  if (!value) return "";
  return String(value).replace(/\D/g, "");
}

export function maskCnpj(value: string | undefined | null): string {
  const digits = unmask(value).slice(0, 14);
  if (!digits) return "";
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12)
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

export function maskCpf(value: string | undefined | null): string {
  const digits = unmask(value).slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function maskCpfCnpj(value: string | undefined | null): string {
  const digits = unmask(value);
  if (digits.length <= 11) {
    return maskCpf(digits);
  }
  return maskCnpj(digits);
}

export function maskPhone(value: string | undefined | null): string {
  const digits = unmask(value).slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function maskCep(value: string | undefined | null): string {
  const digits = unmask(value).slice(0, 8);
  if (!digits) return "";
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function maskDate(value: string | undefined | null): string {
  const digits = unmask(value).slice(0, 8);
  if (!digits) return "";
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function maskCurrency(value: string | number | undefined | null): string {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value === "number") {
    if (isNaN(value)) return "";
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  const cleanDigits = String(value).replace(/\D/g, "");
  if (!cleanDigits) return "";

  const numberValue = Number(cleanDigits) / 100;
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numberValue);
}

export function parseCurrencyToNumber(value: string | undefined | null): number {
  if (!value) return 0;
  const cleaned = String(value)
    .replace(/[^\d,-]/g, "")
    .replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function maskNfeAccessKey(value: string | undefined | null): string {
  const digits = unmask(value).slice(0, 44);
  if (!digits) return "";
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}
