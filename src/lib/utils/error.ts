import { ApiError } from "@/lib/api-client";


export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return "Sua sessão expirou. Faça login novamente.";
    }
    if (error.status === 403) {
      return "Você não tem permissão para realizar esta ação.";
    }
    if (error.status === 404) {
      return "O recurso solicitado não foi encontrado.";
    }
    if (error.status >= 500) {
      return "O servidor encontrou um problema. Tente novamente em instantes.";
    }
    return error.message || "Ocorreu um erro inesperado.";
  }

  if (error instanceof TypeError) {
    return "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";
  }

  if (error instanceof Error) {
    return error.message || "Ocorreu um erro inesperado.";
  }

  return "Ocorreu um erro desconhecido. Tente novamente.";
}


export function logError(context: string, error: unknown): void {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[${context}]`, error);
  }
}
