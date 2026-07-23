"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { PrismaClientInitializationError, PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import prisma from "../../lib/prisma";
import { StudentSchema, type CreateStudentInput } from "../../lib/student-schema";

type CreateStudentResult =
  | { success: true; id: string }
  | {
      success: false;
      errors: Partial<Record<keyof CreateStudentInput, string>>;
      message?: string;
    };

export async function getStudents(tenantId: string, query?: string) {
  const trimmedQuery = query?.trim();

  try {
    const students = await prisma.student.findMany({
      where: {
        tenantId,
        ...(trimmedQuery
          ? {
              OR: [
                {
                  fullName: {
                    contains: trimmedQuery,
                    mode: "insensitive"
                  }
                },
                {
                  studentNumber: {
                    contains: trimmedQuery,
                    mode: "insensitive"
                  }
                }
              ]
            }
          : {})
      },
      orderBy: { createdAt: "desc" },
      include: {
        enrollments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            courseOffering: {
              include: {
                course: true
              }
            }
          }
        },
        grades: {
          orderBy: { createdAt: "desc" },
          include: {
            courseOffering: {
              select: {
                id: true
              }
            }
          }
        }
      }
    });

    return students.map((student: (typeof students)[number]) => ({
      ...(() => {
        const latestEnrollment = student.enrollments[0];
        const relatedGrade = latestEnrollment
          ? student.grades.find(
              (grade: (typeof student.grades)[number]) => grade.courseOfferingId === latestEnrollment.courseOfferingId
            ) ?? student.grades[0]
          : student.grades[0];

        return {
          id: student.id,
          nis: student.studentNumber,
          name: student.fullName,
          registrationDate: student.createdAt.toISOString(),
          latestEnrollment: latestEnrollment
            ? {
                status: latestEnrollment.status,
                courseName: latestEnrollment.courseOffering.course.name,
                gradeLetter: relatedGrade?.type ?? null,
                gradeScore: relatedGrade ? String(relatedGrade.score) : null
              }
            : null
        };
      })()
    }));
  } catch (error) {
    console.error("[students.getStudents]", error);
    return [];
  }
}

export async function getUnassignedStudents(tenantId: string) {
  try {
    const students = await prisma.student.findMany({
      where: {
        tenantId,
        classroomId: null,
        isActive: true
      },
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        studentNumber: true,
        fullName: true,
        gender: true
      }
    });

    return students.map((student: (typeof students)[number]) => ({
      id: student.id,
      nis: student.studentNumber,
      name: student.fullName,
      gender: student.gender
    }));
  } catch (error) {
    console.error("[students.getUnassignedStudents]", error);
    return [];
  }
}

export async function getStudentById(tenantId: string, studentId: string) {
  try {
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        tenantId
      },
      include: {
        classroom: {
          select: {
            id: true,
            name: true,
            academicYear: true,
            semester: true
          }
        },
        enrollments: {
          orderBy: { createdAt: "desc" },
          include: {
            courseOffering: {
              include: {
                course: true,
                lecturer: true
              }
            }
          }
        }
      }
    });

    if (!student) {
      return null;
    }

    return {
      id: student.id,
      nis: student.studentNumber,
      name: student.fullName,
      gender: student.gender,
      placeOfBirth: student.placeOfBirth,
      dateOfBirth: student.dateOfBirth?.toISOString() ?? null,
      address: student.address,
      fatherName: student.fatherName,
      motherName: student.motherName,
      parentPhone: student.parentPhone,
      parentJob: student.parentJob,
      previousSchool: student.previousSchool,
      classroom: student.classroom
        ? {
            id: student.classroom.id,
            name: student.classroom.name,
            academicYear: student.classroom.academicYear,
            semester: student.classroom.semester
          }
        : null,
      enrollments: student.enrollments.map((enrollment: (typeof student.enrollments)[number]) => ({
        id: enrollment.id,
        status: enrollment.status,
        dayOfWeek: enrollment.courseOffering.dayOfWeek,
        startTime: enrollment.courseOffering.startTime,
        endTime: enrollment.courseOffering.endTime,
        room: enrollment.courseOffering.room,
        course: {
          id: enrollment.courseOffering.course.id,
          code: enrollment.courseOffering.course.code,
          name: enrollment.courseOffering.course.name
        },
        lecturer: enrollment.courseOffering.lecturer
          ? {
              id: enrollment.courseOffering.lecturer.id,
              name: enrollment.courseOffering.lecturer.fullName,
              nip: enrollment.courseOffering.lecturer.staffId
            }
          : null
      }))
    };
  } catch (error) {
    console.error("[students.getStudentById]", error);
    return null;
  }
}

