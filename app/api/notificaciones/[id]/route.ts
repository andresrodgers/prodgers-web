import { NextResponse } from "next/server";

import { fail, ok } from "@/lib/api/responses";
import { getSession } from "@/lib/auth/session";
import { query } from "@/lib/db/pool";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json(fail("unauthenticated", "No autenticado."), { status: 401 });

  const { id } = await params;
  await query(
    `UPDATE notificaciones SET leida = true WHERE id = $1 AND usuario_id = $2`,
    [id, session.userId],
  );

  return NextResponse.json(ok(null));
}
