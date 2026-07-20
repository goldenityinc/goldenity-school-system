import { NextResponse } from "next/server";
import { getCurrentSession } from "../../../lib/utils/jwt";

const DEFAULT_BACKEND_URL =
  process.env.EMPLOYEE_API_BASE_URL ?? process.env.CENTRAL_COMMAND_URL ?? process.env.GOLDENITY_ADMIN_CORE_API_URL ?? "https://goldenity-admin-core-api.vercel.app";

function buildBackendUrl(path: string) {
  return `${DEFAULT_BACKEND_URL.replace(/\/$/, "")}${path}`;
}

async function getForwardHeaders(session: Awaited<ReturnType<typeof getCurrentSession>>, request: Request) {
  const authorizationHeader = request.headers.get("authorization") ?? request.headers.get("Authorization") ?? "";

  if (!session?.tenantId) {
    return null;
  }

  const backendHeaders = {
    Authorization: authorizationHeader || "",
    "Content-Type": "application/json",
    "x-tenant-id": session?.tenantId || session?.tenant_id || session?.user?.tenantId || "MISSING_TENANT",
    "x-user-id": session?.userId || session?.id || session?.user?.id || "MISSING_USER",
    "x-role": session?.role || session?.user?.role || "admin"
  };

  console.log("Parsed Session:", session);
  console.log("Outgoing Headers:", backendHeaders);

  return backendHeaders;
}

async function forwardJsonResponse(path: string, init: RequestInit, session: Awaited<ReturnType<typeof getCurrentSession>>, request: Request) {
  const headers = await getForwardHeaders(session, request);

  if (!headers) {
    return NextResponse.json({ success: false, message: "Token autentikasi tidak ditemukan." }, { status: 401 });
  }

  const response = await fetch(buildBackendUrl(path), {
    ...init,
    headers: {
      ...headers,
      ...(init.headers ?? {})
    },
    cache: "no-store"
  });

  const text = await response.text();
  const contentType = response.headers.get("content-type") ?? "application/json";

  return new NextResponse(text, {
    status: response.status,
    headers: {
      "Content-Type": contentType
    }
  });
}

export async function GET(request: Request) {
  const session = await getCurrentSession();

  if (!session?.tenantId) {
    return NextResponse.json({ success: false, message: "Sesi tenant tidak valid." }, { status: 401 });
  }

  return forwardJsonResponse("/api/employees", { method: "GET" }, session, request);
}

export async function POST(request: Request) {
  const session = await getCurrentSession();

  if (!session?.tenantId) {
    return NextResponse.json({ success: false, message: "Sesi tenant tidak valid." }, { status: 401 });
  }

  const bodyText = await request.text();

  return forwardJsonResponse(
    "/api/employees",
    {
      method: "POST",
      body: bodyText,
      headers: {
        "Content-Type": request.headers.get("content-type") ?? "application/json"
      }
    },
    session,
    request
  );
}