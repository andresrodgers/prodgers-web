import { NextRequest, NextResponse } from "next/server";

import { fail, ok } from "@/lib/api/responses";
import { getSession } from "@/lib/auth/session";
import { query } from "@/lib/db/pool";
import { isProdgers } from "@/lib/permissions/guards";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(fail("unauthenticated", "No autenticado."), { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const expedienteId = searchParams.get("expediente_id");

  // Listado por expediente (instaladora o prodgers)
  if (expedienteId) {
    const result = await query(
      `SELECT id, concepto, monto, created_at FROM tasas WHERE expediente_id = $1 ORDER BY created_at DESC`,
      [expedienteId],
    );
    return NextResponse.json(
      ok(result.rows.map((t) => ({
        id: t.id,
        concepto: t.concepto,
        monto: parseFloat(t.monto),
        createdAt: t.created_at,
      }))),
    );
  }

  // Listado global — solo admin/operativo
  if (!isProdgers(session.rol as "operativo" | "admin")) {
    return NextResponse.json(fail("forbidden", "Sin acceso."), { status: 403 });
  }

  const instaladoraId = searchParams.get("instaladora_id");
  const desde = searchParams.get("desde");
  const hasta = searchParams.get("hasta");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (instaladoraId) {
    params.push(instaladoraId);
    conditions.push(`t.instaladora_id = $${params.length}`);
  }
  if (desde) {
    params.push(desde);
    conditions.push(`t.created_at >= $${params.length}::date`);
  }
  if (hasta) {
    params.push(hasta);
    conditions.push(`t.created_at < ($${params.length}::date + interval '1 day')`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await query(
    `SELECT COUNT(*) AS total FROM tasas t ${where}`,
    params,
  );
  const total = parseInt(countResult.rows[0].total, 10);

  const dataResult = await query(
    `SELECT t.id, t.concepto, t.monto, t.created_at,
            e.codigo AS expediente_codigo, e.id AS expediente_id,
            i.nombre AS instaladora_nombre, i.id AS instaladora_id
     FROM tasas t
     JOIN expedientes e ON e.id = t.expediente_id
     JOIN instaladoras i ON i.id = t.instaladora_id
     ${where}
     ORDER BY t.created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset],
  );

  const totalMonto = await query(
    `SELECT COALESCE(SUM(t.monto), 0) AS total_monto FROM tasas t ${where}`,
    params,
  );

  return NextResponse.json(ok({
    data: dataResult.rows.map((t) => ({
      id: t.id,
      concepto: t.concepto,
      monto: parseFloat(t.monto),
      createdAt: t.created_at,
      expedienteId: t.expediente_id,
      expedienteCodigo: t.expediente_codigo,
      instaladoraId: t.instaladora_id,
      instaladoraNombre: t.instaladora_nombre,
    })),
    total,
    page,
    limit,
    totalMonto: parseFloat(totalMonto.rows[0].total_monto),
  }));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(fail("unauthenticated", "No autenticado."), { status: 401 });
  }
  if (!isProdgers(session.rol as "operativo" | "admin")) {
    return NextResponse.json(fail("forbidden", "Solo PRODGERS puede registrar tasas."), { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.expedienteId || !body?.concepto || !body?.monto) {
    return NextResponse.json(fail("validation_error", "expedienteId, concepto y monto son requeridos."), { status: 400 });
  }

  const monto = parseFloat(body.monto);
  if (isNaN(monto) || monto <= 0) {
    return NextResponse.json(fail("validation_error", "Monto debe ser mayor que 0."), { status: 400 });
  }

  const expResult = await query(
    `SELECT id, instaladora_id FROM expedientes WHERE id = $1`,
    [body.expedienteId],
  );
  if (!expResult.rows[0]) {
    return NextResponse.json(fail("not_found", "Expediente no encontrado."), { status: 404 });
  }
  const { instaladora_id: instaladoraId } = expResult.rows[0];

  const result = await query(
    `INSERT INTO tasas (expediente_id, instaladora_id, concepto, monto, registrado_por)
     VALUES ($1, $2, $3, $4, $5) RETURNING id, concepto, monto, created_at`,
    [body.expedienteId, instaladoraId, body.concepto, monto, session.userId],
  );

  const tasa = result.rows[0];

  await query(
    `INSERT INTO historial_expediente (expediente_id, titulo, actor_usuario_id)
     VALUES ($1, $2, $3)`,
    [body.expedienteId, `Tasa registrada: ${body.concepto} (${monto.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €)`, session.userId],
  );

  query(
    `INSERT INTO auditoria (actor_usuario_id, accion, entidad_tipo, entidad_id)
     VALUES ($1, 'registrar_tasa', 'tasas', $2)`,
    [session.userId, tasa.id],
  ).catch(() => {});

  return NextResponse.json(
    ok({ id: tasa.id, concepto: tasa.concepto, monto: parseFloat(tasa.monto), createdAt: tasa.created_at }),
    { status: 201 },
  );
}
