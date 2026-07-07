"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { FormSection } from "@/components/forms/form-section";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";

type PerfilInstaladora = {
  nombre: string;
  cif: string;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
};

export default function PerfilInstaladoraPage() {
  const [perfil, setPerfil] = useState<PerfilInstaladora | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/instaladoras/me")
      .then((r) => r.json())
      .then((r) => {
        if (r.ok) setPerfil(r.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <PageShell
      eyebrow="Instaladora"
      title="Perfil"
      description="Datos de cuenta de la instaladora. En el MVP quedan mayormente en solo lectura."
    >
      <FormSection title="Datos de instaladora">
        {loading ? (
          <p className="text-[13px] text-brand-secondary">Cargando…</p>
        ) : perfil ? (
          <>
            <ReadField label="Nombre de instaladora" value={perfil.nombre} />
            <ReadField label="Persona de contacto" value={perfil.contacto || "—"} />
            <ReadField label="Teléfono" value={perfil.telefono || "—"} />
            <ReadField label="Email" value={perfil.email || "—"} />
            <ReadField label="Identificador" value={perfil.cif} />
          </>
        ) : (
          <p className="text-[13px] text-brand-secondary">No se pudo cargar el perfil.</p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/cambiar-contrasena">Cambiar contraseña</Link>
          </Button>
          <Button variant="outline">Cerrar sesión</Button>
        </div>
      </FormSection>
    </PageShell>
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
