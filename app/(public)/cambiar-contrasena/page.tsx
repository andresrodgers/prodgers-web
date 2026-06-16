"use client";

import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CambiarContrasenaPage() {
  return (
    <Suspense>
      <CambiarContrasenaForm />
    </Suspense>
  );
}

function CambiarContrasenaForm() {
  const router = useRouter();
  const params = useSearchParams();
  const dest = params.get("dest") ?? "/login";

  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const segura = nueva.length >= 8 && /[A-Z]/.test(nueva) && /[0-9]/.test(nueva);
  const coinciden = nueva === confirmar && confirmar.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!segura) { setError("La contraseña debe tener mínimo 8 caracteres, una mayúscula y un número."); return; }
    if (!coinciden) { setError("Las contraseñas no coinciden."); return; }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/cambiar-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passwordNueva: nueva }),
      });

      const json = await res.json();

      if (!json.ok) {
        setError(json.error?.message ?? "Error al cambiar la contraseña.");
        setLoading(false);
        return;
      }

      router.push(dest);
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full max-w-[420px] flex-col gap-6">
      {/* Logo */}
      <div className="flex justify-center">
        <Logo variant="onDark" size="md" />
      </div>

      {/* Card */}
      <div
        className="flex flex-col gap-6 rounded-[14px] px-8 py-9"
        style={{
          background: "rgba(255,255,255,.06)",
          border: "1px solid rgba(255,255,255,.10)",
        }}
      >
        <div className="flex flex-col gap-1.5">
          <h1 className="font-heading text-[22px] font-bold text-white">Crea tu contraseña</h1>
          <p className="text-[13px]" style={{ color: "rgba(255,255,255,.6)" }}>
            Es tu primer acceso. Define una contraseña personal para continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Nueva contraseña */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold" style={{ color: "rgba(255,255,255,.65)" }}>
              Nueva contraseña
            </label>
            <div className="relative">
              <Input
                type={mostrarNueva ? "text" : "password"}
                placeholder="Mínimo 8 caracteres"
                value={nueva}
                onChange={(e) => { setNueva(e.target.value); setError(""); }}
                autoComplete="new-password"
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setMostrarNueva((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-secondary"
                tabIndex={-1}
              >
                {mostrarNueva ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
            </div>
            {nueva.length > 0 && (
              <div className="flex gap-4 pt-0.5">
                <Req ok={nueva.length >= 8} label="8 caracteres" />
                <Req ok={/[A-Z]/.test(nueva)} label="1 mayúscula" />
                <Req ok={/[0-9]/.test(nueva)} label="1 número" />
              </div>
            )}
          </div>

          {/* Confirmar */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold" style={{ color: "rgba(255,255,255,.65)" }}>
              Confirmar contraseña
            </label>
            <div className="relative">
              <Input
                type={mostrarConfirmar ? "text" : "password"}
                placeholder="Repite la contraseña"
                value={confirmar}
                onChange={(e) => { setConfirmar(e.target.value); setError(""); }}
                autoComplete="new-password"
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setMostrarConfirmar((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-secondary"
                tabIndex={-1}
              >
                {mostrarConfirmar ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
            </div>
            {confirmar.length > 0 && !coinciden && (
              <p className="text-[11.5px]" style={{ color: "#f8a89a" }}>Las contraseñas no coinciden.</p>
            )}
          </div>

          {error && (
            <p
              className="rounded-[8px] px-3 py-2 text-[12px] leading-5"
              style={{ background: "rgba(192,73,47,.15)", color: "#f8a89a" }}
            >
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="mt-1 h-[42px] w-full text-[14px]"
            disabled={!segura || !coinciden || loading}
          >
            {loading ? "Guardando…" : "Guardar contraseña y entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function Req({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className="text-[11px] font-medium transition-colors"
      style={{ color: ok ? "#68d391" : "rgba(255,255,255,.35)" }}
    >
      {ok ? "✓" : "·"} {label}
    </span>
  );
}
