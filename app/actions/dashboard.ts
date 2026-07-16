"use server";

import prisma from "../../lib/prisma";

type DashboardScheduleItem = {
  id: string;
  courseName: string;
  classroomName: string | null;
  lecturerName: string | null;
  dayOfWeek: string | null;
  startTime: string | null;
  endTime: string | null;
  room: string | null;
};

export type DashboardMetrics = {
  totalActiveStudents: number;
  totalTeachers: number;
  totalClassrooms: number;
  totalRevenueThisMonth: number;
  todaySchedule: DashboardScheduleItem[];
};

const dayAliasesByIndex = [
  ["Minggu", "Sunday", "Sun"],
  ["Senin", "Monday", "Mon"],
  ["Selasa", "Tuesday", "Tue"],
  ["Rabu", "Wednesday", "Wed"],
  ["Kamis", "Thursday", "Thu"],
  ["Jumat", "Friday", "Fri"],
  ["Sabtu", "Saturday", "Sat"]
] as const;

export async function getDashboardMetrics(tenantId: string): Promise<DashboardMetrics> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const todayAliases = dayAliasesByIndex[now.getDay()];

  // Tenant isolation rule:
  // Always source tenantId from decoded JWT session (getCurrentSession())
  // and apply it to every Prisma query, e.g. prisma.student.findMany({ where: { tenantId: session.tenantId } }).

  const [totalActiveStudents, totalTeachers, totalClassrooms, monthlyRevenueAgg, todaySchedule] = await Promise.all([
    prisma.student.count({
      where: {
        tenantId,
        isActive: true
      }
    }),
    prisma.lecturer.count({
      where: { tenantId }
    }),
    prisma.classroom.count({
      where: { tenantId }
    }),
    prisma.payment.aggregate({
      _sum: { amountPaid: true },
      where: {
        tenantId,
        paymentDate: {
          gte: startOfMonth,
          lt: startOfNextMonth
        }
      }
    }),
    prisma.courseOffering.findMany({
      where: {
        tenantId,
        dayOfWeek: {
          in: [...todayAliases]
        }
      },
      include: {
        course: {
          select: {
            name: true
          }
        },
        classroom: {
          select: {
            name: true
          }
        },
        lecturer: {
          select: {
            fullName: true
          }
        }
      },
      orderBy: [{ startTime: "asc" }, { createdAt: "asc" }],
      take: 5
    })
  ]);

  return {
    totalActiveStudents,
    totalTeachers,
    totalClassrooms,
    totalRevenueThisMonth: monthlyRevenueAgg._sum.amountPaid ?? 0,
    todaySchedule: todaySchedule.map((offering: (typeof todaySchedule)[number]) => ({
      id: offering.id,
      courseName: offering.course.name,
      classroomName: offering.classroom?.name ?? null,
      lecturerName: offering.lecturer?.fullName ?? null,
      dayOfWeek: offering.dayOfWeek,
      startTime: offering.startTime,
      endTime: offering.endTime,
      room: offering.room
    }))
  };
}

export async function getDashboardStats(tenantId: string) {
  const [totalStudents, totalLecturers, totalCourses] = await Promise.all([
    prisma.student.count({ where: { tenantId } }),
    prisma.lecturer.count({ where: { tenantId } }),
    prisma.course.count({ where: { tenantId } })
  ]);

  return {
    totalStudents,
    totalLecturers,
    totalCourses
  };
}

export async function getRecentStudents(tenantId: string) {
  const students = await prisma.student.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
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
      },
      grades: {
        orderBy: { createdAt: "desc" }
      }
    }
  });

  return students.map((student: (typeof students)[number]) => ({
    id: student.id,
    fullName: student.fullName,
    studentNumber: student.studentNumber,
    email: student.email,
    createdAt: student.createdAt.toISOString(),
    enrollments: student.enrollments.map((enrollment: (typeof student.enrollments)[number]) => {
      const matchedGrade = student.grades.find((grade) => grade.courseOfferingId === enrollment.courseOfferingId) ?? null;

      return {
        id: enrollment.id,
        status: enrollment.status,
        courseOffering: {
          term: enrollment.courseOffering.term,
          academicYear: enrollment.courseOffering.academicYear,
          section: enrollment.courseOffering.section,
          course: {
            name: enrollment.courseOffering.course.name,
            code: enrollment.courseOffering.course.code
          },
          lecturer: enrollment.courseOffering.lecturer
            ? {
                fullName: enrollment.courseOffering.lecturer.fullName
              }
            : null
        },
        grade: matchedGrade
          ? {
              score: String(matchedGrade.score),
              letter: matchedGrade.type,
              remarks: matchedGrade.notes
            }
          : null
      };
    })
  }));
}