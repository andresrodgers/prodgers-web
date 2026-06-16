"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { DataTableShell, TableCell, TableCodeCell, TableHead, TableMutedCell, TableRow } from "@/components/data/data-table-shell";
import { Pagination } from "@/components/data/pagination";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePagination } from "@/hooks/use-pagination";

type ClienteListItem = {
  id: string;
  nombre: string;
  dniNie: string;
  telefono: string | null;
  correo: string | null;
  expedientesCount: number;
};

const PAGE_SIZE = 10;

export default function ClientesPage() {
  const [clientes, setClientes] = useState<ClienteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const qs = debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}&limit=100` : "?limit=100";
      try {
        const r = await fetch(`/api/clientes${qs}`);
        const json = await r.json();
        if (json.ok) setClientes(json.data.data);
      } finally {
        setLoading(false);
      }
    })();
  }, [debouncedSearch]);

  const { pagina, totalPaginas, itemsPagina, setPagina, resetPagina } = usePagination(clientes, PAGE_SIZE);

  function handleSearch(v: string) {
    setSearch(v);
    resetPagina();
  }

  return (
    <PageShell
      eyebrow="Instaladora"
      title="Clientes"
      description="Clientes finales guardados para reutilizar en nuevos expedientes."
      actions={
        <Button asChild>
          <Link href="/instaladora/clientes/nuevo">Crear cliente</Link>
        </Button>
      }
    >
      <div
        className="rounded-[14px] bg-white p-4"
        style={{ boxShadow: "var(--shadow-sm)" }}
      >
        <Input
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Buscar por nombre, DNI/NIE o correo"
        />
      </div>

      <DataTableShell>
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ background: "rgba(11,45,61,.02)" }}>
              <TableHead>Nombre</TableHead>
              <TableHead>DNI/NIE</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Expedientes</TableHead>
              <TableHead />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-[13px] text-brand-secondary">
                  Cargando clientes…
                </td>
              </tr>
            ) : itemsPagina.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-[13px] text-brand-secondary">
                  {search ? "No se encontraron clientes." : "Aún no tienes clientes registrados."}
                </td>
              </tr>
            ) : (
              itemsPagina.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell>
                    <TableCodeCell>{cliente.nombre}</TableCodeCell>
                  </TableCell>
                  <TableCell>
                    <TableMutedCell>{cliente.dniNie}</TableMutedCell>
                  </TableCell>
                  <TableCell>
                    <TableMutedCell>
                      {[cliente.telefono, cliente.correo].filter(Boolean).join(" · ") || "—"}
                    </TableMutedCell>
                  </TableCell>
                  <TableCell>
                    <TableMutedCell>
                      {cliente.expedientesCount} expediente{cliente.expedientesCount !== 1 ? "s" : ""}
                    </TableMutedCell>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/instaladora/clientes/${cliente.id}`}>Ver</Link>
                      </Button>
                      <Button asChild size="sm">
                        <Link href="/instaladora/expedientes/nuevo">+ Expediente</Link>
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
          total={clientes.length}
          pageSize={PAGE_SIZE}
          setPagina={setPagina}
        />
      </DataTableShell>
    </PageShell>
  );
}
