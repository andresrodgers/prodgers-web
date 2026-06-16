import Link from "next/link";

import { FormSection } from "@/components/forms/form-section";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";

export default function PerfilInstaladoraPage() {
  return (
    <PageShell
      eyebrow="Instaladora"
      title="Perfil"
      description="Datos de cuenta de la instaladora. En el MVP quedan mayormente en solo lectura."
    >
      <FormSection title="Datos de instaladora">
        <ReadField label="Nombre de instaladora" value="Solar Levante SL" />
        <ReadField label="Persona de contacto" value="Laura Sanchez" />
        <ReadField label="Teléfono" value="+34 910 220 118" />
        <ReadField label="Email" value="operaciones@solarlevante.es" />
        <ReadField label="Identificador" value="B02938475" />
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
