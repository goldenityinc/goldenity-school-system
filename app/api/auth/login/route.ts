import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_TOKEN_COOKIE_NAME, loginViaAdminCore } from "../../../../lib/api/auth";
import { decodeJwtPayload } from "../../../../lib/utils/jwt";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginBody;

    if (!body.email || !body.password) {
      return NextResponse.json({ message: "Email dan password wajib diisi." }, { status: 400 });
    }

    const token = await loginViaAdminCore({
      email: body.email,
      password: body.password,
      solution: "SCHOOL_ERP"
    });

    const session = decodeJwtPayload(token);
    const cookieStore = await cookies();
    const isSecure = process.env.NODE_ENV === "production";

    cookieStore.set(AUTH_TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isSecure,
      path: "/",
      maxAge: typeof session.exp === "number" ? Math.max(session.exp - Math.floor(Date.now() / 1000), 0) : 60 * 60 * 8
    });

    return NextResponse.json({
      success: true,
      user: {
        userId: session.userId,
        tenantId: session.tenantId,
        role: session.role,
        allowedSolutions: session.allowedSolutions,
        name: session.name ?? "User"
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login gagal.";
    return NextResponse.json({ message }, { status: 401 });
  }
}
