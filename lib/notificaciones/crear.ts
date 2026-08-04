import { query } from "@/lib/db/pool";
import { enviarEmailNotificacion } from "@/lib/email/enviar";

type Params = {
  tipo: string;
  titulo: string;
  mensaje?: string;
  entidadTipo?: string;
  entidadId?: string;
  // Si es true, además de la notificación in-app se intenta enviar un correo.
  // Solo debe usarse en eventos accionables (ver mapeo en CLAUDE.md) — no todo
  // evento amerita un correo, para no saturar bandejas.
  email?: boolean;
};

// Notifica a un usuario específico (in-app siempre; correo si p.email === true)
export async function notificarUsuario(usuarioId: string, p: Params): Promise<void> {
  const result = await query(
    `INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, entidad_tipo, entidad_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [usuarioId, p.tipo, p.titulo, p.mensaje ?? null, p.entidadTipo ?? null, p.entidadId ?? null],
  );

  if (p.email) {
    const notifId = result.rows[0].id as string;
    // Fire-and-forget real: no se espera la respuesta de Resend para no
    // sumarle latencia al request que disparó la notificación.
    despacharCorreo(usuarioId, notifId, p).catch(() => {});
  }
}

// Notifica a todos los usuarios activos de uno o varios roles
export async function notificarRol(roles: string[], p: Params): Promise<void> {
  const usuarios = await query(
    `SELECT id FROM usuarios WHERE rol = ANY($1) AND estado = 'Activo'`,
    [roles],
  );
  if (usuarios.rows.length === 0) return;

  await Promise.all(
    (usuarios.rows as { id: string }[]).map((r) => notificarUsuario(r.id, p)),
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

async function despacharCorreo(usuarioId: string, notifId: string, p: Params): Promise<void> {
  const userResult = await query(
    `SELECT email, nombre, rol FROM usuarios WHERE id = $1`,
    [usuarioId],
  );
  const usuario = userResult.rows[0] as { email: string | null; nombre: string; rol: string } | undefined;

  // Sin correo cargado: se queda solo in-app, no es un error.
  if (!usuario?.email) return;

  const resultado = await enviarEmailNotificacion({
    to: usuario.email,
    nombre: usuario.nombre,
    titulo: p.titulo,
    mensaje: p.mensaje,
    ctaUrl: construirLink(usuario.rol, p.entidadTipo, p.entidadId),
  });

  await query(
    `UPDATE notificaciones SET email_enviado = $1, email_error = $2 WHERE id = $3`,
    [resultado.ok, resultado.error ?? null, notifId],
  ).catch(() => {});
}

function construirLink(rol: string, entidadTipo?: string, entidadId?: string): string {
  const base = process.env.APP_URL ?? "http://localhost:3001";
  if (!entidadId || entidadTipo !== "expedientes") return base;

  const prefix = rol === "admin" || rol === "operativo" ? "/prodgers" : "/instaladora";
  return `${base}${prefix}/expedientes/${entidadId}`;
}
