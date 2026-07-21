import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_TOKEN_COOKIE_NAME } from "../../../lib/api/auth";
import { decodeJwtPayload } from "../../../lib/utils/jwt";

const DEFAULT_BACKEND_URL =
  process.env.CAMPUS_API_URL ?? process.env.EMPLOYEE_API_BASE_URL ?? process.env.GOLDENITY_ADMIN_CORE_API_URL ?? "https://goldenity-campus-website.vercel.app";

function buildBackendUrl(path: string) {
  return `${DEFAULT_BACKEND_URL.replace(/\/$/, "")}${path}`;
}

type ForwardSession = {
  token: string;
  tenantId: string;
  userId: string;
  role: string;
};

function readBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, value] = authorizationHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !value) {
    return null;
  }

  return value.trim();
}

async function resolveForwardSession(request: Request): Promise<ForwardSession | null> {
  const cookieStore = await cookies();
  const tokenFromCookie = cookieStore.get(AUTH_TOKEN_COOKIE_NAME)?.value?.trim() || "";
  const tokenFromAuthorizationHeader = readBearerToken(request.headers.get("authorization") ?? request.headers.get("Authorization"));
  const token = tokenFromCookie || tokenFromAuthorizationHeader || "";

  if (!token) {
    return null;
  }

  try {
    const session = decodeJwtPayload(token);
    const tenantId = session.tenantId || session.tenant_id || session.user?.tenantId || session.user?.tenant_id;
    const userId = session.userId || session.id || session.user?.id;
    const role = session.role || session.user?.role || "admin";

    if (!tenantId || !userId) {
      return null;
    }

    return {
      token,
      tenantId,
      userId,
      role
    };
  } catch {
    return null;
  }
}

async function forwardJsonResponse(path: string, init: RequestInit, request: Request) {
  const session = await resolveForwardSession(request);

  if (!session) {
    return NextResponse.json({ error: "Local session missing" }, { status: 401 });
  }

  const backendHeaders = {
    "Content-Type": "application/json",
    "x-tenant-id": session.tenantId,
    "x-user-id": session.userId,
    "x-role": session.role,
    Authorization: `Bearer ${session.token}`
  };

  console.log("Parsed Session:", session);
  console.log("Outgoing Headers:", backendHeaders);

  const response = await fetch(buildBackendUrl(path), {
    ...init,
    headers: {
      ...backendHeaders,
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
  return forwardJsonResponse("/api/employees", { method: "GET" }, request);
}

export async function POST(request: Request) {
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
    request
  );
}