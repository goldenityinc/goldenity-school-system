"use server";

import { getCurrentSession } from "../../lib/utils/jwt";
import prisma from "../../lib/prisma";

type ProxyPayload = Record<string, unknown>;

type ProxyResult<T> =
  | {
      success: true;
      data: T;
      message?: string;
    }
  | {
      success: false;
      data: T;
      error: string;
      message?: string;
      status?: number;
      errors?: Record<string, string>;
    };

function toStringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function toNumberValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function safeParseJsonObject(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function requireTenantContext<T>(fallbackData: T): Promise<
  | { ok: true; tenantId: string; userId: string }
  | { ok: false; result: ProxyResult<T> }
> {
  if (!process.env.DATABASE_URL) {
    return {
      ok: false,
      result: {
        success: false,
        data: fallbackData,
        error: "Konfigurasi database belum siap (DATABASE_URL belum di-set)."
      }
    };
  }

  const session = await getCurrentSession();
  if (!session?.tenantId || !session?.userId) {
    return {
      ok: false,
      result: {
        success: false,
        data: fallbackData,
        error: "Sesi tenant tidak valid. Silakan login ulang."
      }
    };
  }

  return { ok: true, tenantId: session.tenantId, userId: session.userId };
}

export async function getEmployees(): Promise<ProxyResult<unknown[]>> {
  const ctx = await requireTenantContext<unknown[]>([]);
  if (!ctx.ok) return ctx.result;

  try {
    const rows = await prisma.lecturer.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: [{ fullName: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        staffId: true,
        fullName: true,
        email: true,
        phone: true,
        gender: true,
        role: true,
        status: true,
        nuptk: true
      }
    });

    return {
      success: true,
      data: rows.map((row) => ({
        id: row.id,
        name: row.fullName,
        fullName: row.fullName,
        nik: row.staffId,
        nuptk: row.nuptk ?? null,
        role: row.role ?? "GURU",
        status: row.status ?? "ACTIVE",
        email: row.email,
        phone: row.phone ?? null,
        gender: row.gender ?? null
      }))
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : "Gagal memuat data karyawan."
    };
  }
}

export async function createEmployee(payload: ProxyPayload): Promise<ProxyResult<null>> {
  const ctx = await requireTenantContext<null>(null);
  if (!ctx.ok) return ctx.result;

  const name = toStringValue(payload.name).trim();
  const nik = toStringValue(payload.nik).trim();
  const email = toStringValue(payload.email).trim();
  const nuptk = toStringValue(payload.nuptk).trim();
  const phone = toStringValue(payload.phone).trim();
  const gender = toStringValue(payload.gender).trim();
  const role = toStringValue(payload.role).trim();
  const status = toStringValue(payload.status).trim();

  const errors: Record<string, string> = {};
  if (!name) errors.name = "Nama wajib diisi";
  if (!nik) errors.nik = "NIK wajib diisi";
  if (!email) errors.email = "Email wajib diisi";
  if (!role) errors.role = "Role wajib dipilih";
  if (!status) errors.status = "Status wajib dipilih";

  if (Object.keys(errors).length > 0) {
    return { success: false, data: null, error: "Validasi gagal", errors };
  }

  try {
    await prisma.lecturer.create({
      data: {
        tenantId: ctx.tenantId,
        staffId: nik,
        fullName: name,
        email,
        nuptk: nuptk || null,
        phone: phone || null,
        gender: gender || null,
        role,
        status
      }
    });

    return { success: true, data: null };
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Gagal menyimpan karyawan.";
    return { success: false, data: null, error: message };
  }
}

