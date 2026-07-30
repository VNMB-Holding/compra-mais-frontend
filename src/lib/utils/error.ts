import { ApiError } from "@/lib/api-client";

/**
 * Converts any thrown value into a user-friendly message in Portuguese.
 *
 * Priority:
 *  1. ApiError  → uses the server message already in Portuguese
 *  2. TypeError (network / fetch failure) → generic connectivity message
 *  3. Unknown   → generic fallback
 */
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
    // fetch() throws TypeError on network failures (offline, CORS, DNS…)
    return "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";
  }

  if (error instanceof Error) {
    return error.message || "Ocorreu um erro inesperado.";
  }

  return "Ocorreu um erro desconhecido. Tente novamente.";
}

/**
 * Controlled logger — only emits to the console outside of production.
 * In production, errors should surface through UI states or a monitoring
 * tool (e.g. Sentry) rather than the browser console.
 *
 * @param context  Human-readable label for where the error occurred.
 * @param error    The thrown value.
 */
export function logError(context: string, error: unknown): void {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[${context}]`, error);
  }
}
