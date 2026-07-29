"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { PrismaClientInitializationError, PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import prisma from "../../lib/prisma";
import { getCurrentSession } from "../../lib/utils/jwt";

const ACTIVE_TENANT_SLUG_COOKIE_NAME = "goldenity_school_active_tenant_slug";

const GradeSchema = z.object({
  studentId: z.string().min(1, "Murid wajib dipilih"),
  courseId: z.string().min(1, "Mata pelajaran wajib dipilih"),
  courseOfferingId: z.string().optional(),
  type: z.string().min(1, "Tipe penilaian wajib diisi"),
  score: z.coerce.number().min(0, "Nilai tidak boleh kurang dari 0").max(100, "Nilai tidak boleh lebih dari 100"),
  notes: z.string().max(1000, "Catatan maksimal 1000 karakter").optional()
});

export type CreateGradeInput = z.infer<typeof GradeSchema>;

type MutationResult =
  | { success: true; id: string }
  | {
      success: false;
      errors: Partial<Record<keyof CreateGradeInput | "general", string>>;
      message?: string;
    };

export type GradeListRow = {
  id: string;
  type: string;
  score: number;
  notes: string | null;
  createdAt: string;
  student: {
    id: string;
    nis: string | null;
    name: string | null;
  } | null;
  course: {
    id: string;
    code: string | null;
    name: string;
  } | null;
  schedule: {
    id: string;
    term: string;
    academicYear: string;
    dayOfWeek: string | null;
    startTime: string | null;
    endTime: string | null;
    lecturerName: string | null;
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

function revalidateGrades(tenantSlug: string | undefined) {
  revalidatePath("/academics/grades");
  revalidatePath("/academics");
  revalidatePath("/students");
  if (tenantSlug) {
    revalidatePath(`/school-erp/${encodeURIComponent(tenantSlug)}/academics/grades`, "page");
    revalidatePath(`/school-erp/${encodeURIComponent(tenantSlug)}/academics`, "page");
    revalidatePath(`/school-erp/${encodeURIComponent(tenantSlug)}/students`, "page");
  }
}

export async function getGrades(tenantSlug: string, query?: string): Promise<GradeListRow[]> {
  const trimmedQuery = query?.trim();

  try {
    console.log("Fetching grades for slug:", tenantSlug);
    const tenantContext = await resolveTenantContext(tenantSlug);

    if (!tenantContext?.tenantId) {
      return [];
    }

    const grades = await prisma.grade.findMany({
      where: {
        tenantId: tenantContext.tenantId,
        ...(trimmedQuery
          ? {
              OR: [
                {
                  student: {
                    fullName: { contains: trimmedQuery, mode: "insensitive" }
                  }
                },
                {
                  student: {
                    studentNumber: { contains: trimmedQuery, mode: "insensitive" }
                  }
                },
                {
                  courseOffering: {
                    course: {
                      name: { contains: trimmedQuery, mode: "insensitive" }
                    }
                  }
                },
                {
                  courseOffering: {
                    course: {
                      code: { contains: trimmedQuery, mode: "insensitive" }
                    }
                  }
                },
                { type: { contains: trimmedQuery, mode: "insensitive" } },
                { notes: { contains: trimmedQuery, mode: "insensitive" } }
              ]
            }
          : {})
      },
      orderBy: [{ createdAt: "desc" }],
      take: 300,
      select: {
        id: true,
        type: true,
        score: true,
        notes: true,
        createdAt: true,
        student: {
          select: {
            id: true,
            studentNumber: true,
            fullName: true
          }
        },
        courseOffering: {
          select: {
            id: true,
            term: true,
            academicYear: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
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
                fullName: true
              }
            }
          }
        }
      }
    });

    console.log("Found grades count:", grades.length);

    return grades.map((g) => ({
      id: g.id,
      type: g.type || "",
      score: g.score,
      notes: g.notes ?? null,
      createdAt: g.createdAt.toISOString(),
      student: g.student
        ? {
            id: g.student.id,
            nis: g.student.studentNumber ?? null,
            name: g.student.fullName ?? null
          }
        : null,
      course: g.courseOffering?.course
        ? {
            id: g.courseOffering.course.id,
            code: g.courseOffering.course.code ?? null,
            name: g.courseOffering.course.name
          }
        : null,
      schedule: g.courseOffering
        ? {
            id: g.courseOffering.id,
            term: g.courseOffering.term || "",
            academicYear: g.courseOffering.academicYear || "",
            dayOfWeek: g.courseOffering.dayOfWeek ?? null,
            startTime: g.courseOffering.startTime ?? null,
            endTime: g.courseOffering.endTime ?? null,
            lecturerName: g.courseOffering.lecturer?.fullName ?? null
          }
        : null
    }));
  } catch (error) {
    console.error("PRISMA NILAI FETCH ERROR:", error);
    return [];
  }
}

