import { User } from "@/types/auth";

export interface TenantOption {
  id: string;
  name: string;
  type?: "Matriz" | "Filial";
}

/**
 * Mantido por compatibilidade: todos os usuários agora têm acesso irrestrito aos seus tenants
 */
export function isVnmbUser(_user: User | null): boolean {
  return true;
}

/**
 * Retorna as Empresas Principais disponíveis para o usuário (Matrizes / Empresas do grupo)
 */
export function getPrimaryCompanyOptions(user: User | null): TenantOption[] {
  if (!user || !user.availableTenants || user.availableTenants.length === 0) {
    if (user?.tenantId && user?.tenantName) {
      return [{ id: user.tenantId, name: user.tenantName, type: "Matriz" }];
    }
    return [];
  }

  // Retorna todas as Empresas / Matrizes (separando filiais secundárias para o sub-seletor)
  const primary = user.availableTenants.filter(
    (t) => t.type === "Matriz" || !t.type || !t.name.toUpperCase().includes("FILIAL")
  );

  return primary.length > 0 ? primary : user.availableTenants;
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

/**
 * Retorna o nome amigável da Empresa/Unidade com base no tenantId do registro e do usuário logado
 */
export function getTenantDisplayName(tenantId?: string, user?: User | null): string {
  if (!tenantId) {
    return user?.tenantName || "—";
  }

  // 1. Tenta encontrar na lista de tenants do usuário por ID exato
  const foundInUser = user?.availableTenants?.find((t) => t.id === tenantId);
  if (foundInUser) return foundInUser.name;

  // 2. Se for o mesmo tenantId do usuário logado
  if (user?.tenantId === tenantId && user?.tenantName) {
    return user.tenantName;
  }

  // 3. Fallback para o tenantName do usuário logado ou travessão
  return user?.tenantName || "—";
}
