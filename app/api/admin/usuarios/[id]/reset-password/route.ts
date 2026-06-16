import crypto from "crypto";

import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { fail, ok } from "@/lib/api/responses";
import { getSession } from "@/lib/auth/session";
import { query } from "@/lib/db/pool";

function generarPasswordTemporal(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  const bytes = crypto.randomBytes(12);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json(fail("unauthenticated", "No autenticado."), { status: 401 });
  if (session.rol !== "admin") return NextResponse.json(fail("forbidden", "Solo administradores."), { status: 403 });

  const { id } = await params;
  const passwordTemporal = generarPasswordTemporal();
  const passwordHash = await bcrypt.hash(passwordTemporal, 10);

  const result = await query(
    `UPDATE usuarios SET password_hash = $1, debe_cambiar_password = true
     WHERE id = $2 AND rol IN ('operativo', 'admin')
     RETURNING id`,
    [passwordHash, id],
  );

  if (!result.rows[0]) {
    return NextResponse.json(fail("not_found", "Usuario no encontrado."), { status: 404 });
  }

  return NextResponse.json(ok({ passwordTemporal }));
}
