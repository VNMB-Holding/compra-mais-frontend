import { apiClient } from "@/lib/api-client";

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  roles?: string[];
  scopes?: string[];
  tenantId?: string;
  tenantName?: string;
  availableTenants?: { id: string; name: string; type?: "Matriz" | "Filial" }[];
}

export interface LoginResponse {
  message: string;
  user: UserResponse;
}

export interface MeResponse {
  user: UserResponse;
}

export async function loginApi(email: string, password: string, rememberMe?: boolean): Promise<LoginResponse> {
  return apiClient.post<LoginResponse>("/api/auth/login", {
    email,
    password,
    rememberMe,
  });
}

export async function getMeApi(): Promise<MeResponse> {
  return apiClient.get<MeResponse>("/api/auth/me");
}

export async function logoutApi(): Promise<void> {
  return apiClient.post<void>("/api/auth/logout");
}

export async function refreshTokenApi(): Promise<LoginResponse> {
  return apiClient.post<LoginResponse>("/api/auth/refresh");
}
