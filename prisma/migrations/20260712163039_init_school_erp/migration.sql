-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'TENANT_ADMIN', 'TEACHER', 'STAFF');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ENROLLED', 'DROPPED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "GradeLetter" AS ENUM ('A', 'B', 'C', 'D', 'E', 'F', 'INCOMPLETE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lecturer" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "staffId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "specialization" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lecturer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentRegistration" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "registrationNo" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "status" "RegistrationStatus" NOT NULL DEFAULT 'DRAFT',
    "studentId" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "studentNumber" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "enrollmentDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "creditHours" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseOffering" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "lecturerId" TEXT,
    "term" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "section" TEXT,
    "capacity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseOffering_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseOfferingId" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ENROLLED',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grade" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "score" DECIMAL(5,2),
    "letter" "GradeLetter",
    "remarks" TEXT,
    "gradedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "User_tenantId_email_key" ON "User"("tenantId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Lecturer_userId_key" ON "Lecturer"("userId");

-- CreateIndex
CREATE INDEX "Lecturer_tenantId_idx" ON "Lecturer"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Lecturer_tenantId_staffId_key" ON "Lecturer"("tenantId", "staffId");

-- CreateIndex
CREATE UNIQUE INDEX "Lecturer_tenantId_email_key" ON "Lecturer"("tenantId", "email");

-- CreateIndex
CREATE INDEX "StudentRegistration_tenantId_idx" ON "StudentRegistration"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentRegistration_tenantId_registrationNo_key" ON "StudentRegistration"("tenantId", "registrationNo");

-- CreateIndex
CREATE INDEX "Student_tenantId_idx" ON "Student"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_tenantId_studentNumber_key" ON "Student"("tenantId", "studentNumber");

-- CreateIndex
CREATE INDEX "Course_tenantId_idx" ON "Course"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Course_tenantId_code_key" ON "Course"("tenantId", "code");

-- CreateIndex
CREATE INDEX "CourseOffering_tenantId_idx" ON "CourseOffering"("tenantId");

-- CreateIndex
CREATE INDEX "CourseOffering_courseId_idx" ON "CourseOffering"("courseId");

-- CreateIndex
CREATE INDEX "CourseOffering_lecturerId_idx" ON "CourseOffering"("lecturerId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseOffering_tenantId_courseId_term_academicYear_section_key" ON "CourseOffering"("tenantId", "courseId", "term", "academicYear", "section");

-- CreateIndex
CREATE INDEX "Enrollment_tenantId_idx" ON "Enrollment"("tenantId");

-- CreateIndex
CREATE INDEX "Enrollment_studentId_idx" ON "Enrollment"("studentId");

-- CreateIndex
CREATE INDEX "Enrollment_courseOfferingId_idx" ON "Enrollment"("courseOfferingId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_tenantId_studentId_courseOfferingId_key" ON "Enrollment"("tenantId", "studentId", "courseOfferingId");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_enrollmentId_key" ON "Grade"("enrollmentId");

-- CreateIndex
CREATE INDEX "Grade_tenantId_idx" ON "Grade"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_tenantId_enrollmentId_key" ON "Grade"("tenantId", "enrollmentId");

-- AddForeignKey
ALTER TABLE "Lecturer" ADD CONSTRAINT "Lecturer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentRegistration" ADD CONSTRAINT "StudentRegistration_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentRegistration" ADD CONSTRAINT "StudentRegistration_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseOffering" ADD CONSTRAINT "CourseOffering_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseOffering" ADD CONSTRAINT "CourseOffering_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "Lecturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseOfferingId_fkey" FOREIGN KEY ("courseOfferingId") REFERENCES "CourseOffering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
