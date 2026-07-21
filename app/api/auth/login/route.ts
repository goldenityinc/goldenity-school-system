import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "../../../../lib/prisma";
import { AUTH_TOKEN_COOKIE_NAME, AdminCoreAuthError, loginViaAdminCore } from "../../../../lib/api/auth";
import { verifyLoginWithCentralCommand } from "../../../../lib/services/central-command";
import {
  AUTH_TENANT_LABEL_COOKIE_NAME,
  createGatewayToken,
  decodeJwtPayload
} from "../../../../lib/utils/jwt";

type LoginBody = {
  email?: string;
  password?: string;
  tenantSlug?: string;
};

async function syncLocalUserFromLogin(params: {
  email: string;
  password: string;
  tenantSlug?: string;
  session: ReturnType<typeof decodeJwtPayload>;
}) {
  const hashedPassword = await bcrypt.hash(params.password, 10);

  try {
    await prisma.user.upsert({
      where: {
        email: params.email
      },
      update: {
        name: params.session.name ?? params.email,
        password: hashedPassword,
        role: params.session.role,
        tenantId: params.session.tenantId,
        tenantSlug: params.tenantSlug?.trim() || null
      },
      create: {
        name: params.session.name ?? params.email,
        email: params.email,
        password: hashedPassword,
        role: params.session.role,
        tenantId: params.session.tenantId,
        tenantSlug: params.tenantSlug?.trim() || null
      }
    });
  } catch (error) {
    console.error("LOCAL_USER_SYNC_SKIPPED", error);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginBody;

    if (!body.tenantSlug || !body.email || !body.password) {
      return NextResponse.json({ message: "Tenant slug, username, dan password wajib diisi." }, { status: 400 });
    }

    const cookieStore = await cookies();
    const isSecure = process.env.NODE_ENV === "production";

    const loginIdentifier = body.email.trim();
    const tenantSlug = body.tenantSlug.trim();
    let localUser: Awaited<ReturnType<typeof prisma.user.findFirst>> | null = null;

    try {
      localUser = await prisma.user.findFirst({
        where: {
          AND: [
            {
              OR: [{ tenantSlug }, { tenantId: tenantSlug }]
            },
            {
              OR: [{ email: loginIdentifier }, { name: loginIdentifier }]
            }
          ]
        }
      });
    } catch (error) {
      console.error("LOCAL_USER_LOOKUP_SKIPPED", error);
    }

    if (localUser) {
      const isPasswordValid = await bcrypt.compare(body.password, localUser.password);

      if (isPasswordValid) {
        const tenantIdForToken = localUser.tenantId ?? localUser.tenantSlug ?? tenantSlug;

        const token = createGatewayToken({
          userId: localUser.id,
          tenantId: tenantIdForToken,
          role: localUser.role,
          allowedSolutions: ["SCHOOL_ERP"],
          email: localUser.email,
          name: localUser.name,
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8
        });

        cookieStore.set(AUTH_TOKEN_COOKIE_NAME, token, {
          httpOnly: true,
          sameSite: "lax",
          secure: isSecure,
          path: "/",
          maxAge: 60 * 60 * 8
        });

        cookieStore.set(AUTH_TENANT_LABEL_COOKIE_NAME, body.tenantSlug, {
          httpOnly: true,
          sameSite: "lax",
          secure: isSecure,
          path: "/",
          maxAge: 60 * 60 * 8
        });

        return NextResponse.json({
          success: true,
          user: {
            userId: localUser.id,
            tenantId: tenantIdForToken,
            role: localUser.role,
            allowedSolutions: ["SCHOOL_ERP"],
            name: localUser.name,
            email: localUser.email
          }
        });
      }
    }

    let session: ReturnType<typeof decodeJwtPayload> | null = null;
    let token: string | null = null;

    try {
      token = await loginViaAdminCore({
        email: body.email,
        password: body.password,
        tenantSlug: body.tenantSlug,
        solution: "SCHOOL_ERP"
      });

      session = decodeJwtPayload(token);

      if (!session.name) {
        token = createGatewayToken({
          userId: session.userId,
          tenantId: session.tenantId,
          role: session.role,
          allowedSolutions: session.allowedSolutions,
          email: session.email,
          name: body.email,
          tenantName: session.tenantName ?? body.tenantSlug,
          exp: session.exp
        });
        session = decodeJwtPayload(token);
      }

      if (session?.email && session?.tenantId) {
        await syncLocalUserFromLogin({
          email: session.email,
          password: body.password,
          tenantSlug: body.tenantSlug,
          session
        });
      }

      cookieStore.set(AUTH_TOKEN_COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: isSecure,
        path: "/",
        maxAge: typeof session?.exp === "number" ? Math.max(session.exp - Math.floor(Date.now() / 1000), 0) : 60 * 60 * 8
      });

      cookieStore.set(AUTH_TENANT_LABEL_COOKIE_NAME, session?.tenantName ?? body.tenantSlug, {
        httpOnly: true,
        sameSite: "lax",
        secure: isSecure,
        path: "/",
        maxAge: typeof session?.exp === "number" ? Math.max(session.exp - Math.floor(Date.now() / 1000), 0) : 60 * 60 * 8
      });
    } catch (loginError) {
      try {
        const verifiedUser = await verifyLoginWithCentralCommand({
          email: loginIdentifier,
          password: body.password,
          requestedSolution: "SCHOOL_ERP",
          tenantSlug
        });

        const nowInSeconds = Math.floor(Date.now() / 1000);
        token = createGatewayToken({
          userId: verifiedUser.id,
          tenantId: verifiedUser.tenantId ?? tenantSlug,
          role: verifiedUser.role,
          allowedSolutions: verifiedUser.activeModules.length > 0 ? verifiedUser.activeModules : ["SCHOOL_ERP"],
          email: verifiedUser.email,
          name: verifiedUser.name,
          tenantName: tenantSlug,
          exp: nowInSeconds + 60 * 60 * 8
        });
        session = decodeJwtPayload(token);

        if (session?.email && session?.tenantId) {
          await syncLocalUserFromLogin({
            email: session.email,
            password: body.password,
            tenantSlug,
            session
          });
        }

        cookieStore.set(AUTH_TOKEN_COOKIE_NAME, token, {
          httpOnly: true,
          sameSite: "lax",
          secure: isSecure,
          path: "/",
          maxAge: 60 * 60 * 8
        });

        cookieStore.set(AUTH_TENANT_LABEL_COOKIE_NAME, tenantSlug, {
          httpOnly: true,
          sameSite: "lax",
          secure: isSecure,
          path: "/",
          maxAge: 60 * 60 * 8
        });
      } catch {
        if (loginError instanceof AdminCoreAuthError) {
          throw loginError;
        }

        throw loginError;
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        userId: session?.userId ?? null,
        tenantId: session?.tenantId ?? null,
        role: session?.role ?? null,
        allowedSolutions: session?.allowedSolutions ?? [],
        name: session?.name ?? body.email ?? "Pengguna"
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
