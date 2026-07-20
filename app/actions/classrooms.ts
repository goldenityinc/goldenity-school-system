"use server";

type ClassroomActionResult = { success: false; error: string } | { success: true };

export async function getClassrooms(_tenantId: string) {
  return [];
}

export async function createClassroom(_tenantId: string, _data: unknown): Promise<ClassroomActionResult> {
  return { success: false, error: "Fitur ini akan dihubungkan ke backend API." };
}

export async function getClassroomById(_classroomId: string, _tenantId: string) {
  return null;
}

export async function assignStudentToClassroom(_studentId: string, _classroomId: string, _tenantId: string): Promise<ClassroomActionResult> {
  return { success: false, error: "Fitur ini akan dihubungkan ke backend API." };
}

export async function assignStudentsToClassroom(_classroomId: string, _studentIds: string[], _tenantId: string): Promise<ClassroomActionResult> {
  return { success: false, error: "Fitur ini akan dihubungkan ke backend API." };
}