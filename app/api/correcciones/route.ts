import { NextResponse } from "next/server";

import { fail } from "@/lib/api/responses";
import { ERROR_CODES } from "@/lib/errors/codes";

export async function GET() {
  return NextResponse.json(
    fail(ERROR_CODES.notImplemented, "Correcciones pendiente para fase posterior."),
    { status: 501 },
  );
}
