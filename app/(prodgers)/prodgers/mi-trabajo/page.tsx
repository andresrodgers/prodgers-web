"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { DataTableShell, TableCell, TableCodeCell, TableHead, TableRow } from "@/components/data/data-table-shell";
import { StatusBadge } from "@/components/expediente/status-badge";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { statusTone } from "@/modules/expedientes/constants";
import type { ExpedienteListItem } from "@/modules/expedientes/types";

export default function MiTrabajoPage() {
  const { session } = useSession();
  const [expedientes, setExpedientes] = useState<ExpedienteListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/expedientes?limit=200")
      .then((r) => r.json())
      .then((r) => {
        if (r.ok) setExpedientes(r.data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const asignados = session?.userId
    ? expedientes.filter((e) => e.responsableId === session.userId)
    : [];

  return (
    <PageShell
      eyebrow="PRODGERS operativo"
      title="Mi trabajo"
      description="Vista de priorización por responsable. No restringe la visibilidad general."
    >
      <DataTableShell>
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ background: "rgba(11,45,61,.02)" }}>
              <TableHead>Código</TableHead>
              <TableHead>Instaladora</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-[13px] text-brand-secondary">
                  Cargando expedientes…
                </td>
              </tr>
            ) : asignados.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-[13px] text-brand-secondary">
                  No tienes expedientes asignados.
                </td>
              </tr>
            ) : (
              asignados.map((expediente) => (
                <TableRow key={expediente.id}>
                  <TableCell>
                    <TableCodeCell>{expediente.codigo}</TableCodeCell>
                  </TableCell>
                  <TableCell>{expediente.instaladora}</TableCell>
                  <TableCell>
                    <StatusBadge label={expediente.estado} tone={statusTone(expediente.estado)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/prodgers/expedientes/${expediente.id}`}>Ver detalle</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </tbody>
        </table>
      </DataTableShell>
    </PageShell>
  );
}
