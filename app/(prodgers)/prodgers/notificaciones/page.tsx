"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { TableCell, TableHead, TableRow } from "@/components/data/data-table-shell";
import { Pagination } from "@/components/data/pagination";
import { PageShell } from "@/components/layout/page-shell";
import { usePagination } from "@/hooks/use-pagination";
import { timeAgo } from "@/lib/utils";

type Notificacion = {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string | null;
  entidadTipo: string | null;
  entidadId: string | null;
  leida: boolean;
  createdAt: string;
};

const PAGE_SIZE = 30;

export default function NotificacionesPage() {
  const router = useRouter();
  const [all, setAll] = useState<Notificacion[]>([]);
  const [filtro, setFiltro] = useState<"todas" | "no_leidas">("todas");

  useEffect(() => {
    fetch("/api/notificaciones")
      .then((r) => r.json())
      .then((json) => { if (json.ok) setAll(json.data.data); })
      .catch(() => {});
  }, []);

  const marcarTodasLeidas = () => {
    fetch("/api/notificaciones", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    }).catch(() => {});
    setAll((prev) => prev.map((n) => ({ ...n, leida: true })));
  };

  const marcarLeida = (id: string) => {
    fetch(`/api/notificaciones/${id}`, { method: "PATCH" }).catch(() => {});
    setAll((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
  };

  const handleClick = (n: Notificacion) => {
    if (!n.leida) marcarLeida(n.id);
    if (n.entidadId) router.push(`/prodgers/expedientes/${n.entidadId}`);
  };

  const filtered = filtro === "no_leidas" ? all.filter((n) => !n.leida) : all;
  const { pagina, totalPaginas, itemsPagina, setPagina } = usePagination(filtered, PAGE_SIZE);

  return (
    <PageShell
      title="Notificaciones"
      actions={
        <div className="flex items-center gap-3">
          <div
            className="flex overflow-hidden rounded-[11px] border"
            style={{ borderColor: "rgba(255,255,255,.08)" }}
          >
            {(["todas", "no_leidas"] as const).map((f) => (
              <button
                key={f}
                onClick={() => { setFiltro(f); setPagina(1); }}
                className="px-3 py-1.5 text-[12px] font-semibold transition"
                style={
                  filtro === f
                    ? { background: "rgba(255,255,255,.12)", color: "#fff" }
                    : { color: "#9fb2bc" }
                }
              >
                {f === "todas" ? "Todas" : "No leídas"}
              </button>
            ))}
          </div>
          {all.some((n) => !n.leida) && (
            <button
              onClick={marcarTodasLeidas}
              className="text-[12px] text-[#9fb2bc] transition hover:text-white"
            >
              Marcar todas leídas
            </button>
          )}
        </div>
      }
    >
      <div
        className="overflow-hidden rounded-[16px]"
        style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)" }}
      >
        <table className="w-full text-left">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,.07)" }}>
              <TableHead>Notificación</TableHead>
              <TableHead>Mensaje</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
            </tr>
          </thead>
          <tbody>
            {itemsPagina.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-[#9fb2bc]">
                  Sin notificaciones
                </TableCell>
              </TableRow>
            ) : (
              (itemsPagina as Notificacion[]).map((n) => (
                <TableRow
                  key={n.id}
                  className="cursor-pointer hover:bg-white/5"
                  onClick={() => handleClick(n)}
                  style={n.leida ? {} : { background: "rgba(242,178,51,.04)" }}
                >
                  <TableCell>
                    <span className={`font-semibold ${n.leida ? "text-[#9fb2bc]" : "text-white"}`}>
                      {!n.leida && (
                        <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-400 align-middle" />
                      )}
                      {n.titulo}
                    </span>
                  </TableCell>
                  <TableCell className="text-[#9fb2bc]">{n.mensaje ?? "—"}</TableCell>
                  <TableCell className="text-[#9fb2bc]">{timeAgo(n.createdAt)}</TableCell>
                  <TableCell>
                    <span
                      className={`text-[11px] font-semibold ${
                        n.leida ? "text-[#5b6770]" : "text-amber-400"
                      }`}
                    >
                      {n.leida ? "Leída" : "No leída"}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        pagina={pagina}
        totalPaginas={totalPaginas}
        total={filtered.length}
        pageSize={PAGE_SIZE}
        setPagina={setPagina}
      />
    </PageShell>
  );
}
