const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL;
const RAW_AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL;
const RAW_GEOAPIFY_API_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;
const RAW_SUPPORT_WHATSAPP = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP;
const RAW_SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;

function resolveApiUrl(): string {
  if (process.env.NODE_ENV === "test") {
    return RAW_API_URL || "http://localhost:3001";
  }

  // 1. Resolução dinâmica no navegador baseada no hostname ativo
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.includes("hml-")) {
      return "https://hml-api-compramais.vnmbholding.com";
    }
    if (host === "compra-mais.vnmbholding.com") {
      return "https://api-compramais.vnmbholding.com";
    }
    if (host === "localhost" || host === "127.0.0.1") {
      return RAW_API_URL || "http://localhost:3001";
    }
  }

  // 2. Variável de build estática injetada pelo Next.js
  if (RAW_API_URL && RAW_API_URL.trim() !== "") {
    return RAW_API_URL.trim().replace(/\/+$/, "");
  }

  return "";
}

function resolveAuthApiUrl(): string {
  if (process.env.NODE_ENV === "test") {
    return RAW_AUTH_API_URL || "http://localhost:19842";
  }

  // 1. Resolução dinâmica no navegador baseada no hostname ativo
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.includes("hml-")) {
      return "https://hml-identity.vnmbholding.com";
    }
    if (host === "compra-mais.vnmbholding.com") {
      return "https://identity.vnmbholding.com";
    }
    if (host === "localhost" || host === "127.0.0.1") {
      return RAW_AUTH_API_URL || "http://localhost:19842";
    }
  }

  // 2. Variável de build estática injetada pelo Next.js
  if (RAW_AUTH_API_URL && RAW_AUTH_API_URL.trim() !== "") {
    return RAW_AUTH_API_URL.trim().replace(/\/+$/, "");
  }

  return "";
}

export const env = {
  API_URL: resolveApiUrl(),
  AUTH_API_URL: resolveAuthApiUrl(),
  GEOAPIFY_API_KEY: RAW_GEOAPIFY_API_KEY || "2259d519a04e42bcbf5003b9366404a0",
  SUPPORT_WHATSAPP: RAW_SUPPORT_WHATSAPP || "5511986055544",
  SUPPORT_EMAIL: RAW_SUPPORT_EMAIL || "breno@vnmb.com.br",
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
} as const;

export const BIZ_API_URL = env.API_URL;
export const AUTH_API_URL = env.AUTH_API_URL;
export const GEOAPIFY_API_KEY = env.GEOAPIFY_API_KEY;
