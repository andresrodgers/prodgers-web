"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  DataTableShell,
  TableCell,
  TableCodeCell,
  TableHead,
  TableMutedCell,
  TableRow,
} from "@/components/data/data-table-shell";
import { Pagination } from "@/components/data/pagination";
import { StatusBadge } from "@/components/expediente/status-badge";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { usePagination } from "@/hooks/use-pagination";
import { statusTone } from "@/modules/expedientes/constants";
import { timeAgo } from "@/lib/utils";

type InstaladoraDetalle = {
  id: string;
  nombre: string;
  cif: string;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  estado: string;
  expedientes: Array<{
    id: string;
    codigo: string;
    estado: string;
    municipio: string;
    servicio: string;
    createdAt: string;
  }>;
};

type ClienteItem = {
  id: string;
  nombre: string;
  dniNie: string;
  telefono: string | null;
  correo: string | null;
  expedientesCount: number;
};

const PAGE_SIZE = 10;

export default function DetalleInstaladoraOperativoPage() {
  const { id } = useParams<{ id: string }>();
  const [instaladora, setInstaladora] = useState<InstaladoraDetalle | null>(null);
  const [clientes, setClientes] = useState<ClienteItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<"expedientes" | "clientes">("expedientes");

  useEffect(() => {
    Promise.all([
      fetch(`/api/instaladoras/${id}`).then((r) => r.json()),
      fetch(`/api/clientes?instaladora_id=${id}&limit=100`).then((r) => r.json()),
    ]).then(([instJson, cliJson]) => {
      if (instJson.ok) setInstaladora(instJson.data);
      if (cliJson.ok) setClientes(cliJson.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const expedientes = useMemo(() => instaladora?.expedientes ?? [], [instaladora]);

  const activos = useMemo(
    () => expedientes.filter((e) => e.estado !== "Finalizado" && e.estado !== "Cancelado").length,
    [expedientes],
  );

  const pagExp = usePagination(expedientes, PAGE_SIZE);
  const pagCli = usePagination(clientes, PAGE_SIZE);

  function handleTab(t: "expedientes" | "clientes") {
    setTab(t);
    if (t === "expedientes") pagExp.resetPagina();
    else pagCli.resetPagina();
  }

  if (loading) {
    return (
      <PageShell eyebrow="PRODGERS operativo" title="Cargando…">
        <p className="text-[13px] text-brand-secondary">Cargando instaladora…</p>
      </PageShell>
    );
  }

  if (!instaladora) {
    return (
      <PageShell eyebrow="PRODGERS operativo" title="No encontrada">
        <p className="text-[13px] text-brand-secondary">La instaladora no existe o sin acceso.</p>
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow="PRODGERS operativo"
      title={instaladora.nombre}
      description={`${instaladora.cif}${instaladora.contacto ? ` · ${instaladora.contacto}` : ""}${instaladora.email ? ` · ${instaladora.email}` : ""}`}
    >
      <div className="grid gap-[14px] sm:grid-cols-3">
        <KpiBlock label="Expedientes totales" value={expedientes.length} />
        <KpiBlock label="Activos" value={activos} />
        <KpiBlock label="Clientes únicos" value={clientes.length} />
      </div>

      <Card>
        <CardHeader className="px-5 pb-0 pt-4">
          <div className="flex gap-2">
            <TabPill
              label="Expedientes"
              count={expedientes.length}
              active={tab === "expedientes"}
              onClick={() => handleTab("expedientes")}
            />
            <TabPill
              label="Clientes"
              count={clientes.length}
              active={tab === "clientes"}
              onClick={() => handleTab("clientes")}
            />
          </div>
        </CardHeader>

        <CardContent className="px-0 pb-0 pt-0">
          <DataTableShell>
            {tab === "expedientes" ? (
              <>
                <table className="w-full border-collapse">
                  <thead>
                    <tr style={{ background: "rgba(11,45,61,.02)" }}>
                      <TableHead>Código</TableHead>
                      <TableHead>Municipio</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Creado</TableHead>
                      <TableHead />
                    </tr>
                  </thead>
                  <tbody>
                    {pagExp.itemsPagina.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5}>
                          <div className="py-6 text-center text-[13px] text-brand-secondary">
                            Sin expedientes registrados.
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagExp.itemsPagina.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell>
                            <TableCodeCell>{e.codigo}</TableCodeCell>
                          </TableCell>
                          <TableCell>
                            <TableMutedCell>{e.municipio}</TableMutedCell>
                          </TableCell>
                          <TableCell>
                            <StatusBadge label={e.estado as Parameters<typeof statusTone>[0]} tone={statusTone(e.estado as Parameters<typeof statusTone>[0])} />
                          </TableCell>
                          <TableCell>
                            <TableMutedCell>{timeAgo(e.createdAt)}</TableMutedCell>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end">
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/prodgers/expedientes/${e.id}`}>Ver</Link>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </tbody>
                </table>
                <Pagination
                  pagina={pagExp.pagina}
                  totalPaginas={pagExp.totalPaginas}
                  total={expedientes.length}
                  pageSize={PAGE_SIZE}
                  setPagina={pagExp.setPagina}
                />
              </>
            ) : (
              <>
                <table className="w-full border-collapse">
                  <thead>
                    <tr style={{ background: "rgba(11,45,61,.02)" }}>
                      <TableHead>Nombre</TableHead>
                      <TableHead>DNI/NIE</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Expedientes</TableHead>
                    </tr>
                  </thead>
                  <tbody>
                    {pagCli.itemsPagina.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4}>
                          <div className="py-6 text-center text-[13px] text-brand-secondary">
                            Sin clientes registrados.
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagCli.itemsPagina.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell>
                            <span className="text-[13px] font-semibold text-brand-primary">{c.nombre}</span>
                          </TableCell>
                          <TableCell>
                            <TableMutedCell>{c.dniNie}</TableMutedCell>
                          </TableCell>
                          <TableCell>
                            <TableMutedCell>
                              {[c.telefono, c.correo].filter(Boolean).join(" · ") || "—"}
                            </TableMutedCell>
                          </TableCell>
                          <TableCell>
                            <TableMutedCell>{c.expedientesCount}</TableMutedCell>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </tbody>
                </table>
                <Pagination
                  pagina={pagCli.pagina}
                  totalPaginas={pagCli.totalPaginas}
                  total={clientes.length}
                  pageSize={PAGE_SIZE}
                  setPagina={pagCli.setPagina}
                />
              </>
            )}
          </DataTableShell>
        </CardContent>
      </Card>
    </PageShell>
  );
}

function KpiBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[14px] bg-white px-5 py-4" style={{ boxShadow: "var(--shadow-sm)" }}>
      <p className="text-[11px] font-semibold uppercase tracking-[.06em] text-brand-secondary">{label}</p>
      <p className="mt-1 font-heading text-[28px] font-semibold text-brand-primary">{value}</p>
    </div>
  );
}

function TabPill({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-[10px] px-4 py-2 transition-all"
      style={active ? { background: "#0B2D3D", color: "#fff" } : { background: "#F4F7F8", color: "#5B6770" }}
    >
      <span className="font-heading text-[12.5px] font-semibold">{label}</span>
      <span
        className="rounded-[6px] px-1.5 py-0.5 font-heading text-[11px] font-semibold"
        style={active ? { background: "rgba(255,255,255,.15)" } : { background: "#E8ECEE" }}
      >
        {count}
      </span>
    </button>
  );
}
