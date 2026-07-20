"use server";

type EnrollmentMutationResult = { success: false; error: string } | { success: true };

export async function getEnrollmentData(_tenantId: string) {
  return { students: [], courseOfferings: [] };
}

export async function enrollStudents(_tenantId: string, _studentIds: string[], _courseOfferingId: string) {
  return { success: false, error: "Fitur ini akan dihubungkan ke backend API." };
}

export async function unenrollStudent(_tenantId: string, _studentId: string, _courseOfferingId: string): Promise<EnrollmentMutationResult> {
  return { success: false, error: "Fitur ini akan dihubungkan ke backend API." };
}

export async function moveStudent(_studentId: string, _fromCourseOfferingId: string, _toCourseOfferingId: string, _tenantId: string): Promise<EnrollmentMutationResult> {
  return { success: false, error: "Fitur ini akan dihubungkan ke backend API." };
}