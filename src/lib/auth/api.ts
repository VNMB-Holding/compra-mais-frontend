import { apiClient } from "@/lib/api-client";

export interface IdentityLoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: string;
  user: {
    id: string;
    name: string;
    email: string;
    tenant_id?: string;
    tenant_name?: string;
    roles?: string[];
    scopes?: string[];
  };
}

export interface IdentityMeResponse {
  user_id: string;
  tenant_id: string;
  application?: string;
  roles: string[];
  scopes: string[];
}

export async function loginApi(email: string, password: string): Promise<IdentityLoginResponse> {
  return apiClient.post<IdentityLoginResponse>(
    "/api/auth/login",
    {
      email,
      password,
      client_id: "compra-mais",
    },
    { auth: true }
  );
}

export interface IdentityUserResponse {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
}

export async function getUserByIdApi(userId: string): Promise<IdentityUserResponse> {
  return apiClient.get<IdentityUserResponse>(`/api/users/${userId}`, { auth: true });
}

export async function getUserAccessApi(userId: string): Promise<any[]> {
  return apiClient.get<any[]>(`/api/users/${userId}/access`, { auth: true });
}

export interface IdentityTenant {
  id: string;
  name: string;
  slug: string;
  document_number: string;
  status: "Active" | "Inactive";
  type: "Matriz" | "Filial";
  parent_tenant_id?: string;
}

export async function getTenantsApi(): Promise<IdentityTenant[]> {
  return apiClient.get<IdentityTenant[]>("/api/tenants", { auth: true });
}

export async function logoutApi(refreshToken: string): Promise<void> {
  return apiClient.post<void>(
    "/api/auth/logout",
    { refresh_token: refreshToken },
    { auth: true }
  );
}

export async function refreshTokenApi(refreshToken: string): Promise<{ access_token: string; refresh_token: string }> {
  return apiClient.post<{ access_token: string; refresh_token: string }>(
    "/api/auth/refresh",
    { refresh_token: refreshToken },
    { auth: true }
  );
}
