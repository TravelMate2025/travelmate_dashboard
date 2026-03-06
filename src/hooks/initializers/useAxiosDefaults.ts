import axios, { InternalAxiosRequestConfig } from "axios";
import env from "@/config/env";
import { knownBackendApiBases } from "@/lib/backend-api";

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
];

const readPersistedAuth = (): PersistedAuthState | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(env.auth.PERSIST_AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writePersistedAuth = (value: PersistedAuthState) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(env.auth.PERSIST_AUTH_KEY, JSON.stringify(value));
  } catch {}
};

const isAuthExcludedRoute = (url: string = "") =>
  AUTH_EXCLUDED_PATHS.some((path) => url.includes(path));

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

const normalizeBackendPathname = (pathname: string) => {
  const apiStrippedPath = pathname.replace(/^\/api\/?/, "/");

  if (!apiStrippedPath || apiStrippedPath === "/") {
    return "/";
  }

  if (apiStrippedPath.endsWith("/")) {
    return apiStrippedPath;
  }

  const lastSegment = apiStrippedPath.split("/").filter(Boolean).pop() || "";
  const looksLikeFile = lastSegment.includes(".");

  return looksLikeFile ? apiStrippedPath : `${apiStrippedPath}/`;
};

const toProxyUrl = (inputUrl?: string) => {
  if (!inputUrl || typeof window === "undefined") {
    return inputUrl;
  }

  const url = inputUrl.trim();

  if (!url || url.startsWith("/api/proxy/") || url.startsWith("/api/auth/")) {
    return url;
  }

  let parsed: URL;

  try {
    parsed = isAbsoluteHttpUrl(url)
      ? new URL(url)
      : new URL(url, window.location.origin);
  } catch {
    return url;
  }

  if (isAbsoluteHttpUrl(url) && !knownBackendOrigins.has(parsed.origin)) {
    return url;
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

  if (accessToken && !config.headers.Authorization) {
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

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true; // Mark request for retry

      const requestUrl = originalRequest?.url || "";
      const isAuthRoute = isAuthExcludedRoute(requestUrl);

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
              };

              writePersistedAuth(nextAuthState);

              if (typeof window !== "undefined") {
                fetch("/api/auth/set-cookies", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    accessToken: refreshedAccessToken,
                    refreshToken,
                  }),
                }).catch(() => null);
              }

              originalRequest.headers = {
                ...(originalRequest.headers || {}),
                Authorization: `Bearer ${refreshedAccessToken}`,
              };

              instance.defaults.headers.common.Authorization =
                `Bearer ${refreshedAccessToken}`;

              return instance(originalRequest);
            }
          } catch {}
        }
      }

      if (typeof window !== "undefined") {
        window.location.href = "/auth/login";
      }
    }

    return Promise.reject(error);
  }
);

export default instance;
