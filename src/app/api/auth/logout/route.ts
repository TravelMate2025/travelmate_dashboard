import { NextResponse } from "next/server";
import { clearedCookieOptions } from "@/lib/auth-cookies";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out successfully" });

  response.cookies.set("accessToken", "", clearedCookieOptions);
  response.cookies.set("refreshToken", "", clearedCookieOptions);
  response.cookies.set("dashboardIsAdmin", "", clearedCookieOptions);
  response.cookies.set("dashboardIsSuperuser", "", clearedCookieOptions);

  return response;
}
