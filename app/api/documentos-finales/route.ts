import fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";

import { fail, ok } from "@/lib/api/responses";
import { getSession } from "@/lib/auth/session";
import { query } from "@/lib/db/pool";
import { notificarInstaladora } from "@/lib/notificaciones/crear";
import { ensureDir, getDocumentoFinalPath } from "@/lib/storage/paths";
import { validateMagicBytes } from "@/lib/storage/validate-mime";

const ALLOWED_MIME: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};
const MAX_PDF = 15 * 1024 * 1024;
const MAX_IMG = 4 * 1024 * 1024;

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(fail("unauthenticated", "No autenticado."), { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const expedienteId = searchParams.get("expediente_id");
  if (!expedienteId) {
    return NextResponse.json(fail("missing_param", "Parámetro expediente_id requerido."), { status: 400 });
  }

  // Scope check for instaladoras
  if (session.rol === "instaladora_propietario" || session.rol === "instaladora_gestor") {
    const check = await query(
      `SELECT id FROM expedientes WHERE id = $1 AND instaladora_id = $2`,
      [expedienteId, session.instaladoraId],
    );
    if (!check.rows[0]) {
      return NextResponse.json(fail("forbidden", "Sin acceso."), { status: 403 });
    }
  }

  const result = await query(
    `SELECT id, fase, titulo, estado, nombre_archivo, storage_path, created_at
     FROM documentos_finales
     WHERE expediente_id = $1
     ORDER BY created_at ASC`,
    [expedienteId],
  );

  return NextResponse.json(
    ok(
      result.rows.map((r) => ({
        id: r.id,
        fase: r.fase,
        titulo: r.titulo,
        estado: r.estado,
        nombreArchivo: r.nombre_archivo ?? null,
        storagePath: r.storage_path ?? null,
        createdAt: r.created_at,
      })),
    ),
  );
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(fail("unauthenticated", "No autenticado."), { status: 401 });
  }

  if (session.rol !== "operativo" && session.rol !== "admin") {
    return NextResponse.json(fail("forbidden", "Solo operativo puede subir documentos finales."), { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(fail("invalid_body", "Se esperaba multipart/form-data."), { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const expedienteId = formData.get("expediente_id") as string | null;
  const fase = formData.get("fase") as string | null;
  const titulo = formData.get("titulo") as string | null;

  if (!file || !(file instanceof File)) {
    return NextResponse.json(fail("missing_file", "Campo 'file' requerido."), { status: 400 });
  }
  if (!expedienteId || !fase || !titulo) {
    return NextResponse.json(
      fail("missing_fields", "Campos 'expediente_id', 'fase' y 'titulo' son requeridos."),
      { status: 400 },
    );
  }

  const mime = file.type;
  if (!ALLOWED_MIME[mime]) {
    return NextResponse.json(
      fail("invalid_mime", `Tipo no permitido: ${mime}. Usa PDF, JPEG, PNG o WEBP.`),
      { status: 422 },
    );
  }

  const maxSize = mime === "application/pdf" ? MAX_PDF : MAX_IMG;
  if (file.size > maxSize) {
    const limitMB = maxSize / 1024 / 1024;
    return NextResponse.json(
      fail("file_too_large", `El archivo supera el límite de ${limitMB} MB.`),
      { status: 422 },
    );
  }

  if (!(await validateMagicBytes(file, mime))) {
    return NextResponse.json(
      fail("invalid_file_content", "El contenido del archivo no coincide con el tipo declarado."),
      { status: 422 },
    );
  }

  // Get instaladora_id from expediente
  const expResult = await query(
    `SELECT instaladora_id FROM expedientes WHERE id = $1`,
    [expedienteId],
  );
  if (!expResult.rows[0]) {
    return NextResponse.json(fail("not_found", "Expediente no encontrado."), { status: 404 });
  }

  const instaladoraId = expResult.rows[0].instaladora_id as string;

  // Insert DB record first to get the ID for the path
  const insertResult = await query(
    `INSERT INTO documentos_finales (expediente_id, fase, titulo, estado, nombre_archivo, mime_type, tamano_bytes, subido_por)
     VALUES ($1, $2, $3, 'Pendiente', $4, $5, $6, $7)
     RETURNING id`,
    [expedienteId, fase.trim(), titulo.trim(), file.name, mime, file.size, session.userId],
  );

  const newId = insertResult.rows[0].id as string;
  const docIdShort = newId.replace(/-/g, "").slice(0, 8);

  const storagePath = getDocumentoFinalPath(instaladoraId, expedienteId, fase, docIdShort, file.name);
  await ensureDir(storagePath);
  const bytes = await file.arrayBuffer();
  await fs.writeFile(storagePath, Buffer.from(bytes));

  await query(
    `UPDATE documentos_finales SET storage_path = $1, updated_at = NOW() WHERE id = $2`,
    [storagePath, newId],
  );

  notificarInstaladora(instaladoraId, {
    tipo: "documento_final_subido",
    titulo: `Documento final subido`,
    mensaje: `${fase} — ${titulo.trim()}`,
    entidadTipo: "expedientes",
    entidadId: expedienteId,
    // Todavía no es descargable (falta marcarlo Disponible), no amerita correo.
  }).catch(() => {});

  return NextResponse.json(
    ok({ id: newId, fase, titulo: titulo.trim(), estado: "Pendiente", nombreArchivo: file.name }),
    { status: 201 },
  );
}
