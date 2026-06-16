import { NextRequest, NextResponse } from "next/server";

import { fail, ok } from "@/lib/api/responses";
import { getSession } from "@/lib/auth/session";
import { query } from "@/lib/db/pool";
import { isInstaladora } from "@/lib/permissions/guards";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(fail("unauthenticated", "No autenticado."), { status: 401 });
  }
  if (!isInstaladora(session.rol as "instaladora_propietario" | "instaladora_gestor")) {
    return NextResponse.json(fail("forbidden", "Solo la instaladora puede resolver correcciones."), { status: 403 });
  }

  const { id: correccionId } = await params;

  // Verify correction belongs to an expediente of this instaladora
  const correccionResult = await query(
    `SELECT c.id, c.expediente_id, c.estado
     FROM correcciones c
     JOIN expedientes e ON e.id = c.expediente_id
     WHERE c.id = $1 AND e.instaladora_id = $2`,
    [correccionId, session.instaladoraId],
  );

  if (!correccionResult.rows[0]) {
    return NextResponse.json(fail("not_found", "Corrección no encontrada."), { status: 404 });
  }

  const correccion = correccionResult.rows[0];

  if (correccion.estado === "Resuelta") {
    return NextResponse.json(fail("invalid_state", "La corrección ya está resuelta."), { status: 409 });
  }

  await query(
    `UPDATE correcciones SET estado = 'Resuelta', resuelto_por = $2, updated_at = NOW() WHERE id = $1`,
    [correccionId, session.userId],
  );

  await query(
    `INSERT INTO historial_expediente (expediente_id, titulo, descripcion, actor_usuario_id)
     VALUES ($1, 'Corrección marcada como resuelta', NULL, $2)`,
    [correccion.expediente_id, session.userId],
  );

  return NextResponse.json(ok({ id: correccionId, estado: "Resuelta" }));
}
