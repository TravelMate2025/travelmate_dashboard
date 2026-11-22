import axios, { InternalAxiosRequestConfig } from "axios";
import env from "@/config/env";
import { knownBackendApiBases, isTrustedBackendHost } from "@/lib/backend-api";
import {
  clearAuthSession,
  readStoredAuthState,
  syncAuthSession,
} from "@/lib/auth-session";

type PersistedAuthState = {
  accessToken?: string;
  refreshToken?: string;
  [key: string]: unknown;
};

const AUTH_EXCLUDED_PATHS = [
  "/auth-token/",
  "/auth/jwt/token/refresh/",
  "/auth/jwt/token/verify/",
  "/users/logout/",
  "/auth/login",
  "/auth/logout",
  "/admin/invitations/validate/",
  "/admin/invitations/accept/",
];

const readPersistedAuth = (): PersistedAuthState | null =>
  (readStoredAuthState() as PersistedAuthState | null) ?? null;

const isAuthExcludedRoute = (url: string = "") =>
  AUTH_EXCLUDED_PATHS.some((path) => url.includes(path));

const isPublicInvitationRoute = (url: string = "") =>
  url.includes("/admin/invitations/validate/") ||
  url.includes("/admin/invitations/accept/");

const knownBackendOrigins = new Set(
  knownBackendApiBases()
    .map((base) => {
      try {
        return new URL(base).origin;
      } catch {
        return null;
      }
    })
    .filter((origin): origin is string => Boolean(origin))
);

const isAbsoluteHttpUrl = (value: string) => /^https?:\/\//i.test(value);

// isTrustedBackendHost (from lib/backend-api.ts) is the same check
// resolveBackendApiBase uses to decide whether to honor
// NEXT_PUBLIC_API_BASE_URL — kept as one shared implementation instead of
// each file inventing its own copy of "what counts as our backend."
const isTravelmateBackendHost = isTrustedBackendHost;

const ensureEndpointTrailingSlash = (path: string) => {
  if (!path || path === "/") {
    return "/";
  }

  if (path.endsWith("/")) {
    return path;
  }

  const lastSegment = path.split("/").filter(Boolean).pop() || "";
  const looksLikeFile = lastSegment.includes(".");

  return looksLikeFile ? path : `${path}/`;
};

const normalizeBackendPathname = (pathname: string) => {
  const apiStrippedPath = pathname.replace(/^\/api\/?/, "/");

  return ensureEndpointTrailingSlash(apiStrippedPath);
};

const normalizeProxyPathname = (pathname: string) => {
  const proxyStrippedPath = pathname.replace(/^\/api\/proxy\/?/, "/");
  const normalizedProxyPath = ensureEndpointTrailingSlash(proxyStrippedPath);

  return `/api/proxy${normalizedProxyPath}`;
};

const toProxyUrl = (inputUrl?: string) => {
  if (!inputUrl || typeof window === "undefined") {
    return inputUrl;
  }

  const url = inputUrl.trim();

  if (!url) {
    return url;
  }

  if (url.startsWith("/api/auth/")) {
    return url;
  }

  if (url.startsWith("/api/proxy/")) {
    const [pathname, query = ""] = url.split("?");
    const normalizedPath = normalizeProxyPathname(pathname);
    return `${normalizedPath}${query ? `?${query}` : ""}`;
  }

  let parsed: URL;

  try {
    parsed = isAbsoluteHttpUrl(url)
      ? new URL(url)
      : new URL(url, window.location.origin);
  } catch {
    return url;
  }

  const isKnownBackendOrigin = knownBackendOrigins.has(parsed.origin);
  const isKnownTravelmateBackend = isTravelmateBackendHost(parsed.hostname);

  if (isAbsoluteHttpUrl(url) && !isKnownBackendOrigin && !isKnownTravelmateBackend) {
    return url;
  }

  if (parsed.pathname.startsWith("/api/proxy/")) {
    const normalizedPath = normalizeProxyPathname(parsed.pathname);
    return `${normalizedPath}${parsed.search}`;
  }

  if (!parsed.pathname.startsWith("/api/")) {
    return url;
  }

  const backendPath = normalizeBackendPathname(parsed.pathname);
  return `/api/proxy${backendPath}${parsed.search}`;
};

const applyRequestDefaults = (config: InternalAxiosRequestConfig) => {
  config.withCredentials = true;
  config.url = toProxyUrl(config.url);

  const persistedAuth = readPersistedAuth();
  const accessToken = persistedAuth?.accessToken;

  if (
    accessToken &&
    !config.headers.Authorization &&
    !isPublicInvitationRoute(config.url)
  ) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
};

const instance = axios.create({
  withCredentials: true,
});

axios.defaults.withCredentials = true;

axios.interceptors.request.use(applyRequestDefaults);
instance.interceptors.request.use(applyRequestDefaults);

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || "";
    const isAuthRoute = isAuthExcludedRoute(requestUrl);

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true; // Mark request for retry

      let shouldForceLogout = false;

      if (!isAuthRoute) {
        const persistedAuth = readPersistedAuth();
        const refreshToken = persistedAuth?.refreshToken;

        if (refreshToken) {
          try {
            const refreshResponse = await axios.post(
              env.api.jwtRefreshToken,
              { refresh: refreshToken },
              { withCredentials: true }
            );

            const refreshedAccessToken = refreshResponse?.data?.access;

            if (refreshedAccessToken) {
              const nextAuthState = {
                ...(persistedAuth || {}),
                accessToken: refreshedAccessToken,
                refreshToken,
              };

              void syncAuthSession(nextAuthState).catch(() => null);

              originalRequest.headers = {
                ...(originalRequest.headers || {}),
                Authorization: `Bearer ${refreshedAccessToken}`,
              };

              instance.defaults.headers.common.Authorization =
                `Bearer ${refreshedAccessToken}`;

              return instance(originalRequest);
            }
            shouldForceLogout = true;
          } catch (refreshError: any) {
            const refreshStatus = refreshError?.response?.status;

            // Only force logout when refresh token is actually invalid/expired.
            if (refreshStatus === 401 || refreshStatus === 403) {
              shouldForceLogout = true;
            }
          }
        } else {
          shouldForceLogout = true;
        }
      }

      if (typeof window !== "undefined" && !isAuthRoute && shouldForceLogout) {
        void clearAuthSession().catch(() => null);
        window.location.href = "/auth/login";
      }
    }

    return Promise.reject(error);
  }
);

export default instance;
