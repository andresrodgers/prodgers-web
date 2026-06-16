"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, FolderKanban, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { MetricCard } from "@/components/data/metric-card";
import { Pagination } from "@/components/data/pagination";
import { StatusBadge } from "@/components/expediente/status-badge";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePagination } from "@/hooks/use-pagination";
import { statusTone } from "@/modules/expedientes/constants";
import type { ExpedienteListItem } from "@/modules/expedientes/types";
import { timeAgo } from "@/lib/utils";

type SaldoData = {
  nombre: string;
  saldoBase: number;
  gastado: number;
  disponible: number;
};

const PAGE_SIZE_INICIO = 10;

export default function InstaladoraHomePage() {
  const [expedientes, setExpedientes] = useState<ExpedienteListItem[]>([]);
  const [saldo, setSaldo] = useState<SaldoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/expedientes?limit=200").then((r) => r.json()),
      fetch("/api/instaladoras/me").then((r) => r.json()),
    ]).then(([expRes, saldoRes]) => {
      if (expRes.ok) setExpedientes(expRes.data.data);
      if (saldoRes.ok) setSaldo(saldoRes.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const pendientes = expedientes.filter(
    (e) => e.estado === "Documentacion pendiente" || e.estado === "Subsanacion",
  );
  const activos = expedientes.filter((e) => e.estado !== "Finalizado" && e.estado !== "Cancelado");
  const finalizados = expedientes.filter((e) => e.estado === "Finalizado");
  const clientesUnicos = new Set(expedientes.map((e) => e.clienteId)).size;

  const { pagina, totalPaginas, itemsPagina, setPagina } = usePagination(expedientes, PAGE_SIZE_INICIO);

  return (
    <PageShell
      eyebrow="Portal instaladora"
      title={saldo?.nombre ?? "Mi portal"}
      description="Bienvenido a tu portal de gestión de expedientes."
    >
      {/* Saldo disponible */}
      <div className="grid gap-[14px] sm:grid-cols-3">
        <div className="rounded-[14px] bg-white px-5 py-4" style={{ boxShadow: "var(--shadow-sm)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-[.06em] text-brand-secondary">Saldo base</p>
          <p className="mt-1 font-heading text-[28px] font-semibold text-brand-primary">
            {loading ? "—" : (saldo?.saldoBase ?? 0).toLocaleString("es-ES", { minimumFractionDigits: 2 })} €
          </p>
        </div>
        <div className="rounded-[14px] bg-white px-5 py-4" style={{ boxShadow: "var(--shadow-sm)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-[.06em] text-brand-secondary">Gastado en tasas</p>
          <p className="mt-1 font-heading text-[28px] font-semibold text-brand-primary">
            {loading ? "—" : (saldo?.gastado ?? 0).toLocaleString("es-ES", { minimumFractionDigits: 2 })} €
          </p>
        </div>
        <div className="rounded-[14px] bg-white px-5 py-4" style={{ boxShadow: "var(--shadow-sm)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-[.06em]" style={{ color: "#1f6b48" }}>Disponible</p>
          <p className="mt-1 font-heading text-[28px] font-semibold" style={{ color: "#1f6b48" }}>
            {loading ? "—" : (saldo?.disponible ?? 0).toLocaleString("es-ES", { minimumFractionDigits: 2 })} €
          </p>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid gap-[14px] sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Expedientes activos"
          value={loading ? "—" : activos.length}
          accent
          icon={<FolderKanban className="h-[13px] w-[13px]" />}
        />
        <MetricCard
          label="Pendientes acción"
          value={loading ? "—" : pendientes.length}
          icon={<AlertTriangle className="h-[13px] w-[13px]" />}
        />
        <MetricCard
          label="Clientes únicos"
          value={loading ? "—" : clientesUnicos}
          icon={<Users className="h-[13px] w-[13px]" />}
        />
        <MetricCard
          label="Finalizados"
          value={loading ? "—" : finalizados.length}
          icon={<CheckCircle2 className="h-[13px] w-[13px]" />}
        />
      </div>

      {/* Expedientes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Mis expedientes</CardTitle>
          <Button asChild size="sm">
            <Link href="/instaladora/expedientes/nuevo">+ Nuevo expediente</Link>
          </Button>
        </CardHeader>
        <CardContent className="px-0 pb-0 pt-0">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: "rgba(11,45,61,.02)" }}>
                {["Código", "Cliente", "Estado", "Último cambio", ""].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[.06em] text-brand-secondary">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-[13px] text-brand-secondary">
                    Cargando…
                  </td>
                </tr>
              ) : itemsPagina.map((e) => (
                <tr key={e.id} className="border-t border-[rgba(11,45,61,.05)]">
                  <td className="px-5 py-3">
                    <span className="rounded-[6px] bg-[#EEF2F3] px-2 py-0.5 font-mono text-[11.5px] font-semibold text-brand-primary">{e.codigo}</span>
                  </td>
                  <td className="px-5 py-3 text-[13px] text-brand-secondary">{e.cliente}</td>
                  <td className="px-5 py-3">
                    <StatusBadge label={e.estado} tone={statusTone(e.estado)} />
                  </td>
                  <td className="px-5 py-3 text-[12px] text-brand-secondary">{timeAgo(e.updatedAt)}</td>
                  <td className="px-5 py-3 text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/instaladora/expedientes/${e.id}`}>Ver</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            pagina={pagina}
            totalPaginas={totalPaginas}
            total={expedientes.length}
            pageSize={PAGE_SIZE_INICIO}
            setPagina={setPagina}
          />
        </CardContent>
      </Card>
    </PageShell>
  );
}
