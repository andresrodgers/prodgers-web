"use client";

import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function rolDestino(rol: string): string {
  if (rol === "admin") return "/admin/inicio";
  if (rol === "operativo") return "/prodgers/inicio";
  return "/instaladora/inicio";
}

export default function LoginPage() {
  const router = useRouter();
  const [identificador, setIdentificador] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const id = identificador.trim();
    if (!id) { setError("Introduce tu identificador."); return; }
    if (!password) { setError("Introduce tu contraseña."); return; }

    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identificador: id, password }),
      });

      const json = await res.json();

      if (!json.ok) {
        setError(json.error?.message ?? "Error al iniciar sesión.");
        setLoading(false);
        return;
      }

      const { rol, debeCambiarPassword } = json.data;
      const dest = rolDestino(rol);

      if (debeCambiarPassword) {
        router.push(`/cambiar-contrasena?dest=${encodeURIComponent(dest)}`);
      } else {
        router.push(dest);
      }
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
        <div className="flex flex-col gap-1.5 text-center">
          <h1 className="font-heading text-[22px] font-bold text-white">Acceso al portal</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold" style={{ color: "rgba(255,255,255,.65)" }}>
              Identificador
            </label>
            <Input
              placeholder="CIF o DNI/NIE"
              value={identificador}
              onChange={(e) => { setIdentificador(e.target.value); setError(""); }}
              autoComplete="username"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold" style={{ color: "rgba(255,255,255,.65)" }}>
              Contraseña
            </label>
            <div className="relative">
              <Input
                type={mostrarPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                autoComplete="current-password"
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setMostrarPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "rgba(255,255,255,.45)" }}
                tabIndex={-1}
              >
                {mostrarPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <p
              className="rounded-[8px] px-3 py-2 text-[12px] leading-5"
              style={{ background: "rgba(192,73,47,.15)", color: "#f8a89a" }}
            >
              {error}
            </p>
          )}

          <Button type="submit" className="mt-1 h-[42px] w-full text-[14px]" disabled={loading}>
            {loading ? "Accediendo…" : "Entrar"}
          </Button>
        </form>
      </div>

      <p className="text-center text-[11px]" style={{ color: "rgba(255,255,255,.25)" }}>
        Para recuperar el acceso, contacta a PRODGERS directamente.
      </p>
    </div>
  );
}
