import { NextResponse } from "next/server";
import { getCurrentSession } from "../../../../lib/utils/jwt";

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  return NextResponse.json({
    authenticated: true,
    session
  });
}
