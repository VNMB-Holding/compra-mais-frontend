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

export async function getMeApi(): Promise<IdentityMeResponse> {
  return apiClient.get<IdentityMeResponse>("/api/auth/me", { auth: true });
}

export async function logoutApi(refreshToken: string): Promise<void> {
  return apiClient.post<void>(
    "/api/auth/logout",
    { refresh_token: refreshToken },
    { auth: true }
  );
}
