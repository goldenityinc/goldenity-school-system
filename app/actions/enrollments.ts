"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { z } from "zod";
import prisma from "../../lib/prisma";

const EnrollStudentsSchema = z.object({
  studentIds: z.array(z.string().min(1)).min(1, "Pilih minimal 1 siswa"),
  courseOfferingId: z.string().min(1, "Kelas tujuan wajib dipilih")
});

type EnrollStudentsResult =
  | { success: true; createdCount: number; skippedCount: number }
  | {
      success: false;
      error: string;
      errors?: {
        studentIds?: string;
        courseOfferingId?: string;
      };
    };

type EnrollmentMutationResult =
  | { success: true }
  | {
      success: false;
      error: string;
    };

export async function getEnrollmentData(tenantId: string) {
  const [students, courseOfferings] = await Promise.all([
    prisma.student.findMany({
      where: { tenantId, isActive: true },
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        studentNumber: true,
        fullName: true
      }
    }),
    prisma.courseOffering.findMany({
      where: { tenantId },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }, { createdAt: "desc" }],
      include: {
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
            fullName: true,
            staffId: true
          }
        },
        enrollments: {
          where: { tenantId },
          include: {
            student: {
              select: {
                id: true,
                studentNumber: true,
                fullName: true
              }
            }
          },
          orderBy: { createdAt: "desc" }
        }
      }
    })
  ]);

  return {
    students: students.map((student: (typeof students)[number]) => ({
      id: student.id,
      nis: student.studentNumber,
      name: student.fullName
    })),
    courseOfferings: courseOfferings.map((offering: (typeof courseOfferings)[number]) => ({
      id: offering.id,
      dayOfWeek: offering.dayOfWeek,
      startTime: offering.startTime,
      endTime: offering.endTime,
      room: offering.room,
      term: offering.term,
      academicYear: offering.academicYear,
      course: offering.course,
      lecturer: offering.lecturer
        ? {
            id: offering.lecturer.id,
            name: offering.lecturer.fullName,
            nip: offering.lecturer.staffId
          }
        : null,
      enrollments: offering.enrollments.map((enrollment: (typeof offering.enrollments)[number]) => ({
        id: enrollment.id,
        studentId: enrollment.studentId,
        status: enrollment.status,
        student: {
          id: enrollment.student.id,
          nis: enrollment.student.studentNumber,
          name: enrollment.student.fullName
        }
      }))
    }))
  };
}

export async function enrollStudents(
  tenantId: string,
  studentIds: string[],
  courseOfferingId: string
): Promise<EnrollStudentsResult> {
  const parsed = EnrollStudentsSchema.safeParse({ studentIds, courseOfferingId });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;

    return {
      success: false,
      error: "Input pendaftaran tidak valid",
      errors: {
        studentIds: fieldErrors.studentIds?.[0],
        courseOfferingId: fieldErrors.courseOfferingId?.[0]
      }
    };
  }

  const cleaned = parsed.data;

  const [offering, validStudents] = await Promise.all([
    prisma.courseOffering.findFirst({
      where: {
        id: cleaned.courseOfferingId,
        tenantId
      },
      select: { id: true }
    }),
    prisma.student.findMany({
      where: {
        tenantId,
        id: {
          in: cleaned.studentIds
        }
      },
      select: { id: true }
    })
  ]);

  if (!offering) {
    return {
      success: false,
      error: "Kelas tujuan tidak ditemukan untuk tenant aktif",
      errors: {
        courseOfferingId: "Kelas tujuan tidak valid"
      }
    };
  }

  const validStudentIds = validStudents.map((student: (typeof validStudents)[number]) => student.id);

  if (validStudentIds.length === 0) {
    return {
      success: false,
      error: "Tidak ada siswa valid untuk didaftarkan",
      errors: {
        studentIds: "Pilih siswa yang tersedia pada tenant aktif"
      }
    };
  }

  const existing = await prisma.enrollment.findMany({
    where: {
      tenantId,
      courseOfferingId: cleaned.courseOfferingId,
      studentId: {
        in: validStudentIds
      }
    },
    select: { studentId: true }
  });

  const existingSet = new Set(existing.map((item: (typeof existing)[number]) => item.studentId));
  const newStudentIds = validStudentIds.filter((studentId) => !existingSet.has(studentId));

  if (newStudentIds.length === 0) {
    return {
      success: false,
      error: "Semua siswa yang dipilih sudah terdaftar di kelas ini"
    };
  }

  try {
    const created = await prisma.enrollment.createMany({
      data: newStudentIds.map((studentId: (typeof newStudentIds)[number]) => ({
        tenantId,
        studentId,
        courseOfferingId: cleaned.courseOfferingId,
        status: "ENROLLED"
      })),
      skipDuplicates: true
    });

    revalidatePath("/academics/enrollment");
    revalidatePath("/academics");

    return {
      success: true,
      createdCount: created.count,
      skippedCount: cleaned.studentIds.length - created.count
    };
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        success: false,
        error: "Beberapa siswa sudah terdaftar di kelas yang dipilih"
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal memproses enrollment"
    };
  }
}

export async function unenrollStudent(
  tenantId: string,
  studentId: string,
  courseOfferingId: string
): Promise<EnrollmentMutationResult> {
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      tenantId,
      studentId,
      courseOfferingId
    },
    select: {
      id: true
    }
  });

  if (!enrollment) {
    return {
      success: false,
      error: "Enrollment tidak ditemukan pada kelas yang dipilih"
    };
  }

  await prisma.enrollment.delete({
    where: {
      id: enrollment.id
    }
  });

  revalidatePath("/academics/enrollment");
  revalidatePath("/academics");

  return { success: true };
}

export async function moveStudent(
  tenantId: string,
  studentId: string,
  oldCourseOfferingId: string,
  newCourseOfferingId: string
): Promise<EnrollmentMutationResult> {
  if (oldCourseOfferingId === newCourseOfferingId) {
    return { success: true };
  }

  const [oldEnrollment, newOffering] = await Promise.all([
    prisma.enrollment.findFirst({
      where: {
        tenantId,
        studentId,
        courseOfferingId: oldCourseOfferingId
      },
      select: {
        id: true,
        status: true
      }
    }),
    prisma.courseOffering.findFirst({
      where: {
        id: newCourseOfferingId,
        tenantId
      },
      select: {
        id: true
      }
    })
  ]);

  if (!oldEnrollment) {
    return {
      success: false,
      error: "Enrollment asal tidak ditemukan"
    };
  }

  if (!newOffering) {
    return {
      success: false,
      error: "Kelas tujuan tidak ditemukan"
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const alreadyInNew = await tx.enrollment.findFirst({
        where: {
          tenantId,
          studentId,
          courseOfferingId: newCourseOfferingId
        },
        select: { id: true }
      });

      await tx.enrollment.delete({
        where: {
          id: oldEnrollment.id
        }
      });

      if (!alreadyInNew) {
        await tx.enrollment.create({
          data: {
            tenantId,
            studentId,
            courseOfferingId: newCourseOfferingId,
            status: oldEnrollment.status
          }
        });
      }
    });

    revalidatePath("/academics/enrollment");
    revalidatePath("/academics");

    return { success: true };
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        success: false,
        error: "Siswa sudah terdaftar di kelas tujuan"
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal memindahkan siswa"
    };
  }
}