export async function getOptionsForGradeForm(tenantSlug: string) {
  try {
    const tenantContext = await resolveTenantContext(tenantSlug);
    if (!tenantContext?.tenantId) {
      return { students: [], courses: [], schedules: [] };
    }

    const [students, schedules] = await Promise.all([
      prisma.student.findMany({
        where: { tenantId: tenantContext.tenantId, isActive: true },
        orderBy: [{ fullName: "asc" }],
        select: {
          id: true,
          studentNumber: true,
          fullName: true
        }
      }),
      prisma.courseOffering.findMany({
        where: { tenantId: tenantContext.tenantId },
        orderBy: [{ academicYear: "desc" }, { term: "desc" }, { dayOfWeek: "asc" }],
        select: {
          id: true,
          term: true,
          academicYear: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          course: {
            select: {
              id: true,
              code: true,
              name: true
            }
          }
        }
      })
    ]);

    const coursesMap = new Map<string, { id: string; code: string | null; name: string }>();
    for (const s of schedules) {
      if (s?.course?.id && !coursesMap.has(s.course.id)) {
        coursesMap.set(s.course.id, {
          id: s.course.id,
          code: s.course.code ?? null,
          name: s.course.name ?? "Mata Pelajaran"
        });
      }
    }
    if (coursesMap.size === 0) {
      const allCourses = await prisma.course.findMany({
        where: { tenantId: tenantContext.tenantId },
        orderBy: [{ code: "asc" }, { name: "asc" }],
        select: { id: true, code: true, name: true }
      });
      for (const c of allCourses) {
        coursesMap.set(c.id, { id: c.id, code: c.code ?? null, name: c.name });
      }
    }
    const courses = Array.from(coursesMap.values());

    return {
      students: students.map((s) => ({
        id: s.id,
        label: `${s.studentNumber ? `[${s.studentNumber}] ` : ""}${s.fullName ?? "Murid"}`
      })),
      courses: courses.map((c) => ({
        id: c.id,
        label: `${c.code ? `[${c.code}] ` : ""}${c.name}`
      })),
      schedules: schedules.map((s) => ({
        id: s.id,
        courseId: s.course.id,
        label: `${s.course.name}${s.dayOfWeek ? ` (${s.dayOfWeek} ${s.startTime ?? ""}-${s.endTime ?? ""})` : ""}${
          s.term ? ` — ${s.term}/${s.academicYear}` : ""
        }`
      }))
    };
  } catch (error) {
    console.error("[grades.getOptionsForGradeForm]", error);
    return { students: [], courses: [], schedules: [] };
  }
}

export async function createGrade(tenantSlugOrId: string, data: CreateGradeInput): Promise<MutationResult> {
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

  const parsed = GradeSchema.safeParse(data);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const firstError = parsed.error.issues[0]?.message;

    return {
      success: false,
      errors: {
        studentId: fieldErrors.studentId?.[0],
        courseId: fieldErrors.courseId?.[0],
        courseOfferingId: fieldErrors.courseOfferingId?.[0],
        type: fieldErrors.type?.[0],
        score: fieldErrors.score?.[0],
        notes: fieldErrors.notes?.[0]
      },
      message: firstError ?? "Data nilai tidak valid. Periksa input dan coba lagi."
    };
  }

  const cleaned = parsed.data;
  const tenantId = tenantContext.tenantId.trim();

  try {
    let resolvedCourseOfferingId: string | null = cleaned.courseOfferingId?.trim() || null;

    if (!resolvedCourseOfferingId) {
      const firstMatching = await prisma.courseOffering.findFirst({
        where: { tenantId, courseId: cleaned.courseId.trim() },
        orderBy: [{ createdAt: "desc" }],
        select: { id: true }
      });
      resolvedCourseOfferingId = firstMatching?.id ?? null;

      if (!resolvedCourseOfferingId) {
        const fallback = await prisma.courseOffering.create({
          data: {
            tenantId,
            courseId: cleaned.courseId.trim(),
            term: "2026/2027-Ganjil",
            academicYear: "2026/2027",
            section: "A"
          },
          select: { id: true }
        });
        resolvedCourseOfferingId = fallback.id;
      }
    }

    const created = await prisma.grade.create({
      data: {
        tenantId,
        studentId: cleaned.studentId.trim(),
        courseOfferingId: resolvedCourseOfferingId,
        score: cleaned.score,
        type: cleaned.type.trim(),
        notes: cleaned.notes?.trim() || null
      }
    });

    revalidateGrades(tenantContext.tenantSlug);
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
      if (error.code === "P2003") {
        return {
          success: false,
          errors: { general: "Murid atau jadwal mata pelajaran yang dipilih tidak ditemukan." },
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
      message: "Terjadi kesalahan saat menyimpan nilai. Coba lagi."
    };
  }
}

