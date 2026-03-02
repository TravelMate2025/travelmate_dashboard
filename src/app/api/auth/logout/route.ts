import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 }
    );

    // Clear the access token cookie by setting its maxAge to 0
    response.cookies.set("accessToken", "", {
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
    });

    // Clear the refresh token cookie by setting its maxAge to 0
    response.cookies.set("refreshToken", "", {
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { message: "An error occurred during logout." },
      { status: 500 }
    );
  }
}