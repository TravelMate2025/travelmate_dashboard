import { NextRequest, NextResponse } from "next/server";
import { joinUrl, resolveBackendApiBase } from "@/lib/backend-api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body?.email ?? "";
    const password = body?.password ?? "";

    const apiBase = resolveBackendApiBase();

    const endpointCandidates = [
      `${apiBase}/auth/admin/jwt/login-superuser/`,
      `${apiBase}/auth-token/`,
      joinUrl(`${apiBase}/auth/`, "jwt/login-superuser/"),
      joinUrl(`${apiBase}/superadmin/`, "login-superuser/"),
      joinUrl(`${apiBase}/auth/`, "jwt/create/"),
    ];

    const payloadCandidates = [
      { email, password },
      { username: email, password },
    ];

    let lastErrorStatus = 500;
    let lastErrorBody: unknown = { message: "Login failed." };

    for (const endpoint of endpointCandidates) {
      for (const candidatePayload of payloadCandidates) {
        const upstream = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(candidatePayload),
          cache: "no-store",
        });

        const raw = await upstream.text();
        let parsed: unknown = raw;

        try {
          parsed = raw ? JSON.parse(raw) : {};
        } catch {
          parsed = raw || {};
        }

        if (upstream.ok) {
          return NextResponse.json(parsed, { status: upstream.status });
        }

        lastErrorStatus = upstream.status;
        lastErrorBody = parsed;

        if (upstream.status === 400 || upstream.status === 401 || upstream.status === 403) {
          return NextResponse.json(parsed, { status: upstream.status });
        }
      }
    }

    return NextResponse.json(lastErrorBody, { status: lastErrorStatus });
  } catch (error) {
    return NextResponse.json(
      { message: "Unable to process login request." },
      { status: 500 }
    );
  }
}
