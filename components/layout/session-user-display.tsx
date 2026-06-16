"use client";

import { useSession } from "@/hooks/use-session";

export function SessionUserDisplay({ roleLabel }: { roleLabel: string }) {
  const { session, loading } = useSession();
  const nombre = session?.nombre ?? "";
  const initials = nombre ? nombre.slice(0, 2).toUpperCase() : "··";

  return (
    <div
      className="flex items-center gap-2.5 rounded-[14px] px-3 py-2.5"
      style={{ background: "rgba(255,255,255,.06)" }}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-heading text-xs font-semibold text-white"
        style={{
          background: "#16475f",
          border: "1px solid rgba(255,255,255,.18)",
          opacity: loading ? 0.4 : 1,
        }}
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className="truncate text-[12px] font-semibold text-white"
          style={{ opacity: loading ? 0.4 : 1 }}
        >
          {loading ? "·····" : (nombre || "PRODGERS")}
        </p>
        <p className="text-[11px]" style={{ color: "rgba(255,255,255,.45)" }}>
          {roleLabel}
        </p>
      </div>
    </div>
  );
}
