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

const AssignStudentsBulkSchema = z.object({
  classroomId: z.string().min(1, "Kelas tujuan wajib dipilih"),
  studentIds: z.array(z.string().min(1)).min(1, "Pilih minimal satu siswa")
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
        studentIds?: string;
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

export async function getClassroomById(classroomId: string, tenantId: string) {
  const classroom = await prisma.classroom.findFirst({
    where: {
      id: classroomId,
      tenantId
    },
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
          gender: true,
          isActive: true
        },
        orderBy: { fullName: "asc" }
      },
      courseOfferings: {
        where: { tenantId },
        include: {
          course: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          lecturer: {
            select: {
              id: true,
              staffId: true,
              fullName: true
            }
          }
        },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }]
      }
    }
  });

  if (!classroom) {
    return null;
  }

  return {
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
      gender: student.gender,
      isActive: student.isActive
    })),
    courseOfferings: classroom.courseOfferings.map((offering) => ({
      id: offering.id,
      term: offering.term,
      academicYear: offering.academicYear,
      section: offering.section,
      dayOfWeek: offering.dayOfWeek,
      startTime: offering.startTime,
      endTime: offering.endTime,
      room: offering.room,
      course: {
        id: offering.course.id,
        code: offering.course.code,
        name: offering.course.name
      },
      lecturer: offering.lecturer
        ? {
            id: offering.lecturer.id,
            nip: offering.lecturer.staffId,
            name: offering.lecturer.fullName
          }
        : null
    }))
  };
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
  revalidatePath(`/academics/classrooms/${cleaned.classroomId}`);

  return { success: true };
}

export async function assignStudentsToClassroom(
  classroomId: string,
  studentIds: string[],
  tenantId: string
): Promise<ClassroomActionResult> {
  const parsed = AssignStudentsBulkSchema.safeParse({ classroomId, studentIds });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;

    return {
      success: false,
      error: "Input penempatan siswa tidak valid",
      errors: {
        classroomId: fieldErrors.classroomId?.[0],
        studentIds: fieldErrors.studentIds?.[0]
      }
    };
  }

  const cleaned = parsed.data;
  const uniqueStudentIds = Array.from(new Set(cleaned.studentIds));

  const classroom = await prisma.classroom.findFirst({
    where: {
      id: cleaned.classroomId,
      tenantId
    },
    select: { id: true }
  });

  if (!classroom) {
    return {
      success: false,
      error: "Kelas tidak ditemukan untuk tenant aktif",
      errors: {
        classroomId: "Kelas tidak valid"
      }
    };
  }

  const validStudents = await prisma.student.findMany({
    where: {
      tenantId,
      id: { in: uniqueStudentIds }
    },
    select: { id: true }
  });

  if (validStudents.length !== uniqueStudentIds.length) {
    return {
      success: false,
      error: "Sebagian siswa tidak valid untuk tenant aktif",
      errors: {
        studentIds: "Ada siswa yang tidak ditemukan"
      }
    };
  }

  await prisma.student.updateMany({
    where: {
      tenantId,
      id: { in: uniqueStudentIds }
    },
    data: {
      classroomId: cleaned.classroomId
    }
  });

  revalidatePath("/students");
  revalidatePath("/academics/classrooms");
  revalidatePath(`/academics/classrooms/${cleaned.classroomId}`);

  return { success: true };
}