export async function createStudent(tenantId: string, data: CreateStudentInput): Promise<CreateStudentResult> {
  if (!process.env.DATABASE_URL) {
    return {
      success: false,
      errors: {},
      message: "Konfigurasi database belum siap (DATABASE_URL belum di-set)."
    };
  }

  if (!tenantId.trim()) {
    return {
      success: false,
      errors: {},
      message: "Sesi tenant tidak valid. Silakan login ulang."
    };
  }

  const parsed = StudentSchema.safeParse(data);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const firstError = parsed.error.issues[0]?.message;

    return {
      success: false,
      errors: {
        name: fieldErrors.name?.[0],
        nis: fieldErrors.nis?.[0],
        parentPhone: fieldErrors.parentPhone?.[0],
        dateOfBirth: fieldErrors.dateOfBirth?.[0],
        gender: fieldErrors.gender?.[0],
        previousReportCard: fieldErrors.previousReportCard?.[0]
      },
      message: firstError ?? "Data murid tidak valid. Periksa input dan coba lagi."
    };
  }

  const cleanedData = parsed.data;

  const baseStudentData = {
    tenantId: tenantId.trim(),
    fullName: cleanedData.name.trim(),
    studentNumber: cleanedData.nis.trim(),
    enrollmentDate: new Date()
  };

  const extendedStudentData = {
    ...baseStudentData,
    gender: cleanedData.gender?.trim() || null,
    placeOfBirth: cleanedData.placeOfBirth?.trim() || null,
    dateOfBirth: cleanedData.dateOfBirth ? new Date(cleanedData.dateOfBirth) : null,
    address: cleanedData.address?.trim() || null,
    fatherName: cleanedData.fatherName?.trim() || null,
    motherName: cleanedData.motherName?.trim() || null,
    parentPhone: cleanedData.parentPhone?.trim() || null,
    parentJob: cleanedData.parentJob?.trim() || null,
    previousSchool: cleanedData.previousSchool?.trim() || null,
    previousReportCard: cleanedData.previousReportCard ?? undefined
  };

  try {
    const createdStudent = await prisma.student.create({
      data: extendedStudentData
    });

    revalidatePath("/students");
    return { success: true, id: createdStudent.id };
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
          errors: {
            nis: "NIS sudah terdaftar untuk tenant ini."
          },
          message: "Data murid gagal disimpan karena NIS sudah digunakan."
        };
      }

      try {
        const fallbackStudent = await prisma.student.create({
          data: baseStudentData
        });

        revalidatePath("/students");
        return { success: true, id: fallbackStudent.id };
      } catch (fallbackError) {
        const fallbackCode = fallbackError instanceof PrismaClientKnownRequestError ? fallbackError.code : null;

        return {
          success: false,
          errors: {},
          message:
            fallbackCode === "P2002"
              ? "NIS sudah terdaftar untuk tenant ini."
              : fallbackCode
                ? `Skema database belum sinkron atau ada constraint yang ditolak (kode: ${fallbackCode}).`
                : "Skema database belum sinkron atau ada constraint yang ditolak saat menyimpan murid."
        };
      }

      return {
        success: false,
        errors: {},
        message: "Gagal menyimpan data murid."
      };
    }

    return {
      success: false,
      errors: {},
      message: "Terjadi kesalahan saat menyimpan data murid. Coba lagi."
    };
  }
}

