import { User } from "@/types/auth";

export interface TenantOption {
  id: string;
  name: string;
  type?: "Matriz" | "Filial";
}

/**
 * Verifica se o usuário pertence à VNMB Holding / Administrador VNMB
 */
export function isVnmbUser(user: User | null): boolean {
  if (!user) return false;
  const emailMatch = user.email?.toLowerCase().includes("vnmb");
  const tenantMatch = user.availableTenants?.some((t) => t.name.toUpperCase().includes("VNMB"));
  return Boolean(emailMatch || tenantMatch);
}

/**
 * Verifica se o usuário é da VB AGRO Matriz
 */
export function isVbAgroMatrizUser(user: User | null): boolean {
  if (!user) return false;
  if (isVnmbUser(user)) return false;
  const currentTenant = user.availableTenants?.find((t) => t.id === user.tenantId);
  if (currentTenant && currentTenant.name.toUpperCase().includes("VB AGRO") && currentTenant.type === "Matriz") {
    return true;
  }
  return false;
}

/**
 * Retorna as opções de filtro por empresa/filial que o usuário tem acesso nas tabelas
 */
export function getCompanyFilterOptions(user: User | null): TenantOption[] {
  if (!user || !user.availableTenants) return [];

  if (isVnmbUser(user)) {
    // VNMB vê todas as empresas
    return user.availableTenants;
  }

  if (isVbAgroMatrizUser(user)) {
    // VB AGRO Matriz vê as filiais da VB AGRO
    return user.availableTenants.filter(
      (t) => t.name.toUpperCase().includes("VB AGRO")
    );
  }

  // Outros usuários vêm apenas sua empresa
  const myTenant = user.availableTenants.find((t) => t.id === user.tenantId);
  return myTenant ? [myTenant] : [];
}
