import { NextRequest, NextResponse } from "next/server";

import { fail, ok } from "@/lib/api/responses";
import { getSession } from "@/lib/auth/session";
import { query } from "@/lib/db/pool";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json(fail("unauthenticated", "No autenticado."), { status: 401 });
  if (session.rol !== "admin") return NextResponse.json(fail("forbidden", "Solo administradores."), { status: 403 });

  const { searchParams } = req.nextUrl;
  const accion = searchParams.get("accion");
  const entidadTipo = searchParams.get("entidad_tipo");
  const actorId = searchParams.get("actor_id");
  const desde = searchParams.get("desde");
  const hasta = searchParams.get("hasta");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (accion) {
    params.push(accion);
    conditions.push(`a.accion = $${params.length}`);
  }
  if (entidadTipo) {
    params.push(entidadTipo);
    conditions.push(`a.entidad_tipo = $${params.length}`);
  }
  if (actorId) {
    params.push(actorId);
    conditions.push(`a.actor_usuario_id = $${params.length}`);
  }
  if (desde) {
    params.push(desde);
    conditions.push(`a.created_at >= $${params.length}::date`);
  }
  if (hasta) {
    params.push(hasta);
    conditions.push(`a.created_at < ($${params.length}::date + interval '1 day')`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await query(
    `SELECT COUNT(*) AS total FROM auditoria a ${where}`,
    params,
  );
  const total = parseInt(countResult.rows[0].total, 10);

  const dataResult = await query(
    `SELECT a.id, a.accion, a.entidad_tipo, a.entidad_id, a.ip_address, a.created_at,
            u.nombre AS actor_nombre, u.rol AS actor_rol, u.identificador_legal AS actor_identificador
     FROM auditoria a
     LEFT JOIN usuarios u ON u.id = a.actor_usuario_id
     ${where}
     ORDER BY a.created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset],
  );

  return NextResponse.json(ok({
    data: dataResult.rows.map((r) => ({
      id: r.id,
      accion: r.accion,
      entidadTipo: r.entidad_tipo,
      entidadId: r.entidad_id,
      ipAddress: r.ip_address,
      createdAt: r.created_at,
      actor: r.actor_nombre
        ? { nombre: r.actor_nombre, rol: r.actor_rol, identificador: r.actor_identificador }
        : null,
    })),
    total,
    page,
    limit,
  }));
}
