"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { DataTableShell, TableCell, TableCodeCell, TableHead, TableMutedCell, TableRow } from "@/components/data/data-table-shell";
import { Pagination } from "@/components/data/pagination";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { usePagination } from "@/hooks/use-pagination";

type InstaladoraItem = {
  id: string;
  nombre: string;
  contacto: string | null;
  email: string | null;
  expedientesCount: number;
};

const PAGE_SIZE = 10;

export default function InstaladorasOperativoPage() {
  const [instaladoras, setInstaladoras] = useState<InstaladoraItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/instaladoras")
      .then((r) => r.json())
      .then((r) => {
        if (r.ok) setInstaladoras(r.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const { pagina, totalPaginas, itemsPagina, setPagina } = usePagination(instaladoras, PAGE_SIZE);

  return (
    <PageShell
      eyebrow="PRODGERS operativo"
      title="Instaladoras"
      description="Consulta operativa de empresas, clientes finales y expedientes."
    >
      <DataTableShell>
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ background: "rgba(11,45,61,.02)" }}>
              <TableHead>Empresa</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Expedientes</TableHead>
              <TableHead />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[13px] text-brand-secondary">
                  Cargando instaladoras…
                </td>
              </tr>
            ) : itemsPagina.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[13px] text-brand-secondary">
                  No hay instaladoras registradas.
                </td>
              </tr>
            ) : (
              itemsPagina.map((instaladora) => (
                <TableRow key={instaladora.id}>
                  <TableCell>
                    <TableCodeCell>{instaladora.nombre}</TableCodeCell>
                  </TableCell>
                  <TableCell>
                    <TableMutedCell>{instaladora.contacto ?? "—"}</TableMutedCell>
                  </TableCell>
                  <TableCell>
                    <TableMutedCell>{instaladora.email ?? "—"}</TableMutedCell>
                  </TableCell>
                  <TableCell>
                    <TableMutedCell>{instaladora.expedientesCount}</TableMutedCell>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/prodgers/instaladoras/${instaladora.id}`}>Ver detalle</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </tbody>
        </table>
        <Pagination
          pagina={pagina}
          totalPaginas={totalPaginas}
          total={instaladoras.length}
          pageSize={PAGE_SIZE}
          setPagina={setPagina}
        />
      </DataTableShell>
    </PageShell>
  );
}
