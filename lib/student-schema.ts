import { Prisma } from "@prisma/client";
import { z } from "zod";

export const StudentSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  nis: z.string().min(1, "NIS wajib diisi"),
  gender: z.string().optional(),
  placeOfBirth: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  parentPhone: z.string().optional(),
  parentJob: z.string().optional(),
  previousSchool: z.string().optional(),
  previousReportCard: z.union([z.custom<Prisma.InputJsonValue>(), z.null()]).optional()
});

export type CreateStudentInput = z.infer<typeof StudentSchema>;
