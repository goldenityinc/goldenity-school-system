"use server";

export type CreateLecturerInput = { [key: string]: never };
export type CreateCourseInput = { [key: string]: never };
export type CreateCourseOfferingInput = { [key: string]: never };

type SuccessResult = { success: true; id?: string };
type FailureResult = { success: false; errors?: Record<string, string>; error?: string };

export async function getLecturers(_tenantId: string) {
  return [];
}

export async function getHomeroomTeachers(_tenantId: string) {
  return [];
}

export async function getCourses(_tenantId: string) {
  return [];
}

export async function getCourseOfferings(_tenantId: string) {
  return [];
}

export async function getCourseOfferingById(_tenantId: string, _offeringId: string) {
  return null;
}

export async function createLecturer(_tenantId: string, _data: CreateLecturerInput): Promise<SuccessResult | FailureResult> {
  return { success: false, error: "Fitur ini akan dihubungkan ke backend API." };
}

export async function createCourse(_tenantId: string, _data: CreateCourseInput): Promise<SuccessResult | FailureResult> {
  return { success: false, error: "Fitur ini akan dihubungkan ke backend API." };
}

export async function createCourseOffering(_tenantId: string, _data: CreateCourseOfferingInput): Promise<SuccessResult | FailureResult> {
  return { success: false, error: "Fitur ini akan dihubungkan ke backend API." };
}
