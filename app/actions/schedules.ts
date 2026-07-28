"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { PrismaClientInitializationError, PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import prisma from "../../lib/prisma";
import { CourseOfferingSchema, type CreateCourseOfferingInput } from "../../lib/academics-schema";
import { getCurrentSession } from "../../lib/utils/jwt";

const ACTIVE_TENANT_SLUG_COOKIE_NAME = "goldenity_school_active_tenant_slug";

type MutationResult =
  | { success: true; id: string }
  | {
      success: false;
      errors: Partial<Record<keyof CreateCourseOfferingInput | "general", string>>;
      message?: string;
    };

export type ScheduleListRow = {
  id: string;
  term: string;
  academicYear: string;
  section: string | null;
  dayOfWeek: string | null;
  startTime: string | null;
  endTime: string | null;
  room: string | null;
  createdAt: string;
  course: {
    id: string;
    code: string | null;
    name: string;
  } | null;
  lecturer: {
    id: string;
    staffId: string | null;
    fullName: string | null;
  } | null;
  classroom: {
    id: string;
    code: string | null;
    name: string;
  } | null;
};

async function resolveTenantContext(tenantSlugOrId: string) {
  const normalizedTenantScope = tenantSlugOrId.trim();

  if (!normalizedTenantScope) {
    return null;
  }

  const [cookieStore, session] = await Promise.all([
    Promise.resolve()
      .then(() => cookies())
      .catch(() => ({ get: () => undefined })),
    getCurrentSession().catch(() => null)
  ]);
  const activeTenantSlug = decodeURIComponent(cookieStore.get(ACTIVE_TENANT_SLUG_COOKIE_NAME)?.value ?? "").trim();

  if (
    session?.tenantId &&
    (normalizedTenantScope === session.tenantId ||
      (activeTenantSlug && normalizedTenantScope === activeTenantSlug) ||
      (session.tenantName && normalizedTenantScope === session.tenantName))
  ) {
    return {
      tenantId: session.tenantId.trim(),
      tenantSlug: activeTenantSlug || normalizedTenantScope
    };
  }

  const tenantRecord = await prisma.user.findFirst({
    where: {
      OR: [{ tenantSlug: normalizedTenantScope }, { tenantId: normalizedTenantScope }]
    },
    select: {
      tenantId: true,
      tenantSlug: true
    }
  });

  return {
    tenantId: tenantRecord?.tenantId?.trim() || normalizedTenantScope,
    tenantSlug: tenantRecord?.tenantSlug?.trim() || activeTenantSlug || normalizedTenantScope
  };
}

function revalidateSchedules(tenantSlug: string | undefined) {
  revalidatePath("/academics/schedules");
  revalidatePath("/academics");
  if (tenantSlug) {
    revalidatePath(`/school-erp/${encodeURIComponent(tenantSlug)}/academics/schedules`, "page");
    revalidatePath(`/school-erp/${encodeURIComponent(tenantSlug)}/academics`, "page");
  }
}

export async function getSchedules(tenantSlug: string, query?: string): Promise<ScheduleListRow[]> {
  const trimmedQuery = query?.trim();

  try {
    console.log("Fetching schedules for slug:", tenantSlug);
    const tenantContext = await resolveTenantContext(tenantSlug);

    if (!tenantContext?.tenantId) {
      return [];
    }

    const offerings = await prisma.courseOffering.findMany({
      where: {
        tenantId: tenantContext.tenantId,
        ...(trimmedQuery
          ? {
              OR: [
                {
                  course: {
                    name: { contains: trimmedQuery, mode: "insensitive" }
                  }
                },
                {
                  course: {
                    code: { contains: trimmedQuery, mode: "insensitive" }
                  }
                },
                {
                  lecturer: {
                    fullName: { contains: trimmedQuery, mode: "insensitive" }
                  }
                },
                {
                  classroom: {
                    name: { contains: trimmedQuery, mode: "insensitive" }
                  }
                },
                {
                  classroom: {
                    code: { contains: trimmedQuery, mode: "insensitive" }
                  }
                },
                { dayOfWeek: { contains: trimmedQuery, mode: "insensitive" } },
                { room: { contains: trimmedQuery, mode: "insensitive" } }
              ]
            }
          : {})
      },
      orderBy: [
        { academicYear: "desc" },
        { term: "desc" },
        { section: "asc" },
        { dayOfWeek: "asc" },
        { startTime: "asc" }
      ],
      select: {
        id: true,
        term: true,
        academicYear: true,
        section: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        room: true,
        createdAt: true,
        course: {
          select: {
            id: true,
            code: true,
            name: true
          }
        },
        lecturer: {
          select: {
            id: true,
            staffId: true,
            fullName: true
          }
        },
        classroom: {
          select: {
            id: true,
            code: true,
            name: true
          }
        }
      }
    });

    console.log("Found schedules count:", offerings.length);

    return offerings.map((row) => ({
      id: row.id,
      term: row.term || "",
      academicYear: row.academicYear || "",
      section: row.section ?? null,
      dayOfWeek: row.dayOfWeek ?? null,
      startTime: row.startTime ?? null,
      endTime: row.endTime ?? null,
      room: row.room ?? null,
      createdAt: row.createdAt.toISOString(),
      course: row.course
        ? {
            id: row.course.id,
            code: row.course.code ?? null,
            name: row.course.name
          }
        : null,
      lecturer: row.lecturer
        ? {
            id: row.lecturer.id,
            staffId: row.lecturer.staffId ?? null,
            fullName: row.lecturer.fullName ?? null
          }
        : null,
      classroom: row.classroom
        ? {
            id: row.classroom.id,
            code: row.classroom.code ?? null,
            name: row.classroom.name
          }
        : null
    }));
  } catch (error) {
    console.error("PRISMA SCHEDULE FETCH ERROR:", error);
    return [];
  }
}

