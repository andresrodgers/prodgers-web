import { NextRequest, NextResponse } from "next/server";

import { fail, ok } from "@/lib/api/responses";
import { getSession } from "@/lib/auth/session";
import { query } from "@/lib/db/pool";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(fail("unauthenticated", "No autenticado."), { status: 401 });
  }
  if (session.rol !== "operativo" && session.rol !== "admin") {
    return NextResponse.json(fail("forbidden", "Solo operativo puede ver la cola de documentos."), { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const estado = searchParams.get("estado") ?? "Subido";
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));

  const result = await query(
    `SELECT de.id, de.tipo_documento, de.estado, de.nombre_archivo, de.created_at,
            e.id AS expediente_id, e.codigo AS expediente_codigo,
            ins.nombre AS instaladora
     FROM documentos_entrada de
     JOIN expedientes e ON e.id = de.expediente_id
     JOIN instaladoras ins ON ins.id = e.instaladora_id
     WHERE de.estado = $1
     ORDER BY de.created_at ASC
     LIMIT $2`,
    [estado, limit],
  );

  return NextResponse.json(
    ok(
      result.rows.map((r) => ({
        id: r.id,
        tipoDocumento: r.tipo_documento,
        estado: r.estado,
        nombreArchivo: r.nombre_archivo ?? null,
        expedienteId: r.expediente_id,
        expedienteCodigo: r.expediente_codigo,
        instaladora: r.instaladora,
        createdAt: r.created_at,
      })),
    ),
  );
}
