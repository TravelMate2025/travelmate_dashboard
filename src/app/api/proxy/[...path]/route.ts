import { NextRequest, NextResponse } from "next/server";
import { joinUrl, resolveBackendApiBase } from "@/lib/backend-api";

const REQUEST_HEADER_BLOCKLIST = new Set([
  "host",
  "connection",
  "content-length",
  "transfer-encoding",
  "accept-encoding",
]);

const RESPONSE_HEADER_ALLOWLIST = [
  "content-type",
  "content-disposition",
  "cache-control",
  "pragma",
  "expires",
  "etag",
  "last-modified",
];

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

const buildRequestHeaders = (req: NextRequest) => {
  const headers = new Headers();

  req.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (!REQUEST_HEADER_BLOCKLIST.has(lowerKey)) {
      headers.set(key, value);
    }
  });

  return headers;
};

const buildResponseHeaders = (upstream: Response) => {
  const headers = new Headers();

  for (const key of RESPONSE_HEADER_ALLOWLIST) {
    const value = upstream.headers.get(key);
    if (value) {
      headers.set(key, value);
    }
  }

  const getSetCookie = (upstream.headers as Headers & {
    getSetCookie?: () => string[];
  }).getSetCookie;

  if (typeof getSetCookie === "function") {
    const cookies = getSetCookie.call(upstream.headers) || [];
    for (const cookie of cookies) {
      headers.append("set-cookie", cookie);
    }
  } else {
    const setCookie = upstream.headers.get("set-cookie");
    if (setCookie) {
      headers.set("set-cookie", setCookie);
    }
  }

  return headers;
};

const handler = async (req: NextRequest, context: RouteContext) => {
  try {
    const { path = [] } = await context.params;
    const apiBase = resolveBackendApiBase();
    const requestPath = req.nextUrl.pathname;
    const requestHasTrailingSlash = requestPath.endsWith("/");
    const joinedPath = path.join("/");
    const upstreamPath =
      requestHasTrailingSlash && joinedPath && !joinedPath.endsWith("/")
        ? `${joinedPath}/`
        : joinedPath;
    const upstreamUrl = `${joinUrl(apiBase, upstreamPath)}${req.nextUrl.search}`;

    const method = req.method.toUpperCase();
    const hasBody = method !== "GET" && method !== "HEAD";
    const body = hasBody ? await req.arrayBuffer() : null;
    const requestInit: RequestInit = {
      method,
      headers: buildRequestHeaders(req),
      body,
      redirect: "manual",
      cache: "no-store",
    };

    let upstream = await fetch(upstreamUrl, requestInit);

    const shouldRetryWithTrailingSlash =
      upstream.status === 404 &&
      Boolean(upstreamPath) &&
      !upstreamPath.endsWith("/");

    if (shouldRetryWithTrailingSlash) {
      const retryUrl = `${joinUrl(apiBase, `${upstreamPath}/`)}${req.nextUrl.search}`;
      upstream = await fetch(retryUrl, requestInit);
    }

    const responseHeaders = buildResponseHeaders(upstream);

    return new NextResponse(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(
      { detail: "Proxy request failed" },
      { status: 502 }
    );
  }
};

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
export const HEAD = handler;
