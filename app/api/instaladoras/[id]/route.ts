import { NextResponse } from "next/server";

import { fail, ok } from "@/lib/api/responses";
import { getSession } from "@/lib/auth/session";
import { query } from "@/lib/db/pool";

// ─── GET /api/instaladoras/[id] ──────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json(fail("unauthenticated", "No autenticado."), { status: 401 });
  if (session.rol !== "admin") return NextResponse.json(fail("forbidden", "Solo administradores."), { status: 403 });

  const { id } = await params;

  const [mainResult, usuarioResult, expedientesResult, tasasResult] = await Promise.all([
    query(
      `SELECT i.*, COALESCE(SUM(t.monto), 0) AS gastado
       FROM instaladoras i
       LEFT JOIN tasas t ON t.instaladora_id = i.id
       WHERE i.id = $1
       GROUP BY i.id`,
      [id],
    ),
    query(
      `SELECT id, nombre, identificador_legal, estado, debe_cambiar_password
       FROM usuarios
       WHERE instaladora_id = $1 AND rol = 'instaladora_propietario'
       LIMIT 1`,
      [id],
    ),
    query(
      `SELECT id, codigo, estado, municipio, servicio, created_at
       FROM expedientes
       WHERE instaladora_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [id],
    ),
    query(
      `SELECT t.id, t.expediente_id, e.codigo AS expediente_codigo, t.concepto, t.monto, t.created_at
       FROM tasas t
       JOIN expedientes e ON e.id = t.expediente_id
       WHERE t.instaladora_id = $1
       ORDER BY t.created_at DESC
       LIMIT 50`,
      [id],
    ),
  ]);

  if (!mainResult.rows[0]) {
    return NextResponse.json(fail("not_found", "Instaladora no encontrada."), { status: 404 });
  }

  const i = mainResult.rows[0];
  const saldoBase = parseFloat(i.saldo_base);
  const gastado = parseFloat(i.gastado);

  const up = usuarioResult.rows[0] ?? null;
  const usuarioPropietario = up
    ? {
        id: up.id,
        nombre: up.nombre,
        identificadorLegal: up.identificador_legal,
        estado: up.estado,
        debeCambiarPassword: up.debe_cambiar_password,
      }
    : null;

  const expedientes = expedientesResult.rows.map((e) => ({
    id: e.id,
    codigo: e.codigo,
    estado: e.estado,
    municipio: e.municipio,
    servicio: e.servicio,
    createdAt: e.created_at,
  }));

  const tasas = tasasResult.rows.map((t) => ({
    id: t.id,
    expedienteId: t.expediente_id,
    expedienteCodigo: t.expediente_codigo,
    concepto: t.concepto,
    monto: parseFloat(t.monto),
    createdAt: t.created_at,
  }));

  return NextResponse.json(
    ok({
      id: i.id,
      nombre: i.nombre,
      cif: i.cif,
      contacto: i.contacto,
      telefono: i.telefono,
      email: i.email,
      estado: i.estado,
      saldoBase,
      gastado,
      disponible: saldoBase - gastado,
      usuarioPropietario,
      expedientes,
      tasas,
    }),
  );
}

// ─── PATCH /api/instaladoras/[id] ────────────────────────────────

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json(fail("unauthenticated", "No autenticado."), { status: 401 });
  if (session.rol !== "admin") return NextResponse.json(fail("forbidden", "Solo administradores."), { status: 403 });

  const { id } = await params;
  const body = await req.json() as Record<string, unknown>;

  // Map camelCase → snake_case for allowed fields
  const fieldMap: Record<string, string> = {
    nombre: "nombre",
    cif: "cif",
    contacto: "contacto",
    telefono: "telefono",
    email: "email",
    estado: "estado",
    saldoBase: "saldo_base",
  };

  const setClauses: string[] = [];
  const values: unknown[] = [];

  for (const [camel, snake] of Object.entries(fieldMap)) {
    if (body[camel] !== undefined) {
      values.push(body[camel]);
      setClauses.push(`${snake} = $${values.length}`);
    }
  }

  if (setClauses.length === 0) {
    return NextResponse.json(fail("validation", "No hay campos para actualizar."), { status: 400 });
  }

  values.push(id);
  const result = await query(
    `UPDATE instaladoras SET ${setClauses.join(", ")}, updated_at = NOW()
     WHERE id = $${values.length}
     RETURNING id, nombre, cif, contacto, telefono, email, estado, saldo_base`,
    values,
  );

  if (!result.rows[0]) {
    return NextResponse.json(fail("not_found", "Instaladora no encontrada."), { status: 404 });
  }

  const r = result.rows[0];
  return NextResponse.json(
    ok({
      id: r.id,
      nombre: r.nombre,
      cif: r.cif,
      contacto: r.contacto,
      telefono: r.telefono,
      email: r.email,
      estado: r.estado,
      saldoBase: parseFloat(r.saldo_base),
    }),
  );
}
