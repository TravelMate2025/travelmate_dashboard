// Same backend for both staging and production dashboard environments —
// travelmate_web also points at this one. travelmate-backend-knvd (the old
// STAGING_BASE_URL) was a bare service with no database, never actually
// functional; travelmate-backend-1-1lgj (the old LIVE_BASE_URL) is a
// separate, unrelated backend not used here.
const STAGING_BASE_URL = "https://travelmate-backend-staging.onrender.com/api";
const LIVE_BASE_URL = "https://travelmate-backend-staging.onrender.com/api";

// Dev-only: lets NEXT_PUBLIC_API_BASE_URL point at a local `travelmate_backend`
// (e.g. http://localhost:8000/api via run_local.sh) for local testing.
// Gated on NODE_ENV so this never opens up in a production build.
const isLocalBackendAllowed = process.env.NODE_ENV !== "production";
const LOCAL_HOSTNAMES = ["localhost", "127.0.0.1"];

const ALLOWED_BACKEND_HOSTS = new Set(
  [STAGING_BASE_URL, LIVE_BASE_URL]
    .map((value) => {
      try {
        return new URL(value).hostname.toLowerCase();
      } catch {
        return null;
      }
    })
    .filter((hostname): hostname is string => Boolean(hostname))
    .concat(isLocalBackendAllowed ? LOCAL_HOSTNAMES : [])
);

export const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const joinUrl = (base: string, path: string) => {
  const normalizedBase = trimTrailingSlash(base || "");
  const normalizedPath = path.replace(/^\/+/, "");
  return `${normalizedBase}/${normalizedPath}`;
};

const isAllowedBackendBase = (value?: string) => {
  if (!value) {
    return false;
  }

  try {
    const parsed = new URL(value);
    return ALLOWED_BACKEND_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
};

export const resolveBackendApiBase = () => {
  const environment =
    process.env.NEXT_PUBLIC_ENVIRONMENT?.trim().toLowerCase() || "staging";
  const envBaseCandidate = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  const baseFromEnv = isAllowedBackendBase(envBaseCandidate) ? envBaseCandidate : undefined;
  const defaultBase = environment === "production" ? LIVE_BASE_URL : STAGING_BASE_URL;

  const normalized = trimTrailingSlash(baseFromEnv || defaultBase);
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
};

export const knownBackendApiBases = () => {
  const bases = [
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim(),
    STAGING_BASE_URL,
    LIVE_BASE_URL,
  ].filter(
    (value): value is string =>
      Boolean(value && value.trim()) && isAllowedBackendBase(value)
  );

  return Array.from(new Set(bases.map((base) => {
    const normalized = trimTrailingSlash(base);
    return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
  })));
};
