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
// host. Our two travelmateglo.com backend domains plus a *pattern* for
// Render addresses (travelmate-backend-*.onrender.com; production's is
// travelmate-backend-staging.onrender.com, a name kept from before the
// rename of the service). useAxiosDefaults.ts imports this same check rather
// than keeping its own separate copy.
// The only built-in backend is DEVELOPMENT. The live backend is used only
// when NEXT_PUBLIC_API_BASE_URL names it explicitly (the live Vercel project
// sets it). A missing, mistyped or untrusted value therefore lands on test
// data, never on real customers' data: the testing dashboard is a Vercel
// "production" deployment of its own project, so "which Vercel environment"
// can't tell testing and live apart (22 Nov 2026, a preview read live users).
//
// Development: its own Render workspace, reached through its custom domain,
// which follows the service when it moves.
const DEVELOPMENT_API_BASE_URL = "https://staging-api.travelmateglo.com/api";

const defaultApiBase = () => DEVELOPMENT_API_BASE_URL;

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
  return /^travelmate-backend(-[a-z0-9]+)*\.onrender\.com$/i.test(host);
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
        `[backend-api] NEXT_PUBLIC_API_BASE_URL host "${parsed.hostname}" doesn't match a recognized backend host — refusing to send authenticated requests to it. Falling back to the development backend (${defaultApiBase()}). If this host is actually correct, update isTrustedBackendHost in src/lib/backend-api.ts.`
      );
    } catch {
      console.error(
        `[backend-api] NEXT_PUBLIC_API_BASE_URL ("${envBaseCandidate}") isn't a valid URL — falling back to the development backend.`
      );
    }
  }

  return normalizeApiBase(defaultApiBase());
};

export const knownBackendApiBases = () =>
  Array.from(new Set([normalizeApiBase(defaultApiBase()), resolveBackendApiBase()]));
