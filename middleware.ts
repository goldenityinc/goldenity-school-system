import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_TOKEN_COOKIE_NAME } from "./lib/api/auth";

export default function middleware(request: NextRequest) {
  const token = request.cookies.get(AUTH_TOKEN_COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  const tenantPrefixMatch = pathname.match(/^\/school-erp\/([^/]+)(?:\/(.*))?$/);
  const activeTenantSlugCookie = request.cookies.get("goldenity_school_active_tenant_slug")?.value;

  if (tenantPrefixMatch) {
    const tenantSlug = decodeURIComponent(tenantPrefixMatch[1] ?? "").trim();
    const rest = tenantPrefixMatch[2] ?? "";
    const forwardedPath = rest ? `/${rest}` : "/";

    if (!token && forwardedPath !== "/login") {
      return NextResponse.redirect(new URL(`/school-erp/${encodeURIComponent(tenantSlug)}/login`, request.url));
    }

    if (forwardedPath === "/login") {
      const response = token
        ? NextResponse.redirect(new URL(`/school-erp/${encodeURIComponent(tenantSlug)}`, request.url))
        : NextResponse.next();

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

  if (!token && pathname !== "/login" && !pathname.startsWith("/api/auth")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
