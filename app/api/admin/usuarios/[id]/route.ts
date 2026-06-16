import { NextResponse } from "next/server";

import { fail, ok } from "@/lib/api/responses";
import { getSession } from "@/lib/auth/session";
import { query } from "@/lib/db/pool";

// ─── PATCH /api/admin/usuarios/[id] ─────────────────────────────

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json(fail("unauthenticated", "No autenticado."), { status: 401 });
  if (session.rol !== "admin") return NextResponse.json(fail("forbidden", "Solo administradores."), { status: 403 });

  const { id } = await params;
  const body = await req.json() as {
    nombre?: string;
    identificadorLegal?: string;
    rol?: string;
    estado?: string;
  };

  // Prevent deactivating yourself
  if (body.estado === "Inactivo" && id === session.userId) {
    return NextResponse.json(fail("conflict", "No puedes desactivar tu propia cuenta."), { status: 409 });
  }

  // Map camelCase → snake_case
  const fieldMap: Record<string, string> = {
    nombre: "nombre",
    identificadorLegal: "identificador_legal",
    rol: "rol",
    estado: "estado",
  };

  const setClauses: string[] = [];
  const values: unknown[] = [];

  for (const [camel, snake] of Object.entries(fieldMap)) {
    const val = (body as Record<string, unknown>)[camel];
    if (val !== undefined) {
      values.push(val);
      setClauses.push(`${snake} = $${values.length}`);
    }
  }

  if (setClauses.length === 0) {
    return NextResponse.json(fail("validation", "No hay campos para actualizar."), { status: 400 });
  }

  values.push(id);
  const result = await query(
    `UPDATE usuarios SET ${setClauses.join(", ")}
     WHERE id = $${values.length} AND rol IN ('operativo', 'admin')
     RETURNING id, nombre, identificador_legal, rol, estado`,
    values,
  );

  if (!result.rows[0]) {
    return NextResponse.json(fail("not_found", "Usuario no encontrado."), { status: 404 });
  }

  const r = result.rows[0];
  return NextResponse.json(
    ok({
      id: r.id,
      nombre: r.nombre,
      identificadorLegal: r.identificador_legal,
      rol: r.rol,
      estado: r.estado,
    }),
  );
}
