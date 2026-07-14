import { NextResponse } from "next/server";
import { getCurrentSession } from "../../../lib/utils/jwt";
import { createStudent } from "../../../app/actions/students";
import type { CreateStudentInput } from "../../../lib/student-schema";

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      {
        success: false,
        message: "Konfigurasi database belum siap (DATABASE_URL belum di-set)."
      },
      { status: 503 }
    );
  }

  const session = await getCurrentSession();

  if (!session?.tenantId) {
    return NextResponse.json({ success: false, message: "Sesi tenant tidak valid." }, { status: 401 });
  }

  let body: CreateStudentInput;

  try {
    body = (await request.json()) as CreateStudentInput;
  } catch {
    return NextResponse.json({ success: false, message: "Payload tidak valid." }, { status: 400 });
  }

  let result;

  try {
    result = await createStudent(session.tenantId, body);
  } catch (error) {
    console.error("[api.students.POST]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal terhubung ke database saat menyimpan murid."
      },
      { status: 503 }
    );
  }

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        message: result.message ?? "Gagal menyimpan murid.",
        errors: result.errors
      },
      { status: result.message?.includes("NIS sudah terdaftar") ? 409 : 400 }
    );
  }

  return NextResponse.json({ success: true, id: result.id }, { status: 201 });
}