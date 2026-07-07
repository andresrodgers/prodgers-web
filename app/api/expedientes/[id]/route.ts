import { NextRequest, NextResponse } from "next/server";

import { fail, ok } from "@/lib/api/responses";
import { getSession } from "@/lib/auth/session";
import { query } from "@/lib/db/pool";
import { notificarInstaladora } from "@/lib/notificaciones/crear";
import { isInstaladora, isProdgers } from "@/lib/permissions/guards";
import { TIPO_DOCUMENTO_LABEL } from "@/modules/documentos/constants";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(fail("unauthenticated", "No autenticado."), { status: 401 });
  }

  const { id } = await params;

  const expResult = await query(
    `SELECT
       e.id, e.codigo, e.instaladora_id, ins.nombre AS instaladora,
       cf.id AS cliente_id, cf.nombre AS cliente,
       cf.dni_nie AS cliente_dni, cf.telefono AS cliente_telefono, cf.correo AS cliente_correo,
       e.municipio, e.provincia, e.direccion, e.codigo_postal, e.distribuidora, e.cups, e.estado, e.servicio,
       e.responsable_id, COALESCE(u.nombre, 'Sin asignar') AS responsable,
       e.potencia_kw, e.potencia_inversor_kwp,
       e.marca_panel, e.modelo_panel, e.cantidad_paneles, e.potencia_panel_wp,
       e.marca_inversor, e.modelo_inversor, e.modalidad_autoconsumo,
       e.observaciones, e.created_at, e.updated_at
     FROM expedientes e
     JOIN instaladoras ins ON ins.id = e.instaladora_id
     JOIN clientes_finales cf ON cf.id = e.cliente_final_id
     LEFT JOIN usuarios u ON u.id = e.responsable_id
     WHERE e.id = $1`,
    [id],
  );

  if (!expResult.rows[0]) {
    return NextResponse.json(fail("not_found", "Expediente no encontrado."), { status: 404 });
  }

  const e = expResult.rows[0];

  if (isInstaladora(session.rol as "instaladora_propietario" | "instaladora_gestor") && session.instaladoraId !== e.instaladora_id) {
    return NextResponse.json(fail("forbidden", "Sin acceso a este expediente."), { status: 403 });
  }

  const [docsEntrada, docsFinales, historial, correcciones, tasas] = await Promise.all([
    query(`SELECT id, tipo_documento, estado, version, nombre_archivo, storage_path, created_at
           FROM documentos_entrada WHERE expediente_id = $1 ORDER BY tipo_documento`, [id]),
    query(`SELECT id, fase, titulo, estado, nombre_archivo, storage_path, created_at
           FROM documentos_finales WHERE expediente_id = $1 ORDER BY created_at`, [id]),
    query(`SELECT id, titulo, descripcion, estado_anterior, estado_nuevo, created_at
           FROM historial_expediente WHERE expediente_id = $1 ORDER BY created_at DESC`, [id]),
    query(`SELECT id, campo_afectado, nota, estado, created_at
           FROM correcciones WHERE expediente_id = $1 ORDER BY created_at DESC`, [id]),
    query(`SELECT id, concepto, monto, created_at
           FROM tasas WHERE expediente_id = $1 ORDER BY created_at DESC`, [id]),
  ]);

  const esOperativo = session.rol === "operativo";
  const data = {
    id: e.id,
    codigo: e.codigo,
    instaladoraId: e.instaladora_id,
    instaladora: e.instaladora,
    clienteId: e.cliente_id,
    cliente: e.cliente,
    clienteDni: e.cliente_dni,
    clienteTelefono: esOperativo ? null : (e.cliente_telefono ?? null),
    clienteCorreo: esOperativo ? null : (e.cliente_correo ?? null),
    municipio: e.municipio,
    provincia: e.provincia,
    direccion: e.direccion,
    codigoPostal: e.codigo_postal ?? null,
    distribuidora: e.distribuidora,
    cups: e.cups ?? null,
    estado: e.estado,
    servicio: e.servicio,
    responsableId: e.responsable_id ?? null,
    responsable: e.responsable,
    potenciaKw: parseFloat(e.potencia_kw),
    potenciaInversorKwp: parseFloat(e.potencia_inversor_kwp),
    marcaPanel: e.marca_panel,
    modeloPanel: e.modelo_panel,
    cantidadPaneles: parseInt(e.cantidad_paneles, 10),
    potenciaPanelWp: e.potencia_panel_wp !== null ? parseFloat(e.potencia_panel_wp) : null,
    marcaInversor: e.marca_inversor,
    modeloInversor: e.modelo_inversor,
    modalidadAutoconsumo: e.modalidad_autoconsumo,
    observaciones: e.observaciones ?? null,
    createdAt: e.created_at,
    updatedAt: e.updated_at,
    documentosEntrada: docsEntrada.rows.map((d) => ({
      id: d.id,
      tipo: d.tipo_documento,
      titulo: TIPO_DOCUMENTO_LABEL[d.tipo_documento] ?? d.tipo_documento,
      estado: d.estado,
      version: d.version,
      nombreArchivo: d.nombre_archivo ?? null,
      storagePath: d.storage_path ?? null,
      createdAt: d.created_at,
    })),
    documentosFinales: docsFinales.rows.map((d) => ({
      id: d.id,
      fase: d.fase,
      titulo: d.titulo,
      estado: d.estado,
      nombreArchivo: d.nombre_archivo ?? null,
      storagePath: d.storage_path ?? null,
      createdAt: d.created_at,
    })),
    historial: historial.rows.map((h) => ({
      id: h.id,
      titulo: h.titulo,
      descripcion: h.descripcion ?? null,
      estadoAnterior: h.estado_anterior ?? null,
      estadoNuevo: h.estado_nuevo ?? null,
      createdAt: h.created_at,
    })),
    correcciones: correcciones.rows.map((c) => ({
      id: c.id,
      campoAfectado: c.campo_afectado,
      nota: c.nota,
      estado: c.estado,
      createdAt: c.created_at,
    })),
    tasas: tasas.rows.map((t) => ({
      id: t.id,
      concepto: t.concepto,
      monto: parseFloat(t.monto),
      createdAt: t.created_at,
    })),
  };

  return NextResponse.json(ok(data));
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(fail("unauthenticated", "No autenticado."), { status: 401 });
  }

  const { id } = await params;

  const expResult = await query(
    `SELECT id, codigo, instaladora_id, estado, responsable_id FROM expedientes WHERE id = $1`,
    [id],
  );
  if (!expResult.rows[0]) {
    return NextResponse.json(fail("not_found", "Expediente no encontrado."), { status: 404 });
  }
  const exp = expResult.rows[0];

  if (isInstaladora(session.rol as "instaladora_propietario" | "instaladora_gestor") && session.instaladoraId !== exp.instaladora_id) {
    return NextResponse.json(fail("forbidden", "Sin acceso a este expediente."), { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json(fail("validation_error", "Body inválido."), { status: 400 });
  }

  const userId = session.userId;

  // Cambiar estado (solo prodgers)
  if (body.estado !== undefined) {
    if (!isProdgers(session.rol as "operativo" | "admin")) {
      return NextResponse.json(fail("forbidden", "Solo PRODGERS puede cambiar el estado."), { status: 403 });
    }
    const estadoAnterior = exp.estado;
    await query(
      `UPDATE expedientes SET estado = $1, updated_by = $2 WHERE id = $3`,
      [body.estado, userId, id],
    );
    await query(
      `INSERT INTO historial_expediente (expediente_id, titulo, descripcion, estado_anterior, estado_nuevo, actor_usuario_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        id,
        `Estado actualizado a "${body.estado}"`,
        body.descripcion || null,
        estadoAnterior,
        body.estado,
        userId,
      ],
    );
    if (body.estado === "Documentacion pendiente" && body.campoAfectado) {
      await query(
        `INSERT INTO correcciones (expediente_id, campo_afectado, nota, solicitado_por)
         VALUES ($1, $2, $3, $4)`,
        [id, body.campoAfectado, body.descripcion || "Se solicita corrección.", userId],
      );
    }
    query(
      `INSERT INTO auditoria (actor_usuario_id, accion, entidad_tipo, entidad_id)
       VALUES ($1, 'cambio_estado', 'expedientes', $2)`,
      [userId, id],
    ).catch(() => {});
    notificarInstaladora(exp.instaladora_id as string, {
      tipo: "estado_actualizado",
      titulo: `Expediente actualizado — ${exp.codigo}`,
      mensaje: `El estado cambió a "${body.estado}"`,
      entidadTipo: "expedientes",
      entidadId: id,
    }).catch(() => {});
    return NextResponse.json(ok({ estado: body.estado }));
  }

  // Asignar responsable (solo prodgers)
  if (body.responsableId !== undefined) {
    if (!isProdgers(session.rol as "operativo" | "admin")) {
      return NextResponse.json(fail("forbidden", "Solo PRODGERS puede asignar responsable."), { status: 403 });
    }
    const nombreResult = await query(`SELECT nombre FROM usuarios WHERE id = $1`, [body.responsableId]);
    const nombre = nombreResult.rows[0]?.nombre ?? "Operativo";
    await query(
      `UPDATE expedientes SET responsable_id = $1, updated_by = $2 WHERE id = $3`,
      [body.responsableId, userId, id],
    );
    await query(
      `INSERT INTO historial_expediente (expediente_id, titulo, actor_usuario_id)
       VALUES ($1, $2, $3)`,
      [id, `Expediente asignado a ${nombre}`, userId],
    );
    return NextResponse.json(ok({ responsableId: body.responsableId, responsable: nombre }));
  }

  // Actualizar CUPS u observaciones
  const updates: string[] = [];
  const vals: unknown[] = [];
  let vi = 1;

  if (body.cups !== undefined) {
    updates.push(`cups = $${vi++}`);
    vals.push(body.cups || null);
  }
  if (body.observaciones !== undefined) {
    updates.push(`observaciones = $${vi++}`);
    vals.push(body.observaciones || null);
  }

  if (updates.length === 0) {
    return NextResponse.json(fail("validation_error", "Nada que actualizar."), { status: 400 });
  }

  updates.push(`updated_by = $${vi++}`);
  vals.push(userId);
  vals.push(id);

  await query(`UPDATE expedientes SET ${updates.join(", ")} WHERE id = $${vi}`, vals);
  return NextResponse.json(ok({ updated: true }));
}
