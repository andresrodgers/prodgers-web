import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { fail, ok } from "@/lib/api/responses";
import { getSession } from "@/lib/auth/session";
import { query } from "@/lib/db/pool";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json(fail("unauthenticated", "No autenticado."), { status: 401 });
  if (session.rol !== "admin") return NextResponse.json(fail("forbidden", "Solo administradores."), { status: 403 });

  const { id } = await params;

  // Get CIF from instaladora to use as reset password
  const instaladoraResult = await query(
    `SELECT cif FROM instaladoras WHERE id = $1`,
    [id],
  );
  if (!instaladoraResult.rows[0]) {
    return NextResponse.json(fail("not_found", "Instaladora no encontrada."), { status: 404 });
  }
  const cif = instaladoraResult.rows[0].cif as string;

  // Find propietario user
  const usuarioResult = await query(
    `SELECT id FROM usuarios WHERE instaladora_id = $1 AND rol = 'instaladora_propietario' LIMIT 1`,
    [id],
  );
  if (!usuarioResult.rows[0]) {
    return NextResponse.json(fail("not_found", "Usuario propietario no encontrado."), { status: 404 });
  }

  const usuarioId = usuarioResult.rows[0].id;
  const passwordHash = await bcrypt.hash(cif, 12);

  await query(
    `UPDATE usuarios SET password_hash = $1, debe_cambiar_password = true,
     failed_login_attempts = 0, locked_until = NULL WHERE id = $2`,
    [passwordHash, usuarioId],
  );

  return NextResponse.json(ok({
    mensajePassword: `La contraseña ha sido restablecida al CIF de la instaladora (${cif}). El propietario debe cambiarla en el próximo acceso.`,
  }));
}
