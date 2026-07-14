"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "../../lib/prisma";

const InputGradeSchema = z.object({
  studentId: z.string().min(1, "Siswa wajib dipilih"),
  courseOfferingId: z.string().min(1, "Kelas mapel wajib dipilih"),
  type: z.string().min(1, "Tipe nilai wajib diisi"),
  score: z.coerce.number().min(0, "Nilai minimal 0").max(100, "Nilai maksimal 100")
});

type GradeActionResult =
  | { success: true }
  | {
      success: false;
      error: string;
      errors?: {
        studentId?: string;
        courseOfferingId?: string;
        type?: string;
        score?: string;
      };
    };

export async function inputGrade(
  tenantId: string,
  studentId: string,
  courseOfferingId: string,
  type: string,
  score: number
): Promise<GradeActionResult> {
  const parsed = InputGradeSchema.safeParse({ studentId, courseOfferingId, type, score });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;

    return {
      success: false,
      error: "Input nilai tidak valid",
      errors: {
        studentId: fieldErrors.studentId?.[0],
        courseOfferingId: fieldErrors.courseOfferingId?.[0],
        type: fieldErrors.type?.[0],
        score: fieldErrors.score?.[0]
      }
    };
  }

  const cleaned = parsed.data;

  try {
    const [student, courseOffering] = await Promise.all([
      prisma.student.findFirst({
        where: {
          id: cleaned.studentId,
          tenantId
        },
        select: { id: true }
      }),
      prisma.courseOffering.findFirst({
        where: {
          id: cleaned.courseOfferingId,
          tenantId
        },
        select: { id: true }
      })
    ]);

    if (!student) {
      return {
        success: false,
        error: "Siswa tidak ditemukan untuk tenant aktif"
      };
    }

    if (!courseOffering) {
      return {
        success: false,
        error: "Kelas mapel tidak ditemukan untuk tenant aktif"
      };
    }

    const existing = await prisma.grade.findFirst({
      where: {
        tenantId,
        studentId: cleaned.studentId,
        courseOfferingId: cleaned.courseOfferingId,
        type: cleaned.type.trim().toUpperCase()
      },
      select: { id: true }
    });

    if (existing) {
      await prisma.grade.update({
        where: { id: existing.id },
        data: {
          score: cleaned.score,
          notes: null
        }
      });
    } else {
      await prisma.grade.create({
        data: {
          tenantId,
          studentId: cleaned.studentId,
          courseOfferingId: cleaned.courseOfferingId,
          type: cleaned.type.trim().toUpperCase(),
          score: cleaned.score,
          notes: null
        }
      });
    }

    revalidatePath("/students");
    revalidatePath("/academics");

    return { success: true };
  } catch (error) {
    console.error("[grades.inputGrade]", error);
    return {
      success: false,
      error: "Terjadi kesalahan saat menyimpan nilai. Coba lagi."
    };
  }
}

export async function getStudentGrades(tenantId: string, studentId: string) {
  try {
    const grades = await prisma.grade.findMany({
      where: {
        tenantId,
        studentId
      },
      orderBy: [{ createdAt: "desc" }],
      include: {
        courseOffering: {
          select: {
            id: true,
            term: true,
            academicYear: true,
            lecturer: {
              select: {
                id: true,
                fullName: true,
                staffId: true
              }
            },
            course: {
              select: {
                code: true,
                name: true
              }
            }
          }
        }
      }
    });

    return grades.map((grade) => ({
      id: grade.id,
      studentId: grade.studentId,
      courseOfferingId: grade.courseOfferingId,
      type: grade.type,
      score: grade.score,
      notes: grade.notes,
      createdAt: grade.createdAt.toISOString(),
      updatedAt: grade.updatedAt.toISOString(),
      courseOffering: {
        id: grade.courseOffering.id,
        term: grade.courseOffering.term,
        academicYear: grade.courseOffering.academicYear,
        lecturer: grade.courseOffering.lecturer
          ? {
              id: grade.courseOffering.lecturer.id,
              name: grade.courseOffering.lecturer.fullName,
              nip: grade.courseOffering.lecturer.staffId
            }
          : null,
        courseCode: grade.courseOffering.course.code,
        courseName: grade.courseOffering.course.name
      }
    }));
  } catch (error) {
    console.error("[grades.getStudentGrades]", error);
    return [];
  }
}

export async function getGradesByCourseOffering(tenantId: string, courseOfferingId: string) {
  try {
    const grades = await prisma.grade.findMany({
      where: {
        tenantId,
        courseOfferingId
      },
      orderBy: [{ studentId: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        studentId: true,
        courseOfferingId: true,
        type: true,
        score: true,
        updatedAt: true
      }
    });

    return grades.map((grade) => ({
      id: grade.id,
      studentId: grade.studentId,
      courseOfferingId: grade.courseOfferingId,
      type: grade.type,
      score: grade.score,
      updatedAt: grade.updatedAt.toISOString()
    }));
  } catch (error) {
    console.error("[grades.getGradesByCourseOffering]", error);
    return [];
  }
}
