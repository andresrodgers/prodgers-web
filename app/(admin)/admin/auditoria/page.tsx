"use client";

import { useEffect, useState } from "react";

import { PageShell } from "@/components/layout/page-shell";
import { Pagination } from "@/components/data/pagination";
import {
  TableCell,
  TableHead,
  TableMutedCell,
  TableRow,
} from "@/components/data/data-table-shell";
import { usePagination } from "@/hooks/use-pagination";

const PAGE_SIZE = 50;

const ACCION_LABEL: Record<string, string> = {
  login:             "Login",
  crear_expediente:  "Crear expediente",
  cambio_estado:     "Cambio de estado",
  registrar_tasa:    "Registrar tasa",
  cambio_password:   "Cambio de contraseña",
};

const ACCION_COLOR: Record<string, string> = {
  login:             "#1a5f8a",
  crear_expediente:  "#0d7a6b",
  cambio_estado:     "#6b3fa0",
  registrar_tasa:    "#9a6b00",
  cambio_password:   "#5B6770",
};

const ENTIDAD_LABEL: Record<string, string> = {
  usuarios:     "Usuario",
  expedientes:  "Expediente",
  tasas:        "Tasa",
};

const ACCIONES = Object.keys(ACCION_LABEL);

type EventoAuditoria = {
  id: string;
  accion: string;
  entidadTipo: string;
  entidadId: string | null;
  ipAddress: string | null;
  createdAt: string;
  actor: { nombre: string; rol: string; identificador: string } | null;
};

export default function AuditoriaPage() {
  const [eventos, setEventos] = useState<EventoAuditoria[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [filtroAccion, setFiltroAccion] = useState("");
  const [filtroDesde, setFiltroDesde] = useState("");
  const [filtroHasta, setFiltroHasta] = useState("");

  const pag = usePagination(eventos, PAGE_SIZE);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const qs = new URLSearchParams({ limit: "500" });
      if (filtroAccion) qs.set("accion", filtroAccion);
      if (filtroDesde) qs.set("desde", filtroDesde);
      if (filtroHasta) qs.set("hasta", filtroHasta);
      try {
        const r = await fetch(`/api/admin/auditoria?${qs}`);
        const json = await r.json();
        if (json.ok) {
          setEventos(json.data.data);
          setTotal(json.data.total);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [filtroAccion, filtroDesde, filtroHasta]);

  function limpiarFiltros() {
    setFiltroAccion("");
    setFiltroDesde("");
    setFiltroHasta("");
  }

  const hayFiltros = !!filtroAccion || !!filtroDesde || !!filtroHasta;

  return (
    <PageShell
      eyebrow="Administración"
      title="Registro de auditoría"
      description="Historial de acciones realizadas en el sistema."
    >
      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-3 rounded-[14px] bg-white px-5 py-4" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-[.06em] text-brand-secondary">Acción</span>
          <select
            className="h-9 rounded-[8px] border border-brand-border bg-[#EEF2F3] px-3 text-[13px] text-brand-primary outline-none"
            value={filtroAccion}
            onChange={(e) => { setFiltroAccion(e.target.value); pag.resetPagina(); }}
          >
            <option value="">Todas</option>
            {ACCIONES.map((a) => (
              <option key={a} value={a}>{ACCION_LABEL[a]}</option>
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

        <div className="ml-auto">
          <p className="text-[10px] font-semibold uppercase tracking-[.06em] text-brand-secondary">Total</p>
          <p className="font-heading text-[20px] font-semibold text-brand-primary">{total}</p>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-[14px] bg-white" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: "rgba(11,45,61,.02)" }}>
                <TableHead>Fecha y hora</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Entidad</TableHead>
                <TableHead>IP</TableHead>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[13px] text-brand-secondary">Cargando…</td>
                </tr>
              ) : pag.itemsPagina.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[13px] text-brand-secondary">
                    {hayFiltros ? "Sin resultados para los filtros aplicados." : "Sin eventos registrados."}
                  </td>
                </tr>
              ) : (
                pag.itemsPagina.map((ev) => (
                  <TableRow key={ev.id}>
                    <TableCell>
                      <TableMutedCell>
                        {new Date(ev.createdAt).toLocaleString("es-ES", {
                          day: "2-digit", month: "2-digit", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </TableMutedCell>
                    </TableCell>
                    <TableCell>
                      <span
                        className="font-heading text-[12px] font-semibold"
                        style={{ color: ACCION_COLOR[ev.accion] ?? "#5B6770" }}
                      >
                        {ACCION_LABEL[ev.accion] ?? ev.accion}
                      </span>
                    </TableCell>
                    <TableCell>
                      {ev.actor ? (
                        <div>
                          <p className="text-[13px] font-medium text-brand-primary">{ev.actor.nombre}</p>
                          <p className="text-[11px] text-brand-secondary">{ev.actor.identificador}</p>
                        </div>
                      ) : (
                        <TableMutedCell>Sistema</TableMutedCell>
                      )}
                    </TableCell>
                    <TableCell>
                      <TableMutedCell>
                        {ENTIDAD_LABEL[ev.entidadTipo] ?? ev.entidadTipo}
                      </TableMutedCell>
                    </TableCell>
                    <TableCell>
                      <TableMutedCell>{ev.ipAddress ?? "—"}</TableMutedCell>
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
          total={total}
          pageSize={PAGE_SIZE}
          setPagina={pag.setPagina}
        />
      </div>
    </PageShell>
  );
}
