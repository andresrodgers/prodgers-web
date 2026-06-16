import fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";

import { fail, ok } from "@/lib/api/responses";
import { getSession } from "@/lib/auth/session";
import { query } from "@/lib/db/pool";
import { notificarRol } from "@/lib/notificaciones/crear";
import { isInstaladora } from "@/lib/permissions/guards";
import { ensureDir, getDocumentoEntradaPath } from "@/lib/storage/paths";
import { validateMagicBytes } from "@/lib/storage/validate-mime";

const ALLOWED_MIME: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};
const MAX_PDF = 15 * 1024 * 1024;
const MAX_IMG = 4 * 1024 * 1024;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(fail("unauthenticated", "No autenticado."), { status: 401 });
  }
  if (!isInstaladora(session.rol as "instaladora_propietario" | "instaladora_gestor")) {
    return NextResponse.json(fail("forbidden", "Solo instaladoras pueden subir documentos."), { status: 403 });
  }

  const { id: docId } = await params;

  // Verify document belongs to this instaladora
  const docResult = await query(
    `SELECT de.id, de.expediente_id, de.tipo_documento, de.estado, de.version,
            e.instaladora_id
     FROM documentos_entrada de
     JOIN expedientes e ON e.id = de.expediente_id
     WHERE de.id = $1 AND e.instaladora_id = $2`,
    [docId, session.instaladoraId],
  );

  if (!docResult.rows[0]) {
    return NextResponse.json(fail("not_found", "Documento no encontrado."), { status: 404 });
  }

  const doc = docResult.rows[0];

  if (doc.estado === "Validado") {
    return NextResponse.json(fail("invalid_state", "El documento ya está validado y no se puede reemplazar."), { status: 409 });
  }

  // Parse multipart form data
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(fail("invalid_body", "Se esperaba multipart/form-data."), { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file || !(file instanceof File)) {
    return NextResponse.json(fail("missing_file", "Campo 'file' requerido."), { status: 400 });
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

  // Determine version and whether to update in place or insert new
  const isPendiente = doc.estado === "Pendiente";
  const newVersion = isPendiente ? 1 : doc.version + 1;
  const docIdShort = docId.replace(/-/g, "").slice(0, 8);
  const storagePath = getDocumentoEntradaPath(
    session.instaladoraId!,
    doc.expediente_id,
    doc.tipo_documento,
    newVersion,
    docIdShort,
    file.name,
  );

  // Write file to disk
  await ensureDir(storagePath);
  const bytes = await file.arrayBuffer();
  await fs.writeFile(storagePath, Buffer.from(bytes));

  const nombreArchivo = file.name;

  if (isPendiente) {
    // Update the existing Pendiente row in place
    await query(
      `UPDATE documentos_entrada
       SET estado = 'Subido', storage_path = $1, nombre_archivo = $2,
           mime_type = $3, tamano_bytes = $4, version = 1,
           subido_por = $5
       WHERE id = $6`,
      [storagePath, nombreArchivo, mime, file.size, session.userId, docId],
    );

    notificarRol(["admin", "operativo"], {
      tipo: "documento_subido",
      titulo: `Documento subido`,
      mensaje: `${doc.tipo_documento} · Expediente ${doc.expediente_id}`,
      entidadTipo: "expedientes",
      entidadId: doc.expediente_id as string,
    }).catch(() => {});

    return NextResponse.json(ok({ id: docId, version: 1, estado: "Subido", nombreArchivo }));
  } else {
    // Insert replacement row
    const insertResult = await query(
      `INSERT INTO documentos_entrada
         (expediente_id, tipo_documento, estado, version, storage_path,
          nombre_archivo, mime_type, tamano_bytes, reemplaza_documento_id, subido_por)
       VALUES ($1, $2, 'Subido', $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        doc.expediente_id, doc.tipo_documento, newVersion, storagePath,
        nombreArchivo, mime, file.size, docId, session.userId,
      ],
    );

    // Mark previous as Reemplazado
    await query(
      `UPDATE documentos_entrada SET estado = 'Reemplazado' WHERE id = $1`,
      [docId],
    );

    const newId = insertResult.rows[0].id as string;

    notificarRol(["admin", "operativo"], {
      tipo: "documento_subido",
      titulo: `Documento reemplazado`,
      mensaje: `${doc.tipo_documento} · Expediente ${doc.expediente_id}`,
      entidadTipo: "expedientes",
      entidadId: doc.expediente_id as string,
    }).catch(() => {});

    return NextResponse.json(ok({ id: newId, version: newVersion, estado: "Subido", nombreArchivo }));
  }
}
