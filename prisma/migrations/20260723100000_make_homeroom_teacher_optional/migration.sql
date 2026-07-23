ALTER TABLE "Classroom" ALTER COLUMN "homeroomTeacherId" DROP NOT NULL;

ALTER TABLE "Classroom" DROP CONSTRAINT IF EXISTS "Classroom_homeroomTeacherId_fkey";

ALTER TABLE "Classroom"
ADD CONSTRAINT "Classroom_homeroomTeacherId_fkey"
FOREIGN KEY ("homeroomTeacherId") REFERENCES "Lecturer"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

