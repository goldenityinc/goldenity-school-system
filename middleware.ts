import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_TOKEN_COOKIE_NAME } from "./lib/api/auth";

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

export default function middleware(request: NextRequest) {
  const token = request.cookies.get(AUTH_TOKEN_COOKIE_NAME)?.value;
  const hasValidToken = isUsableAuthToken(token);
  const { pathname } = request.nextUrl;

  const tenantPrefixMatch = pathname.match(/^\/school-erp\/([^/]+)(?:\/(.*))?$/);
  const activeTenantSlugCookie = request.cookies.get("goldenity_school_active_tenant_slug")?.value;

  if (tenantPrefixMatch) {
    const tenantSlug = decodeURIComponent(tenantPrefixMatch[1] ?? "").trim();
    const rest = tenantPrefixMatch[2] ?? "";
    const forwardedPath = rest ? `/${rest}` : "/";

    if (!hasValidToken && forwardedPath !== "/login") {
      const response = NextResponse.redirect(new URL(`/school-erp/${encodeURIComponent(tenantSlug)}/login`, request.url));
      if (token) {
        expireAuthCookie(response, request);
      }
      return response;
    }

    if (forwardedPath === "/login") {
      const response = hasValidToken
        ? NextResponse.redirect(new URL(`/school-erp/${encodeURIComponent(tenantSlug)}`, request.url))
        : NextResponse.next();

      if (token && !hasValidToken) {
        expireAuthCookie(response, request);
      }

      if (tenantSlug) {
        response.cookies.set("goldenity_school_active_tenant_slug", tenantSlug, {
          path: "/",
          sameSite: "lax",
          secure: request.nextUrl.protocol === "https:",
        });
      }
      return response;
    }

    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = forwardedPath;

    const response = NextResponse.rewrite(rewriteUrl);
    if (tenantSlug) {
      response.cookies.set("goldenity_school_active_tenant_slug", tenantSlug, {
        path: "/",
        sameSite: "lax",
        secure: request.nextUrl.protocol === "https:",
      });
    }
    return response;
  }

  if (activeTenantSlugCookie && (pathname === "/" || pathname === "/login")) {
    return NextResponse.redirect(
      new URL(
        `/school-erp/${encodeURIComponent(activeTenantSlugCookie)}${pathname === "/login" ? "/login" : ""}`,
        request.url,
      ),
    );
  }

  if (activeTenantSlugCookie && !pathname.startsWith("/api") && !pathname.startsWith("/_next") && pathname !== "/favicon.ico") {
    if (!pathname.startsWith("/school-erp/") && pathname !== "/login") {
      return NextResponse.redirect(
        new URL(`/school-erp/${encodeURIComponent(activeTenantSlugCookie)}${pathname}`, request.url),
      );
    }
  }

  if (!hasValidToken && pathname !== "/login" && !pathname.startsWith("/api/auth")) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    if (token) {
      expireAuthCookie(response, request);
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
