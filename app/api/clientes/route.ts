import { NextRequest, NextResponse } from "next/server";

import { fail, ok } from "@/lib/api/responses";
import { getSession } from "@/lib/auth/session";
import { query } from "@/lib/db/pool";
import { isInstaladora } from "@/lib/permissions/guards";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(fail("unauthenticated", "No autenticado."), { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search")?.trim();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
  const offset = (page - 1) * limit;

  // Determine which instaladora to scope to
  let scopeInstaladoraId: string | null;
  if (session.rol === "operativo" || session.rol === "admin") {
    const instaladoraIdParam = searchParams.get("instaladora_id");
    if (!instaladoraIdParam) {
      return NextResponse.json(fail("missing_param", "instaladora_id requerido para este rol."), { status: 400 });
    }
    scopeInstaladoraId = instaladoraIdParam;
  } else if (isInstaladora(session.rol as "instaladora_propietario" | "instaladora_gestor")) {
    scopeInstaladoraId = session.instaladoraId;
  } else {
    return NextResponse.json(fail("forbidden", "Sin acceso."), { status: 403 });
  }

  const params: unknown[] = [scopeInstaladoraId];
  let searchClause = "";

  if (search && search.length >= 1) {
    searchClause = `AND (cf.nombre ILIKE $2 OR cf.dni_nie ILIKE $2 OR cf.correo ILIKE $2)`;
    params.push(`%${search}%`);
  }

  const countResult = await query(
    `SELECT COUNT(*) AS total FROM clientes_finales cf
     WHERE cf.instaladora_id = $1 ${searchClause}`,
    params,
  );
  const total = parseInt(countResult.rows[0].total, 10);

  const dataResult = await query(
    `SELECT cf.id, cf.nombre, cf.dni_nie, cf.telefono, cf.correo, cf.created_at,
            COUNT(e.id)::int AS expedientes_count
     FROM clientes_finales cf
     LEFT JOIN expedientes e ON e.cliente_final_id = cf.id
     WHERE cf.instaladora_id = $1 ${searchClause}
     GROUP BY cf.id
     ORDER BY cf.nombre ASC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset],
  );

  const esOperativo = session.rol === "operativo";
  const data = dataResult.rows.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    dniNie: r.dni_nie,
    telefono: esOperativo ? undefined : (r.telefono ?? null),
    correo: esOperativo ? undefined : (r.correo ?? null),
    expedientesCount: r.expedientes_count,
    createdAt: r.created_at,
  }));

  return NextResponse.json(ok({ data, total, page, limit }));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(fail("unauthenticated", "No autenticado."), { status: 401 });
  }
  if (!isInstaladora(session.rol as "instaladora_propietario" | "instaladora_gestor")) {
    return NextResponse.json(fail("forbidden", "Solo instaladoras."), { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.nombre || !body?.dni) {
    return NextResponse.json(
      fail("validation_error", "nombre y dni son requeridos."),
      { status: 400 },
    );
  }

  const result = await query(
    `INSERT INTO clientes_finales (instaladora_id, nombre, dni_nie, telefono, correo)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (instaladora_id, dni_nie) DO UPDATE
       SET nombre = EXCLUDED.nombre,
           telefono = COALESCE(EXCLUDED.telefono, clientes_finales.telefono),
           correo   = COALESCE(EXCLUDED.correo, clientes_finales.correo)
     RETURNING id, nombre, dni_nie, telefono, correo, created_at`,
    [
      session.instaladoraId,
      body.nombre.trim(),
      String(body.dni).toUpperCase().trim(),
      body.telefono?.trim() || null,
      body.correo?.trim() || null,
    ],
  );

  const r = result.rows[0];
  return NextResponse.json(
    ok({
      id: r.id,
      nombre: r.nombre,
      dniNie: r.dni_nie,
      telefono: r.telefono ?? null,
      correo: r.correo ?? null,
      createdAt: r.created_at,
    }),
    { status: 201 },
  );
}
