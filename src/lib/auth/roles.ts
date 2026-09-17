import { UserRole } from "@/types/auth";

export const ROUTE_ROLES = {
  dashboard: ["procurist", "gerente", "admin"] as UserRole[],
  compras: ["procurist", "gerente", "admin"] as UserRole[],
  fornecedores: ["procurist", "gerente", "admin"] as UserRole[],
  solicitacoesRapidas: ["solicitante"] as UserRole[],
};

export function mapApiRole(roles: string[]): UserRole {
  if (!roles || roles.length === 0) return "solicitante";
  const normalized = roles.map((r) => r.toLowerCase().trim());
  if (normalized.some((r) => r === "admin" || r === "administrator" || r === "administrador")) {
    return "admin";
  }
  if (normalized.some((r) => r === "gerente" || r === "manager" || r === "diretor")) {
    return "gerente";
  }
  if (
    normalized.some(
      (r) =>
        r === "procurist" ||
        r === "procurista" ||
        r === "comprador" ||
        r === "compradora" ||
        r === "comprador especialista" ||
        r === "compradora especialista" ||
        r === "comprador_especialista" ||
        r === "compradora_especialista" ||
        r === "buyer" ||
        r === "procurement" ||
        r.includes("comprador") ||
        r.includes("compradora")
    )
  ) {
    return "procurist";
  }
  return "solicitante";
}
