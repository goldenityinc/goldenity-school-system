import { NextResponse } from "next/server";
import { getCurrentSession } from "../../../lib/utils/jwt";
import { createStudent } from "../../../app/actions/students";
import type { CreateStudentInput } from "../../../lib/student-schema";

export async function POST(request: Request) {
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

  const result = await createStudent(session.tenantId, body);

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