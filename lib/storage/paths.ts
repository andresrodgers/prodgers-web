import fs from "fs/promises";
import path from "path";

export function getUploadsRoot(): string {
  return process.env.UPLOADS_PATH ?? path.join(process.cwd(), "uploads");
}

export function getDocumentoEntradaPath(
  instaladoraId: string,
  expedienteId: string,
  tipoDocumento: string,
  version: number,
  docIdShort: string,
  originalName: string,
): string {
  const normalized = originalName
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 80);
  const filename = `v${version}_${docIdShort}_${normalized}`;
  return path.join(getUploadsRoot(), instaladoraId, expedienteId, tipoDocumento, filename);
}

export function getDocumentoFinalPath(
  instaladoraId: string,
  expedienteId: string,
  fase: string,
  docIdShort: string,
  originalName: string,
): string {
  const normalizedFase = fase.toLowerCase().replace(/[^a-z0-9]/g, "_");
  const normalized = originalName
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 80);
  const filename = `${docIdShort}_${normalized}`;
  return path.join(getUploadsRoot(), instaladoraId, expedienteId, `final_${normalizedFase}`, filename);
}

export async function ensureDir(filePath: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}
