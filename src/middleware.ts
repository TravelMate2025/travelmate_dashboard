import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const publicPaths = ["/auth/login", "/auth/signin", "/invitations"];

  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;
  const isAdmin = request.cookies.get("dashboardIsAdmin")?.value === "true";
  const isSuperuser =
    request.cookies.get("dashboardIsSuperuser")?.value === "true";

  if (!accessToken && !refreshToken) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (!isAdmin && !isSuperuser) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/Dashboard/:path*", "/dashboard/:path*"],
};
