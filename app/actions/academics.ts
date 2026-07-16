"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import prisma from "../../lib/prisma";
import {
  CourseOfferingSchema,
  CourseSchema,
  LecturerSchema,
  type CreateCourseOfferingInput,
  type CreateCourseInput,
  type CreateLecturerInput
} from "../../lib/academics-schema";

type LecturerResult =
  | { success: true; id: string }
  | { success: false; errors: Partial<Record<keyof CreateLecturerInput, string>> };

type CourseResult =
  | { success: true; id: string }
  | { success: false; errors: Partial<Record<keyof CreateCourseInput, string>> };

type CourseOfferingResult =
  | { success: true; id: string }
  | { success: false; errors: Partial<Record<keyof CreateCourseOfferingInput, string>> };

export async function getLecturers(tenantId: string) {
  const lecturers = await prisma.lecturer.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" }
  });

  return lecturers.map((lecturer: (typeof lecturers)[number]) => ({
    id: lecturer.id,
    nip: lecturer.staffId,
    name: lecturer.fullName,
    email: lecturer.email,
    specialization: lecturer.specialization,
    createdAt: lecturer.createdAt.toISOString()
  }));
}

export async function getHomeroomTeachers(tenantId: string) {
  const lecturers = await prisma.lecturer.findMany({
    where: { tenantId },
    orderBy: { fullName: "asc" },
    select: {
      id: true,
      staffId: true,
      fullName: true
    }
  });

  return lecturers.map((lecturer: (typeof lecturers)[number]) => ({
    id: lecturer.id,
    nip: lecturer.staffId,
    name: lecturer.fullName
  }));
}

export async function getCourses(tenantId: string) {
  const courses = await prisma.course.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" }
  });

  return courses.map((course: (typeof courses)[number]) => ({
    id: course.id,
    code: course.code,
    name: course.name,
    credits: course.creditHours,
    description: course.description,
    createdAt: course.createdAt.toISOString()
  }));
}

export async function getCourseOfferings(tenantId: string) {
  const offerings = await prisma.courseOffering.findMany({
    where: { tenantId },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }, { createdAt: "desc" }],
    include: {
      course: true,
      lecturer: true,
      classroom: true
    }
  });

  return offerings.map((offering: (typeof offerings)[number]) => ({
    id: offering.id,
    courseId: offering.courseId,
    lecturerId: offering.lecturerId,
    dayOfWeek: offering.dayOfWeek,
    startTime: offering.startTime,
    endTime: offering.endTime,
    room: offering.room,
    classroomId: offering.classroomId,
    term: offering.term,
    academicYear: offering.academicYear,
    section: offering.section,
    course: {
      id: offering.course.id,
      code: offering.course.code,
      name: offering.course.name
    },
    lecturer: offering.lecturer
      ? {
          id: offering.lecturer.id,
          name: offering.lecturer.fullName,
          nip: offering.lecturer.staffId
        }
      : null,
    classroom: offering.classroom
      ? {
          id: offering.classroom.id,
          name: offering.classroom.name,
          academicYear: offering.classroom.academicYear,
          semester: offering.classroom.semester
        }
      : null
  }));
}

export async function getCourseOfferingById(tenantId: string, offeringId: string) {
  const offering = await prisma.courseOffering.findFirst({
    where: {
      id: offeringId,
      tenantId
    },
    include: {
      course: true,
      lecturer: true,
      classroom: true,
      enrollments: {
        where: {
          tenantId
        },
        orderBy: {
          createdAt: "desc"
        },
        include: {
          student: true
        }
      }
    }
  });

  if (!offering) {
    return null;
  }

  return {
    id: offering.id,
    dayOfWeek: offering.dayOfWeek,
    startTime: offering.startTime,
    endTime: offering.endTime,
    room: offering.room,
    classroom: offering.classroom
      ? {
          id: offering.classroom.id,
          name: offering.classroom.name,
          academicYear: offering.classroom.academicYear,
          semester: offering.classroom.semester
        }
      : null,
    term: offering.term,
    academicYear: offering.academicYear,
    course: {
      id: offering.course.id,
      code: offering.course.code,
      name: offering.course.name
    },
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
        name: enrollment.student.fullName,
        gender: enrollment.student.gender
      }
    }))
  };
}

