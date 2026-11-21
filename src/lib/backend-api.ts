// Single source of truth for "which backend does the dashboard talk to."
// Driven by NEXT_PUBLIC_API_BASE_URL (a normal env var — set it per Vercel
// environment, no code change needed to point at a different backend).
//
// Previously this was two hardcoded URLs (STAGING_BASE_URL/LIVE_BASE_URL)
// with an exact-hostname allowlist gating the env var — which is exactly
// what went stale: both hardcoded URLs pointed at old/wrong backends for
// weeks while the env var was silently rejected for not matching them.
//
// isTrustedBackendHost still enforces a real restriction (not just a
// warning) because the server-side proxy (src/app/api/proxy/[...path]/
// route.ts) forwards auth cookies/headers to whatever this resolves to —
// a misconfigured env var here would leak credentials to an unintended
// host. Fixed as a *pattern* (any travelmate-backend-*.onrender.com)
// instead of an exact-match list, so a new backend subdomain (e.g. a
// future travelmate-backend-production) just works without another
// hardcoded-URL edit. useAxiosDefaults.ts imports this same check rather
// than keeping its own separate copy.
// Production's Render service is called "travelmate-backend-staging" for
// historical reasons: it IS production (live database
// travelmate-backend-postgres). It isn't renamed because Render's Blueprint
// knows services by name, so a rename in render.yaml would create a second,
// empty production service.
const PRODUCTION_API_BASE_URL = "https://travelmate-backend-staging.onrender.com/api";
// Development: its own Render service and free database (test data only).
const DEVELOPMENT_API_BASE_URL = "https://travelmate-backend-development.onrender.com/api";

// Vercel tells the build which environment it is ("production", "preview",
// "development"); unknown (e.g. a production build elsewhere) counts as live,
// so the live dashboard never changes backend by accident.
const deployEnv = () => process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.VERCEL_ENV || "";
export const isLiveBuild = () => {
  const env = deployEnv();
  if (env) return env === "production";
  return process.env.NODE_ENV === "production";
};

// When NEXT_PUBLIC_API_BASE_URL is missing or not trusted: the live build
// keeps production; previews and local runs use development, so testing can
// never touch real customers' data by mistake.
const defaultApiBase = () => (isLiveBuild() ? PRODUCTION_API_BASE_URL : DEVELOPMENT_API_BASE_URL);

export const isTrustedBackendHost = (hostname: string) => {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1") {
    // Dev-only: lets NEXT_PUBLIC_API_BASE_URL point at a local
    // `travelmate_backend` (e.g. http://localhost:8000/api via
    // run_local.sh). Gated on NODE_ENV so this never opens up in a
    // production build.
    return process.env.NODE_ENV !== "production";
  }
  // our own addresses: backend.travelmateglo.com (production) and
  // staging-api.travelmateglo.com (development, the one web and mobile use)
  if (host === "backend.travelmateglo.com" || host === "staging-api.travelmateglo.com") return true;
  return /^travelmate-backend(-[a-z0-9]+)?\.onrender\.com$/i.test(host);
};

export const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const joinUrl = (base: string, path: string) => {
  const normalizedBase = trimTrailingSlash(base || "");
  const normalizedPath = path.replace(/^\/+/, "");
  return `${normalizedBase}/${normalizedPath}`;
};

const normalizeApiBase = (base: string) => {
  const normalized = trimTrailingSlash(base);
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
};

export const resolveBackendApiBase = () => {
  const envBaseCandidate = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

  if (envBaseCandidate) {
    try {
      const parsed = new URL(envBaseCandidate);
      if (isTrustedBackendHost(parsed.hostname)) {
        return normalizeApiBase(envBaseCandidate);
      }
      console.error(
        `[backend-api] NEXT_PUBLIC_API_BASE_URL host "${parsed.hostname}" doesn't match a recognized backend host — refusing to send authenticated requests to it. Falling back to the default backend (${defaultApiBase()}). If this host is actually correct, update isTrustedBackendHost in src/lib/backend-api.ts.`
      );
    } catch {
      console.error(
        `[backend-api] NEXT_PUBLIC_API_BASE_URL ("${envBaseCandidate}") isn't a valid URL — falling back to the default backend.`
      );
    }
  }

  return normalizeApiBase(defaultApiBase());
};

export const knownBackendApiBases = () =>
  Array.from(new Set([normalizeApiBase(defaultApiBase()), resolveBackendApiBase()]));
