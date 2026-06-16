import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { fail, ok } from "@/lib/api/responses";
import { getSession } from "@/lib/auth/session";
import { query } from "@/lib/db/pool";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(fail("unauthenticated", "No autenticado."), { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.passwordNueva) {
    return NextResponse.json(
      fail("validation_error", "La nueva contraseña es requerida."),
      { status: 400 },
    );
  }

  const passwordNueva = String(body.passwordNueva);

  if (
    passwordNueva.length < 8 ||
    !/[A-Z]/.test(passwordNueva) ||
    !/[0-9]/.test(passwordNueva)
  ) {
    return NextResponse.json(
      fail(
        "validation_error",
        "La contraseña debe tener mínimo 8 caracteres, una mayúscula y un número.",
      ),
      { status: 400 },
    );
  }

  // Si se envía passwordActual (cambio voluntario), verificarla
  if (body.passwordActual) {
    const { rows } = await query(
      "SELECT password_hash FROM usuarios WHERE id = $1",
      [session.userId],
    );
    if (!rows[0]) {
      return NextResponse.json(fail("not_found", "Usuario no encontrado."), { status: 404 });
    }
    const valid = await bcrypt.compare(String(body.passwordActual), rows[0].password_hash);
    if (!valid) {
      return NextResponse.json(
        fail("validation_error", "La contraseña actual es incorrecta."),
        { status: 400 },
      );
    }
  }

  const hash = await bcrypt.hash(passwordNueva, 12);

  await query(
    "UPDATE usuarios SET password_hash = $1, debe_cambiar_password = false WHERE id = $2",
    [hash, session.userId],
  );

  query(
    `INSERT INTO auditoria (actor_usuario_id, accion, entidad_tipo, entidad_id)
     VALUES ($1, 'cambio_password', 'usuarios', $1)`,
    [session.userId],
  ).catch(() => {});

  return NextResponse.json(ok({ message: "Contraseña actualizada correctamente." }));
}
