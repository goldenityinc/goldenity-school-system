import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_TOKEN_COOKIE_NAME } from "../../../../lib/api/auth";
import { AUTH_TENANT_LABEL_COOKIE_NAME } from "../../../../lib/utils/jwt";

export async function POST() {
  const cookieStore = await cookies();

  cookieStore.set(AUTH_TOKEN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });

  cookieStore.set(AUTH_TENANT_LABEL_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });

  return NextResponse.json({ success: true });
}
