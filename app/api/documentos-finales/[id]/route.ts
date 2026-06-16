import { NextRequest, NextResponse } from "next/server";

import { fail, ok } from "@/lib/api/responses";
import { getSession } from "@/lib/auth/session";
import { query } from "@/lib/db/pool";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(fail("unauthenticated", "No autenticado."), { status: 401 });
  }

  if (session.rol !== "operativo" && session.rol !== "admin") {
    return NextResponse.json(fail("forbidden", "Solo operativo puede actualizar documentos finales."), { status: 403 });
  }

  const { id: docId } = await params;

  const docResult = await query(
    `SELECT df.id, df.expediente_id, df.fase, df.titulo, df.estado
     FROM documentos_finales df
     WHERE df.id = $1`,
    [docId],
  );

  if (!docResult.rows[0]) {
    return NextResponse.json(fail("not_found", "Documento no encontrado."), { status: 404 });
  }

  const doc = docResult.rows[0];

  let body: { estado: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(fail("invalid_body", "JSON inválido."), { status: 400 });
  }

  const { estado } = body;
  if (estado !== "Disponible") {
    return NextResponse.json(
      fail("invalid_estado", "El único estado válido para esta operación es 'Disponible'."),
      { status: 422 },
    );
  }

  if (doc.estado === "Disponible") {
    return NextResponse.json(fail("invalid_state", "El documento ya está marcado como Disponible."), { status: 409 });
  }

  await query(
    `UPDATE documentos_finales SET estado = 'Disponible', updated_at = NOW() WHERE id = $1`,
    [docId],
  );

  await query(
    `INSERT INTO historial_expediente (expediente_id, titulo, descripcion, actor_usuario_id)
     VALUES ($1, $2, $3, $4)`,
    [doc.expediente_id, "Documento final disponible", `${doc.titulo} (${doc.fase})`, session.userId],
  );

  return NextResponse.json(ok({ id: docId, estado: "Disponible" }));
}
