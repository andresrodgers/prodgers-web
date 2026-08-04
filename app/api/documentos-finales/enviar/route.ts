import { NextRequest, NextResponse } from "next/server";

import { fail, ok } from "@/lib/api/responses";
import { getSession } from "@/lib/auth/session";
import { query } from "@/lib/db/pool";
import { notificarInstaladora } from "@/lib/notificaciones/crear";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(fail("unauthenticated", "No autenticado."), { status: 401 });
  }
  if (session.rol !== "operativo" && session.rol !== "admin") {
    return NextResponse.json(fail("forbidden", "Solo operativo puede enviar documentos finales."), { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.expedienteId) {
    return NextResponse.json(fail("validation_error", "expedienteId requerido."), { status: 400 });
  }

  const expResult = await query(
    `SELECT id, codigo, instaladora_id FROM expedientes WHERE id = $1`,
    [body.expedienteId],
  );
  if (!expResult.rows[0]) {
    return NextResponse.json(fail("not_found", "Expediente no encontrado."), { status: 404 });
  }
  const exp = expResult.rows[0];

  const docsResult = await query(
    `SELECT titulo FROM documentos_finales
     WHERE expediente_id = $1 AND estado = 'Disponible'
     ORDER BY created_at`,
    [body.expedienteId],
  );
  if (docsResult.rows.length === 0) {
    return NextResponse.json(
      fail("no_docs", "No hay documentos en estado Disponible para notificar."),
      { status: 409 },
    );
  }

  const titulos = (docsResult.rows as { titulo: string }[]).map((r) => r.titulo).join(", ");

  await notificarInstaladora(exp.instaladora_id as string, {
    tipo: "documentos_finales",
    titulo: `Documentos finales disponibles — ${exp.codigo as string}`,
    mensaje: titulos,
    entidadTipo: "expedientes",
    entidadId: exp.id as string,
    email: true,
  });

  return NextResponse.json(ok({ enviados: docsResult.rows.length }));
}
