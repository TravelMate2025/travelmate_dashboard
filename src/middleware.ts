import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
} from "./context/Auth-Cookies";

export function middleware(request: NextRequest) {
  const { value: accessToken } = request.cookies.get(ACCESS_TOKEN_KEY) ?? {
    value: null,
  };
  const { value: refreshToken } = request.cookies.get(REFRESH_TOKEN_KEY) ?? {
    value: null,
  };

  const response = NextResponse.next();

  if (accessToken) {
    response.cookies.set(ACCESS_TOKEN_KEY, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }

  if (refreshToken) {
    response.cookies.set(REFRESH_TOKEN_KEY, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }

  return response;
}

export const config = {
  matcher: "/:path*",
};