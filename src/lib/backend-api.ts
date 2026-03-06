const STAGING_BASE_URL = "https://travelmate-backend-knvd.onrender.com/api";
const LIVE_BASE_URL = "https://travelmate-backend-1-1lgj.onrender.com/api";

export const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const joinUrl = (base: string, path: string) => {
  const normalizedBase = trimTrailingSlash(base || "");
  const normalizedPath = path.replace(/^\/+/, "");
  return `${normalizedBase}/${normalizedPath}`;
};

export const resolveBackendApiBase = () => {
  const environment =
    process.env.NEXT_PUBLIC_ENVIRONMENT?.trim().toLowerCase() || "staging";
  const baseFromEnv = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  const defaultBase = environment === "production" ? LIVE_BASE_URL : STAGING_BASE_URL;

  const normalized = trimTrailingSlash(baseFromEnv || defaultBase);
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
};

export const knownBackendApiBases = () => {
  const bases = [
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim(),
    STAGING_BASE_URL,
    LIVE_BASE_URL,
  ].filter((value): value is string => Boolean(value && value.trim()));

  return Array.from(new Set(bases.map((base) => {
    const normalized = trimTrailingSlash(base);
    return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
  })));
};
