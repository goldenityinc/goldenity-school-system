"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "../../lib/prisma";

const CreateClassroomSchema = z.object({
  name: z.string().min(1, "Nama kelas wajib diisi"),
  academicYear: z.string().min(4, "Tahun ajaran wajib diisi"),
  semester: z.coerce.number().int().min(1).max(2),
  homeroomTeacherId: z.string().min(1, "Wali kelas wajib dipilih")
});

const AssignStudentSchema = z.object({
  studentId: z.string().min(1, "Siswa wajib dipilih"),
  classroomId: z.string().min(1, "Kelas tujuan wajib dipilih")
});

type ClassroomActionResult =
  | { success: true }
  | {
      success: false;
      error: string;
      errors?: {
        name?: string;
        academicYear?: string;
        semester?: string;
        homeroomTeacherId?: string;
        studentId?: string;
        classroomId?: string;
      };
    };

export async function getClassrooms(tenantId: string) {
  const classrooms = await prisma.classroom.findMany({
    where: { tenantId },
    orderBy: [{ academicYear: "desc" }, { semester: "desc" }, { name: "asc" }],
    include: {
      homeroomTeacher: {
        select: {
          id: true,
          staffId: true,
          fullName: true
        }
      },
      students: {
        where: { tenantId },
        select: {
          id: true,
          studentNumber: true,
          fullName: true,
          isActive: true
        },
        orderBy: { fullName: "asc" }
      },
      courseOfferings: {
        where: { tenantId },
        select: {
          id: true,
          term: true,
          course: {
            select: {
              name: true,
              code: true
            }
          }
        }
      }
    }
  });

  return classrooms.map((classroom) => ({
    id: classroom.id,
    name: classroom.name,
    academicYear: classroom.academicYear,
    semester: classroom.semester,
    createdAt: classroom.createdAt.toISOString(),
    homeroomTeacher: {
      id: classroom.homeroomTeacher.id,
      nip: classroom.homeroomTeacher.staffId,
      name: classroom.homeroomTeacher.fullName
    },
    students: classroom.students.map((student) => ({
      id: student.id,
      nis: student.studentNumber,
      name: student.fullName,
      isActive: student.isActive
    })),
    courseOfferings: classroom.courseOfferings.map((offering) => ({
      id: offering.id,
      term: offering.term,
      courseName: offering.course.name,
      courseCode: offering.course.code
    }))
  }));
}

export async function createClassroom(
  tenantId: string,
  data: {
    name: string;
    academicYear: string;
    semester: number;
    homeroomTeacherId: string;
  }
): Promise<ClassroomActionResult> {
  const parsed = CreateClassroomSchema.safeParse(data);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;

    return {
      success: false,
      error: "Input kelas tidak valid",
      errors: {
        name: fieldErrors.name?.[0],
        academicYear: fieldErrors.academicYear?.[0],
        semester: fieldErrors.semester?.[0],
        homeroomTeacherId: fieldErrors.homeroomTeacherId?.[0]
      }
    };
  }

  const cleaned = parsed.data;

  const teacher = await prisma.lecturer.findFirst({
    where: {
      id: cleaned.homeroomTeacherId,
      tenantId
    },
    select: { id: true }
  });

  if (!teacher) {
    return {
      success: false,
      error: "Wali kelas tidak ditemukan untuk tenant aktif",
      errors: {
        homeroomTeacherId: "Wali kelas tidak valid"
      }
    };
  }

  await prisma.classroom.create({
    data: {
      tenantId,
      name: cleaned.name.trim(),
      academicYear: cleaned.academicYear.trim(),
      semester: cleaned.semester,
      homeroomTeacherId: cleaned.homeroomTeacherId
    }
  });

  revalidatePath("/academics");
  revalidatePath("/academics/classrooms");

  return { success: true };
}

export async function assignStudentToClassroom(
  tenantId: string,
  studentId: string,
  classroomId: string
): Promise<ClassroomActionResult> {
  const parsed = AssignStudentSchema.safeParse({ studentId, classroomId });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;

    return {
      success: false,
      error: "Input penempatan kelas tidak valid",
      errors: {
        studentId: fieldErrors.studentId?.[0],
        classroomId: fieldErrors.classroomId?.[0]
      }
    };
  }

  const cleaned = parsed.data;

  const [student, classroom] = await Promise.all([
    prisma.student.findFirst({
      where: {
        id: cleaned.studentId,
        tenantId
      },
      select: { id: true }
    }),
    prisma.classroom.findFirst({
      where: {
        id: cleaned.classroomId,
        tenantId
      },
      select: { id: true }
    })
  ]);

  if (!student) {
    return {
      success: false,
      error: "Siswa tidak ditemukan untuk tenant aktif",
      errors: {
        studentId: "Siswa tidak valid"
      }
    };
  }

  if (!classroom) {
    return {
      success: false,
      error: "Kelas tidak ditemukan untuk tenant aktif",
      errors: {
        classroomId: "Kelas tidak valid"
      }
    };
  }

  await prisma.student.update({
    where: { id: cleaned.studentId },
    data: {
      classroomId: cleaned.classroomId
    }
  });

  revalidatePath("/students");
  revalidatePath("/academics/classrooms");

  return { success: true };
}
