import { NextResponse } from "next/server";

import { fail, ok } from "@/lib/api/responses";
import { getSession } from "@/lib/auth/session";
import { query } from "@/lib/db/pool";
import { isInstaladora } from "@/lib/permissions/guards";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(fail("unauthenticated", "No autenticado."), { status: 401 });
  }
  if (!isInstaladora(session.rol as "instaladora_propietario" | "instaladora_gestor")) {
    return NextResponse.json(fail("forbidden", "Solo instaladoras."), { status: 403 });
  }

  const result = await query(
    `SELECT ins.nombre, ins.saldo_base,
            COALESCE(SUM(t.monto), 0) AS gastado
     FROM instaladoras ins
     LEFT JOIN tasas t ON t.instaladora_id = ins.id
     WHERE ins.id = $1
     GROUP BY ins.id`,
    [session.instaladoraId],
  );

  if (!result.rows[0]) {
    return NextResponse.json(fail("not_found", "Instaladora no encontrada."), { status: 404 });
  }

  const { nombre, saldo_base, gastado } = result.rows[0];
  const saldoBase = parseFloat(saldo_base);
  const gastadoNum = parseFloat(gastado);

  return NextResponse.json(
    ok({
      nombre,
      saldoBase,
      gastado: gastadoNum,
      disponible: saldoBase - gastadoNum,
    }),
  );
}
