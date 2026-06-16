"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { DataTableShell, TableCell, TableCodeCell, TableHead, TableMutedCell, TableRow } from "@/components/data/data-table-shell";
import { Pagination } from "@/components/data/pagination";
import { StatusBadge } from "@/components/expediente/status-badge";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { usePagination } from "@/hooks/use-pagination";
import { statusTone } from "@/modules/expedientes/constants";
import type { ExpedienteListItem } from "@/modules/expedientes/types";
import { timeAgo } from "@/lib/utils";

const PAGE_SIZE = 10;
const filterOptions = ["Todos", "Activos", "Doc. pendiente", "Subsanacion", "Finalizados"] as const;
type FilterOption = (typeof filterOptions)[number];

export default function ExpedientesInstaladoraPage() {
  const [expedientes, setExpedientes] = useState<ExpedienteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<FilterOption>("Todos");

  useEffect(() => {
    fetch("/api/expedientes?limit=500")
      .then((r) => r.json())
      .then((r) => {
        if (r.ok) setExpedientes(r.data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const expFiltrados = useMemo(() => {
    if (filtro === "Todos") return expedientes;
    if (filtro === "Activos") return expedientes.filter((e) => e.estado !== "Finalizado" && e.estado !== "Cancelado");
    if (filtro === "Doc. pendiente") return expedientes.filter((e) => e.estado === "Documentacion pendiente");
    if (filtro === "Subsanacion") return expedientes.filter((e) => e.estado === "Subsanacion");
    if (filtro === "Finalizados") return expedientes.filter((e) => e.estado === "Finalizado");
    return expedientes;
  }, [filtro, expedientes]);

  const { pagina, totalPaginas, itemsPagina, setPagina, resetPagina } =
    usePagination(expFiltrados, PAGE_SIZE);

  function handleFiltro(f: FilterOption) {
    setFiltro(f);
    resetPagina();
  }

  return (
    <PageShell
      eyebrow="Instaladora"
      title="Expedientes"
      description="Consulta estados, continúa borradores, corrige pendientes y descarga documentos finales."
      actions={
        <Button asChild>
          <Link href="/instaladora/expedientes/nuevo">+ Nuevo expediente</Link>
        </Button>
      }
    >
      <div className="flex flex-wrap gap-2.5">
        {filterOptions.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => handleFiltro(f)}
            className="inline-flex h-[38px] items-center gap-[7px] rounded-[13px] px-4 font-heading text-[12.5px] font-semibold transition"
            style={
              filtro === f
                ? { background: "#0B2D3D", color: "#fff", boxShadow: "0 8px 18px -10px rgba(11,45,61,.6)" }
                : { background: "#E8ECEE", color: "#5B6770" }
            }
          >
            {f}
          </button>
        ))}
      </div>

      <DataTableShell>
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ background: "rgba(11,45,61,.02)" }}>
              <TableHead>Código</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Municipio · Potencia</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Último cambio</TableHead>
              <TableHead />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-[13px] text-brand-secondary">
                  Cargando expedientes…
                </td>
              </tr>
            ) : itemsPagina.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-[13px] text-brand-secondary">
                  No hay expedientes para este filtro.
                </td>
              </tr>
            ) : (
              itemsPagina.map((expediente) => (
                <TableRow key={expediente.id}>
                  <TableCell>
                    <TableCodeCell>{expediente.codigo}</TableCodeCell>
                  </TableCell>
                  <TableCell>{expediente.cliente}</TableCell>
                  <TableCell>
                    <TableMutedCell>{expediente.municipio} · {expediente.potenciaKw} kWp</TableMutedCell>
                  </TableCell>
                  <TableCell>
                    <StatusBadge label={expediente.estado} tone={statusTone(expediente.estado)} />
                  </TableCell>
                  <TableCell>
                    <TableMutedCell>{timeAgo(expediente.updatedAt)}</TableMutedCell>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/instaladora/expedientes/${expediente.id}`}>Ver</Link>
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
          total={expFiltrados.length}
          pageSize={PAGE_SIZE}
          setPagina={setPagina}
        />
      </DataTableShell>
    </PageShell>
  );
}
