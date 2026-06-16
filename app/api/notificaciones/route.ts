import { NextRequest, NextResponse } from "next/server";

import { fail, ok } from "@/lib/api/responses";
import { getSession } from "@/lib/auth/session";
import { query } from "@/lib/db/pool";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json(fail("unauthenticated", "No autenticado."), { status: 401 });

  const [dataResult, countResult] = await Promise.all([
    query(
      `SELECT id, tipo, titulo, mensaje, entidad_tipo, entidad_id, leida, created_at
       FROM notificaciones
       WHERE usuario_id = $1
       ORDER BY created_at DESC
       LIMIT 30`,
      [session.userId],
    ),
    query(
      `SELECT COUNT(*) AS total FROM notificaciones WHERE usuario_id = $1 AND leida = false`,
      [session.userId],
    ),
  ]);

  return NextResponse.json(ok({
    data: dataResult.rows.map((r) => ({
      id: r.id,
      tipo: r.tipo,
      titulo: r.titulo,
      mensaje: r.mensaje,
      entidadTipo: r.entidad_tipo,
      entidadId: r.entidad_id,
      leida: r.leida,
      createdAt: r.created_at,
    })),
    noLeidas: parseInt(countResult.rows[0].total, 10),
  }));
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json(fail("unauthenticated", "No autenticado."), { status: 401 });

  const body = await req.json().catch(() => null);
  if (body?.all === true) {
    await query(
      `UPDATE notificaciones SET leida = true WHERE usuario_id = $1`,
      [session.userId],
    );
    return NextResponse.json(ok(null));
  }

  return NextResponse.json(fail("invalid_body", "Parámetro inválido."), { status: 400 });
}
