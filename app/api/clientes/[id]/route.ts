import { NextRequest, NextResponse } from "next/server";

import { fail, ok } from "@/lib/api/responses";
import { getSession } from "@/lib/auth/session";
import { query } from "@/lib/db/pool";
import { isInstaladora } from "@/lib/permissions/guards";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(fail("unauthenticated", "No autenticado."), { status: 401 });
  }
  if (!isInstaladora(session.rol as "instaladora_propietario" | "instaladora_gestor")) {
    return NextResponse.json(fail("forbidden", "Solo instaladoras."), { status: 403 });
  }

  const { id } = await params;

  const clienteResult = await query(
    `SELECT id, nombre, dni_nie, telefono, correo, created_at
     FROM clientes_finales WHERE id = $1 AND instaladora_id = $2`,
    [id, session.instaladoraId],
  );

  if (!clienteResult.rows[0]) {
    return NextResponse.json(fail("not_found", "Cliente no encontrado."), { status: 404 });
  }

  const c = clienteResult.rows[0];

  const expResult = await query(
    `SELECT e.id, e.codigo, e.estado, e.servicio, e.municipio, e.potencia_kw,
            e.created_at, e.updated_at
     FROM expedientes e
     WHERE e.cliente_final_id = $1
     ORDER BY e.created_at DESC`,
    [id],
  );

  return NextResponse.json(
    ok({
      id: c.id,
      nombre: c.nombre,
      dniNie: c.dni_nie,
      telefono: c.telefono ?? null,
      correo: c.correo ?? null,
      createdAt: c.created_at,
      expedientes: expResult.rows.map((e) => ({
        id: e.id,
        codigo: e.codigo,
        estado: e.estado,
        servicio: e.servicio,
        municipio: e.municipio,
        potenciaKw: parseFloat(e.potencia_kw),
        createdAt: e.created_at,
        updatedAt: e.updated_at,
      })),
    }),
  );
}
