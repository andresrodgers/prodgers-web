import { NextRequest, NextResponse } from "next/server";

import { fail, ok } from "@/lib/api/responses";
import { getSession } from "@/lib/auth/session";
import { query } from "@/lib/db/pool";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(fail("unauthenticated", "No autenticado."), { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const expedienteId = searchParams.get("expediente_id");

  const esInstaladora =
    session.rol === "instaladora_propietario" || session.rol === "instaladora_gestor";

  let rows;

  if (esInstaladora) {
    if (expedienteId) {
      const result = await query(
        `SELECT c.id, c.expediente_id, c.campo_afectado, c.nota, c.estado, c.created_at
         FROM correcciones c
         JOIN expedientes e ON e.id = c.expediente_id
         WHERE c.expediente_id = $1 AND e.instaladora_id = $2
         ORDER BY c.created_at DESC`,
        [expedienteId, session.instaladoraId],
      );
      rows = result.rows;
    } else {
      const result = await query(
        `SELECT c.id, c.expediente_id, c.campo_afectado, c.nota, c.estado, c.created_at
         FROM correcciones c
         JOIN expedientes e ON e.id = c.expediente_id
         WHERE e.instaladora_id = $1 AND c.estado = 'Pendiente'
         ORDER BY c.created_at DESC`,
        [session.instaladoraId],
      );
      rows = result.rows;
    }
  } else {
    if (expedienteId) {
      const result = await query(
        `SELECT id, expediente_id, campo_afectado, nota, estado, created_at
         FROM correcciones WHERE expediente_id = $1 ORDER BY created_at DESC`,
        [expedienteId],
      );
      rows = result.rows;
    } else {
      const result = await query(
        `SELECT id, expediente_id, campo_afectado, nota, estado, created_at
         FROM correcciones WHERE estado = 'Pendiente'
         ORDER BY created_at DESC LIMIT 50`,
        [],
      );
      rows = result.rows;
    }
  }

  return NextResponse.json(
    ok(
      rows.map((c) => ({
        id: c.id,
        expedienteId: c.expediente_id,
        campoAfectado: c.campo_afectado,
        nota: c.nota,
        estado: c.estado,
        createdAt: c.created_at,
      })),
    ),
  );
}
