import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { fail, ok } from "@/lib/api/responses";
import { clearSessionCookie, getSession, setSessionCookie } from "@/lib/auth/session";
import { query } from "@/lib/db/pool";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body?.identificador || !body?.password) {
    return NextResponse.json(
      fail("validation_error", "Identificador y contraseña requeridos."),
      { status: 400 },
    );
  }

  const id = String(body.identificador).trim().toUpperCase();
  const password = String(body.password);

  const { rows } = await query(
    `SELECT id, nombre, rol, instaladora_id, password_hash, estado, debe_cambiar_password,
            failed_login_attempts, locked_until
     FROM usuarios WHERE identificador_legal = $1`,
    [id],
  );

  const user = rows[0];

  // Usuario no existe — respuesta genérica para no revelar si el identificador existe
  if (!user) {
    return NextResponse.json(
      fail("unauthenticated", "Identificador o contraseña incorrectos."),
      { status: 401 },
    );
  }

  // Cuenta bloqueada por brute force
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    const minutos = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 60_000);
    return NextResponse.json(
      fail("too_many_attempts", `Cuenta bloqueada. Intenta de nuevo en ${minutos} minuto${minutos === 1 ? "" : "s"}.`),
      { status: 429 },
    );
  }

  const passwordOk = await bcrypt.compare(password, user.password_hash);

  if (!passwordOk) {
    const nuevosIntentos = (user.failed_login_attempts ?? 0) + 1;
    const bloquear = nuevosIntentos >= 5;
    await query(
      `UPDATE usuarios
       SET failed_login_attempts = $1,
           locked_until = CASE WHEN $2 THEN NOW() + INTERVAL '15 minutes' ELSE locked_until END
       WHERE id = $3`,
      [nuevosIntentos, bloquear, user.id],
    );
    return NextResponse.json(
      fail("unauthenticated", "Identificador o contraseña incorrectos."),
      { status: 401 },
    );
  }

  if (user.estado === "Inactivo") {
    return NextResponse.json(
      fail("forbidden", "Esta cuenta está desactivada. Contacta con PRODGERS."),
      { status: 403 },
    );
  }

  // Login exitoso — resetear contador de intentos
  await query(
    `UPDATE usuarios SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1`,
    [user.id],
  );

  const response = NextResponse.json(
    ok({
      nombre: user.nombre,
      rol: user.rol,
      instaladoraId: user.instaladora_id,
      debeCambiarPassword: user.debe_cambiar_password,
    }),
  );

  await setSessionCookie(response, {
    userId: user.id,
    rol: user.rol,
    instaladoraId: user.instaladora_id,
    nombre: user.nombre,
  });

  // Registrar login en auditoria (sin bloquear la respuesta si falla)
  query(
    `INSERT INTO auditoria (actor_usuario_id, accion, entidad_tipo, entidad_id)
     VALUES ($1, 'login', 'usuarios', $1)`,
    [user.id],
  ).catch(() => {});

  return response;
}

export async function DELETE() {
  const response = NextResponse.json(ok({ message: "Sesión cerrada." }));
  clearSessionCookie(response);
  return response;
}

// Verificar sesión activa (usado por el cliente para saber si sigue logueado)
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(fail("unauthenticated", "Sin sesión activa."), { status: 401 });
  }
  return NextResponse.json(
    ok({
      userId: session.userId,
      nombre: session.nombre,
      rol: session.rol,
      instaladoraId: session.instaladoraId,
    }),
  );
}
