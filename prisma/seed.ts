import { RegistrationStatus, EnrollmentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma";

const TENANT_SD = "tenant-sd-01";
const TENANT_SMP = "tenant-smp-02";

type SeedStudentInput = {
  studentNumber: string;
  fullName: string;
  email: string;
  enrollmentDate: Date;
  registrationNo: string;
};

async function cleanup() {
  await prisma.$transaction([
    prisma.payment.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.expense.deleteMany(),
    prisma.grade.deleteMany(),
    prisma.enrollment.deleteMany(),
    prisma.courseOffering.deleteMany(),
    prisma.classroom.deleteMany(),
    prisma.studentRegistration.deleteMany(),
    prisma.student.deleteMany(),
    prisma.course.deleteMany(),
    prisma.lecturer.deleteMany(),
    prisma.user.deleteMany()
  ]);
}

async function seedTenant(
  tenantId: string,
  lecturerSeed: { staffId: string; fullName: string; email: string; specialization: string },
  courseSeed: { code: string; name: string; description: string; term: string; academicYear: string; section: string; capacity: number },
  students: SeedStudentInput[]
) {
  const hashedPassword = await bcrypt.hash("password123", 10);

  const lecturerUser = await prisma.user.create({
    data: {
      name: lecturerSeed.fullName,
      email: lecturerSeed.email,
      password: hashedPassword,
      role: "TEACHER",
      tenantId
    }
  });

  const lecturer = await prisma.lecturer.create({
    data: {
      tenantId,
      userId: lecturerUser.id,
      staffId: lecturerSeed.staffId,
      fullName: lecturerSeed.fullName,
      email: lecturerSeed.email,
      specialization: lecturerSeed.specialization
    }
  });

  const course = await prisma.course.create({
    data: {
      tenantId,
      code: courseSeed.code,
      name: courseSeed.name,
      description: courseSeed.description,
      creditHours: 3
    }
  });

  const offering = await prisma.courseOffering.create({
    data: {
      tenantId,
      courseId: course.id,
      lecturerId: lecturer.id,
      term: courseSeed.term,
      academicYear: courseSeed.academicYear,
      section: courseSeed.section,
      capacity: courseSeed.capacity
    }
  });

  for (const studentSeed of students) {
    const student = await prisma.student.create({
      data: {
        tenantId,
        studentNumber: studentSeed.studentNumber,
        fullName: studentSeed.fullName,
        email: studentSeed.email,
        enrollmentDate: studentSeed.enrollmentDate
      }
    });

    const registration = await prisma.studentRegistration.create({
      data: {
        tenantId,
        registrationNo: studentSeed.registrationNo,
        fullName: studentSeed.fullName,
        email: studentSeed.email,
        status: RegistrationStatus.APPROVED,
        studentId: student.id,
        createdByUserId: lecturerUser.id
      }
    });

    await prisma.enrollment.create({
      data: {
        tenantId,
        studentId: student.id,
        courseOfferingId: offering.id,
        status: EnrollmentStatus.ENROLLED
      }
    });

    await prisma.grade.create({
      data: {
        tenantId,
        studentId: student.id,
        courseOfferingId: offering.id,
        score: studentSeed.studentNumber.endsWith("1") ? 96.5 : 88.25,
        type: "UAS",
        notes: `Seeded record for ${studentSeed.fullName}`
      }
    });

    console.log(`Seeded registration ${registration.registrationNo} for tenant ${tenantId}`);
  }
}

async function main() {
  await cleanup();

  const adminPassword = await bcrypt.hash("password123", 10);
  await prisma.user.create({
    data: {
      name: "Goldenity Super Admin",
      email: "admin@goldenity.com",
      password: adminPassword,
      role: "SUPER_ADMIN"
    }
  });

  await seedTenant(
    TENANT_SD,
    {
      staffId: "SD-L-001",
      fullName: "Bu Sari Prameswari",
      email: "sari.prameswari@sd.example.com",
      specialization: "Matematika Dasar"
    },
    {
      code: "SD-MTK-101",
      name: "Matematika Dasar SD",
      description: "Mata pelajaran matematika dasar untuk siswa SD.",
      term: "Semester Ganjil",
      academicYear: "2026/2027",
      section: "A",
      capacity: 30
    },
    [
      {
        studentNumber: "SD-001",
        fullName: "Alya Putri",
        email: "alya.putri@sd.example.com",
        enrollmentDate: new Date("2026-07-01"),
        registrationNo: "REG-SD-001"
      },
      {
        studentNumber: "SD-002",
        fullName: "Raka Pratama",
        email: "raka.pratama@sd.example.com",
        enrollmentDate: new Date("2026-07-01"),
        registrationNo: "REG-SD-002"
      }
    ]
  );

  await seedTenant(
    TENANT_SMP,
    {
      staffId: "SMP-L-001",
      fullName: "Pak Dimas Saputra",
      email: "dimas.saputra@smp.example.com",
      specialization: "Fisika Terapan"
    },
    {
      code: "SMP-FIS-201",
      name: "Fisika Terapan SMP",
      description: "Konsep fisika terapan untuk siswa SMP.",
      term: "Semester Ganjil",
      academicYear: "2026/2027",
      section: "A",
      capacity: 30
    },
    [
      {
        studentNumber: "SMP-001",
        fullName: "Nadia Lestari",
        email: "nadia.lestari@smp.example.com",
        enrollmentDate: new Date("2026-07-01"),
        registrationNo: "REG-SMP-001"
      },
      {
        studentNumber: "SMP-002",
        fullName: "Fajar Maulana",
        email: "fajar.maulana@smp.example.com",
        enrollmentDate: new Date("2026-07-01"),
        registrationNo: "REG-SMP-002"
      }
    ]
  );

  console.log("Seed completed successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });