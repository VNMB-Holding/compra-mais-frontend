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
    { auth: true },
  );
}

export interface FacialStatusResponse {
  enrolled: boolean;
  provider?: string;
  model_version?: string;
  enrolled_at?: string;
  updated_at?: string;
}

export interface FacialEnrollResponse {
  message?: string;
  provider?: string;
  model_version?: string;
  enrolled_at?: string;
}

export interface FacialVerifyResponse {
  matched: boolean;
  similarity: number;
  threshold?: number;
}

export interface FacialGenerateEnrollLinkParams {
  email?: string;
  userId?: string;
  expiresInHours?: number;
  baseUrl?: string;
}

export interface FacialGenerateEnrollLinkResponse {
  token: string;
  url: string;
  expires_at: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface FacialVerifyEnrollLinkResponse {
  valid: boolean;
  expires_at: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface FacialSubmitEnrollLinkResponse {
  success: boolean;
  message: string;
  user?: {
    name: string;
    email: string;
  };
}

export interface FacialCompareMatch {
  user_id: string;
  user_name: string;
  user_email: string;
  tenant_id: string;
  tenant_name: string;
  similarity: number;
  percentage: number;
  match_level: string;
}

export interface FacialCompareResponse {
  face_detected: boolean;
  total_comparisons: number;
  matches: FacialCompareMatch[];
}

export async function facialAuthenticateApi(
  image: string,
  email?: string,
): Promise<IdentityLoginResponse> {
  return apiClient.post<IdentityLoginResponse>(
    "/api/auth/facial/authenticate",
    {
      image,
      client_id: "compra-mais",
      ...(email ? { email } : {}),
    },
    { auth: true },
  );
}

export const faceLoginApi = facialAuthenticateApi;

export async function enrollFacialApi(image: string): Promise<FacialEnrollResponse> {
  return apiClient.post<FacialEnrollResponse>("/api/auth/facial/enroll", { image }, { auth: true });
}

export async function deleteFacialApi(): Promise<void> {
  return apiClient.delete<void>("/api/auth/facial/enroll", { auth: true });
}

export async function getFacialStatusApi(): Promise<FacialStatusResponse> {
  return apiClient.get<FacialStatusResponse>("/api/auth/facial/status", { auth: true });
}

export async function verifyFacialApi(
  image: string,
  similarityThreshold?: number,
): Promise<FacialVerifyResponse> {
  return apiClient.post<FacialVerifyResponse>(
    "/api/auth/facial/verify",
    {
      image,
      ...(similarityThreshold !== undefined ? { similarity_threshold: similarityThreshold } : {}),
    },
    { auth: true },
  );
}

export async function generateFacialEnrollLinkApi(
  params: FacialGenerateEnrollLinkParams = {},
): Promise<FacialGenerateEnrollLinkResponse> {
  return apiClient.post<FacialGenerateEnrollLinkResponse>(
    "/api/auth/facial/enroll-link/generate",
    {
      ...(params.email ? { email: params.email } : {}),
      ...(params.userId ? { user_id: params.userId } : {}),
      ...(params.expiresInHours ? { expires_in_hours: params.expiresInHours } : {}),
      ...(params.baseUrl ? { base_url: params.baseUrl } : {}),
    },
    { auth: true },
  );
}

export async function verifyFacialEnrollLinkApi(
  token: string,
): Promise<FacialVerifyEnrollLinkResponse> {
  return apiClient.get<FacialVerifyEnrollLinkResponse>(
    `/api/auth/facial/enroll-link/verify?token=${encodeURIComponent(token)}`,
    { auth: true },
  );
}

export async function submitFacialEnrollLinkApi(
  token: string,
  image: string,
): Promise<FacialSubmitEnrollLinkResponse> {
  return apiClient.post<FacialSubmitEnrollLinkResponse>(
    "/api/auth/facial/enroll-link",
    { token, image },
    { auth: true },
  );
}

export async function compareFacialApi(
  image: string,
  tenantId?: string,
  topK?: number,
): Promise<FacialCompareResponse> {
  return apiClient.post<FacialCompareResponse>(
    "/api/auth/facial/compare",
    {
      image,
      ...(tenantId ? { tenant_id: tenantId } : {}),
      ...(topK !== undefined ? { top_k: topK } : {}),
    },
    { auth: true },
  );
}

export async function enrollUserFacialApi(
  userId: string,
  image: string,
): Promise<FacialEnrollResponse> {
  return apiClient.post<FacialEnrollResponse>(
    `/api/users/${userId}/facial-enroll`,
    { image },
    { auth: true },
  );
}

export async function deleteUserFacialApi(userId: string): Promise<void> {
  return apiClient.delete<void>(`/api/users/${userId}/facial-enroll`, { auth: true });
}

export async function getUserFacialStatusApi(userId: string): Promise<FacialStatusResponse> {
  return apiClient.get<FacialStatusResponse>(`/api/users/${userId}/facial-status`, { auth: true });
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
  return apiClient.post<void>("/api/auth/logout", { refresh_token: refreshToken }, { auth: true });
}

export async function refreshTokenApi(
  refreshToken: string,
): Promise<{ access_token: string; refresh_token: string }> {
  return apiClient.post<{ access_token: string; refresh_token: string }>(
    "/api/auth/refresh",
    { refresh_token: refreshToken },
    { auth: true },
  );
}
