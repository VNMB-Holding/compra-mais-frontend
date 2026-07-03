export type UserRole = "procurist" | "solicitante" | "gerente" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  avatar?: string;
  accessToken?: string;
  refreshToken?: string;
  tenantId?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}
