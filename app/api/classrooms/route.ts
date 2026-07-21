import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_TOKEN_COOKIE_NAME } from "../../../lib/api/auth";

const DEFAULT_BACKEND_URL =
  process.env.CAMPUS_API_URL ?? process.env.CLASSROOM_API_BASE_URL ?? process.env.EMPLOYEE_API_BASE_URL ?? process.env.GOLDENITY_ADMIN_CORE_API_URL ?? "https://goldenity-campus-website.vercel.app";

function buildBackendUrl(path: string) {
  return `${DEFAULT_BACKEND_URL.replace(/\/$/, "")}${path}`;
}

type JwtClaims = {
  userId?: string;
  sub?: string;
  id?: string;
  role?: string;
  userRole?: string;
  tenantId?: string;
  tenant_id?: string;
  user?: {
    id?: string;
    userId?: string;
    role?: string;
    tenantId?: string;
    tenant_id?: string;
  };
  roles?: string[];
};

type ProxySession = {
  token: string;
  tenantId: string;
  userId: string;
  role: string;
};

function decodeBase64Url(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
}

function decodeJwtClaims(token: string): JwtClaims | null {
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(parts[1])) as JwtClaims;
  } catch {
    return null;
  }
}

function readHeaderAny(request: Request, requestHeaders: Headers, name: string) {
  return request.headers.get(name) ?? requestHeaders.get(name) ?? "";
}

function readBearerToken(authorizationHeader: string) {
  const [scheme, value] = authorizationHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !value) {
    return "";
  }

  return value.trim();
}

async function extractProxySession(request: Request): Promise<ProxySession | null> {
  const cookieStore = await cookies();
  const requestHeaders = await headers();

  const authorizationHeader = readHeaderAny(request, requestHeaders, "authorization") || readHeaderAny(request, requestHeaders, "Authorization");
  const tokenFromHeader = readBearerToken(authorizationHeader);
  const tokenFromCookie = cookieStore.get(AUTH_TOKEN_COOKIE_NAME)?.value?.trim() || "";
  const token = tokenFromCookie || tokenFromHeader;

  const claims = token ? decodeJwtClaims(token) : null;

  const tenantId =
    claims?.tenantId ??
    claims?.tenant_id ??
    claims?.user?.tenantId ??
    claims?.user?.tenant_id ??
    readHeaderAny(request, requestHeaders, "x-tenant-id") ??
    readHeaderAny(request, requestHeaders, "X-Tenant-Id");

  const userId =
    claims?.userId ??
    claims?.sub ??
    claims?.id ??
    claims?.user?.id ??
    claims?.user?.userId ??
    readHeaderAny(request, requestHeaders, "x-user-id") ??
    readHeaderAny(request, requestHeaders, "X-User-Id");

  const role =
    claims?.role ??
    claims?.userRole ??
    claims?.user?.role ??
    (Array.isArray(claims?.roles) ? claims?.roles[0] : undefined) ??
    readHeaderAny(request, requestHeaders, "x-role") ??
    readHeaderAny(request, requestHeaders, "X-Role");

  if (!token || !tenantId || !userId || !role) {
    return null;
  }

  return {
    token,
    tenantId,
    userId,
    role
  };
}

async function proxyJson(path: string, init: RequestInit, request: Request) {
  const session = await extractProxySession(request);

  if (!session) {
    return NextResponse.json({ error: "FRONTEND_PROXY_MISSING_SESSION" }, { status: 401 });
  }

  const response = await fetch(buildBackendUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-tenant-id": session.tenantId,
      "x-user-id": session.userId,
      "x-role": session.role,
      Authorization: `Bearer ${session.token}`,
      ...(init.headers ?? {})
    },
    cache: "no-store"
  });

  const responseText = await response.text();
  const responseContentType = response.headers.get("content-type") ?? "application/json";

  return new NextResponse(responseText, {
    status: response.status,
    headers: {
      "Content-Type": responseContentType
    }
  });
}

export async function GET(request: Request) {
  return proxyJson("/api/classrooms", { method: "GET" }, request);
}

export async function POST(request: Request) {
  const bodyText = await request.text();

  return proxyJson(
    "/api/classrooms",
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