export async function updateGrade(
  tenantSlugOrId: string,
  gradeId: string,
  data: CreateGradeInput
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

  if (!gradeId.trim()) {
    return {
      success: false,
      errors: {},
      message: "ID nilai tidak valid."
    };
  }

  const parsed = GradeSchema.safeParse(data);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const firstError = parsed.error.issues[0]?.message;

    return {
      success: false,
      errors: {
        studentId: fieldErrors.studentId?.[0],
        courseId: fieldErrors.courseId?.[0],
        courseOfferingId: fieldErrors.courseOfferingId?.[0],
        type: fieldErrors.type?.[0],
        score: fieldErrors.score?.[0],
        notes: fieldErrors.notes?.[0]
      },
      message: firstError ?? "Data nilai tidak valid. Periksa input dan coba lagi."
    };
  }

  const cleaned = parsed.data;
  const tenantId = tenantContext.tenantId.trim();

  try {
    const existing = await prisma.grade.findFirst({
      where: { id: gradeId.trim(), tenantId },
      select: { id: true }
    });

    if (!existing) {
      return {
        success: false,
        errors: {},
        message: "Data nilai tidak ditemukan untuk tenant aktif."
      };
    }

    let resolvedCourseOfferingId: string | null = cleaned.courseOfferingId?.trim() || null;

    if (!resolvedCourseOfferingId) {
      const firstMatching = await prisma.courseOffering.findFirst({
        where: { tenantId, courseId: cleaned.courseId.trim() },
        orderBy: [{ createdAt: "desc" }],
        select: { id: true }
      });
      resolvedCourseOfferingId = firstMatching?.id ?? null;

      if (!resolvedCourseOfferingId) {
        const fallback = await prisma.courseOffering.create({
          data: {
            tenantId,
            courseId: cleaned.courseId.trim(),
            term: "2026/2027-Ganjil",
            academicYear: "2026/2027",
            section: "A"
          },
          select: { id: true }
        });
        resolvedCourseOfferingId = fallback.id;
      }
    }

    const updated = await prisma.grade.update({
      where: { id: gradeId.trim() },
      data: {
        studentId: cleaned.studentId.trim(),
        courseOfferingId: resolvedCourseOfferingId,
        score: cleaned.score,
        type: cleaned.type.trim(),
        notes: cleaned.notes?.trim() || null
      }
    });

    revalidateGrades(tenantContext.tenantSlug);
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
      if (error.code === "P2003") {
        return {
          success: false,
          errors: { general: "Murid atau jadwal mata pelajaran yang dipilih tidak ditemukan." },
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
      message: "Terjadi kesalahan saat memperbarui nilai. Coba lagi."
    };
  }
}

export async function deleteGrade(id: string, tenantSlugOrId: string) {
  const tenantContext = await resolveTenantContext(tenantSlugOrId);
  const tenantId = tenantContext?.tenantId;

  if (!tenantId) {
    throw new Error("Sesi tenant tidak valid.");
  }

  const grade = await prisma.grade.findFirst({
    where: { id, tenantId },
    select: { id: true }
  });

  if (!grade) {
    throw new Error("Nilai tidak ditemukan untuk tenant aktif.");
  }

  await prisma.grade.delete({ where: { id } });

  revalidateGrades(tenantContext?.tenantSlug);
}

type LegacyGradeRow = {
  id: string;
  studentId: string;
  courseOfferingId: string;
  type: string;
  score: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  courseOffering: {
    id: string;
    term: string;
    academicYear: string;
    lecturer: {
      id: string;
      name: string;
      nip: string;
    } | null;
    courseCode: string;
    courseName: string;
  };
};

