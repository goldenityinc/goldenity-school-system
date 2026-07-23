ALTER TABLE "Lecturer"
ADD COLUMN IF NOT EXISTS "phone" TEXT,
ADD COLUMN IF NOT EXISTS "gender" TEXT,
ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'GURU',
ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN IF NOT EXISTS "nuptk" TEXT;

ALTER TABLE "Classroom"
ADD COLUMN IF NOT EXISTS "code" TEXT,
ADD COLUMN IF NOT EXISTS "capacity" INTEGER;

UPDATE "Classroom"
SET "code" = COALESCE("code", regexp_replace("name", '\\s+.*$', ''))
WHERE "code" IS NULL;

UPDATE "Classroom"
SET "code" = COALESCE("code", id)
WHERE "code" IS NULL;

ALTER TABLE "Classroom" ALTER COLUMN "code" SET NOT NULL;

ALTER TABLE "Classroom" DROP CONSTRAINT IF EXISTS "Classroom_tenantId_name_academicYear_semester_key";

ALTER TABLE "Classroom"
ADD CONSTRAINT "Classroom_tenantId_code_academicYear_semester_key"
UNIQUE ("tenantId", "code", "academicYear", "semester");

CREATE INDEX IF NOT EXISTS "Classroom_code_idx" ON "Classroom"("code");

