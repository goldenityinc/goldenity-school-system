/*
  Warnings:

  - You are about to drop the column `enrollmentId` on the `Grade` table. All the data in the column will be lost.
  - You are about to drop the column `gradedAt` on the `Grade` table. All the data in the column will be lost.
  - You are about to drop the column `letter` on the `Grade` table. All the data in the column will be lost.
  - You are about to drop the column `remarks` on the `Grade` table. All the data in the column will be lost.
  - You are about to alter the column `score` on the `Grade` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,2)` to `DoublePrecision`.
  - Added the required column `courseOfferingId` to the `Grade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentId` to the `Grade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Grade` table without a default value. This is not possible if the table is not empty.
  - Made the column `score` on table `Grade` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "CourseOffering" ADD COLUMN     "classroomId" TEXT;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "classroomId" TEXT;

-- DropTable
DROP TABLE "Grade";

-- CreateTable
CREATE TABLE "Classroom" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "semester" INTEGER NOT NULL,
    "homeroomTeacherId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Classroom_pkey" PRIMARY KEY ("id")
);

  -- CreateTable
  CREATE TABLE "Grade" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseOfferingId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
  );

-- CreateIndex
CREATE INDEX "Classroom_tenantId_idx" ON "Classroom"("tenantId");

-- CreateIndex
CREATE INDEX "Classroom_homeroomTeacherId_idx" ON "Classroom"("homeroomTeacherId");

-- CreateIndex
CREATE UNIQUE INDEX "Classroom_tenantId_name_academicYear_semester_key" ON "Classroom"("tenantId", "name", "academicYear", "semester");

-- CreateIndex
CREATE INDEX "CourseOffering_classroomId_idx" ON "CourseOffering"("classroomId");

-- CreateIndex
CREATE INDEX "Grade_studentId_idx" ON "Grade"("studentId");

-- CreateIndex
CREATE INDEX "Grade_courseOfferingId_idx" ON "Grade"("courseOfferingId");

-- CreateIndex
CREATE INDEX "Grade_tenantId_studentId_courseOfferingId_idx" ON "Grade"("tenantId", "studentId", "courseOfferingId");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Classroom" ADD CONSTRAINT "Classroom_homeroomTeacherId_fkey" FOREIGN KEY ("homeroomTeacherId") REFERENCES "Lecturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseOffering" ADD CONSTRAINT "CourseOffering_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_courseOfferingId_fkey" FOREIGN KEY ("courseOfferingId") REFERENCES "CourseOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;
