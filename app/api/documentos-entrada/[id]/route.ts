import { NextRequest, NextResponse } from "next/server";

import { fail, ok } from "@/lib/api/responses";
import { getSession } from "@/lib/auth/session";
import { query } from "@/lib/db/pool";
import { notificarInstaladora } from "@/lib/notificaciones/crear";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(fail("unauthenticated", "No autenticado."), { status: 401 });
  }

  // Only operativo roles can validate/reject documents
  if (session.rol !== "operativo" && session.rol !== "admin") {
    return NextResponse.json(fail("forbidden", "Solo operativo puede validar documentos."), { status: 403 });
  }

  const { id: docId } = await params;

  const docResult = await query(
    `SELECT de.id, de.expediente_id, de.tipo_documento, de.estado, e.instaladora_id
     FROM documentos_entrada de
     JOIN expedientes e ON e.id = de.expediente_id
     WHERE de.id = $1`,
    [docId],
  );

  if (!docResult.rows[0]) {
    return NextResponse.json(fail("not_found", "Documento no encontrado."), { status: 404 });
  }

  const doc = docResult.rows[0];

  if (doc.estado !== "Subido") {
    return NextResponse.json(
      fail("invalid_state", `El documento está en estado '${doc.estado}'. Solo se pueden revisar documentos 'Subido'.`),
      { status: 409 },
    );
  }

  let body: { estado: string; nota?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(fail("invalid_body", "JSON inválido."), { status: 400 });
  }

  const { estado, nota } = body;
  if (estado !== "Validado" && estado !== "Incorrecto") {
    return NextResponse.json(
      fail("invalid_estado", "El estado debe ser 'Validado' o 'Incorrecto'."),
      { status: 422 },
    );
  }

  if (estado === "Incorrecto" && !nota?.trim()) {
    return NextResponse.json(
      fail("missing_nota", "Se requiere una nota explicando el problema."),
      { status: 422 },
    );
  }

  await query(
    `UPDATE documentos_entrada
     SET estado = $1, nota_revision = $2, revisado_por = $3, updated_at = NOW()
     WHERE id = $4`,
    [estado, nota?.trim() ?? null, session.userId, docId],
  );

  // If rejected, create a correction entry
  if (estado === "Incorrecto") {
    await query(
      `INSERT INTO correcciones (expediente_id, campo_afectado, nota, estado, solicitado_por)
       VALUES ($1, $2, $3, 'Pendiente', $4)`,
      [doc.expediente_id, doc.tipo_documento, nota!.trim(), session.userId],
    );
  }

  // Historial entry
  const estadoLabel = estado === "Validado" ? "validado" : "rechazado";
  await query(
    `INSERT INTO historial_expediente (expediente_id, titulo, descripcion, actor_usuario_id)
     VALUES ($1, $2, $3, $4)`,
    [
      doc.expediente_id,
      `Documento ${estadoLabel}`,
      `${doc.tipo_documento}${nota ? `: ${nota}` : ""}`,
      session.userId,
    ],
  );

  notificarInstaladora(doc.instaladora_id as string, {
    tipo: "documento_revisado",
    titulo: `Documento ${estadoLabel}`,
    mensaje: `${doc.tipo_documento}${nota ? ` — ${nota}` : ""}`,
    entidadTipo: "expedientes",
    entidadId: doc.expediente_id as string,
  }).catch(() => {});

  return NextResponse.json(ok({ id: docId, estado }));
}
