"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FormSection } from "@/components/forms/form-section";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormData = {
  nombre: string;
  dni: string;
  telefono: string;
  correo: string;
};

const emptyForm: FormData = { nombre: "", dni: "", telefono: "", correo: "" };

export default function NuevoClientePage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function setField(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate() {
    const newErrors: Partial<FormData> = {};
    if (!form.nombre.trim()) newErrors.nombre = "Campo obligatorio";
    if (!form.dni.trim()) newErrors.dni = "Campo obligatorio";
    if (form.telefono && !/^\+?[\d\s\-()\\.]{7,}$/.test(form.telefono))
      newErrors.telefono = "Formato no válido";
    if (form.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo))
      newErrors.correo = "Formato no válido";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(redirectTo?: "expediente") {
    if (!validate()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          dni: form.dni.trim(),
          telefono: form.telefono.trim() || undefined,
          correo: form.correo.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message ?? "Error al crear el cliente.");
        setSubmitting(false);
        return;
      }
      if (redirectTo === "expediente") {
        router.push("/instaladora/expedientes/nuevo");
      } else {
        router.push(`/instaladora/clientes/${json.data.id}`);
      }
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
      setSubmitting(false);
    }
  }

  return (
    <PageShell
      eyebrow="Instaladora"
      title="Crear cliente"
      description="Registra un cliente final para reutilizarlo en futuros expedientes."
    >
      <FormSection title="Datos del titular">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="nombre" label="Nombre y apellidos" placeholder="Maria Gomez Ruiz" required
            value={form.nombre} onChange={(v) => setField("nombre", v)} error={errors.nombre}
          />
          <Field
            id="dni" label="DNI/NIE" placeholder="12345678Z" required
            value={form.dni} onChange={(v) => setField("dni", v)} error={errors.dni}
          />
          <Field
            id="telefono" label="Telefono" placeholder="+34 600 000 000"
            value={form.telefono} onChange={(v) => setField("telefono", v)} error={errors.telefono}
          />
          <Field
            id="correo" label="Correo electronico" placeholder="correo@email.com"
            value={form.correo} onChange={(v) => setField("correo", v)} error={errors.correo}
          />
        </div>
      </FormSection>

      {error && (
        <p
          className="rounded-[8px] px-3 py-2 text-[12px] leading-5"
          style={{ background: "rgba(192,73,47,.15)", color: "#f8a89a" }}
        >
          {error}
        </p>
      )}

      <div
        className="flex flex-wrap justify-between gap-2 rounded-[14px] bg-white px-5 py-4"
        style={{ boxShadow: "var(--shadow-sm)" }}
      >
        <Button asChild type="button" variant="destructive">
          <Link href="/instaladora/clientes">Cancelar</Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => handleSubmit("expediente")}
          >
            Guardar y crear expediente
          </Button>
          <Button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit()}
          >
            {submitting ? "Guardando…" : "Crear cliente"}
          </Button>
        </div>
      </div>
    </PageShell>
  );
}

function Field({
  id, label, placeholder, required, value, onChange, error,
}: {
  id: string;
  label: string;
  placeholder: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="ml-0.5 text-[#f8a89a]">*</span>}
      </Label>
      <Input
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <p className="text-[11.5px]" style={{ color: "#f8a89a" }}>{error}</p>}
    </div>
  );
}
