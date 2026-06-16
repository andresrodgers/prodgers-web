"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Pagination } from "@/components/data/pagination";
import { StatusBadge } from "@/components/expediente/status-badge";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePagination } from "@/hooks/use-pagination";
import {
  TableCell,
  TableCodeCell,
  TableHead,
  TableMutedCell,
  TableRow,
} from "@/components/data/data-table-shell";
import { statusTone } from "@/modules/expedientes/constants";

const PAGE_SIZE_TABS = 10;

// ─── Types ───────────────────────────────────────────────────────

type UsuarioPropietario = {
  id: string;
  nombre: string;
  identificadorLegal: string;
  estado: string;
  debeCambiarPassword: boolean;
};

type ExpedienteItem = {
  id: string;
  codigo: string;
  estado: string;
  municipio: string | null;
  servicio: string | null;
  createdAt: string;
};

type TasaItem = {
  id: string;
  expedienteId: string;
  expedienteCodigo: string;
  concepto: string;
  monto: number;
  createdAt: string;
};

type InstaladoraDetail = {
  id: string;
  nombre: string;
  cif: string;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  estado: "Activa" | "Inactiva";
  saldoBase: number;
  gastado: number;
  disponible: number;
  usuarioPropietario: UsuarioPropietario | null;
  expedientes: ExpedienteItem[];
  tasas: TasaItem[];
};

// ─── Constantes y helpers ─────────────────────────────────────────

const MESES_LISTA = [
  { value: "01", label: "Enero" }, { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" }, { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" }, { value: "06", label: "Junio" },
  { value: "07", label: "Julio" }, { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" }, { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" }, { value: "12", label: "Diciembre" },
];

const MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const DIAS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));
const AÑOS = ["2024", "2025", "2026", "2027"];

// Defaults del último mes
const _lm = (() => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const anio = String(d.getFullYear());
  const lastDay = String(new Date(Number(anio), Number(mes), 0).getDate()).padStart(2, "0");
  return { mes, anio, lastDay };
})();

// ─── Page ────────────────────────────────────────────────────────

