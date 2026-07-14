import { Prisma } from "@prisma/client";
import { z } from "zod";

function normalizePhoneInput(value: string) {
  return value.trim().replace(/[\s-]/g, "");
}

const indonesianPhoneSchema = z
  .string()
  .optional()
  .transform((value) => (value ? normalizePhoneInput(value) : value))
  .refine(
    (value) => {
      if (!value) return true;

      return /^(?:\+62|62|0)\d{8,13}$/.test(value);
    },
    { message: "Nomor telepon harus angka Indonesia atau format +62" }
  );

export const StudentSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi"),
  nis: z.string().trim().regex(/^\d+$/, "NIS hanya boleh angka").min(1, "NIS wajib diisi"),
  gender: z.string().optional(),
  placeOfBirth: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  parentPhone: indonesianPhoneSchema,
  parentJob: z.string().optional(),
  previousSchool: z.string().optional(),
  previousReportCard: z.union([z.custom<Prisma.InputJsonValue>(), z.null()]).optional()
});

export type CreateStudentInput = z.infer<typeof StudentSchema>;
