import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_TOKEN_COOKIE_NAME, AdminCoreAuthError, loginViaAdminCore } from "../../../../lib/api/auth";
import { decodeJwtPayload } from "../../../../lib/utils/jwt";

type LoginBody = {
  email?: string;
  password?: string;
  tenantSlug?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginBody;

    if (!body.tenantSlug || !body.email || !body.password) {
      return NextResponse.json({ message: "Tenant slug, username, dan password wajib diisi." }, { status: 400 });
    }

    const token = await loginViaAdminCore({
      email: body.email,
      password: body.password,
      tenantSlug: body.tenantSlug,
      solution: "SCHOOL_ERP"
    });

    const cookieStore = await cookies();
    const isSecure = process.env.NODE_ENV === "production";
    let session: ReturnType<typeof decodeJwtPayload> | null = null;

    try {
      session = decodeJwtPayload(token);
    } catch (decodeError) {
      console.error("JWT DECODE FAILED AFTER LOGIN:", decodeError);
    }

    cookieStore.set(AUTH_TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isSecure,
      path: "/",
      maxAge: typeof session?.exp === "number" ? Math.max(session.exp - Math.floor(Date.now() / 1000), 0) : 60 * 60 * 8
    });

    return NextResponse.json({
      success: true,
      user: {
        userId: session?.userId ?? null,
        tenantId: session?.tenantId ?? null,
        role: session?.role ?? null,
        allowedSolutions: session?.allowedSolutions ?? [],
        name: session?.name ?? "User"
      }
    });
  } catch (error) {
    if (error instanceof AdminCoreAuthError) {
      return NextResponse.json(
        {
          message: error.message,
          details: error.details,
          source: "admin-core"
        },
        { status: error.status }
      );
    }

    const message = error instanceof Error ? error.message : "Login gagal.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
