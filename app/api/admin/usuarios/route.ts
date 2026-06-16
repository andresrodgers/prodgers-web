import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { fail, ok } from "@/lib/api/responses";
import { getSession } from "@/lib/auth/session";
import { query } from "@/lib/db/pool";

// ─── GET /api/admin/usuarios ─────────────────────────────────────

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json(fail("unauthenticated", "No autenticado."), { status: 401 });
  if (session.rol !== "admin") return NextResponse.json(fail("forbidden", "Solo administradores."), { status: 403 });

  const result = await query(
    `SELECT id, nombre, identificador_legal, email, telefono, rol, estado, debe_cambiar_password, created_at
     FROM usuarios
     WHERE rol IN ('operativo', 'admin')
     ORDER BY nombre ASC`,
  );

  const data = result.rows.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    identificadorLegal: r.identificador_legal,
    email: r.email,
    telefono: r.telefono,
    rol: r.rol,
    estado: r.estado,
    debeCambiarPassword: r.debe_cambiar_password,
    createdAt: r.created_at,
  }));

  return NextResponse.json(ok(data));
}

// ─── POST /api/admin/usuarios ────────────────────────────────────

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json(fail("unauthenticated", "No autenticado."), { status: 401 });
  if (session.rol !== "admin") return NextResponse.json(fail("forbidden", "Solo administradores."), { status: 403 });

  const body = await req.json() as {
    nombre?: string;
    identificadorLegal?: string;
    email?: string;
    telefono?: string;
    rol?: string;
  };

  const { nombre, identificadorLegal, email, telefono, rol } = body;

  if (!nombre?.trim()) return NextResponse.json(fail("validation", "El nombre es obligatorio."), { status: 400 });
  if (!identificadorLegal?.trim()) return NextResponse.json(fail("validation", "El identificador es obligatorio."), { status: 400 });
  if (rol !== "operativo" && rol !== "admin") {
    return NextResponse.json(fail("validation", "El rol debe ser 'operativo' o 'admin'."), { status: 400 });
  }

  // Check duplicate identificador_legal
  const dup = await query(
    "SELECT id FROM usuarios WHERE identificador_legal = $1",
    [identificadorLegal.trim()],
  );
  if (dup.rows.length > 0) {
    return NextResponse.json(fail("conflict", "Ya existe un usuario con ese identificador."), { status: 409 });
  }

  // La contraseña inicial es el propio identificador (el admin lo comunica al usuario)
  const identificadorNormalizado = identificadorLegal.trim().toUpperCase();
  const passwordHash = await bcrypt.hash(identificadorNormalizado, 12);

  const result = await query(
    `INSERT INTO usuarios (instaladora_id, nombre, identificador_legal, email, telefono, password_hash, rol, estado, debe_cambiar_password, created_by)
     VALUES (NULL, $1, $2, $3, $4, $5, $6, 'Activo', true, $7)
     RETURNING id, nombre, identificador_legal, rol`,
    [
      nombre.trim(),
      identificadorNormalizado,
      email?.trim() ?? null,
      telefono?.trim() ?? null,
      passwordHash,
      rol,
      session.userId,
    ],
  );

  const r = result.rows[0];
  return NextResponse.json(
    ok({
      id: r.id,
      nombre: r.nombre,
      identificadorLegal: r.identificador_legal,
      rol: r.rol,
      mensajePassword: "La contraseña inicial es el identificador del usuario. Debe cambiarla en el primer acceso.",
    }),
    { status: 201 },
  );
}
