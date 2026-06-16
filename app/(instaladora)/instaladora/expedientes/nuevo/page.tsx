"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { DocumentUploadCard } from "@/components/documents/document-upload-card";
import { FormSection } from "@/components/forms/form-section";
import { StepIndicator } from "@/components/forms/step-indicator";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown } from "lucide-react";

const steps = [
  "Cliente final",
  "Datos de ubicacion",
  "Datos tecnicos",
  "Documentos",
  "Revision y envio",
];

type DocStatus = "Pendiente" | "Subido";

type DocKey =
  | "DNI/NIE titular"
  | "Factura electrica"
  | "Autorizacion firmada"
  | "Fotografias de cubierta"
  | "Fotografias del contador"
  | "Fotografias del cuadro electrico"
  | "Otros documentos";

type DocConfig = { key: DocKey; title: string; required: boolean };

const DOCS: DocConfig[] = [
  { key: "DNI/NIE titular", title: "DNI/NIE titular", required: true },
  { key: "Factura electrica", title: "Factura eléctrica", required: true },
  { key: "Autorizacion firmada", title: "Autorización firmada", required: true },
  { key: "Fotografias de cubierta", title: "Fotografías de cubierta", required: true },
  { key: "Fotografias del contador", title: "Fotografías del contador", required: true },
  { key: "Fotografias del cuadro electrico", title: "Fotografías del cuadro eléctrico", required: true },
  { key: "Otros documentos", title: "Otros documentos", required: false },
];

const initialDocStatuses: Record<DocKey, DocStatus> = {
  "DNI/NIE titular": "Pendiente",
  "Factura electrica": "Pendiente",
  "Autorizacion firmada": "Pendiente",
  "Fotografias de cubierta": "Pendiente",
  "Fotografias del contador": "Pendiente",
  "Fotografias del cuadro electrico": "Pendiente",
  "Otros documentos": "Pendiente",
};

type FormData = {
  nombre: string;
  dni: string;
  telefono: string;
  correo: string;
  direccion: string;
  municipio: string;
  provincia: string;
  distribuidora: string;
  observaciones: string;
  marcaPanel: string;
  modeloPanel: string;
  cantidadPaneles: string;
  marcaInversor: string;
  modeloInversor: string;
  potenciaInversor: string;
  modalidad: string;
  servicio: string;
};

const emptyForm: FormData = {
  nombre: "", dni: "", telefono: "", correo: "",
  direccion: "", municipio: "", provincia: "", distribuidora: "", observaciones: "",
  marcaPanel: "", modeloPanel: "", cantidadPaneles: "", marcaInversor: "", modeloInversor: "",
  potenciaInversor: "", modalidad: "Sin excedentes", servicio: "Pack completo",
};