export async function updateStudent(tenantId: string, studentId: string, data: CreateStudentInput): Promise<CreateStudentResult> {
  if (!process.env.DATABASE_URL) {
    return {
      success: false,
      errors: {},
      message: "Konfigurasi database belum siap (DATABASE_URL belum di-set)."
    };
  }

  if (!tenantId.trim()) {
    return {
      success: false,
      errors: {},
      message: "Sesi tenant tidak valid. Silakan login ulang."
    };
  }

  if (!studentId.trim()) {
    return {
      success: false,
      errors: {},
      message: "ID murid tidak valid."
    };
  }

  const parsed = StudentSchema.safeParse(data);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const firstError = parsed.error.issues[0]?.message;

    return {
      success: false,
      errors: {
        name: fieldErrors.name?.[0],
        nis: fieldErrors.nis?.[0],
        parentPhone: fieldErrors.parentPhone?.[0],
        dateOfBirth: fieldErrors.dateOfBirth?.[0],
        gender: fieldErrors.gender?.[0],
        previousReportCard: fieldErrors.previousReportCard?.[0]
      },
      message: firstError ?? "Data murid tidak valid. Periksa input dan coba lagi."
    };
  }

  const cleanedData = parsed.data;

  try {
    const existing = await prisma.student.findFirst({
      where: { id: studentId.trim(), tenantId: tenantId.trim() },
      select: { id: true }
    });

    if (!existing) {
      return {
        success: false,
        errors: {},
        message: "Murid tidak ditemukan untuk tenant aktif."
      };
    }

    const updated = await prisma.student.update({
      where: { id: studentId.trim() },
      data: {
        fullName: cleanedData.name.trim(),
        studentNumber: cleanedData.nis.trim(),
        gender: cleanedData.gender?.trim() || null,
        placeOfBirth: cleanedData.placeOfBirth?.trim() || null,
        dateOfBirth: cleanedData.dateOfBirth ? new Date(cleanedData.dateOfBirth) : null,
        address: cleanedData.address?.trim() || null,
        fatherName: cleanedData.fatherName?.trim() || null,
        motherName: cleanedData.motherName?.trim() || null,
        parentPhone: cleanedData.parentPhone?.trim() || null,
        parentJob: cleanedData.parentJob?.trim() || null,
        previousSchool: cleanedData.previousSchool?.trim() || null,
        previousReportCard: cleanedData.previousReportCard ?? undefined
      }
    });

    revalidatePath("/students");
    revalidatePath(`/students/${updated.id}`);
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
          errors: {
            nis: "NIS sudah terdaftar untuk tenant ini."
          },
          message: "Data murid gagal disimpan karena NIS sudah digunakan."
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
      message: "Terjadi kesalahan saat menyimpan data murid. Coba lagi."
    };
  }
}

export async function deleteStudent(id: string, tenantId: string) {
  const student = await prisma.student.findFirst({
    where: {
      id,
      tenantId
    },
    select: {
      id: true
    }
  });

  if (!student) {
    throw new Error("Student tidak ditemukan untuk tenant aktif.");
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      studentId: id,
      tenantId
    },
    select: {
      id: true
    }
  });

  const enrollmentIds = enrollments.map((enrollment: (typeof enrollments)[number]) => enrollment.id);

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    if (enrollmentIds.length > 0) {
      await tx.grade.deleteMany({
        where: {
          tenantId,
          studentId: id
        }
      });
    }

    await tx.enrollment.deleteMany({
      where: {
        tenantId,
        studentId: id
      }
    });

    await tx.studentRegistration.deleteMany({
      where: {
        tenantId,
        studentId: id
      }
    });

    await tx.student.delete({
      where: {
        id
      }
    });
  });

  revalidatePath("/students");
}
