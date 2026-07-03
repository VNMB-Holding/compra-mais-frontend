export type UserRole = "procurist" | "solicitante" | "gerente" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roles?: string[];
  scopes?: string[];
  department?: string;
  avatar?: string;
  accessToken?: string;
  refreshToken?: string;
  tenantId?: string;
  tenantName?: string;
  availableTenants?: { id: string; name: string; type?: "Matriz" | "Filial" }[];
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<User>;
  logout: () => void;
}
