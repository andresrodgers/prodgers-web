import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { fail, ok } from "@/lib/api/responses";
import { getSession } from "@/lib/auth/session";
import { query } from "@/lib/db/pool";

// ─── GET /api/instaladoras ────────────────────────────────────────

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json(fail("unauthenticated", "No autenticado."), { status: 401 });
  if (session.rol !== "admin") return NextResponse.json(fail("forbidden", "Solo administradores."), { status: 403 });

  const result = await query(
    `SELECT i.id, i.nombre, i.cif, i.contacto, i.telefono, i.email, i.estado, i.saldo_base,
            COALESCE(SUM(t.monto), 0) AS gastado,
            COUNT(DISTINCT e.id) AS expedientes_count
     FROM instaladoras i
     LEFT JOIN tasas t ON t.instaladora_id = i.id
     LEFT JOIN expedientes e ON e.instaladora_id = i.id
     GROUP BY i.id
     ORDER BY i.nombre ASC`,
  );

  const data = result.rows.map((r) => {
    const saldoBase = parseFloat(r.saldo_base);
    const gastado = parseFloat(r.gastado);
    return {
      id: r.id,
      nombre: r.nombre,
      cif: r.cif,
      contacto: r.contacto,
      telefono: r.telefono,
      email: r.email,
      estado: r.estado,
      saldoBase,
      gastado,
      disponible: saldoBase - gastado,
      expedientesCount: parseInt(r.expedientes_count, 10),
    };
  });

  return NextResponse.json(ok(data));
}

// ─── POST /api/instaladoras ───────────────────────────────────────

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json(fail("unauthenticated", "No autenticado."), { status: 401 });
  if (session.rol !== "admin") return NextResponse.json(fail("forbidden", "Solo administradores."), { status: 403 });

  const body = await req.json();
  const { nombre, cif, contacto, telefono, email } = body as {
    nombre?: string;
    cif?: string;
    contacto?: string;
    telefono?: string;
    email?: string;
  };

  if (!nombre?.trim()) return NextResponse.json(fail("validation", "El nombre es obligatorio."), { status: 400 });
  if (!cif?.trim()) return NextResponse.json(fail("validation", "El CIF/NIF es obligatorio."), { status: 400 });
  if (!contacto?.trim()) return NextResponse.json(fail("validation", "El nombre de contacto es obligatorio."), { status: 400 });
  if (!telefono?.trim()) return NextResponse.json(fail("validation", "El teléfono de contacto es obligatorio."), { status: 400 });
  if (!email?.trim()) return NextResponse.json(fail("validation", "El email de contacto es obligatorio."), { status: 400 });

  // Check duplicate CIF
  const dup = await query("SELECT id FROM instaladoras WHERE cif = $1", [cif.trim().toUpperCase()]);
  if (dup.rows.length > 0) {
    return NextResponse.json(fail("conflict", "Ya existe una instaladora con ese CIF."), { status: 409 });
  }

  const cifNormalizado = cif.trim().toUpperCase();

  // Insert instaladora
  const instResult = await query(
    `INSERT INTO instaladoras (nombre, cif, contacto, telefono, email, estado, saldo_base)
     VALUES ($1, $2, $3, $4, $5, 'Activa', 0)
     RETURNING id, nombre, cif`,
    [nombre.trim(), cifNormalizado, contacto.trim(), telefono.trim(), email.trim()],
  );
  const instaladora = instResult.rows[0];

  // Password inicial = CIF (el admin lo comunica al propietario)
  const passwordHash = await bcrypt.hash(cifNormalizado, 12);

  // Insert propietario user
  await query(
    `INSERT INTO usuarios (instaladora_id, nombre, identificador_legal, email, telefono, password_hash, rol, estado, debe_cambiar_password, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, 'instaladora_propietario', 'Activo', true, $7)`,
    [
      instaladora.id,
      nombre.trim(),
      cifNormalizado,
      email.trim(),
      telefono.trim(),
      passwordHash,
      session.userId,
    ],
  );

  return NextResponse.json(
    ok({
      id: instaladora.id,
      nombre: instaladora.nombre,
      cif: instaladora.cif,
      mensajePassword: "La contraseña inicial es el CIF/NIF de la instaladora. El propietario debe cambiarla en el primer acceso.",
    }),
    { status: 201 },
  );
}
