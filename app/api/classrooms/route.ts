import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_TOKEN_COOKIE_NAME } from "../../../lib/api/auth";
import { getCurrentSession } from "../../../lib/utils/jwt";

const DEFAULT_BACKEND_URL =
  process.env.CLASSROOM_API_BASE_URL ?? process.env.EMPLOYEE_API_BASE_URL ?? process.env.CENTRAL_COMMAND_URL ?? process.env.GOLDENITY_ADMIN_CORE_API_URL ?? "https://goldenity-admin-core-api.vercel.app";

function buildBackendUrl(path: string) {
  return `${DEFAULT_BACKEND_URL.replace(/\/$/, "")}${path}`;
}

async function getForwardHeaders(sessionTenantId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-Tenant-Id": sessionTenantId
  };
}

async function forwardJsonResponse(path: string, init: RequestInit, tenantId: string) {
  const headers = await getForwardHeaders(tenantId);

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

export async function GET() {
  const session = await getCurrentSession();

  if (!session?.tenantId) {
    return NextResponse.json({ success: false, message: "Sesi tenant tidak valid." }, { status: 401 });
  }

  return forwardJsonResponse("/api/classrooms", { method: "GET" }, session.tenantId);
}

export async function POST(request: Request) {
  const session = await getCurrentSession();

  if (!session?.tenantId) {
    return NextResponse.json({ success: false, message: "Sesi tenant tidak valid." }, { status: 401 });
  }

  const bodyText = await request.text();

  return forwardJsonResponse(
    "/classrooms",
    {
      method: "POST",
      body: bodyText,
      headers: {
        "Content-Type": request.headers.get("content-type") ?? "application/json"
      }
    },
    session.tenantId
  );
}