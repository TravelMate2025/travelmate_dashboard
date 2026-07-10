import { NextRequest, NextResponse } from "next/server";
import { resolveBackendApiBase } from "@/lib/backend-api";

const parseResponseBody = async (response: Response) => {
  const raw = await response.text();

  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return raw || {};
  }
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body?.email ?? "";
    const password = body?.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 }
      );
    }

    const apiBase = resolveBackendApiBase();

    const endpoint = `${apiBase}/auth/admin/jwt/login-superuser/`;
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });

    const parsed = await parseResponseBody(upstream);

    if (!upstream.ok) {
      return NextResponse.json(parsed, { status: upstream.status });
    }

    const hasSupportedShape =
      parsed &&
      typeof parsed === "object" &&
      "access" in parsed &&
      "refresh" in parsed &&
      "user_id" in parsed &&
      "is_admin" in parsed &&
      "is_superuser" in parsed;

    if (!hasSupportedShape) {
      return NextResponse.json(
        {
          message:
            "Dashboard login endpoint returned an unsupported authentication payload.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed, { status: upstream.status });
  } catch {
    return NextResponse.json(
      { message: "Unable to process login request." },
      { status: 500 }
    );
  }
}
