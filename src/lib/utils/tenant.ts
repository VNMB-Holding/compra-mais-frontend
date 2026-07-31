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
 * Retorna as Empresas Principais (Matrizes / Empresas do grupo)
 */
export function getPrimaryCompanyOptions(user: User | null): TenantOption[] {
  if (!user || !user.availableTenants) return [];

  if (isVnmbUser(user)) {
    // Retorna todas as Empresas / Matrizes do grupo (excluindo filiais secundárias do primeiro select)
    const primary = user.availableTenants.filter(
      (t) => t.type === "Matriz" || !t.type || !t.name.toUpperCase().includes("FILIAL")
    );
    return primary.length > 0 ? primary : user.availableTenants;
  }

  // Se o usuário é VB Agro Matriz ou outra matriz, retorna sua matriz
  const currentTenant = user.availableTenants.find((t) => t.id === user.tenantId);
  if (currentTenant) {
    return [currentTenant];
  }

  return user.availableTenants;
}

/**
 * Retorna as Filiais de uma determinada empresa selecionada (ex: VB AGRO)
 */
export function getBranchCompanyOptions(user: User | null, selectedCompanyId: string): TenantOption[] {
  if (!user || !user.availableTenants || !selectedCompanyId || selectedCompanyId === "TODAS") return [];

  const selectedTenant = user.availableTenants.find((t) => t.id === selectedCompanyId);
  if (!selectedTenant) return [];

  // Extrai o nome base (ex: "VB AGRO")
  const baseName = selectedTenant.name.replace(/\s*(Matriz|Filial.*)$/i, "").trim().toUpperCase();

  // Encontra todas as filiais associadas a essa empresa
  return user.availableTenants.filter(
    (t) => t.id !== selectedCompanyId && t.name.toUpperCase().includes(baseName)
  );
}
