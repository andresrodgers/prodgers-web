"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Building2, CheckCircle2, FolderKanban } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { MetricCard } from "@/components/data/metric-card";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExpedienteListItem } from "@/modules/expedientes/types";

type InstaladoraResumen = {
  id: string;
  nombre: string;
  estado: string;
  expedientesCount: number;
};

const MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const COLORES_ESTADO = ["#0B2D3D", "#2E7D5B", "#F2B233", "#C0492F", "#5B6770", "#16475f", "#7B4B94", "#2980B9", "#E67E22", "#4CAF82"];
const INST_COLORS = ["#0B2D3D", "#2E7D5B", "#F2B233", "#C0492F", "#5B6770"];

const PERIODOS = ["Este mes", "Últimos 3 meses", "Este año"] as const;

function getMesesPeriodo(periodo: string): string[] {
  const now = new Date();
  const cy = now.getFullYear();
  const cm = now.getMonth();
  if (periodo === "Este mes") return [`${cy}-${String(cm + 1).padStart(2, "0")}`];
  if (periodo === "Últimos 3 meses") {
    return [-2, -1, 0].map((o) => {
      const d = new Date(cy, cm + o, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    });
  }
  return Array.from({ length: cm + 1 }, (_, i) => `${cy}-${String(i + 1).padStart(2, "0")}`);
}

function ymALabel(ym: string): string {
  return MESES_CORTOS[Number(ym.split("-")[1]) - 1] ?? ym;
}

function expYM(createdAt: string): string {
  return createdAt.slice(0, 7);
}

export default function AdminHomePage() {
  const [periodo, setPeriodo] = useState<(typeof PERIODOS)[number]>("Últimos 3 meses");
  const [expedientes, setExpedientes] = useState<ExpedienteListItem[]>([]);
  const [instaladoras, setInstaladoras] = useState<InstaladoraResumen[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/expedientes?limit=500").then((r) => r.json()),
      fetch("/api/instaladoras").then((r) => r.json()),
    ]).then(([expJson, instJson]) => {
      if (expJson.ok) setExpedientes(expJson.data.data);
      if (instJson.ok) setInstaladoras(instJson.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const meses = useMemo(() => getMesesPeriodo(periodo), [periodo]);

  const ahora = new Date();
  const mesActual = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}`;

  const finalizadosEsteMes = expedientes.filter(
    (e) => e.estado === "Finalizado" && expYM(e.updatedAt) === mesActual,
  ).length;

  const lineData = useMemo(
    () =>
      meses.map((ym) => ({
        mes: ymALabel(ym),
        Expedientes: expedientes.filter((e) => expYM(e.createdAt) === ym).length,
      })),
    [meses, expedientes],
  );

  const instaladorasBarData = useMemo(
    () =>
      meses.map((ym) => {
        const entry: Record<string, string | number> = { mes: ymALabel(ym) };
        for (const inst of instaladoras) {
          entry[inst.nombre] = expedientes.filter(
            (e) => e.instaladoraId === inst.id && expYM(e.createdAt) === ym,
          ).length;
        }
        return entry;
      }),
    [meses, expedientes, instaladoras],
  );

  const distribucion = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of expedientes) counts[e.estado] = (counts[e.estado] ?? 0) + 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [expedientes]);

  const operativosData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of expedientes) {
      if (!e.responsableId || e.responsable === "Sin asignar") continue;
      if (!meses.includes(expYM(e.createdAt))) continue;
      counts[e.responsable] = (counts[e.responsable] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([nombre, total]) => ({ nombre, total }))
      .sort((a, b) => b.total - a.total);
  }, [meses, expedientes]);

  if (loading) {
    return (
      <PageShell eyebrow="PRODGERS admin" title="Dashboard">
        <p className="text-[13px] text-brand-secondary">Cargando datos…</p>
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow="PRODGERS admin"
      title="Dashboard"
      actions={
        <>
          <Button asChild>
            <Link href="/admin/instaladoras">+ Instaladora</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/usuarios">+ Usuario</Link>
          </Button>
        </>
      }
    >
      <div className="grid gap-[14px] sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Instaladoras activas"
          value={instaladoras.filter((i) => i.estado === "Activa").length}
          accent
          icon={<Building2 className="h-[13px] w-[13px]" />}
        />
        <MetricCard
          label="Expedientes activos"
          value={expedientes.filter((e) => e.estado !== "Finalizado" && e.estado !== "Cancelado").length}
          icon={<FolderKanban className="h-[13px] w-[13px]" />}
        />
        <MetricCard
          label="Sin asignar"
          value={expedientes.filter((e) => !e.responsableId).length}
          icon={<AlertTriangle className="h-[13px] w-[13px]" />}
        />
        <MetricCard
          label="Finalizados este mes"
          value={finalizadosEsteMes}
          icon={<CheckCircle2 className="h-[13px] w-[13px]" />}
        />
      </div>

      <div className="flex gap-2">
        {PERIODOS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriodo(p)}
            className="rounded-[10px] px-4 py-2 text-[12.5px] font-semibold transition-all"
            style={
              periodo === p
                ? { background: "#0B2D3D", color: "#fff" }
                : { background: "#F4F7F8", color: "#5B6770" }
            }
          >
            {p}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actividad general</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-0">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={lineData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(11,45,61,.06)" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#5B6770" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#5B6770" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(11,45,61,.12)", fontSize: 12 }} />
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Line type="monotone" dataKey="Expedientes" stroke="#0B2D3D" strokeWidth={2} dot={{ r: 4, fill: "#0B2D3D" }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Expedientes por instaladora</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={instaladorasBarData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(11,45,61,.06)" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#5B6770" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#5B6770" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(11,45,61,.12)", fontSize: 12 }} />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
                {instaladoras.map((inst, idx) => (
                  <Bar key={inst.id} dataKey={inst.nombre} fill={INST_COLORS[idx % INST_COLORS.length]} radius={[3, 3, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribución por estado</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center px-5 pb-5 pt-0">
            {distribucion.length === 0 ? (
              <p className="py-8 text-[12.5px] text-brand-secondary">Sin expedientes.</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={distribucion} innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={2}>
                      {distribucion.map((_, i) => (
                        <Cell key={i} fill={COLORES_ESTADO[i % COLORES_ESTADO.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(11,45,61,.12)", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-2">
                  {distribucion.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: COLORES_ESTADO[i % COLORES_ESTADO.length] }} />
                      <span className="text-[11px] text-brand-secondary">{item.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nivel operativo</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-0">
          {operativosData.length === 0 ? (
            <p className="py-8 text-center text-[12.5px] text-brand-secondary">
              Sin expedientes asignados en este período.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(120, operativosData.length * 52)}>
              <BarChart data={operativosData} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(11,45,61,.06)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#5B6770" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11, fill: "#5B6770" }} axisLine={false} tickLine={false} width={110} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 20px rgba(11,45,61,.12)", fontSize: 12 }} />
                <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                  {operativosData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "#0B2D3D" : i === 1 ? "#16475f" : "#5B6770"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