export async function updateEmployee(payload: ProxyPayload): Promise<ProxyResult<null>> {
  const ctx = await requireTenantContext<null>(null);
  if (!ctx.ok) return ctx.result;

  const id = toStringValue(payload.id).trim();
  const name = toStringValue(payload.name).trim();
  const nik = toStringValue(payload.nik).trim();
  const email = toStringValue(payload.email).trim();
  const nuptk = toStringValue(payload.nuptk).trim();
  const phone = toStringValue(payload.phone).trim();
  const gender = toStringValue(payload.gender).trim();
  const role = toStringValue(payload.role).trim();
  const status = toStringValue(payload.status).trim();

  const errors: Record<string, string> = {};
  if (!id) errors.id = "ID karyawan tidak valid";
  if (!name) errors.name = "Nama wajib diisi";
  if (!nik) errors.nik = "NIK wajib diisi";
  if (!email) errors.email = "Email wajib diisi";
  if (!role) errors.role = "Role wajib dipilih";
  if (!status) errors.status = "Status wajib dipilih";

  if (Object.keys(errors).length > 0) {
    return { success: false, data: null, error: "Validasi gagal", errors };
  }

  try {
    const existing = await prisma.lecturer.findFirst({
      where: { id, tenantId: ctx.tenantId },
      select: { id: true }
    });

    if (!existing) {
      return { success: false, data: null, error: "Karyawan tidak ditemukan." };
    }

    await prisma.lecturer.update({
      where: { id },
      data: {
        staffId: nik,
        fullName: name,
        email,
        nuptk: nuptk || null,
        phone: phone || null,
        gender: gender || null,
        role,
        status
      }
    });

    return { success: true, data: null };
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui karyawan.";
    return { success: false, data: null, error: message };
  }
}

export async function getClassrooms(): Promise<ProxyResult<unknown[]>> {
  const ctx = await requireTenantContext<unknown[]>([]);
  if (!ctx.ok) return ctx.result;

  try {
    const rows = await prisma.classroom.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: [{ createdAt: "desc" }],
      include: {
        homeroomTeacher: {
          select: {
            id: true,
            fullName: true
          }
        },
        students: {
          select: { id: true }
        }
      }
    });

    return {
      success: true,
      data: rows.map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        academicYear: row.academicYear,
        capacity: row.capacity ?? null,
        homeroomTeacherId: row.homeroomTeacher?.id ?? null,
        homeroomTeacherName: row.homeroomTeacher?.fullName ?? null,
        homeroomTeacher: row.homeroomTeacher
          ? { name: row.homeroomTeacher.fullName, fullName: row.homeroomTeacher.fullName }
          : null,
        maxStudents: null,
        studentCount: row.students.length
      }))
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : "Gagal memuat data kelas."
    };
  }
}

export async function createClassroom(payload: ProxyPayload): Promise<ProxyResult<null>> {
  const ctx = await requireTenantContext<null>(null);
  if (!ctx.ok) return ctx.result;

  const code = toStringValue(payload.code).trim();
  const name = toStringValue(payload.name).trim();
  const academicYear = toStringValue(payload.academicYear).trim();
  const homeroomTeacherId = toStringValue(payload.homeroomTeacherId).trim();
  const capacity = toNumberValue(payload.capacity);

  const errors: Record<string, string> = {};
  if (!code) errors.code = "Kode kelas wajib diisi";
  if (!name) errors.name = "Nama kelas wajib diisi";
  if (!academicYear) errors.academicYear = "Tahun ajaran wajib diisi";
  if (capacity === null || capacity <= 0) errors.capacity = "Kapasitas harus lebih dari 0";

  if (Object.keys(errors).length > 0) {
    return { success: false, data: null, error: "Validasi gagal", errors };
  }

  try {
    await prisma.classroom.create({
      data: {
        tenantId: ctx.tenantId,
        code,
        name,
        capacity,
        academicYear,
        semester: 1,
        ...(homeroomTeacherId ? { homeroomTeacherId } : {})
      }
    });

    return { success: true, data: null };
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Gagal menyimpan kelas.";
    return { success: false, data: null, error: message };
  }
}

export async function updateClassroom(payload: ProxyPayload): Promise<ProxyResult<null>> {
  const ctx = await requireTenantContext<null>(null);
  if (!ctx.ok) return ctx.result;

  const id = toStringValue(payload.id).trim();
  const code = toStringValue(payload.code).trim();
  const name = toStringValue(payload.name).trim();
  const academicYear = toStringValue(payload.academicYear).trim();
  const homeroomTeacherId = toStringValue(payload.homeroomTeacherId).trim();
  const capacity = toNumberValue(payload.capacity);

  const errors: Record<string, string> = {};
  if (!id) errors.id = "ID kelas tidak valid";
  if (!code) errors.code = "Kode kelas wajib diisi";
  if (!name) errors.name = "Nama kelas wajib diisi";
  if (!academicYear) errors.academicYear = "Tahun ajaran wajib diisi";
  if (capacity === null || capacity <= 0) errors.capacity = "Kapasitas harus lebih dari 0";

  if (Object.keys(errors).length > 0) {
    return { success: false, data: null, error: "Validasi gagal", errors };
  }

  try {
    const existing = await prisma.classroom.findFirst({
      where: { id, tenantId: ctx.tenantId },
      select: { id: true }
    });

    if (!existing) {
      return { success: false, data: null, error: "Kelas tidak ditemukan." };
    }

    await prisma.classroom.update({
      where: { id },
      data: {
        code,
        name,
        capacity,
        academicYear,
        homeroomTeacherId: homeroomTeacherId || null
      }
    });

    return { success: true, data: null };
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui kelas.";
    return { success: false, data: null, error: message };
  }
}

