import { NextRequest, NextResponse } from "next/server";

import { fail, ok } from "@/lib/api/responses";
import { getSession } from "@/lib/auth/session";
import pool, { query } from "@/lib/db/pool";
import { notificarRol } from "@/lib/notificaciones/crear";
import { isInstaladora } from "@/lib/permissions/guards";
import { DOCUMENTOS_ENTRADA_OBLIGATORIOS } from "@/modules/documentos/constants";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(fail("unauthenticated", "No autenticado."), { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
  const offset = (page - 1) * limit;
  const estado = searchParams.get("estado");
  const servicio = searchParams.get("servicio");
  const search = searchParams.get("search")?.trim();

  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (isInstaladora(session.rol as "instaladora_propietario" | "instaladora_gestor")) {
    conditions.push(`e.instaladora_id = $${idx++}`);
    params.push(session.instaladoraId);
  }
  if (estado) {
    conditions.push(`e.estado = $${idx++}`);
    params.push(estado);
  }
  if (servicio) {
    conditions.push(`e.servicio = $${idx++}`);
    params.push(servicio);
  }
  if (search) {
    conditions.push(`(e.codigo ILIKE $${idx} OR ins.nombre ILIKE $${idx} OR cf.nombre ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await query(
    `SELECT COUNT(*) AS total
     FROM expedientes e
     JOIN instaladoras ins ON ins.id = e.instaladora_id
     JOIN clientes_finales cf ON cf.id = e.cliente_final_id
     ${where}`,
    params,
  );
  const total = parseInt(countResult.rows[0].total, 10);

  const dataResult = await query(
    `SELECT
       e.id, e.codigo, e.instaladora_id, ins.nombre AS instaladora,
       cf.id AS cliente_id, cf.nombre AS cliente,
       e.municipio, e.provincia, e.estado, e.servicio,
       e.responsable_id, COALESCE(u.nombre, 'Sin asignar') AS responsable,
       e.potencia_kw, e.distribuidora,
       e.created_at, e.updated_at
     FROM expedientes e
     JOIN instaladoras ins ON ins.id = e.instaladora_id
     JOIN clientes_finales cf ON cf.id = e.cliente_final_id
     LEFT JOIN usuarios u ON u.id = e.responsable_id
     ${where}
     ORDER BY e.created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset],
  );

  const data = dataResult.rows.map((r) => ({
    id: r.id,
    codigo: r.codigo,
    instaladoraId: r.instaladora_id,
    instaladora: r.instaladora,
    clienteId: r.cliente_id,
    cliente: r.cliente,
    municipio: r.municipio,
    provincia: r.provincia,
    estado: r.estado,
    servicio: r.servicio,
    responsableId: r.responsable_id ?? null,
    responsable: r.responsable,
    potenciaKw: parseFloat(r.potencia_kw),
    distribuidora: r.distribuidora,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  return NextResponse.json(ok({ data, total, page, limit }));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(fail("unauthenticated", "No autenticado."), { status: 401 });
  }
  if (!isInstaladora(session.rol as "instaladora_propietario" | "instaladora_gestor")) {
    return NextResponse.json(fail("forbidden", "Solo instaladoras pueden crear expedientes."), { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json(fail("validation_error", "Body inválido."), { status: 400 });
  }

  const {
    clienteNombre, clienteDni, clienteTelefono, clienteCorreo,
    servicio, direccion, municipio, provincia, codigoPostal, distribuidora, observaciones,
    potenciaKw, marcaPanel, modeloPanel, cantidadPaneles,
    marcaInversor, modeloInversor, potenciaInversorKwp, modalidadAutoconsumo,
  } = body;

  const required: Record<string, unknown> = {
    clienteNombre, clienteDni, servicio, direccion, municipio, provincia,
    distribuidora, potenciaKw, marcaPanel, modeloPanel, cantidadPaneles,
    marcaInversor, modeloInversor, potenciaInversorKwp, modalidadAutoconsumo,
  };
  for (const [field, value] of Object.entries(required)) {
    if (value === undefined || value === null || value === "") {
      return NextResponse.json(fail("validation_error", `Campo requerido: ${field}.`), { status: 400 });
    }
  }

  const instaladoraId = session.instaladoraId!;
  const userId = session.userId;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const clienteResult = await client.query(
      `INSERT INTO clientes_finales (instaladora_id, nombre, dni_nie, telefono, correo)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (instaladora_id, dni_nie) DO UPDATE
         SET nombre = EXCLUDED.nombre,
             telefono = COALESCE(EXCLUDED.telefono, clientes_finales.telefono),
             correo = COALESCE(EXCLUDED.correo, clientes_finales.correo)
       RETURNING id`,
      [instaladoraId, clienteNombre, String(clienteDni).toUpperCase(), clienteTelefono || null, clienteCorreo || null],
    );
    const clienteId = clienteResult.rows[0].id;

    const expResult = await client.query(
      `INSERT INTO expedientes (
         instaladora_id, cliente_final_id, created_by,
         servicio, direccion, municipio, provincia, codigo_postal, distribuidora, observaciones,
         potencia_kw, marca_panel, modelo_panel, cantidad_paneles,
         marca_inversor, modelo_inversor, potencia_inversor_kwp, modalidad_autoconsumo
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       RETURNING id, codigo`,
      [
        instaladoraId, clienteId, userId,
        servicio, direccion, municipio, provincia, codigoPostal || null, distribuidora, observaciones || null,
        potenciaKw, marcaPanel, modeloPanel, cantidadPaneles,
        marcaInversor, modeloInversor, potenciaInversorKwp, modalidadAutoconsumo,
      ],
    );
    const { id: expedienteId, codigo } = expResult.rows[0];

    for (const tipo of DOCUMENTOS_ENTRADA_OBLIGATORIOS) {
      await client.query(
        `INSERT INTO documentos_entrada (expediente_id, tipo_documento) VALUES ($1, $2)`,
        [expedienteId, tipo],
      );
    }

    await client.query(
      `INSERT INTO historial_expediente (expediente_id, titulo, estado_nuevo, actor_usuario_id)
       VALUES ($1, 'Expediente creado', 'Recibido', $2)`,
      [expedienteId, userId],
    );

    client.query(
      `INSERT INTO auditoria (actor_usuario_id, accion, entidad_tipo, entidad_id)
       VALUES ($1, 'crear_expediente', 'expedientes', $2)`,
      [userId, expedienteId],
    ).catch(() => {});

    await client.query("COMMIT");

    (async () => {
      const ins = await query(`SELECT nombre FROM instaladoras WHERE id = $1`, [instaladoraId]);
      const instaladoraNombre = ins.rows[0]?.nombre ?? "Instaladora";
      await notificarRol(["admin", "operativo"], {
        tipo: "expediente_nuevo",
        titulo: `Nuevo expediente — ${instaladoraNombre}`,
        mensaje: `${codigo} · ${servicio}`,
        entidadTipo: "expedientes",
        entidadId: expedienteId,
      });
    })().catch(() => {});

    return NextResponse.json(ok({ id: expedienteId, codigo }), { status: 201 });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error creando expediente:", err);
    return NextResponse.json(fail("server_error", "Error interno al crear el expediente."), { status: 500 });
  } finally {
    client.release();
  }
}