export async function getOptionsForScheduleForm(tenantSlug: string) {
  try {
    const tenantContext = await resolveTenantContext(tenantSlug);
    if (!tenantContext?.tenantId) {
      return { courses: [], lecturers: [], classrooms: [] };
    }

    const [courses, lecturers, classrooms] = await Promise.all([
      prisma.course.findMany({
        where: { tenantId: tenantContext.tenantId },
        orderBy: [{ code: "asc" }, { name: "asc" }],
        select: { id: true, code: true, name: true }
      }),
      prisma.lecturer.findMany({
        where: { tenantId: tenantContext.tenantId, status: { not: "NONAKTIF" } },
        orderBy: [{ fullName: "asc" }],
        select: { id: true, staffId: true, fullName: true }
      }),
      prisma.classroom.findMany({
        where: { tenantId: tenantContext.tenantId },
        orderBy: [{ name: "asc" }],
        select: { id: true, code: true, name: true, academicYear: true, semester: true }
      })
    ]);

    return { courses, lecturers, classrooms };
  } catch (error) {
    console.error("[schedules.getOptionsForScheduleForm]", error);
    return { courses: [], lecturers: [], classrooms: [] };
  }
}

export async function createSchedule(tenantSlugOrId: string, data: CreateCourseOfferingInput): Promise<MutationResult> {
  if (!process.env.DATABASE_URL) {
    return {
      success: false,
      errors: {},
      message: "Konfigurasi database belum siap (DATABASE_URL belum di-set)."
    };
  }

  const tenantContext = await resolveTenantContext(tenantSlugOrId);

  if (!tenantContext?.tenantId) {
    return {
      success: false,
      errors: {},
      message: "Sesi tenant tidak valid. Silakan login ulang."
    };
  }

  const parsed = CourseOfferingSchema.safeParse(data);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const firstError = parsed.error.issues[0]?.message;

    return {
      success: false,
      errors: {
        courseId: fieldErrors.courseId?.[0],
        lecturerId: fieldErrors.lecturerId?.[0],
        classroomId: fieldErrors.classroomId?.[0],
        dayOfWeek: fieldErrors.dayOfWeek?.[0],
        startTime: fieldErrors.startTime?.[0],
        endTime: fieldErrors.endTime?.[0],
        room: fieldErrors.room?.[0]
      },
      message: firstError ?? "Data jadwal tidak valid. Periksa input dan coba lagi."
    };
  }

  const cleaned = parsed.data;
  const academicYear = "2026/2027";
  const term = `${academicYear}-Ganjil`;
  const section = "A";

  try {
    const created = await prisma.courseOffering.create({
      data: {
        tenantId: tenantContext.tenantId.trim(),
        courseId: cleaned.courseId.trim(),
        lecturerId: cleaned.lecturerId?.trim() || null,
        classroomId: cleaned.classroomId?.trim() || null,
        dayOfWeek: cleaned.dayOfWeek,
        startTime: cleaned.startTime,
        endTime: cleaned.endTime,
        room: cleaned.room?.trim() || null,
        term,
        academicYear,
        section
      }
    });

    revalidateSchedules(tenantContext.tenantSlug);
    return { success: true, id: created.id };
  } catch (error) {
    if (error instanceof PrismaClientInitializationError) {
      return {
        success: false,
        errors: {},
        message: "Koneksi database gagal. Periksa DATABASE_URL dan status server database."
      };
    }

    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return {
          success: false,
          errors: { general: "Jadwal dengan kombinasi mata pelajaran, term, tahun ajaran, dan kelas sudah ada." },
          message: "Jadwal pelajaran duplikat (unique constraint ditolak)."
        };
      }

      if (error.code === "P2003") {
        return {
          success: false,
          errors: { general: "Mata pelajaran, guru, atau kelas yang dipilih tidak ditemukan." },
          message: "Referensi foreign key tidak valid (kode P2003)."
        };
      }

      return {
        success: false,
        errors: {},
        message: `Skema database belum sinkron atau ada constraint yang ditolak (kode: ${error.code}).`
      };
    }

    return {
      success: false,
      errors: {},
      message: "Terjadi kesalahan saat menyimpan jadwal pelajaran. Coba lagi."
    };
  }
}

