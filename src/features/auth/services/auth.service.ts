import {
  loginApi,
  getUserByIdApi,
  getUserAccessApi,
  getTenantsApi,
  logoutApi,
  refreshTokenApi,
  type IdentityLoginResponse,
  type IdentityUserResponse,
  type IdentityTenant,
} from "@/lib/auth/api";

export const authService = {
  login: (email: string, password: string) => loginApi(email, password),
  getUserById: (userId: string) => getUserByIdApi(userId),
  getUserAccess: (userId: string) => getUserAccessApi(userId),
  getTenants: () => getTenantsApi(),
  logout: (refreshToken: string) => logoutApi(refreshToken),
  refreshToken: (refreshToken: string) => refreshTokenApi(refreshToken),
};

export type { IdentityLoginResponse, IdentityUserResponse, IdentityTenant };
