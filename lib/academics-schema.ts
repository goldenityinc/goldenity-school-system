import { z } from "zod";

export const LecturerSchema = z.object({
  nip: z.string().min(1, "NIP wajib diisi"),
  name: z.string().min(1, "Nama wajib diisi"),
  specialization: z.string().optional()
});

export const CourseSchema = z.object({
  code: z.string().min(1, "Kode pelajaran wajib diisi"),
  name: z.string().min(1, "Nama pelajaran wajib diisi"),
  credits: z.coerce.number().int().min(1, "SKS minimal 1").max(12, "SKS maksimal 12")
});

export const CourseOfferingSchema = z.object({
  courseId: z.string().min(1, "Mata pelajaran wajib dipilih"),
  lecturerId: z.string().min(1, "Guru pengajar wajib dipilih"),
  classroomId: z.string().optional(),
  dayOfWeek: z.enum(["Senin", "Selasa", "Rabu", "Kamis", "Jumat"], {
    message: "Hari wajib dipilih"
  }),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Jam mulai tidak valid"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Jam selesai tidak valid"),
  room: z.string().optional()
}).refine((data) => data.startTime < data.endTime, {
  message: "Jam selesai harus setelah jam mulai",
  path: ["endTime"]
});

export type CreateLecturerInput = z.infer<typeof LecturerSchema>;
export type CreateCourseInput = z.infer<typeof CourseSchema>;
export type CreateCourseOfferingInput = z.infer<typeof CourseOfferingSchema>;