export default function DetalleInstaladoraAdminPage() {
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState<InstaladoraDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [tabActivo, setTabActivo] = useState<"expedientes">("expedientes");

  const [desdeDay, setDesdeDay] = useState("01");
  const [desdeMes, setDesdeMes] = useState(_lm.mes);
  const [desdeAnio, setDesdeAnio] = useState(_lm.anio);
  const [hastaDay, setHastaDay] = useState(_lm.lastDay);
  const [hastaMes, setHastaMes] = useState(_lm.mes);
  const [hastaAnio, setHastaAnio] = useState(_lm.anio);

  // Dialog: asignar saldo
  const [mostrarAsignarSaldo, setMostrarAsignarSaldo] = useState(false);
  const [nuevoSaldo, setNuevoSaldo] = useState("");
  const [saldoLoading, setSaldoLoading] = useState(false);

  // Dialog: generar contraseña
  const [mostrarGenerarPwd, setMostrarGenerarPwd] = useState(false);
  const [pwdGenerada, setPwdGenerada] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  // Dialog: editar
  const [mostrarEditar, setMostrarEditar] = useState(false);
  const [editForm, setEditForm] = useState({ nombre: "", cif: "", contacto: "", email: "" });
  const [editLoading, setEditLoading] = useState(false);

  // Dialog: activar/desactivar
  const [mostrarToggleActiva, setMostrarToggleActiva] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/instaladoras/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setData(json.data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const expFiltrados = useMemo(() => {
    if (!data) return [];
    return data.expedientes.filter((e) => {
      const d = e.createdAt.slice(0, 10);
      const desde = `${desdeAnio}-${desdeMes}-${desdeDay}`;
      const hasta = `${hastaAnio}-${hastaMes}-${hastaDay}`;
      return d >= desde && d <= hasta;
    });
  }, [data, desdeAnio, desdeMes, desdeDay, hastaAnio, hastaMes, hastaDay]);

  const lineData = useMemo(() => {
    if (!data) return MESES_CORTOS.map((mes) => ({ mes, Expedientes: 0 }));
    const currentYear = String(new Date().getFullYear());
    const expPorMes: Record<string, number> = {};
    for (const e of data.expedientes) {
      const d = new Date(e.createdAt);
      const corto = MESES_CORTOS[d.getMonth()];
      if (String(d.getFullYear()) === currentYear) {
        expPorMes[corto] = (expPorMes[corto] ?? 0) + 1;
      }
    }
    return MESES_CORTOS.map((mes) => ({ mes, Expedientes: expPorMes[mes] ?? 0 }));
  }, [data]);

  const pagExp = usePagination(expFiltrados, PAGE_SIZE_TABS);

  if (loading) {
    return (
      <PageShell title="Cargando…" description="Obteniendo datos de la instaladora.">
        <div className="py-16 text-center text-[13px] text-brand-secondary">Cargando…</div>
      </PageShell>
    );
  }

  if (!data) {
    return (
      <PageShell title="No encontrada" description="La instaladora no existe.">
        <div className="py-16 text-center text-[13px] text-brand-secondary">Instaladora no encontrada.</div>
      </PageShell>
    );
  }

  const instActiva = data.estado === "Activa";

  async function handleEditar() {
    if (!editForm.nombre.trim()) return;
    setEditLoading(true);
    try {
      const res = await fetch(`/api/instaladoras/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: editForm.nombre.trim(),
          cif: editForm.cif.trim(),
          contacto: editForm.contacto.trim() || null,
          email: editForm.email.trim() || null,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setData((prev) => prev ? { ...prev, nombre: json.data.nombre, cif: json.data.cif, contacto: json.data.contacto, email: json.data.email } : prev);
        setMostrarEditar(false);
      }
    } finally {
      setEditLoading(false);
    }
  }

  async function handleToggleActiva() {
    setToggleLoading(true);
    try {
      const nuevoEstado = instActiva ? "Inactiva" : "Activa";
      const res = await fetch(`/api/instaladoras/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      const json = await res.json();
      if (json.ok) {
        setData((prev) => prev ? { ...prev, estado: json.data.estado } : prev);
        setMostrarToggleActiva(false);
      }
    } finally {
      setToggleLoading(false);
    }
  }

  async function handleGenerarPwd() {
    setPwdLoading(true);
    try {
      const res = await fetch(`/api/instaladoras/${id}/reset-password`, { method: "POST" });
      const json = await res.json();
      if (json.ok) {
        setPwdGenerada(json.data.mensajePassword);
      }
    } finally {
      setPwdLoading(false);
    }
  }

  async function handleAsignarSaldo() {
    if (!nuevoSaldo || Number(nuevoSaldo) <= 0) return;
    setSaldoLoading(true);
    try {
      const res = await fetch(`/api/instaladoras/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saldoBase: parseFloat(nuevoSaldo) }),
      });
      const json = await res.json();
      if (json.ok) {
        setData((prev) => {
          if (!prev) return prev;
          const saldoBase = json.data.saldoBase;
          return { ...prev, saldoBase, disponible: saldoBase - prev.gastado };
        });
        setMostrarAsignarSaldo(false);
        setNuevoSaldo("");
      }
    } finally {
      setSaldoLoading(false);
    }
  }

  function exportarCSV() {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = [
      ["Expediente", "Concepto", "Monto (€)", "Fecha"].map(esc),
      ...data!.tasas.map((t) => [
        esc(t.expedienteCodigo),
        esc(t.concepto),
        esc(t.monto.toFixed(2)),
        esc(new Date(t.createdAt).toLocaleDateString("es-ES")),
      ]),
      [],
      [esc("Saldo base"), esc(data!.saldoBase.toFixed(2))],
      [esc("Gastado"), esc(data!.gastado.toFixed(2))],
      [esc("Restante"), esc(data!.disponible.toFixed(2))],
    ];
    const csv = "﻿" + rows.map((r) => r.join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tasas_${id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <PageShell
      title={data.nombre}
      description={[data.cif, data.contacto, data.email].filter(Boolean).join(" · ")}
    >
      {/* ── Fila superior ── */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Saldo y tasas */}
        <Card>
          <CardHeader>
            <CardTitle>Saldo y tasas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 px-5 pb-5 pt-0">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-[10px] px-3 py-3" style={{ background: "#F4F7F8" }}>
                <p className="text-[10px] font-semibold uppercase tracking-[.06em] text-brand-secondary">Base</p>
                <p className="mt-0.5 font-heading text-[18px] font-semibold text-brand-primary">
                  {data.saldoBase.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €
                </p>
              </div>
              <div className="rounded-[10px] px-3 py-3" style={{ background: "#F4F7F8" }}>
                <p className="text-[10px] font-semibold uppercase tracking-[.06em] text-brand-secondary">Gastado</p>
                <p className="mt-0.5 font-heading text-[18px] font-semibold text-brand-primary">
                  {data.gastado.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €
                </p>
              </div>
              <div className="rounded-[10px] px-3 py-3" style={{ background: "#dcefe4" }}>
                <p className="text-[10px] font-semibold uppercase tracking-[.06em]" style={{ color: "#1f6b48" }}>
                  Restante
                </p>
                <p className="mt-0.5 font-heading text-[18px] font-semibold" style={{ color: "#1f6b48" }}>
                  {data.disponible.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-[10px] border border-[rgba(11,45,61,.07)]">
              <div className="max-h-[200px] overflow-y-auto">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0" style={{ background: "rgba(11,45,61,.03)" }}>
                    <tr>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[.06em] text-brand-secondary">Expediente</th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[.06em] text-brand-secondary">Concepto</th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[.06em] text-brand-secondary">Monto</th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[.06em] text-brand-secondary">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.tasas.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-5 text-center text-[12.5px] text-brand-secondary">
                          Sin tasas registradas.
                        </td>
                      </tr>
                    ) : (
                      data.tasas.map((t) => (
                        <tr key={t.id} className="border-t border-[rgba(11,45,61,.05)]">
                          <td className="px-4 py-2.5">
                            <span className="rounded-[6px] bg-[#EEF2F3] px-2 py-0.5 font-mono text-[11.5px] font-semibold text-brand-primary">
                              {t.expedienteCodigo}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-[12.5px] text-brand-primary">{t.concepto}</td>
                          <td className="px-4 py-2.5 text-right font-heading text-[13px] font-semibold text-brand-primary">
                            {t.monto.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €
                          </td>
                          <td className="px-4 py-2.5 text-right text-[12px] text-brand-secondary">
                            {new Date(t.createdAt).toLocaleDateString("es-ES")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button type="button" variant="outline" onClick={exportarCSV}>
                Exportar informe
              </Button>
              <button
                type="button"
                onClick={() => setMostrarAsignarSaldo(true)}
                className="inline-flex h-10 items-center rounded-[10px] px-5 text-[13px] font-semibold transition-all"
                style={{ background: "#F2B233", color: "#0B2D3D" }}
              >
                Asignar saldo
              </button>
            </div>

            {/* Dialog: Asignar saldo */}
            <Dialog
              open={mostrarAsignarSaldo}
              onOpenChange={(open) => {
                if (!open) setNuevoSaldo("");
                setMostrarAsignarSaldo(open);
              }}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Asignar saldo base</DialogTitle>
                </DialogHeader>
                <div className="grid gap-1.5">
                  <Label htmlFor="nuevo-saldo-modal" className="text-[12px]">
                    Nuevo saldo base (€)
                  </Label>
                  <Input
                    id="nuevo-saldo-modal"
                    type="number"
                    placeholder="0.00"
                    value={nuevoSaldo}
                    onChange={(e) => setNuevoSaldo(e.target.value)}
                  />
                  <p className="text-[12px] text-brand-secondary">
                    Saldo actual: {data.saldoBase.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €
                  </p>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    disabled={!nuevoSaldo || Number(nuevoSaldo) <= 0 || saldoLoading}
                    onClick={handleAsignarSaldo}
                  >
                    {saldoLoading ? "Guardando…" : "Guardar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Usuario único */}
        <Card>
          <CardHeader>
            <CardTitle>Usuario único</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 px-5 pb-5 pt-0">
            <div className="grid gap-3 sm:grid-cols-2">
              <ReadField label="Empresa" value={data.nombre} />
              <ReadField label="CIF / Usuario" value={data.cif} />
              <ReadField label="Contacto" value={data.contacto ?? "—"} />
              <ReadField label="Email" value={data.email ?? "—"} />
              <ReadField label="Estado" value={data.estado} />
              <ReadField
                label="Debe cambiar contraseña"
                value={data.usuarioPropietario?.debeCambiarPassword ? "Sí" : "No"}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={instActiva ? "destructive" : "default"}
                size="sm"
                className="w-full"
                onClick={() => setMostrarToggleActiva(true)}
              >
                {instActiva ? "Desactivar" : "Activar"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  setEditForm({
                    nombre: data.nombre,
                    cif: data.cif,
                    contacto: data.contacto ?? "",
                    email: data.email ?? "",
                  });
                  setMostrarEditar(true);
                }}
              >
                Editar
              </Button>
              <Button
                size="sm"
                className="w-full"
                onClick={() => { setPwdGenerada(""); setMostrarGenerarPwd(true); }}
              >
                Generar contraseña
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Actividad (izq) + Panel lateral (der) ── */}
      <div className="grid gap-4 lg:grid-cols-[1.5fr_0.5fr]">

        {/* Actividad */}
        <Card className="flex flex-col">
          <CardHeader className="shrink-0 space-y-0 pb-4">
            <div className="flex flex-wrap gap-4 pb-3">
              <DateRangeSelect
                label="Desde"
                day={desdeDay} mes={desdeMes} anio={desdeAnio}
                onDay={setDesdeDay} onMes={setDesdeMes} onAnio={setDesdeAnio}
              />
              <DateRangeSelect
                label="Hasta"
                day={hastaDay} mes={hastaMes} anio={hastaAnio}
                onDay={setHastaDay} onMes={setHastaMes} onAnio={setHastaAnio}
              />
            </div>

            <div className="flex gap-2">
              <TabPill
                label="Expedientes"
                count={expFiltrados.length}
                active={tabActivo === "expedientes"}
                onClick={() => { setTabActivo("expedientes"); pagExp.resetPagina(); }}
              />
            </div>
          </CardHeader>

          <CardContent className="min-h-0 flex-1 overflow-hidden px-5 pb-5 pt-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ background: "rgba(11,45,61,.02)" }}>
                    <TableHead>Código</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Municipio</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {expFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-[12.5px] text-brand-secondary">
                        Sin expedientes en este período.
                      </td>
                    </tr>
                  ) : (
                    pagExp.itemsPagina.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell><TableCodeCell>{e.codigo}</TableCodeCell></TableCell>
                        <TableCell><TableMutedCell>{e.servicio ?? "—"}</TableMutedCell></TableCell>
                        <TableCell>
                          <StatusBadge
                            label={e.estado}
                            tone={statusTone(e.estado as Parameters<typeof statusTone>[0])}
                          />
                        </TableCell>
                        <TableCell><TableMutedCell>{e.municipio ?? "—"}</TableMutedCell></TableCell>
                      </TableRow>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              pagina={pagExp.pagina}
              totalPaginas={pagExp.totalPaginas}
              total={expFiltrados.length}
              pageSize={PAGE_SIZE_TABS}
              setPagina={pagExp.setPagina}
              className="-mx-5"
            />
          </CardContent>
        </Card>

        {/* Panel lateral: KPIs + line chart */}
        <div className="grid content-start gap-3">

          {/* KPI: Total */}
          <div className="rounded-[14px] bg-white px-5 py-4" style={{ boxShadow: "var(--shadow-sm)" }}>
            <p className="text-[11px] font-semibold uppercase tracking-[.06em] text-brand-secondary">Total</p>
            <div className="mt-2 flex gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[.05em] text-brand-secondary">Expedientes</p>
                <p className="mt-0.5 font-heading text-[28px] font-semibold leading-none text-brand-primary">
                  {data.expedientes.length}
                </p>
              </div>
              <div className="w-px self-stretch" style={{ background: "rgba(11,45,61,.08)" }} />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[.05em] text-brand-secondary">Correcciones</p>
                <p className="mt-0.5 font-heading text-[28px] font-semibold leading-none text-brand-primary">
                  0
                </p>
              </div>
            </div>
          </div>

          {/* Gráfica: line chart 12 meses */}
          <div className="rounded-[14px] bg-white px-4 py-4" style={{ boxShadow: "var(--shadow-sm)" }}>
            <ResponsiveContainer width="100%" height={170}>
              <LineChart
                data={lineData}
                margin={{ top: 4, right: 8, left: -14, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(11,45,61,.06)" />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 9, fill: "#5B6770" }}
                  axisLine={false}
                  tickLine={false}
                  interval={1}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "#5B6770" }}
                  axisLine={false}
                  tickLine={false}
                  width={20}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: "none",
                    boxShadow: "0 4px 20px rgba(11,45,61,.12)",
                    fontSize: 12,
                  }}
                />
                <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 10, paddingTop: 6 }} />
                <Line
                  type="monotone"
                  dataKey="Expedientes"
                  stroke="#0B2D3D"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Dialog: Generar contraseña ── */}
      <Dialog
        open={mostrarGenerarPwd}
        onOpenChange={(open) => {
          if (!open) { setPwdGenerada(""); }
          setMostrarGenerarPwd(open);
        }}
      >
        <DialogContent>
          {!pwdGenerada ? (
            <>
              <DialogHeader>
                <DialogTitle>Generar contraseña temporal</DialogTitle>
              </DialogHeader>
              <p className="text-[13px] leading-5 text-brand-secondary">
                La contraseña se restablecerá al CIF registrado de <strong>{data.nombre}</strong>. La instaladora debe cambiarla en el próximo acceso.
              </p>
              <DialogFooter>
                <Button type="button" disabled={pwdLoading} onClick={handleGenerarPwd}>
                  {pwdLoading ? "Generando…" : "Confirmar"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Contraseña restablecida</DialogTitle>
              </DialogHeader>
              <div className="grid gap-2">
                <p className="text-[12.5px] text-brand-secondary">{pwdGenerada}</p>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setMostrarGenerarPwd(false)}>
                  Cerrar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Editar instaladora ── */}
      <Dialog
        open={mostrarEditar}
        onOpenChange={(open) => setMostrarEditar(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar instaladora</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="edit-nombre" className="text-[12px]">Empresa</Label>
              <Input
                id="edit-nombre"
                value={editForm.nombre}
                onChange={(e) => setEditForm((f) => ({ ...f, nombre: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-cif" className="text-[12px]">CIF / Usuario</Label>
              <Input
                id="edit-cif"
                value={editForm.cif}
                onChange={(e) => setEditForm((f) => ({ ...f, cif: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-contacto" className="text-[12px]">Contacto</Label>
              <Input
                id="edit-contacto"
                value={editForm.contacto}
                onChange={(e) => setEditForm((f) => ({ ...f, contacto: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-email" className="text-[12px]">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              disabled={!editForm.nombre?.trim() || editLoading}
              onClick={handleEditar}
            >
              {editLoading ? "Guardando…" : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Desactivar / Activar ── */}
      <Dialog open={mostrarToggleActiva} onOpenChange={setMostrarToggleActiva}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {instActiva ? "Desactivar instaladora" : "Activar instaladora"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-[13px] leading-5 text-brand-secondary">
            {instActiva
              ? `Al desactivar ${data.nombre}, la instaladora no podrá iniciar sesión ni acceder al portal hasta que sea reactivada manualmente.`
              : `Al activar ${data.nombre}, la instaladora podrá volver a iniciar sesión y acceder al portal con normalidad.`}
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant={instActiva ? "destructive" : "default"}
              disabled={toggleLoading}
              onClick={handleToggleActiva}
            >
              {toggleLoading ? "Guardando…" : instActiva ? "Desactivar" : "Activar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

// ─── Sub-components ──────────────────────────────────────────────

function TabPill({
  label, count, active, onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-0.5 rounded-[10px] px-5 py-2.5 transition-all"
      style={active ? { background: "#0B2D3D", color: "#fff" } : { background: "#F4F7F8", color: "#5B6770" }}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[.06em] opacity-70">{label}</span>
      <span className="font-heading text-[22px] font-semibold leading-none">{count}</span>
    </button>
  );
}

function DateRangeSelect({
  label, day, mes, anio, onDay, onMes, onAnio,
}: {
  label: string;
  day: string; mes: string; anio: string;
  onDay: (v: string) => void;
  onMes: (v: string) => void;
  onAnio: (v: string) => void;
}) {
  const cls = "h-[32px] rounded-[8px] bg-[#EEF2F3] px-2 text-[12px] text-brand-primary outline-none cursor-pointer";
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-[.06em] text-brand-secondary">{label}</span>
      <div className="flex gap-1.5">
        <select className={cls} value={day} onChange={(e) => onDay(e.target.value)}>
          {DIAS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className={cls} value={mes} onChange={(e) => onMes(e.target.value)}>
          {MESES_LISTA.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select className={cls} value={anio} onChange={(e) => onAnio(e.target.value)}>
          {AÑOS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
    </div>
  );
}

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] px-4 py-3" style={{ background: "#F4F7F8" }}>
      <p className="text-[11px] font-semibold text-brand-secondary">{label}</p>
      <p className="mt-0.5 text-[13px] font-semibold text-brand-primary">{value}</p>
    </div>
  );
}