export async function getSubjects(): Promise<ProxyResult<unknown[]>> {
  const ctx = await requireTenantContext<unknown[]>([]);
  if (!ctx.ok) return ctx.result;

  try {
    const rows = await prisma.course.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: [{ code: "asc" }],
      select: { id: true, code: true, name: true, description: true, creditHours: true }
    });

    return {
      success: true,
      data: rows.map((row) => {
        const meta = row.description ? safeParseJsonObject(row.description) : null;
        return {
          id: row.id,
          code: row.code,
          name: row.name,
          category: typeof meta?.category === "string" ? meta.category : null,
          kkm:
            typeof meta?.kkm === "number"
              ? meta.kkm
              : typeof meta?.minimumPassingGrade === "number"
                ? meta.minimumPassingGrade
                : null,
          minimumPassingGrade:
            typeof meta?.minimumPassingGrade === "number"
              ? meta.minimumPassingGrade
              : typeof meta?.kkm === "number"
                ? meta.kkm
                : null,
          creditHours: row.creditHours
        };
      })
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : "Gagal memuat data mapel."
    };
  }
}

export async function createSubject(payload: ProxyPayload): Promise<ProxyResult<null>> {
  const ctx = await requireTenantContext<null>(null);
  if (!ctx.ok) return ctx.result;

  const code = toStringValue(payload.code).trim();
  const name = toStringValue(payload.name).trim();
  const category = toStringValue(payload.category).trim();
  const kkm = toNumberValue(payload.kkm);

  const errors: Record<string, string> = {};
  if (!code) errors.code = "Kode mapel wajib diisi";
  if (!name) errors.name = "Nama mapel wajib diisi";
  if (!category) errors.category = "Kategori wajib dipilih";
  if (kkm === null || kkm <= 0) errors.kkm = "KKM harus lebih dari 0";

  if (Object.keys(errors).length > 0) {
    return { success: false, data: null, error: "Validasi gagal", errors };
  }

  try {
    await prisma.course.create({
      data: {
        tenantId: ctx.tenantId,
        code,
        name,
        description: JSON.stringify({ category, kkm }),
        creditHours: 3
      }
    });

    return { success: true, data: null };
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Gagal menyimpan mapel.";
    return { success: false, data: null, error: message };
  }
}

export async function updateSubject(payload: ProxyPayload): Promise<ProxyResult<null>> {
  const ctx = await requireTenantContext<null>(null);
  if (!ctx.ok) return ctx.result;

  const id = toStringValue(payload.id).trim();
  const code = toStringValue(payload.code).trim();
  const name = toStringValue(payload.name).trim();
  const category = toStringValue(payload.category).trim();
  const kkm = toNumberValue(payload.kkm);

  const errors: Record<string, string> = {};
  if (!id) errors.id = "ID mapel tidak valid";
  if (!code) errors.code = "Kode mapel wajib diisi";
  if (!name) errors.name = "Nama mapel wajib diisi";
  if (!category) errors.category = "Kategori wajib dipilih";
  if (kkm === null || kkm <= 0) errors.kkm = "KKM harus lebih dari 0";

  if (Object.keys(errors).length > 0) {
    return { success: false, data: null, error: "Validasi gagal", errors };
  }

  try {
    const existing = await prisma.course.findFirst({
      where: { id, tenantId: ctx.tenantId },
      select: { id: true }
    });

    if (!existing) {
      return { success: false, data: null, error: "Mapel tidak ditemukan." };
    }

    await prisma.course.update({
      where: { id },
      data: {
        code,
        name,
        description: JSON.stringify({ category, kkm })
      }
    });

    return { success: true, data: null };
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui mapel.";
    return { success: false, data: null, error: message };
  }
}