export async function getStudentGrades(tenantSlugOrId: string, studentId: string): Promise<LegacyGradeRow[]> {
  try {
    const tenantContext = await resolveTenantContext(tenantSlugOrId);
    const tenantId = tenantContext?.tenantId;
    if (!tenantId || !studentId) {
      return [];
    }

    const rows = await prisma.grade.findMany({
      where: { tenantId, studentId: studentId.trim() },
      orderBy: [{ createdAt: "asc" }],
      select: {
        id: true,
        studentId: true,
        courseOfferingId: true,
        type: true,
        score: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        courseOffering: {
          select: {
            id: true,
            term: true,
            academicYear: true,
            course: {
              select: {
                code: true,
                name: true
              }
            },
            lecturer: {
              select: {
                id: true,
                fullName: true,
                staffId: true
              }
            }
          }
        }
      }
    });

    return rows.map((g) => ({
      id: g.id,
      studentId: g.studentId,
      courseOfferingId: g.courseOfferingId ?? "",
      type: g.type || "",
      score: g.score,
      notes: g.notes ?? null,
      createdAt: g.createdAt.toISOString(),
      updatedAt: g.updatedAt.toISOString(),
      courseOffering: {
        id: g.courseOffering?.id ?? "",
        term: g.courseOffering?.term || "",
        academicYear: g.courseOffering?.academicYear || "",
        lecturer: g.courseOffering?.lecturer
          ? {
              id: g.courseOffering.lecturer.id,
              name: g.courseOffering.lecturer.fullName || "",
              nip: g.courseOffering.lecturer.staffId || ""
            }
          : null,
        courseCode: g.courseOffering?.course?.code ?? "",
        courseName: g.courseOffering?.course?.name ?? ""
      }
    }));
  } catch (error) {
    console.error("PRISMA STUDENT GRADES FETCH ERROR:", error);
    return [];
  }
}

export async function inputGrade(
  _tenantId: string,
  studentId: string,
  courseOfferingId: string,
  type: string,
  score: number
): Promise<{ success: boolean; error?: string; id?: string }> {
  const resolved = await resolveTenantContext(_tenantId);
  if (!resolved?.tenantId) {
    return { success: false, error: "Sesi tenant tidak valid." };
  }
  try {
    const created = await prisma.grade.create({
      data: {
        tenantId: resolved.tenantId,
        studentId: studentId.trim(),
        courseOfferingId: courseOfferingId.trim() || null,
        type: type.trim() || "TUGAS",
        score,
        notes: null
      }
    });
    revalidateGrades(resolved.tenantSlug);
    return { success: true, id: created.id };
  } catch (error) {
    console.error("inputGrade error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menyimpan nilai."
    };
  }
}

export async function getGradesByCourseOffering(tenantSlugOrId: string, courseOfferingId: string): Promise<LegacyGradeRow[]> {
  try {
    const tenantContext = await resolveTenantContext(tenantSlugOrId);
    const tenantId = tenantContext?.tenantId;
    if (!tenantId || !courseOfferingId) {
      return [];
    }
    const rows = await prisma.grade.findMany({
      where: { tenantId, courseOfferingId: courseOfferingId.trim() },
      orderBy: [{ createdAt: "asc" }],
      select: {
        id: true,
        studentId: true,
        courseOfferingId: true,
        type: true,
        score: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        courseOffering: {
          select: {
            id: true,
            term: true,
            academicYear: true,
            course: { select: { code: true, name: true } },
            lecturer: { select: { id: true, fullName: true, staffId: true } }
          }
        }
      }
    });
    return rows.map((g) => ({
      id: g.id,
      studentId: g.studentId,
      courseOfferingId: g.courseOfferingId ?? "",
      type: g.type || "",
      score: g.score,
      notes: g.notes ?? null,
      createdAt: g.createdAt.toISOString(),
      updatedAt: g.updatedAt.toISOString(),
      courseOffering: {
        id: g.courseOffering?.id ?? "",
        term: g.courseOffering?.term || "",
        academicYear: g.courseOffering?.academicYear || "",
        lecturer: g.courseOffering?.lecturer
          ? {
              id: g.courseOffering.lecturer.id,
              name: g.courseOffering.lecturer.fullName || "",
              nip: g.courseOffering.lecturer.staffId || ""
            }
          : null,
        courseCode: g.courseOffering?.course?.code ?? "",
        courseName: g.courseOffering?.course?.name ?? ""
      }
    }));
  } catch (error) {
    console.error("getGradesByCourseOffering error:", error);
    return [];
  }
}
