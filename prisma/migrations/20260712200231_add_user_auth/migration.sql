/*
  Warnings:

  - You are about to drop the column `fullName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `User` table. All the data in the column will be lost.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_tenantId_email_key";

-- AlterTable
ALTER TABLE "User"
ADD COLUMN     "name" TEXT,
ADD COLUMN     "password" TEXT,
ALTER COLUMN "tenantId" DROP NOT NULL;

UPDATE "User"
SET "name" = "fullName"
WHERE "name" IS NULL;

UPDATE "User"
SET "password" = '$2b$10$E8i1nOJ.pnO620wo/WAMc.MP1HeveMrAxbePBPEovrPRUvtR54VCC'
WHERE "password" IS NULL;

ALTER TABLE "User"
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "password" SET NOT NULL,
ALTER COLUMN "role" TYPE TEXT USING "role"::text,
ALTER COLUMN "role" SET DEFAULT 'TEACHER',
DROP COLUMN "fullName",
DROP COLUMN "isActive";

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
