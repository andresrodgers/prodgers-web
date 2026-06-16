"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ClipboardList,
  FolderKanban,
  FolderOpen,
} from "lucide-react";
import { useEffect, useState } from "react";

import { MetricCard } from "@/components/data/metric-card";
import { Pagination } from "@/components/data/pagination";
import { StatusBadge } from "@/components/expediente/status-badge";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import {
  DataTableShell,
  TableCell,
  TableCodeCell,
  TableHead,
  TableMutedCell,
  TableRow,
} from "@/components/data/data-table-shell";
import { usePagination } from "@/hooks/use-pagination";
import { statusTone, type ExpedienteStatus } from "@/modules/expedientes/constants";
import type { ExpedienteListItem } from "@/modules/expedientes/types";
import { timeAgo } from "@/lib/utils";

const GRUPOS: Record<string, ExpedienteStatus[]> = {
  "Nuevos expedientes": ["Recibido", "Revision documental"],
  "Pendientes documentación": ["Documentacion pendiente"],
  "En gestión": [
    "Documentacion validada",
    "MTD en elaboracion",
    "MTD finalizada",
    "Declaracion Responsable presentada",
    "Justificante Ayuntamiento recibido",
    "Instalacion en ejecucion",
    "Pendiente CIE",
    "CAU solicitado",
    "CAU obtenido",
    "Registro Industria obtenido",
    "Comunicacion distribuidora realizada",
  ],
  "Subsanaciones": ["Subsanacion"],
  "Pendientes organismos": ["Validacion distribuidora pendiente", "Compensacion activada"],
  "Finalizados": ["Finalizado"],
};

const PAGE_SIZE = 10;

export default function ProdgersHomePage() {
  const [expedientes, setExpedientes] = useState<ExpedienteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroActivo, setFiltroActivo] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/expedientes?limit=200")
      .then((r) => r.json())
      .then((r) => {
        if (r.ok) setExpedientes(r.data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function countGrupo(nombre: string) {
    const estados = GRUPOS[nombre] ?? [];
    return expedientes.filter((e) => estados.includes(e.estado)).length;
  }

  const expedientesFiltrados = filtroActivo
    ? expedientes.filter((e) => (GRUPOS[filtroActivo] ?? []).includes(e.estado))
    : expedientes;

  const { pagina, totalPaginas, itemsPagina: expedientesPagina, setPagina, resetPagina } =
    usePagination(expedientesFiltrados, PAGE_SIZE);

  function toggleFiltro(nombre: string) {
    setFiltroActivo((prev) => (prev === nombre ? null : nombre));
    resetPagina();
  }

  const cards = [
    { label: "Nuevos expedientes", icon: <FolderKanban className="h-[13px] w-[13px]" />, accent: true },
    { label: "Pendientes documentación", icon: <ClipboardList className="h-[13px] w-[13px]" /> },
    { label: "En gestión", icon: <FolderOpen className="h-[13px] w-[13px]" /> },
    { label: "Subsanaciones", icon: <AlertTriangle className="h-[13px] w-[13px]" /> },
    { label: "Pendientes organismos", icon: <Building2 className="h-[13px] w-[13px]" /> },
    { label: "Finalizados", icon: <CheckCircle2 className="h-[13px] w-[13px]" /> },
  ];

  return (
    <PageShell eyebrow="PRODGERS operativo" title="Inicio operativo">
      <div className="grid gap-[14px] sm:grid-cols-3 lg:grid-cols-6">
        {cards.map(({ label, icon, accent }) => {
          const isActive = filtroActivo === label;
          return (
            <button
              key={label}
              type="button"
              onClick={() => toggleFiltro(label)}
              className="h-full rounded-[14px] text-left transition-all"
              style={isActive ? { outline: "2px solid #0B2D3D", outlineOffset: "2px" } : undefined}
            >
              <MetricCard
                label={label}
                value={loading ? "—" : countGrupo(label)}
                icon={icon}
                accent={accent}
                className="h-full"
              />
            </button>
          );
        })}
      </div>

      <DataTableShell>
        <div className="flex items-center justify-between px-5 py-3">
          <p className="text-[12.5px] font-semibold text-brand-secondary">
            {filtroActivo ? filtroActivo : "Todos los expedientes"}
            <span className="ml-2 font-normal">({expedientesFiltrados.length})</span>
          </p>
          {filtroActivo && (
            <button
              type="button"
              className="text-[11.5px] text-brand-secondary underline"
              onClick={() => setFiltroActivo(null)}
            >
              Quitar filtro
            </button>
          )}
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr style={{ background: "rgba(11,45,61,.02)" }}>
              <TableHead>Código</TableHead>
              <TableHead>Instaladora</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead>Servicio</TableHead>
              <TableHead>Último cambio</TableHead>
              <TableHead />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-[13px] text-brand-secondary">
                  Cargando expedientes…
                </td>
              </tr>
            ) : expedientesPagina.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-[13px] text-brand-secondary">
                  No hay expedientes en este grupo.
                </td>
              </tr>
            ) : (
              expedientesPagina.map((expediente) => (
                <TableRow key={expediente.id}>
                  <TableCell>
                    <TableCodeCell>{expediente.codigo}</TableCodeCell>
                  </TableCell>
                  <TableCell>{expediente.instaladora}</TableCell>
                  <TableCell>
                    <TableMutedCell>{expediente.cliente}</TableMutedCell>
                  </TableCell>
                  <TableCell>
                    <StatusBadge label={expediente.estado} tone={statusTone(expediente.estado)} />
                  </TableCell>
                  <TableCell>
                    <TableMutedCell>{expediente.responsable}</TableMutedCell>
                  </TableCell>
                  <TableCell>
                    <TableMutedCell>{expediente.servicio}</TableMutedCell>
                  </TableCell>
                  <TableCell>
                    <TableMutedCell>{timeAgo(expediente.updatedAt)}</TableMutedCell>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/prodgers/expedientes/${expediente.id}`}>Ver</Link>
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
          total={expedientesFiltrados.length}
          pageSize={PAGE_SIZE}
          setPagina={setPagina}
        />
      </DataTableShell>
    </PageShell>
  );
}
