"use client";

import { Eye, EyeOff, Lock } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  nombreUsuario: string;
  onCambiar: () => void;
};

export function ChangePasswordScreen({ nombreUsuario, onCambiar }: Props) {
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [error, setError] = useState("");

  const segura = nueva.length >= 8 && /[A-Z]/.test(nueva) && /[0-9]/.test(nueva);
  const coinciden = nueva === confirmar;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!segura) {
      setError("La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.");
      return;
    }
    if (!coinciden) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    onCambiar();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-surface px-4">
      <div
        className="w-full max-w-[400px] rounded-[20px] bg-white p-8"
        style={{ boxShadow: "var(--shadow-sm)" }}
      >
        {/* Icono */}
        <div
          className="mb-5 flex h-12 w-12 items-center justify-center rounded-[14px]"
          style={{ background: "#EEF2F3" }}
        >
          <Lock size={22} className="text-brand-primary" strokeWidth={2} />
        </div>

        {/* Encabezado */}
        <h1 className="font-heading text-[22px] font-semibold text-brand-primary">
          Crea tu contraseña
        </h1>
        <p className="mt-1.5 text-[13px] leading-5 text-brand-secondary">
          Bienvenido/a, <strong>{nombreUsuario}</strong>. Es tu primer acceso. Define una contraseña personal para continuar.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          {/* Nueva contraseña */}
          <div className="grid gap-1.5">
            <Label htmlFor="pwd-nueva" className="text-[12px]">Nueva contraseña</Label>
            <div className="relative">
              <Input
                id="pwd-nueva"
                type={mostrarNueva ? "text" : "password"}
                placeholder="Mínimo 8 caracteres"
                value={nueva}
                onChange={(e) => { setNueva(e.target.value); setError(""); }}
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setMostrarNueva((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-secondary"
                tabIndex={-1}
              >
                {mostrarNueva ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {/* Indicadores de seguridad */}
            {nueva.length > 0 && (
              <div className="flex gap-3 pt-0.5">
                <Req ok={nueva.length >= 8} label="8 caracteres" />
                <Req ok={/[A-Z]/.test(nueva)} label="1 mayúscula" />
                <Req ok={/[0-9]/.test(nueva)} label="1 número" />
              </div>
            )}
          </div>

          {/* Confirmar contraseña */}
          <div className="grid gap-1.5">
            <Label htmlFor="pwd-confirmar" className="text-[12px]">Confirmar contraseña</Label>
            <div className="relative">
              <Input
                id="pwd-confirmar"
                type={mostrarConfirmar ? "text" : "password"}
                placeholder="Repite la contraseña"
                value={confirmar}
                onChange={(e) => { setConfirmar(e.target.value); setError(""); }}
                className={confirmar.length > 0 && !coinciden ? "border-[#C0492F]" : ""}
              />
              <button
                type="button"
                onClick={() => setMostrarConfirmar((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-secondary"
                tabIndex={-1}
              >
                {mostrarConfirmar ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {confirmar.length > 0 && !coinciden && (
              <p className="text-[11.5px]" style={{ color: "#C0492F" }}>Las contraseñas no coinciden.</p>
            )}
          </div>

          {error && (
            <p className="text-[12px] font-medium" style={{ color: "#C0492F" }}>{error}</p>
          )}

          <Button
            type="submit"
            className="mt-1 w-full"
            disabled={!nueva || !confirmar || !segura || !coinciden}
          >
            Guardar contraseña y entrar
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
      style={{ color: ok ? "#1f6b48" : "#5B6770" }}
    >
      {ok ? "✓" : "·"} {label}
    </span>
  );
}
