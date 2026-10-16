
function getEnvVar(key: string, required = true): string {
  // Em ambiente de testes (vitest), providenciamos mock local para não poluir os logs de teste
  if (process.env.NODE_ENV === "test") {
    if (key === "NEXT_PUBLIC_API_URL") return "http://localhost:3001";
    if (key === "NEXT_PUBLIC_AUTH_API_URL") return "http://localhost:19842";
  }

  const value = process.env[key];

  if (!value || value.trim() === "") {
    if (required) {
      const errorMsg = `[ENV_ERROR] Missing required environment variable: ${key}. Check your .env file or deployment settings.`;
      if (typeof window !== "undefined") {
        console.error(errorMsg);
      } else if (process.env.NODE_ENV === "production") {
        console.warn(errorMsg);
      }
    }
    return "";
  }

  return value.trim().replace(/\/+$/, "");
}

export const env = {
  API_URL: getEnvVar("NEXT_PUBLIC_API_URL", true),

  AUTH_API_URL: getEnvVar("NEXT_PUBLIC_AUTH_API_URL", true),

  GEOAPIFY_API_KEY: getEnvVar("NEXT_PUBLIC_GEOAPIFY_API_KEY", false),

  SUPPORT_WHATSAPP: getEnvVar("NEXT_PUBLIC_SUPPORT_WHATSAPP", false),
  SUPPORT_EMAIL: getEnvVar("NEXT_PUBLIC_SUPPORT_EMAIL", false),

  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
} as const;

export const BIZ_API_URL = env.API_URL;
export const AUTH_API_URL = env.AUTH_API_URL;
export const GEOAPIFY_API_KEY = env.GEOAPIFY_API_KEY;