export async function createLecturer(tenantId: string, data: CreateLecturerInput): Promise<LecturerResult> {
  const parsed = LecturerSchema.safeParse(data);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;

    return {
      success: false,
      errors: {
        nip: fieldErrors.nip?.[0],
        name: fieldErrors.name?.[0],
        specialization: fieldErrors.specialization?.[0]
      }
    };
  }

  const cleanedData = parsed.data;
  const email = `${cleanedData.nip.trim()}@lecturer.goldenity.local`;

  const createdLecturer = await prisma.lecturer.create({
    data: {
      tenantId,
      staffId: cleanedData.nip.trim(),
      fullName: cleanedData.name.trim(),
      email,
      specialization: cleanedData.specialization?.trim() || null
    }
  });

  revalidatePath("/academics");
  return { success: true, id: createdLecturer.id };
}

export async function createCourse(tenantId: string, data: CreateCourseInput): Promise<CourseResult> {
  const parsed = CourseSchema.safeParse(data);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;

    return {
      success: false,
      errors: {
        code: fieldErrors.code?.[0],
        name: fieldErrors.name?.[0],
        credits: fieldErrors.credits?.[0]
      }
    };
  }

  const cleanedData = parsed.data;

  const createdCourse = await prisma.course.create({
    data: {
      tenantId,
      code: cleanedData.code.trim(),
      name: cleanedData.name.trim(),
      creditHours: cleanedData.credits
    }
  });

  revalidatePath("/academics");
  return { success: true, id: createdCourse.id };
}

export async function createCourseOffering(tenantId: string, data: CreateCourseOfferingInput): Promise<CourseOfferingResult> {
  const parsed = CourseOfferingSchema.safeParse(data);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;

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
      }
    };
  }

  const cleanedData = parsed.data;
  const currentYear = new Date().getFullYear();
  const academicYear = `${currentYear}/${currentYear + 1}`;

  const classroomId = cleanedData.classroomId?.trim() ? cleanedData.classroomId.trim() : null;

  const [courseExists, lecturerExists, classroomExists] = await Promise.all([
    prisma.course.findFirst({
      where: {
        id: cleanedData.courseId,
        tenantId
      },
      select: { id: true }
    }),
    prisma.lecturer.findFirst({
      where: {
        id: cleanedData.lecturerId,
        tenantId
      },
      select: { id: true }
    }),
    classroomId
      ? prisma.classroom.findFirst({
          where: {
            id: classroomId,
            tenantId
          },
          select: { id: true }
        })
      : Promise.resolve(null)
  ]);

  if (!courseExists) {
    return {
      success: false,
      errors: {
        courseId: "Mata pelajaran tidak ditemukan untuk tenant aktif"
      }
    };
  }

  if (!lecturerExists) {
    return {
      success: false,
      errors: {
        lecturerId: "Guru pengajar tidak ditemukan untuk tenant aktif"
      }
    };
  }

  if (classroomId && !classroomExists) {
    return {
      success: false,
      errors: {
        classroomId: "Rombongan belajar tidak ditemukan untuk tenant aktif"
      }
    };
  }

  try {
    const createdOffering = await prisma.courseOffering.create({
      data: {
        tenantId,
        courseId: cleanedData.courseId,
        lecturerId: cleanedData.lecturerId,
        classroomId,
        dayOfWeek: cleanedData.dayOfWeek,
        startTime: cleanedData.startTime,
        endTime: cleanedData.endTime,
        room: cleanedData.room?.trim() || null,
        term: "Semester 1",
        academicYear,
        section: null
      }
    });

    revalidatePath("/academics");
    return { success: true, id: createdOffering.id };
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        success: false,
        errors: {
          dayOfWeek: "Jadwal serupa sudah ada. Coba ubah kombinasi mata pelajaran dan waktu."
        }
      };
    }

    throw error;
  }
}