export default function NuevoExpedientePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData | "_docs", string>>>({});
  const [docStatuses, setDocStatuses] = useState<Record<DocKey, DocStatus>>(initialDocStatuses);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  function uploadDoc(key: DocKey) {
    setDocStatuses((prev) => ({ ...prev, [key]: "Subido" }));
    setErrors((prev) => ({ ...prev, _docs: undefined }));
  }

  function setField(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validateStep(current: number): boolean {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (current === 0) {
      if (!form.nombre.trim()) newErrors.nombre = "Campo obligatorio";
      if (!form.dni.trim()) newErrors.dni = "Campo obligatorio";
      if (!form.telefono.trim()) newErrors.telefono = "Campo obligatorio";
      else if (!/^\+?[\d\s\-()\\.]{7,}$/.test(form.telefono)) newErrors.telefono = "Formato de teléfono no válido";
      if (!form.correo.trim()) newErrors.correo = "Campo obligatorio";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) newErrors.correo = "Formato de correo no válido";
    }

    if (current === 1) {
      if (!form.direccion.trim()) newErrors.direccion = "Campo obligatorio";
      if (!form.municipio.trim()) newErrors.municipio = "Campo obligatorio";
      if (!form.provincia.trim()) newErrors.provincia = "Campo obligatorio";
      if (!form.distribuidora.trim()) newErrors.distribuidora = "Campo obligatorio";
    }

    if (current === 2) {
      if (!form.marcaPanel.trim()) newErrors.marcaPanel = "Campo obligatorio";
      if (!form.modeloPanel.trim()) newErrors.modeloPanel = "Campo obligatorio";
      if (!form.cantidadPaneles.trim()) newErrors.cantidadPaneles = "Campo obligatorio";
      if (!form.marcaInversor.trim()) newErrors.marcaInversor = "Campo obligatorio";
      if (!form.modeloInversor.trim()) newErrors.modeloInversor = "Campo obligatorio";
      if (!form.potenciaInversor.trim()) newErrors.potenciaInversor = "Campo obligatorio";
    }

    if (current === 3) {
      const missingRequired = DOCS.filter((d) => d.required && docStatuses[d.key] === "Pendiente");
      if (missingRequired.length > 0) {
        (newErrors as Record<string, string>)._docs = "Faltan documentos obligatorios";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleContinue() {
    if (validateStep(step)) {
      setStep((v) => Math.min(steps.length - 1, v + 1));
    }
  }

  async function handleSubmit() {
    setSubmitError("");
    setSubmitting(true);
    const potenciaNum = parseFloat(form.potenciaInversor.replace(",", "."));
    try {
      const res = await fetch("/api/expedientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteNombre: form.nombre,
          clienteDni: form.dni,
          clienteTelefono: form.telefono || undefined,
          clienteCorreo: form.correo || undefined,
          servicio: form.servicio,
          direccion: form.direccion,
          municipio: form.municipio,
          provincia: form.provincia,
          distribuidora: form.distribuidora,
          observaciones: form.observaciones || undefined,
          potenciaKw: potenciaNum,
          marcaPanel: form.marcaPanel,
          modeloPanel: form.modeloPanel,
          cantidadPaneles: parseInt(form.cantidadPaneles, 10),
          marcaInversor: form.marcaInversor,
          modeloInversor: form.modeloInversor,
          potenciaInversorKwp: potenciaNum,
          modalidadAutoconsumo: form.modalidad,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setSubmitError(json.error?.message ?? "Error al crear el expediente.");
        setSubmitting(false);
        return;
      }
      router.push(`/instaladora/expedientes/${json.data.id}`);
    } catch {
      setSubmitError("Error de conexión. Inténtalo de nuevo.");
      setSubmitting(false);
    }
  }

  const hasDocErrors = !!errors._docs;

  return (
    <PageShell
      eyebrow="Instaladora"
      title="Nuevo expediente residencial"
      description="FV residencial menor a 10 kW. PRODGERS gestionara el expediente completo."
    >
      <StepIndicator steps={steps} current={step} />

      {step === 0 && (
        <ClienteStep form={form} setField={setField} errors={errors} />
      )}
      {step === 1 && (
        <InstalacionStep form={form} setField={setField} errors={errors} />
      )}
      {step === 2 && (
        <DatosTecnicosStep form={form} setField={setField} errors={errors} />
      )}
      {step === 3 && (
        <DocumentosStep
          hasErrors={hasDocErrors}
          form={form}
          setField={setField}
          docStatuses={docStatuses}
          onUpload={uploadDoc}
        />
      )}
      {step === 4 && <RevisionStep form={form} />}

      {submitError && (
        <p
          className="rounded-[8px] px-3 py-2 text-[12px] leading-5"
          style={{ background: "rgba(192,73,47,.15)", color: "#f8a89a" }}
        >
          {submitError}
        </p>
      )}

      <div
        className="flex flex-wrap justify-between gap-2 rounded-[14px] bg-white px-5 py-4"
        style={{ boxShadow: "var(--shadow-sm)" }}
      >
        <div className="flex gap-2">
          <Button asChild type="button" variant="destructive">
            <Link href="/instaladora/expedientes">Cancelar</Link>
          </Button>
          <Button type="button" variant="outline">Guardar borrador</Button>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={step === 0}
            onClick={() => setStep((v) => Math.max(0, v - 1))}
          >
            Volver
          </Button>
          {step < steps.length - 1 ? (
            <Button type="button" onClick={handleContinue}>Continuar</Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Enviando…" : "Enviar"}
            </Button>
          )}
        </div>
      </div>
    </PageShell>
  );
}

type ClienteSuggestion = {
  id: string;
  nombre: string;
  dniNie: string;
  telefono: string | null;
  correo: string | null;
};

function ClienteStep({
  form, setField, errors,
}: {
  form: FormData;
  setField: (f: keyof FormData, v: string) => void;
  errors: Partial<Record<keyof FormData, string>>;
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ClienteSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) return;
    const t = setTimeout(() => {
      fetch(`/api/clientes?search=${encodeURIComponent(query.trim())}&limit=8`)
        .then((r) => r.json())
        .then((r) => { if (r.ok) setSuggestions(r.data.data); })
        .catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  function selectCliente(c: ClienteSuggestion) {
    setField("nombre", c.nombre);
    setField("dni", c.dniNie);
    setField("telefono", c.telefono ?? "");
    setField("correo", c.correo ?? "");
    setQuery(c.nombre);
    setShowDropdown(false);
  }

  return (
    <FormSection title="Cliente final" description="Selecciona un cliente existente o registra uno nuevo.">
      <div className="relative space-y-2">
        <Label htmlFor="buscar-cliente">Buscar cliente existente</Label>
        <Input
          id="buscar-cliente"
          placeholder="Nombre, DNI/NIE o correo"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); }}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          autoComplete="off"
        />
        {showDropdown && suggestions.length > 0 && query.trim().length >= 2 && (
          <div
            className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-[10px] bg-white"
            style={{ boxShadow: "0 4px 20px rgba(11,45,61,.15)" }}
          >
            {suggestions.map((c) => (
              <button
                key={c.id}
                type="button"
                className="flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors hover:bg-[#F4F7F8]"
                onMouseDown={() => selectCliente(c)}
              >
                <span className="text-[13px] font-semibold text-brand-primary">{c.nombre}</span>
                <span className="text-[11.5px] text-brand-secondary">
                  {c.dniNie}{c.correo ? ` · ${c.correo}` : ""}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="nombre" label="Nombre y apellidos" placeholder="Maria Gomez Ruiz" required
          value={form.nombre} onChange={(v) => setField("nombre", v)} error={errors.nombre} />
        <Field id="dni" label="DNI/NIE" placeholder="12345678Z" required
          value={form.dni} onChange={(v) => setField("dni", v)} error={errors.dni} />
        <Field id="telefono" label="Teléfono" placeholder="+34 600 000 000" required
          value={form.telefono} onChange={(v) => setField("telefono", v)} error={errors.telefono} />
        <Field id="correo" label="Correo electrónico" placeholder="correo@email.com" required
          value={form.correo} onChange={(v) => setField("correo", v)} error={errors.correo} />
      </div>
    </FormSection>
  );
}

function InstalacionStep({
  form, setField, errors,
}: {
  form: FormData;
  setField: (f: keyof FormData, v: string) => void;
  errors: Partial<Record<keyof FormData, string>>;
}) {
  return (
    <FormSection title="Datos de ubicacion">
      <Field id="direccion" label="Dirección completa" placeholder="Calle del Sol 18, Valencia" required
        value={form.direccion} onChange={(v) => setField("direccion", v)} error={errors.direccion} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="municipio" label="Municipio" placeholder="Valencia" required
          value={form.municipio} onChange={(v) => setField("municipio", v)} error={errors.municipio} />
        <Field id="provincia" label="Provincia" placeholder="Valencia" required
          value={form.provincia} onChange={(v) => setField("provincia", v)} error={errors.provincia} />
      </div>
      <Field id="distribuidora" label="Distribuidora" placeholder="Iberdrola" required
        value={form.distribuidora} onChange={(v) => setField("distribuidora", v)} error={errors.distribuidora} />
      <div className="space-y-2">
        <Label htmlFor="observaciones">Observaciones</Label>
        <Textarea
          id="observaciones"
          placeholder="Notas relevantes para PRODGERS"
          className="min-h-24"
          value={form.observaciones}
          onChange={(e) => setField("observaciones", e.target.value)}
        />
      </div>
    </FormSection>
  );
}

function DatosTecnicosStep({
  form, setField, errors,
}: {
  form: FormData;
  setField: (f: keyof FormData, v: string) => void;
  errors: Partial<Record<keyof FormData, string>>;
}) {
  return (
    <FormSection title="Datos tecnicos" description="Información sobre los equipos y modalidad de la instalación.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="marcaPanel" label="Marca del panel" placeholder="Ej: Jinko Solar" required
          value={form.marcaPanel} onChange={(v) => setField("marcaPanel", v)} error={errors.marcaPanel} />
        <Field id="modeloPanel" label="Modelo del panel" placeholder="Ej: Tiger Neo N-Type" required
          value={form.modeloPanel} onChange={(v) => setField("modeloPanel", v)} error={errors.modeloPanel} />
        <Field id="cantidadPaneles" label="Cantidad de paneles" placeholder="12" required type="number"
          value={form.cantidadPaneles} onChange={(v) => setField("cantidadPaneles", v)} error={errors.cantidadPaneles} />
        <Field id="marcaInversor" label="Marca del inversor" placeholder="Ej: Huawei" required
          value={form.marcaInversor} onChange={(v) => setField("marcaInversor", v)} error={errors.marcaInversor} />
        <Field id="modeloInversor" label="Modelo del inversor" placeholder="Ej: SUN2000-5KTL" required
          value={form.modeloInversor} onChange={(v) => setField("modeloInversor", v)} error={errors.modeloInversor} />
        <Field id="potenciaInversor" label="Potencia del inversor" placeholder="Ej: 5.4 kWp" required
          value={form.potenciaInversor} onChange={(v) => setField("potenciaInversor", v)} error={errors.potenciaInversor} />
      </div>

      <SelectField
        id="modalidad"
        label="Modalidad de autoconsumo"
        required
        options={["Sin excedentes", "Con excedentes acogido a compensacion", "Con excedentes no acogido a compensacion"]}
        optionLabels={["Sin excedentes", "Con excedentes acogido a compensación", "Con excedentes no acogido a compensación"]}
        value={form.modalidad}
        onChange={(v) => setField("modalidad", v)}
      />

    </FormSection>
  );
}

function DocumentosStep({
  hasErrors,
  form,
  setField,
  docStatuses,
  onUpload,
}: {
  hasErrors: boolean;
  form: FormData;
  setField: (f: keyof FormData, v: string) => void;
  docStatuses: Record<DocKey, DocStatus>;
  onUpload: (key: DocKey) => void;
}) {
  const pendientesObligatorios = DOCS.filter(
    (d) => d.required && docStatuses[d.key] === "Pendiente"
  ).length;

  return (
    <div className="grid gap-4">
      <FormSection title="Tipo de servicio" description="Selecciona el servicio que PRODGERS gestionará para esta instalación.">
        <SelectField
          id="servicio"
          label="Tipo de servicio"
          required
          options={["Pack completo", "MTD", "Legalizacion", "Declaracion Responsable"]}
          optionLabels={["Pack completo", "MTD", "Legalización", "Declaración Responsable"]}
          value={form.servicio}
          onChange={(v) => setField("servicio", v)}
        />
      </FormSection>

      <div className="grid gap-3 md:grid-cols-2">
        {hasErrors && (
          <div
            className="col-span-full rounded-[10px] px-4 py-3 text-[12.5px] font-medium text-brand-primary"
            style={{ background: "#fbeccf", border: "1px solid rgba(242,178,51,.3)" }}
          >
            Faltan {pendientesObligatorios} documento{pendientesObligatorios !== 1 ? "s" : ""} obligatorio{pendientesObligatorios !== 1 ? "s" : ""}. Súbelos antes de continuar.
          </div>
        )}
        {DOCS.map((doc) => (
          <DocumentUploadCard
            key={doc.key}
            title={doc.title}
            required={doc.required}
            status={docStatuses[doc.key]}
            onUpload={() => onUpload(doc.key)}
          />
        ))}
      </div>
    </div>
  );
}

function RevisionStep({ form }: { form: FormData }) {
  const modalidadLabel: Record<string, string> = {
    "Sin excedentes": "Sin excedentes",
    "Con excedentes acogido a compensacion": "Con excedentes acogido a compensación",
    "Con excedentes no acogido a compensacion": "Con excedentes no acogido a compensación",
  };
  const servicioLabel: Record<string, string> = {
    "Pack completo": "Pack completo",
    "MTD": "MTD",
    "Legalizacion": "Legalización",
    "Declaracion Responsable": "Declaración Responsable",
  };

  return (
    <FormSection title="Revision antes de enviar" description="Revisa que no falten campos ni documentos obligatorios.">
      <p className="text-[12px] font-semibold uppercase tracking-[.06em] text-brand-secondary">Cliente y ubicación</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Read label="Cliente final" value={form.nombre || "—"} />
        <Read label="DNI/NIE" value={form.dni || "—"} />
        <Read label="Teléfono" value={form.telefono || "—"} />
        <Read label="Correo" value={form.correo || "—"} />
        <Read label="Dirección" value={form.direccion || "—"} />
        <Read label="Municipio / Provincia" value={[form.municipio, form.provincia].filter(Boolean).join(", ") || "—"} />
        <Read label="Distribuidora" value={form.distribuidora || "—"} />
      </div>

      <p className="text-[12px] font-semibold uppercase tracking-[.06em] text-brand-secondary">Datos técnicos</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Read label="Panel" value={[form.marcaPanel, form.modeloPanel].filter(Boolean).join(" — ") || "—"} />
        <Read label="Cantidad paneles" value={form.cantidadPaneles || "—"} />
        <Read label="Inversor" value={[form.marcaInversor, form.modeloInversor].filter(Boolean).join(" — ") || "—"} />
        <Read label="Potencia inversor" value={form.potenciaInversor || "—"} />
        <Read label="Modalidad autoconsumo" value={modalidadLabel[form.modalidad] ?? form.modalidad} />
        <Read label="Tipo de servicio" value={servicioLabel[form.servicio] ?? form.servicio} />
      </div>
    </FormSection>
  );
}

function Field({
  id, label, placeholder, required, value, onChange, error, type = "text",
}: {
  id: string;
  label: string;
  placeholder: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="ml-1 text-[#C0492F]">*</span>}
      </Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={error ? "border-[#C0492F]" : undefined}
      />
      {error && <p className="text-[11.5px] text-[#C0492F]">{error}</p>}
    </div>
  );
}

function SelectField({
  id, label, required, options, optionLabels, value, onChange,
}: {
  id: string;
  label: string;
  required?: boolean;
  options: string[];
  optionLabels: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="ml-1 text-[#C0492F]">*</span>}
      </Label>
      <div className="relative">
        <select
          id={id}
          className="h-11 w-full appearance-none rounded-[10px] border border-brand-border bg-[#EEF2F3] px-4 pr-12 text-[14px] text-brand-primary outline-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((opt, i) => (
            <option key={opt} value={opt}>{optionLabels[i]}</option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-brand-primary"
          strokeWidth={2}
        />
      </div>
    </div>
  );
}

function Read({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] px-4 py-3" style={{ background: "#F4F7F8" }}>
      <p className="text-[11px] font-semibold text-brand-secondary">{label}</p>
      <p className="mt-0.5 text-[13px] font-semibold text-brand-primary">{value}</p>
    </div>
  );
}
