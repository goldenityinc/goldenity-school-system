import { NextResponse } from "next/server";
import { getCurrentSession } from "../../../lib/utils/jwt";

const DEFAULT_BACKEND_URL =
  process.env.CAMPUS_API_URL ?? process.env.SUBJECT_API_BASE_URL ?? process.env.CLASSROOM_API_BASE_URL ?? process.env.EMPLOYEE_API_BASE_URL ?? process.env.GOLDENITY_ADMIN_CORE_API_URL ?? "https://goldenity-campus-website.vercel.app";

function buildBackendUrl(path: string) {
  return `${DEFAULT_BACKEND_URL.replace(/\/$/, "")}${path}`;
}

function resolveForwardContext(session: Awaited<ReturnType<typeof getCurrentSession>>, request: Request) {
  const requestAuthorizationHeader = request.headers.get("authorization") ?? request.headers.get("Authorization") ?? "";
  const sessionTokenAuthorizationHeader = session?.token ? `Bearer ${session.token}` : "";
  const tenantIdFromHeader = request.headers.get("x-tenant-id") ?? request.headers.get("X-Tenant-Id") ?? "";
  const userIdFromHeader = request.headers.get("x-user-id") ?? request.headers.get("X-User-Id") ?? "";
  const roleFromHeader = request.headers.get("x-role") ?? request.headers.get("X-Role") ?? "";

  const tenantId = session?.tenantId || session?.tenant_id || session?.user?.tenantId || tenantIdFromHeader;
  const userId = session?.userId || session?.id || session?.user?.id || userIdFromHeader || "MISSING_USER";
  const role = session?.role || session?.user?.role || roleFromHeader || "admin";

  if (!tenantId) {
    return null;
  }

  return {
    authorization: requestAuthorizationHeader || sessionTokenAuthorizationHeader,
    tenantId,
    userId,
    role
  };
}

async function getForwardHeaders(session: Awaited<ReturnType<typeof getCurrentSession>>, request: Request) {
  const context = resolveForwardContext(session, request);

  if (!context) {
    return null;
  }

  const backendHeaders = {
    Authorization: context.authorization,
    "Content-Type": "application/json",
    "x-tenant-id": context.tenantId,
    "x-user-id": context.userId,
    "x-role": context.role
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
  const context = resolveForwardContext(session, request);

  if (!context) {
    return NextResponse.json({ success: false, message: "Sesi tenant tidak valid." }, { status: 401 });
  }

  return forwardJsonResponse("/api/subjects", { method: "GET" }, session, request);
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  const context = resolveForwardContext(session, request);

  if (!context) {
    return NextResponse.json({ success: false, message: "Sesi tenant tidak valid." }, { status: 401 });
  }

  const bodyText = await request.text();

  return forwardJsonResponse(
    "/api/subjects",
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