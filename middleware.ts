import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_TOKEN_COOKIE_NAME } from "./lib/api/auth";

const REDIRECT_REFERRER_HEADER = "x-gs-auth-redirect";
const ACTIVE_TENANT_COOKIE_NAME = "goldenity_school_active_tenant_slug";
const TENANT_LOGIN_RE = /^\/school-erp\/([^/]+)\/login\/?$/;
const TENANT_ROUTE_RE = /^\/school-erp\/([^/]+)(?:\/(.*))?$/;
const PSB_ROUTE_RE = /^\/school-erp\/psb\/[^/]+(?:\/.*)?$/;

function decodeBase64Url(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return atob(padded);
}

function isUsableAuthToken(token?: string): boolean {
  if (!token) {
    return false;
  }

  try {
    const parts = token.split(".");
    if (parts.length < 2) {
      return false;
    }

    const payload = JSON.parse(decodeBase64Url(parts[1])) as { exp?: number };
    if (typeof payload.exp === "number") {
      const nowInSeconds = Math.floor(Date.now() / 1000);
      return payload.exp > nowInSeconds;
    }

    return true;
  } catch {
    return false;
  }
}

function expireAuthCookie(response: NextResponse, request: NextRequest) {
  response.cookies.set(AUTH_TOKEN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    path: "/",
    maxAge: 0,
  });
}

function setActiveTenantCookie(response: NextResponse, request: NextRequest, tenantSlug: string) {
  response.cookies.set(ACTIVE_TENANT_COOKIE_NAME, tenantSlug, {
    path: "/",
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
  });
}

function redirectOnce(request: NextRequest, target: string, tag: string) {
  if (request.headers.get(REDIRECT_REFERRER_HEADER) === tag) {
    return null;
  }
  const response = NextResponse.redirect(new URL(target, request.url));
  response.headers.set(REDIRECT_REFERRER_HEADER, tag);
  return response;
}

export default function middleware(request: NextRequest) {
  const token = request.cookies.get(AUTH_TOKEN_COOKIE_NAME)?.value;
  const hasValidToken = isUsableAuthToken(token);
  const { pathname } = request.nextUrl;

  if (PSB_ROUTE_RE.test(pathname)) {
    return NextResponse.next();
  }

  const tenantPrefixMatch = pathname.match(TENANT_ROUTE_RE);
  const activeTenantSlugCookie = request.cookies.get(ACTIVE_TENANT_COOKIE_NAME)?.value;

  if (tenantPrefixMatch) {
    const tenantSlug = decodeURIComponent(tenantPrefixMatch[1] ?? "").trim();
    const rest = tenantPrefixMatch[2] ?? "";
    const forwardedPath = rest ? `/${rest}` : "/";

    if (!tenantSlug) {
      const fallbackRedirect = redirectOnce(request, "/login", "root-login");
      if (fallbackRedirect) {
        if (token) expireAuthCookie(fallbackRedirect, request);
        return fallbackRedirect;
      }
      return NextResponse.next();
    }

    if (!hasValidToken && forwardedPath !== "/login") {
      const loginUrl = `/school-erp/${encodeURIComponent(tenantSlug)}/login`;
      const guarded = redirectOnce(request, loginUrl, `tlogin:${tenantSlug}`);
      if (guarded) {
        if (token) expireAuthCookie(guarded, request);
        return guarded;
      }
    }

    if (forwardedPath === "/login") {
      if (hasValidToken) {
        const dashboardUrl = `/school-erp/${encodeURIComponent(tenantSlug)}`;
        const guarded = redirectOnce(request, dashboardUrl, `tdashboard:${tenantSlug}`);
        if (guarded) {
          setActiveTenantCookie(guarded, request, tenantSlug);
          return guarded;
        }
      }

      const response = NextResponse.next();
      if (token && !hasValidToken) {
        expireAuthCookie(response, request);
      }
      setActiveTenantCookie(response, request, tenantSlug);
      return response;
    }

    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = forwardedPath;

    const response = NextResponse.rewrite(rewriteUrl);
    setActiveTenantCookie(response, request, tenantSlug);
    return response;
  }

  if (activeTenantSlugCookie && !TENANT_LOGIN_RE.test(pathname) && (pathname === "/" || pathname === "/login")) {
    const tenantSlug = activeTenantSlugCookie;
    const targetPath = pathname === "/login" ? `/school-erp/${encodeURIComponent(tenantSlug)}/login` : `/school-erp/${encodeURIComponent(tenantSlug)}`;
    const guarded = redirectOnce(request, targetPath, pathname === "/login" ? `glogin:${tenantSlug}` : `groot:${tenantSlug}`);
    if (guarded) {
      return guarded;
    }
  }

  if (activeTenantSlugCookie && !pathname.startsWith("/api") && !pathname.startsWith("/_next") && pathname !== "/favicon.ico") {
    if (!pathname.startsWith("/school-erp/") && pathname !== "/login") {
      const tenantSlug = activeTenantSlugCookie;
      const response = NextResponse.redirect(
        new URL(`/school-erp/${encodeURIComponent(tenantSlug)}${pathname}`, request.url),
      );
      setActiveTenantCookie(response, request, tenantSlug);
      return response;
    }
  }

  if (!hasValidToken && pathname !== "/login" && !pathname.startsWith("/api/auth")) {
    const guarded = redirectOnce(request, "/login", "fallback-login");
    if (guarded) {
      if (token) expireAuthCookie(guarded, request);
      return guarded;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
