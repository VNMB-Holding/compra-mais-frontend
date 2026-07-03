const API_URL = process.env.NEXT_PUBLIC_IDENTITY_API_URL || "http://localhost:19842";
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID || "compra-mais-client-id";

export interface LoginResponse {
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

export interface MeResponse {
  user_id: string;
  tenant_id: string;
  application: string;
  roles: string[];
  scopes: string[];
}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export async function loginApi(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      client_id: CLIENT_ID,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "E-mail ou senha inválidos");
  }

  return response.json();
}

export async function getMeApi(accessToken: string): Promise<MeResponse> {
  const response = await fetch(`${API_URL}/api/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Não foi possível carregar as informações do usuário.");
  }

  return response.json();
}

export async function logoutApi(refreshToken: string, accessToken: string): Promise<void> {
  await fetch(`${API_URL}/api/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      refresh_token: refreshToken,
    }),
  });
}

export async function refreshApi(refreshToken: string): Promise<RefreshResponse> {
  const response = await fetch(`${API_URL}/api/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error("Sessão expirada.");
  }

  return response.json();
}
