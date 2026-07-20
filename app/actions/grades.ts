"use server";

type GradeActionResult = { success: false; error: string } | { success: true };

export async function inputGrade(_tenantId: string, _studentId: string, _courseOfferingId: string, _type: string, _score: number): Promise<GradeActionResult> {
  return { success: false, error: "Fitur ini akan dihubungkan ke backend API." };
}

export async function getStudentGrades(_tenantId: string, _studentId: string) {
  return [];
}

export async function getGradesByCourseOffering(_tenantId: string, _courseOfferingId: string) {
  return [];
}