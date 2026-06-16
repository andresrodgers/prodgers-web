"use client";

import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { timeAgo } from "@/lib/utils";
import { useSession } from "@/hooks/use-session";

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

const ROL_PREFIX: Record<string, string> = {
  admin: "/admin",
  operativo: "/prodgers",
  instaladora_propietario: "/instaladora",
  instaladora_gestor: "/instaladora",
};

export function NotificationBell() {
  const { session } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<Notificacion[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [open, setOpen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotificaciones = () => {
    if (document.visibilityState === "hidden") return;
    fetch("/api/notificaciones")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) {
          setItems(json.data.data);
          setNoLeidas(json.data.noLeidas);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchNotificaciones();
    intervalRef.current = setInterval(fetchNotificaciones, 30_000);
    document.addEventListener("visibilitychange", fetchNotificaciones);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", fetchNotificaciones);
    };
  }, []);

  const marcarLeida = (id: string) => {
    fetch(`/api/notificaciones/${id}`, { method: "PATCH" }).catch(() => {});
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
    setNoLeidas((c) => Math.max(0, c - 1));
  };

  const marcarTodasLeidas = () => {
    fetch("/api/notificaciones", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    }).catch(() => {});
    setItems((prev) => prev.map((n) => ({ ...n, leida: true })));
    setNoLeidas(0);
  };

  const handleClick = (n: Notificacion) => {
    if (!n.leida) marcarLeida(n.id);
    if (n.entidadId && session?.rol) {
      const prefix = ROL_PREFIX[session.rol] ?? "";
      router.push(`${prefix}/expedientes/${n.entidadId}`);
    }
    setOpen(false);
  };

  const prefix = session?.rol ? (ROL_PREFIX[session.rol] ?? "") : "";
  const preview = items.slice(0, 10);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className="relative flex h-8 w-8 items-center justify-center rounded-full text-[#9fb2bc] transition hover:text-white focus:outline-none"
        aria-label="Notificaciones"
      >
        <Bell className="h-[18px] w-[18px]" />
        {noLeidas > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-red-500 px-[3px] font-heading text-[9px] font-bold leading-none text-white">
            {noLeidas > 99 ? "99+" : noLeidas}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[340px] p-0"
        style={{ background: "#1a2a33", border: "1px solid rgba(255,255,255,.08)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-4 py-3"
          style={{ borderColor: "rgba(255,255,255,.08)" }}
        >
          <span className="font-heading text-[13px] font-semibold text-white">Notificaciones</span>
          {noLeidas > 0 && (
            <button
              onClick={marcarTodasLeidas}
              className="text-[11px] text-[#9fb2bc] transition hover:text-white"
            >
              Marcar todas leídas
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-[360px] overflow-y-auto">
          {preview.length === 0 ? (
            <p className="px-4 py-6 text-center text-[12px] text-[#9fb2bc]">Sin notificaciones</p>
          ) : (
            preview.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className="flex w-full flex-col gap-0.5 px-4 py-3 text-left transition hover:bg-white/5"
                style={n.leida ? {} : { background: "rgba(242,178,51,.04)" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`flex-1 font-heading text-[12px] font-semibold leading-snug ${
                      n.leida ? "text-[#9fb2bc]" : "text-white"
                    }`}
                  >
                    {!n.leida && (
                      <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-400 align-middle" />
                    )}
                    {n.titulo}
                  </span>
                  <span className="shrink-0 text-[10px] text-[#5b6770]">{timeAgo(n.createdAt)}</span>
                </div>
                {n.mensaje && (
                  <span className="line-clamp-1 text-[11px] text-[#5b6770]">{n.mensaje}</span>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        {preview.length > 0 && (
          <div className="border-t px-4 py-2.5" style={{ borderColor: "rgba(255,255,255,.08)" }}>
            <button
              onClick={() => {
                router.push(`${prefix}/notificaciones`);
                setOpen(false);
              }}
              className="text-[11px] text-[#9fb2bc] transition hover:text-white"
            >
              Ver todas las notificaciones
            </button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
