import fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

import { fail } from "@/lib/api/responses";
import { getSession } from "@/lib/auth/session";
import { query } from "@/lib/db/pool";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(fail("unauthenticated", "No autenticado."), { status: 401 });
  }

  const { id: docId } = await params;

  const docResult = await query(
    `SELECT df.storage_path, df.nombre_archivo, df.mime_type, df.estado,
            e.instaladora_id
     FROM documentos_finales df
     JOIN expedientes e ON e.id = df.expediente_id
     WHERE df.id = $1`,
    [docId],
  );

  if (!docResult.rows[0]) {
    return NextResponse.json(fail("not_found", "Documento no encontrado."), { status: 404 });
  }

  const doc = docResult.rows[0];

  // Instaladoras can only download their own expediente docs
  if (
    session.rol === "instaladora_propietario" ||
    session.rol === "instaladora_gestor"
  ) {
    if (doc.instaladora_id !== session.instaladoraId) {
      return NextResponse.json(fail("forbidden", "Sin acceso."), { status: 403 });
    }
    // Instaladoras can only download "Disponible" docs
    if (doc.estado !== "Disponible") {
      return NextResponse.json(fail("not_available", "El documento aún no está disponible."), { status: 403 });
    }
  }

  if (!doc.storage_path) {
    return NextResponse.json(fail("not_available", "El documento no tiene archivo."), { status: 404 });
  }

  let fileBuffer: Buffer;
  try {
    fileBuffer = await fs.readFile(doc.storage_path);
  } catch {
    return NextResponse.json(fail("storage_error", "Archivo no encontrado en disco."), { status: 404 });
  }

  const filename = doc.nombre_archivo ?? path.basename(doc.storage_path);
  const mime = doc.mime_type ?? "application/octet-stream";

  return new NextResponse(new Uint8Array(fileBuffer), {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      "Cache-Control": "private, no-cache",
    },
  });
}
