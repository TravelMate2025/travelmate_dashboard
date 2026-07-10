import { NextRequest, NextResponse } from "next/server";
import {
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
  roleCookieOptions,
} from "@/lib/auth-cookies";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { accessToken, refreshToken, isAdmin, isSuperuser } = body;

  const response = NextResponse.json({ message: "Cookies set successfully" });

  response.cookies.set("accessToken", accessToken, accessTokenCookieOptions);

  response.cookies.set("refreshToken", refreshToken, refreshTokenCookieOptions);

  response.cookies.set("dashboardIsAdmin", String(Boolean(isAdmin)), roleCookieOptions);
  response.cookies.set(
    "dashboardIsSuperuser",
    String(Boolean(isSuperuser)),
    roleCookieOptions
  );

  return response;
}
