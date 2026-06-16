"use client";

import { useEffect, useState } from "react";

import { PageShell } from "@/components/layout/page-shell";
import { Pagination } from "@/components/data/pagination";
import { Button } from "@/components/ui/button";
import {
  TableCell,
  TableCodeCell,
  TableHead,
  TableMutedCell,
  TableRow,
} from "@/components/data/data-table-shell";
import { usePagination } from "@/hooks/use-pagination";

const PAGE_SIZE = 50;

type TasaRow = {
  id: string;
  concepto: string;
  monto: number;
  createdAt: string;
  expedienteId: string;
  expedienteCodigo: string;
  instaladoraId: string;
  instaladoraNombre: string;
};

type Instaladora = { id: string; nombre: string; cif: string };

export default function TasasAdminPage() {
  const [tasas, setTasas] = useState<TasaRow[]>([]);
  const [totalMonto, setTotalMonto] = useState(0);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [loading, setLoading] = useState(true);

  const [instaladoras, setInstaladoras] = useState<Instaladora[]>([]);
  const [filtroInstaladora, setFiltroInstaladora] = useState("");
  const [filtroDesde, setFiltroDesde] = useState("");
  const [filtroHasta, setFiltroHasta] = useState("");

  const pag = usePagination(tasas, PAGE_SIZE);

  useEffect(() => {
    fetch("/api/instaladoras")
      .then((r) => r.json())
      .then((json) => { if (json.ok) setInstaladoras(json.data); });
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const qs = new URLSearchParams({ limit: "500" });
      if (filtroInstaladora) qs.set("instaladora_id", filtroInstaladora);
      if (filtroDesde) qs.set("desde", filtroDesde);
      if (filtroHasta) qs.set("hasta", filtroHasta);
      try {
        const r = await fetch(`/api/tasas?${qs}`);
        const json = await r.json();
        if (json.ok) {
          setTasas(json.data.data);
          setTotalRegistros(json.data.total);
          setTotalMonto(json.data.totalMonto);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [filtroInstaladora, filtroDesde, filtroHasta]);

  function limpiarFiltros() {
    setFiltroInstaladora("");
    setFiltroDesde("");
    setFiltroHasta("");
  }

  function exportarCSV() {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = [
      ["Fecha", "Instaladora", "Expediente", "Concepto", "Monto (€)"].map(esc),
      ...tasas.map((t) => [
        esc(new Date(t.createdAt).toLocaleDateString("es-ES")),
        esc(t.instaladoraNombre),
        esc(t.expedienteCodigo),
        esc(t.concepto),
        esc(t.monto.toFixed(2)),
      ]),
      [],
      ["", "", "", esc("TOTAL"), esc(totalMonto.toFixed(2))],
    ];
    const csv = "﻿" + rows.map((r) => r.join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tasas_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const hayFiltros = !!filtroInstaladora || !!filtroDesde || !!filtroHasta;

  return (
    <PageShell
      eyebrow="Administración"
      title="Tasas y pagos"
      description="Registro global de tasas registradas por expediente."
      actions={
        <Button type="button" variant="outline" onClick={exportarCSV} disabled={tasas.length === 0}>
          Exportar CSV
        </Button>
      }
    >
      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-3 rounded-[14px] bg-white px-5 py-4" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-[.06em] text-brand-secondary">Instaladora</span>
          <select
            className="h-9 rounded-[8px] border border-brand-border bg-[#EEF2F3] px-3 text-[13px] text-brand-primary outline-none"
            value={filtroInstaladora}
            onChange={(e) => { setFiltroInstaladora(e.target.value); pag.resetPagina(); }}
          >
            <option value="">Todas</option>
            {instaladoras.map((i) => (
              <option key={i.id} value={i.id}>{i.nombre}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-[.06em] text-brand-secondary">Desde</span>
          <input
            type="date"
            className="h-9 rounded-[8px] border border-brand-border bg-[#EEF2F3] px-3 text-[13px] text-brand-primary outline-none"
            value={filtroDesde}
            onChange={(e) => { setFiltroDesde(e.target.value); pag.resetPagina(); }}
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-[.06em] text-brand-secondary">Hasta</span>
          <input
            type="date"
            className="h-9 rounded-[8px] border border-brand-border bg-[#EEF2F3] px-3 text-[13px] text-brand-primary outline-none"
            value={filtroHasta}
            onChange={(e) => { setFiltroHasta(e.target.value); pag.resetPagina(); }}
          />
        </div>

        {hayFiltros && (
          <button
            type="button"
            onClick={limpiarFiltros}
            className="h-9 rounded-[8px] px-3 text-[12px] font-semibold text-brand-secondary underline-offset-2 hover:underline"
          >
            Limpiar
          </button>
        )}

        {/* Totales */}
        <div className="ml-auto flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[.06em] text-brand-secondary">Registros</p>
            <p className="font-heading text-[20px] font-semibold text-brand-primary">{totalRegistros}</p>
          </div>
          <div className="w-px self-stretch" style={{ background: "rgba(11,45,61,.08)" }} />
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[.06em] text-brand-secondary">Total gastado</p>
            <p className="font-heading text-[20px] font-semibold text-brand-primary">
              {totalMonto.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €
            </p>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-[14px] bg-white" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: "rgba(11,45,61,.02)" }}>
                <TableHead>Fecha</TableHead>
                <TableHead>Instaladora</TableHead>
                <TableHead>Expediente</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead className="text-right">Monto</TableHead>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[13px] text-brand-secondary">
                    Cargando…
                  </td>
                </tr>
              ) : pag.itemsPagina.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[13px] text-brand-secondary">
                    {hayFiltros ? "Sin resultados para los filtros aplicados." : "Sin tasas registradas todavía."}
                  </td>
                </tr>
              ) : (
                pag.itemsPagina.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <TableMutedCell>
                        {new Date(t.createdAt).toLocaleDateString("es-ES")}
                      </TableMutedCell>
                    </TableCell>
                    <TableCell>{t.instaladoraNombre}</TableCell>
                    <TableCell>
                      <TableCodeCell>{t.expedienteCodigo}</TableCodeCell>
                    </TableCell>
                    <TableCell>{t.concepto}</TableCell>
                    <TableCell className="text-right">
                      <span className="font-heading text-[13px] font-semibold text-brand-primary">
                        {t.monto.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          pagina={pag.pagina}
          totalPaginas={pag.totalPaginas}
          total={totalRegistros}
          pageSize={PAGE_SIZE}
          setPagina={pag.setPagina}
        />
      </div>
    </PageShell>
  );
}
