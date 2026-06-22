import { UserRole } from "@/types/auth";

export const ROUTE_ROLES = {
  dashboard: ["procurist", "gerente", "admin"] as UserRole[],
  compras: ["procurist", "gerente", "admin"] as UserRole[],
  fornecedores: ["procurist", "gerente", "admin"] as UserRole[],
  solicitacoesRapidas: ["solicitante"] as UserRole[],
};
