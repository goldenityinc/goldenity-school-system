import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { getCurrentSession } from "../../../../lib/utils/jwt";

type SettingsPayload = {
  name?: string;
  profilePhotoUrl?: string | null;
  currentPassword?: string;
  newPassword?: string;
  tenantLogoUrl?: string | null;
};

async function getLocalUser(sessionUserId: string, email?: string) {
  return prisma.user.findFirst({
    where: {
      OR: [{ id: sessionUserId }, ...(email ? [{ email }] : [])]
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      tenantId: true,
      tenantSlug: true,
      profilePhotoUrl: true,
      password: true
    }
  });
}

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ message: "Sesi tidak ditemukan." }, { status: 401 });
  }

  const user = await getLocalUser(session.userId, session.email);
  const branding = session.tenantId
    ? await prisma.tenantBranding.findUnique({
        where: {
          tenantId: session.tenantId
        }
      })
    : null;

  return NextResponse.json({
    profile: {
      userId: session.userId,
      name: user?.name ?? session.name ?? "Pengguna",
      email: user?.email ?? session.email ?? null,
      role: user?.role ?? session.role,
      tenantId: user?.tenantId ?? session.tenantId,
      tenantSlug: user?.tenantSlug ?? null,
      profilePhotoUrl: user?.profilePhotoUrl ?? null,
      tenantLogoUrl: branding?.logoUrl ?? null
    }
  });
}

export async function PUT(request: Request) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ message: "Sesi tidak ditemukan." }, { status: 401 });
  }

  const body = (await request.json()) as SettingsPayload;
  const user = await getLocalUser(session.userId, session.email);

  if (!user) {
    return NextResponse.json({ message: "Akun lokal tidak ditemukan." }, { status: 404 });
  }

  const updates: {
    name?: string;
    profilePhotoUrl?: string | null;
    password?: string;
  } = {};

  if (body.tenantLogoUrl !== undefined && session.role !== "TENANT_ADMIN") {
    return NextResponse.json({ message: "Hanya admin tenant yang dapat mengubah logo." }, { status: 403 });
  }

  if (typeof body.name === "string" && body.name.trim().length > 0) {
    updates.name = body.name.trim();
  }

  if (body.profilePhotoUrl !== undefined) {
    updates.profilePhotoUrl = body.profilePhotoUrl?.trim() || null;
  }

  if (body.newPassword) {
    if (!body.currentPassword) {
      return NextResponse.json({ message: "Kata sandi saat ini wajib diisi." }, { status: 400 });
    }

    const isPasswordValid = await bcrypt.compare(body.currentPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ message: "Kata sandi saat ini tidak sesuai." }, { status: 400 });
    }

    if (body.newPassword.length < 8) {
      return NextResponse.json({ message: "Kata sandi baru minimal 8 karakter." }, { status: 400 });
    }

    updates.password = await bcrypt.hash(body.newPassword, 10);
  }

  await prisma.user.update({
    where: {
      id: user.id
    },
    data: updates
  });

  if (body.tenantLogoUrl !== undefined) {
    await prisma.tenantBranding.upsert({
      where: {
        tenantId: session.tenantId
      },
      update: {
        logoUrl: body.tenantLogoUrl?.trim() || null
      },
      create: {
        tenantId: session.tenantId,
        logoUrl: body.tenantLogoUrl?.trim() || null
      }
    });
  }

  return NextResponse.json({ success: true });
}