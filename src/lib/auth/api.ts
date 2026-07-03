const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      rememberMe,
    }),
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "E-mail ou senha inválidos");
  }

  return response.json();
}

export async function getMeApi(): Promise<MeResponse> {
  const response = await fetch(`${API_URL}/api/auth/me`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Não foi possível carregar as informações do usuário.");
  }

  return response.json();
}

export async function logoutApi(): Promise<void> {
  await fetch(`${API_URL}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}
