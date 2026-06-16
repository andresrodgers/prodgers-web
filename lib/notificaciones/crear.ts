import { query } from "@/lib/db/pool";

type Params = {
  tipo: string;
  titulo: string;
  mensaje?: string;
  entidadTipo?: string;
  entidadId?: string;
};

// Notifica a todos los usuarios activos de uno o varios roles
export async function notificarRol(roles: string[], p: Params): Promise<void> {
  const usuarios = await query(
    `SELECT id FROM usuarios WHERE rol = ANY($1) AND estado = 'Activo'`,
    [roles],
  );
  if (usuarios.rows.length === 0) return;

  const ids = usuarios.rows.map((r: { id: string }) => r.id);
  await query(
    `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, entidad_tipo, entidad_id)
     SELECT unnest($1::uuid[]), $2, $3, $4, $5, $6`,
    [ids, p.tipo, p.titulo, p.mensaje ?? null, p.entidadTipo ?? null, p.entidadId ?? null],
  );
}

// Notifica a un usuario específico
export async function notificarUsuario(usuarioId: string, p: Params): Promise<void> {
  await query(
    `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, entidad_tipo, entidad_id)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [usuarioId, p.tipo, p.titulo, p.mensaje ?? null, p.entidadTipo ?? null, p.entidadId ?? null],
  );
}

// Notifica al propietario de una instaladora
export async function notificarInstaladora(instaladoraId: string, p: Params): Promise<void> {
  const result = await query(
    `SELECT id FROM usuarios WHERE instaladora_id = $1 AND rol = 'instaladora_propietario' AND estado = 'Activo'`,
    [instaladoraId],
  );
  if (result.rows.length === 0) return;

  await notificarUsuario(result.rows[0].id as string, p);
}