export async function updateSchedule(
  tenantSlugOrId: string,
  scheduleId: string,
  data: CreateCourseOfferingInput
): Promise<MutationResult> {
  if (!process.env.DATABASE_URL) {
    return {
      success: false,
      errors: {},
      message: "Konfigurasi database belum siap (DATABASE_URL belum di-set)."
    };
  }

  const tenantContext = await resolveTenantContext(tenantSlugOrId);

  if (!tenantContext?.tenantId) {
    return {
      success: false,
      errors: {},
      message: "Sesi tenant tidak valid. Silakan login ulang."
    };
  }

  if (!scheduleId.trim()) {
    return {
      success: false,
      errors: {},
      message: "ID jadwal tidak valid."
    };
  }

  const parsed = CourseOfferingSchema.safeParse(data);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const firstError = parsed.error.issues[0]?.message;

    return {
      success: false,
      errors: {
        courseId: fieldErrors.courseId?.[0],
        lecturerId: fieldErrors.lecturerId?.[0],
        classroomId: fieldErrors.classroomId?.[0],
        dayOfWeek: fieldErrors.dayOfWeek?.[0],
        startTime: fieldErrors.startTime?.[0],
        endTime: fieldErrors.endTime?.[0],
        room: fieldErrors.room?.[0]
      },
      message: firstError ?? "Data jadwal tidak valid. Periksa input dan coba lagi."
    };
  }

  const cleaned = parsed.data;

  try {
    const existing = await prisma.courseOffering.findFirst({
      where: { id: scheduleId.trim(), tenantId: tenantContext.tenantId.trim() },
      select: { id: true }
    });

    if (!existing) {
      return {
        success: false,
        errors: {},
        message: "Jadwal pelajaran tidak ditemukan untuk tenant aktif."
      };
    }

    const updated = await prisma.courseOffering.update({
      where: { id: scheduleId.trim() },
      data: {
        courseId: cleaned.courseId.trim(),
        lecturerId: cleaned.lecturerId?.trim() || null,
        classroomId: cleaned.classroomId?.trim() || null,
        dayOfWeek: cleaned.dayOfWeek,
        startTime: cleaned.startTime,
        endTime: cleaned.endTime,
        room: cleaned.room?.trim() || null
      }
    });

    revalidateSchedules(tenantContext.tenantSlug);
    return { success: true, id: updated.id };
  } catch (error) {
    if (error instanceof PrismaClientInitializationError) {
      return {
        success: false,
        errors: {},
        message: "Koneksi database gagal. Periksa DATABASE_URL dan status server database."
      };
    }

    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return {
          success: false,
          errors: { general: "Jadwal dengan kombinasi mata pelajaran, term, tahun ajaran, dan kelas sudah ada." },
          message: "Jadwal pelajaran duplikat (unique constraint ditolak)."
        };
      }

      if (error.code === "P2003") {
        return {
          success: false,
          errors: { general: "Mata pelajaran, guru, atau kelas yang dipilih tidak ditemukan." },
          message: "Referensi foreign key tidak valid (kode P2003)."
        };
      }

      return {
        success: false,
        errors: {},
        message: `Skema database belum sinkron atau ada constraint yang ditolak (kode: ${error.code}).`
      };
    }

    return {
      success: false,
      errors: {},
      message: "Terjadi kesalahan saat memperbarui jadwal pelajaran. Coba lagi."
    };
  }
}

export async function deleteSchedule(id: string, tenantSlugOrId: string) {
  const tenantContext = await resolveTenantContext(tenantSlugOrId);
  const tenantId = tenantContext?.tenantId;

  if (!tenantId) {
    throw new Error("Sesi tenant tidak valid.");
  }

  const schedule = await prisma.courseOffering.findFirst({
    where: { id, tenantId },
    select: { id: true }
  });

  if (!schedule) {
    throw new Error("Jadwal tidak ditemukan untuk tenant aktif.");
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.grade.deleteMany({
        where: { tenantId, courseOfferingId: id }
      });
      await tx.enrollment.deleteMany({
        where: { tenantId, courseOfferingId: id }
      });
      await tx.courseOffering.delete({
        where: { id }
      });
    });
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === "P2003") {
      await prisma.courseOffering.delete({ where: { id } });
    } else {
      throw error;
    }
  }

  revalidateSchedules(tenantContext?.tenantSlug);
}
