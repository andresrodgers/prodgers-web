"use client";

import { ChevronDown } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type { DocumentoFinal } from "@/modules/expedientes/types";

import { DocumentReviewCard } from "@/components/documents/document-review-card";
import { FinalDocumentCard } from "@/components/documents/final-document-card";
import { StatusBadge } from "@/components/expediente/status-badge";
import { Timeline } from "@/components/expediente/timeline";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EXPEDIENTE_ESTADOS } from "@/modules/expedientes/constants";
import { statusTone } from "@/modules/expedientes/constants";
import type { ExpedienteDetalle, HistorialEntry, Tasa } from "@/modules/expedientes/types";
import { TIPO_DOCUMENTO_LABEL } from "@/modules/documentos/constants";
import { useSession } from "@/hooks/use-session";
import { timeAgo } from "@/lib/utils";

const ESTADOS_SIN_NOTA_REQUERIDA = [
  "MTD en elaboracion",
  "MTD finalizada",
  "CAU solicitado",
  "CAU obtenido",
  "Registro Industria obtenido",
  "Validacion distribuidora pendiente",
  "Compensacion activada",
  "Finalizado",
  "Cancelado",
];

export default function DetalleOperativoPage() {
  const params = useParams<{ id: string }>();
  const { session } = useSession();

  const [expediente, setExpediente] = useState<ExpedienteDetalle | null>(null);
  const [loading, setLoading] = useState(true);

  const [localResponsable, setLocalResponsable] = useState("");
  const [localResponsableId, setLocalResponsableId] = useState<string | null>(null);
  const [localEstado, setLocalEstado] = useState("");
  const [localTimeline, setLocalTimeline] = useState<HistorialEntry[]>([]);
  const [localTasas, setLocalTasas] = useState<Tasa[]>([]);
  const [actualizacionEnviada, setActualizacionEnviada] = useState(false);

  const [estadoSeleccionado, setEstadoSeleccionado] = useState("");
  const [selectedElement, setSelectedElement] = useState("Factura electrica");
  const [visibleNote, setVisibleNote] = useState("");
  const [cupsValue, setCupsValue] = useState("");
  const [cupsGuardado, setCupsGuardado] = useState(false);
  const [cupsEditando, setCupsEditando] = useState(true);

  const [tasaConcepto, setTasaConcepto] = useState("");
  const [tasaMonto, setTasaMonto] = useState("");

  const [localDocsEntrada, setLocalDocsEntrada] = useState<ExpedienteDetalle["documentosEntrada"]>([]);
  const [localDocsFinales, setLocalDocsFinales] = useState<DocumentoFinal[]>([]);
  const [validando, setValidando] = useState<Record<string, boolean>>({});
  const [enviandoFinales, setEnviandoFinales] = useState(false);
  const [finalesEnviados, setFinalesEnviados] = useState(false);

  useEffect(() => {
    fetch(`/api/expedientes/${params.id}`)
      .then((r) => r.json())
      .then((r) => {
        if (r.ok) {
          const exp: ExpedienteDetalle = r.data;
          setExpediente(exp);
          setLocalResponsable(exp.responsable);
          setLocalResponsableId(exp.responsableId);
          setLocalEstado(exp.estado);
          setEstadoSeleccionado(exp.estado);
          setLocalTimeline(exp.historial);
          setLocalTasas(exp.tasas);
          setLocalDocsEntrada(exp.documentosEntrada);
          setLocalDocsFinales(exp.documentosFinales);
          const cups = exp.cups ?? "";
          setCupsValue(cups);
          setCupsGuardado(!!cups);
          setCupsEditando(!cups);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  const isUnassigned = !localResponsableId;

  const incorrectDocument = useMemo(
    () => localDocsEntrada.find((d) => d.estado === "Incorrecto"),
    [localDocsEntrada],
  );

  const mostrarCampoAfectado = estadoSeleccionado === "Documentacion pendiente";
  const notaRequerida = estadoSeleccionado === "Documentacion pendiente" && !ESTADOS_SIN_NOTA_REQUERIDA.includes(estadoSeleccionado);

  async function handleTomarExpediente() {
    if (!session?.userId) return;
    const res = await fetch(`/api/expedientes/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ responsableId: session.userId }),
    });
    const json = await res.json();
    if (json.ok) {
      setLocalResponsable(json.data.responsable);
      setLocalResponsableId(json.data.responsableId);
      setLocalTimeline((prev) => [{
        id: crypto.randomUUID(),
        titulo: `Expediente tomado por ${json.data.responsable}`,
        descripcion: null,
        estadoAnterior: null,
        estadoNuevo: null,
        createdAt: new Date().toISOString(),
      }, ...prev]);
    }
  }

  async function handleEnviarActualizacion() {
    const res = await fetch(`/api/expedientes/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        estado: estadoSeleccionado,
        descripcion: visibleNote.trim() || undefined,
        campoAfectado: mostrarCampoAfectado ? selectedElement : undefined,
      }),
    });
    const json = await res.json();
    if (json.ok) {
      setLocalEstado(estadoSeleccionado);
      setLocalTimeline((prev) => [{
        id: crypto.randomUUID(),
        titulo: `Estado actualizado a "${estadoSeleccionado}"`,
        descripcion: visibleNote.trim() || null,
        estadoAnterior: localEstado,
        estadoNuevo: estadoSeleccionado,
        createdAt: new Date().toISOString(),
      }, ...prev]);
      setVisibleNote("");
      setActualizacionEnviada(true);
      setTimeout(() => setActualizacionEnviada(false), 3000);
    }
  }

  async function handleRegistrarTasa() {
    const res = await fetch("/api/tasas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        expedienteId: params.id,
        concepto: tasaConcepto.trim(),
        monto: Number(tasaMonto),
      }),
    });
    const json = await res.json();
    if (json.ok) {
      setLocalTasas((prev) => [json.data, ...prev]);
      setTasaConcepto("");
      setTasaMonto("");
    }
  }

  async function handleGuardarCups() {
    const res = await fetch(`/api/expedientes/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cups: cupsValue }),
    });
    if ((await res.json()).ok) {
      setCupsGuardado(true);
      setCupsEditando(false);
    }
  }

  async function handleValidarDoc(docId: string) {
    setValidando((prev) => ({ ...prev, [docId]: true }));
    try {
      const res = await fetch(`/api/documentos-entrada/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "Validado" }),
      });
      const json = await res.json();
      if (json.ok) {
        setLocalDocsEntrada((prev) =>
          prev.map((d) => (d.id === docId ? { ...d, estado: "Validado" as const } : d)),
        );
      }
    } finally {
      setValidando((prev) => ({ ...prev, [docId]: false }));
    }
  }

  function handleDescargarDoc(docId: string, nombreArchivo: string) {
    const a = document.createElement("a");
    a.href = `/api/documentos-entrada/${docId}/download`;
    a.download = nombreArchivo;
    a.click();
  }

  async function handleSubirDocFinal(file: File, fase: string, titulo: string) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("expediente_id", params.id);
    formData.append("fase", fase);
    formData.append("titulo", titulo);
    const res = await fetch("/api/documentos-finales", { method: "POST", body: formData });
    const json = await res.json();
    if (json.ok) {
      setLocalDocsFinales((prev) => [...prev, json.data as DocumentoFinal]);
    }
  }

  function handleDescargarFinalDoc(docId: string, nombreArchivo: string) {
    const a = document.createElement("a");
    a.href = `/api/documentos-finales/${docId}/download`;
    a.download = nombreArchivo;
    a.click();
  }

  async function handleEnviarDocumentosFinales() {
    setEnviandoFinales(true);
    try {
      const res = await fetch("/api/documentos-finales/enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expedienteId: params.id }),
      });
      const json = await res.json();
      if (json.ok) {
        setFinalesEnviados(true);
        setTimeout(() => setFinalesEnviados(false), 4000);
      }
    } finally {
      setEnviandoFinales(false);
    }
  }

  async function handleMarcarDisponible(docId: string) {
    const res = await fetch(`/api/documentos-finales/${docId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: "Disponible" }),
    });
    const json = await res.json();
    if (json.ok) {
      setLocalDocsFinales((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, estado: "Disponible" as const } : d)),
      );
    }
  }

  if (loading) {
    return (
      <PageShell eyebrow="Detalle operativo" title="Cargando…">
        <p className="text-[13px] text-brand-secondary">Cargando expediente…</p>
      </PageShell>
    );
  }

  if (!expediente) {
    return (
      <PageShell eyebrow="Detalle operativo" title="No encontrado">
        <p className="text-[13px] text-brand-secondary">El expediente no existe o no tienes acceso.</p>
      </PageShell>
    );
  }

  const excedentes = expediente.modalidadAutoconsumo !== "Sin excedentes";
  const compensacion = expediente.modalidadAutoconsumo === "Con excedentes acogido a compensacion";

  const modalidadLabel: Record<string, string> = {
    "Sin excedentes": "Sin excedentes",
    "Con excedentes acogido a compensacion": "Con excedentes acogido a compensación",
    "Con excedentes no acogido a compensacion": "Con excedentes no acogido a compensación",
  };

  const docsRevisables = localDocsEntrada.filter(
    (d) => d.estado !== "Pendiente",
  ) as unknown as Array<{ id: string; tipo: string; titulo: string; estado: "Subido" | "Validado" | "Incorrecto"; nombreArchivo: string | null; storagePath: string | null; createdAt: string }>;

  const timelineItems = localTimeline.map((h) => ({
    title: h.titulo,
    description: h.descripcion ?? undefined,
    date: timeAgo(h.createdAt),
  }));

  return (
    <PageShell
      eyebrow="Detalle operativo"
      title={`${expediente.codigo} — ${expediente.instaladora}`}
      description={
        isUnassigned
          ? "Expediente sin asignar"
          : `${expediente.cliente} · ${expediente.direccion} · ${expediente.potenciaKw} kWp`
      }
      actions={<StatusBadge label={localEstado as typeof EXPEDIENTE_ESTADOS[number]} tone={statusTone(localEstado as typeof EXPEDIENTE_ESTADOS[number])} />}
    >
      {isUnassigned ? <UnassignedGate onTomar={handleTomarExpediente} /> : null}

      {!isUnassigned ? (
        <>
          <AssignedSummary responsable={localResponsable} />

          <Card>
            <CardHeader>
              <CardTitle>Resumen técnico</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 px-5 pb-5 pt-0 sm:grid-cols-2 lg:grid-cols-4">
              <ReadField label="Potencia FV" value={`${expediente.potenciaKw} kWp`} />
              <ReadField label="Inversor" value={`${expediente.marcaInversor} ${expediente.modeloInversor}`} />
              <ReadField label="Modalidad" value={modalidadLabel[expediente.modalidadAutoconsumo] ?? expediente.modalidadAutoconsumo} />
              <ReadField label="Excedentes" value={excedentes ? "Sí" : "No"} />
              <ReadField label="Compensación" value={compensacion ? "Sí" : "No"} />
              <ReadField label="Distribuidora" value={expediente.distribuidora} />
              <ReadField label="Provincia" value={expediente.provincia} />
              <ReadField label="Municipio" value={expediente.municipio} />
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="cups" className="text-[11px] font-semibold uppercase tracking-[.06em] text-brand-secondary">
                  CUPS
                </Label>
                {cupsEditando ? (
                  <div className="flex gap-2">
                    <Input
                      id="cups"
                      placeholder="ES0021000012345678AA"
                      value={cupsValue}
                      onChange={(e) => setCupsValue(e.target.value)}
                      className="text-[13px]"
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={!cupsValue.trim()}
                      onClick={handleGuardarCups}
                    >
                      Guardar
                    </Button>
                    {cupsGuardado && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setCupsEditando(false)}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-[10px] px-4 py-3" style={{ background: "#F4F7F8" }}>
                      <p className="text-[13px] font-semibold text-brand-primary">{cupsValue}</p>
                    </div>
                    <Button type="button" size="sm" variant="outline" onClick={() => setCupsEditando(true)}>
                      Editar
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid items-start gap-4 xl:grid-cols-[1.3fr_0.7fr]">
            <div className="grid gap-4 self-start">
              <Card>
                <CardHeader>
                  <CardTitle>Documentos de entrada</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col px-5 pb-5 pt-0">
                  {docsRevisables.length === 0 ? (
                    <p className="py-4 text-[13px] text-brand-secondary">
                      La instaladora aún no ha subido documentos.
                    </p>
                  ) : (
                    docsRevisables.map((documento) => (
                      <DocumentReviewCard
                        key={documento.id}
                        title={TIPO_DOCUMENTO_LABEL[documento.tipo] ?? documento.tipo}
                        fileName={documento.nombreArchivo ?? "—"}
                        status={documento.estado}
                        validating={validando[documento.id] ?? false}
                        onDescargar={
                          documento.nombreArchivo
                            ? () => handleDescargarDoc(documento.id, documento.nombreArchivo!)
                            : undefined
                        }
                        onValidar={
                          documento.estado === "Subido"
                            ? () => handleValidarDoc(documento.id)
                            : undefined
                        }
                        onMarkIncorrect={(title, note) => {
                          setSelectedElement(TIPO_DOCUMENTO_LABEL[documento.tipo] ?? documento.tipo);
                          setVisibleNote(note ?? "");
                          setEstadoSeleccionado("Documentacion pendiente");
                        }}
                      />
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Documentos finales</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 px-5 pb-5 pt-0">
                  {localDocsFinales.map((documento) => (
                    <FinalDocumentCard
                      key={documento.id}
                      phase={documento.fase}
                      title={documento.titulo}
                      available={documento.estado === "Disponible"}
                      uploaded={documento.estado === "Pendiente" && !!documento.nombreArchivo}
                      onSubir={(file) => handleSubirDocFinal(file, documento.fase, documento.titulo)}
                      onDescargar={
                        documento.nombreArchivo
                          ? () => handleDescargarFinalDoc(documento.id, documento.nombreArchivo!)
                          : undefined
                      }
                      onReemplazar={(file) => handleSubirDocFinal(file, documento.fase, documento.titulo)}
                      onMarcarDisponible={() => handleMarcarDisponible(documento.id)}
                    />
                  ))}
                  {localDocsFinales.length === 0 && (
                    <p className="text-[13px] text-brand-secondary">Sin documentos finales.</p>
                  )}
                  <div className="rounded-[12px] border border-dashed border-brand-border bg-brand-surface p-4">
                    <p className="text-[13px] font-semibold text-brand-primary">Notificar a instaladora</p>
                    <p className="mt-1 text-[12.5px] text-brand-secondary">
                      Envía una notificación a la instaladora con los documentos finales marcados como Disponible.
                    </p>
                    {finalesEnviados && (
                      <p className="mt-2 rounded-[8px] px-3 py-2 text-[12px]" style={{ background: "rgba(46,125,91,.10)", color: "#2E7D5B" }}>
                        Notificación enviada correctamente.
                      </p>
                    )}
                    <Button
                      className="mt-3"
                      type="button"
                      disabled={enviandoFinales || !localDocsFinales.some((d) => d.estado === "Disponible")}
                      onClick={handleEnviarDocumentosFinales}
                    >
                      {enviandoFinales ? "Enviando…" : "Notificar documentos disponibles"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pago de tasa</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 px-5 pb-5 pt-0">
                  {localTasas.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <p className="text-[12px] font-semibold uppercase tracking-[.06em] text-brand-secondary">
                        Tasas registradas
                      </p>
                      {localTasas.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between rounded-[10px] px-4 py-2.5"
                          style={{ background: "#F4F7F8" }}
                        >
                          <span className="text-[13px] text-brand-primary">{t.concepto}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-[12px] text-brand-secondary">{timeAgo(t.createdAt)}</span>
                            <span className="font-heading text-[13px] font-semibold text-brand-primary">
                              {t.monto.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="tasa-concepto" className="text-[12px]">Concepto</Label>
                      <Input
                        id="tasa-concepto"
                        placeholder="Ej: Tasa distribuidora"
                        value={tasaConcepto}
                        onChange={(e) => setTasaConcepto(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="tasa-monto" className="text-[12px]">Monto (€)</Label>
                      <Input
                        id="tasa-monto"
                        type="number"
                        placeholder="0.00"
                        value={tasaMonto}
                        onChange={(e) => setTasaMonto(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Button
                      type="button"
                      disabled={!tasaConcepto.trim() || !tasaMonto.trim() || Number(tasaMonto) <= 0}
                      onClick={handleRegistrarTasa}
                    >
                      Registrar tasa
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Actualizar expediente</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 px-5 pb-5 pt-0">
                  <SelectField
                    id="nuevo-estado"
                    label="Nuevo estado"
                    options={EXPEDIENTE_ESTADOS as unknown as string[]}
                    value={estadoSeleccionado}
                    onChange={(v) => {
                      setEstadoSeleccionado(v);
                      if (v === "Documentacion pendiente" && incorrectDocument) {
                        setSelectedElement(TIPO_DOCUMENTO_LABEL[incorrectDocument.tipo] ?? incorrectDocument.tipo);
                      }
                    }}
                  />

                  {mostrarCampoAfectado && (
                    <SelectField
                      id="elemento-afectado"
                      label="Campo o documento afectado"
                      options={[
                        "Factura electrica",
                        "DNI/NIE titular",
                        "Autorizacion firmada",
                        "Fotografias de cubierta",
                        "Fotografias del contador",
                        "Fotografias del cuadro electrico",
                        "Direccion completa",
                        "Potencia prevista",
                        "General",
                      ]}
                      value={selectedElement}
                      onChange={setSelectedElement}
                    />
                  )}

                  <Textarea
                    placeholder={notaRequerida ? "Motivo de corrección (visible para la instaladora)" : "Comentario (opcional)"}
                    className="min-h-24"
                    value={visibleNote}
                    onChange={(e) => setVisibleNote(e.target.value)}
                  />

                  {mostrarCampoAfectado && (
                    <p className="text-[11.5px] leading-5 text-brand-secondary">
                      Esta nota sera visible para la instaladora en Correcciones pendientes y habilitara solo el
                      campo o documento seleccionado para correccion.
                    </p>
                  )}

                  {actualizacionEnviada && (
                    <p className="rounded-[8px] px-3 py-2 text-[12px] leading-5" style={{ background: "rgba(46,125,91,.10)", color: "#2E7D5B" }}>
                      Estado actualizado correctamente.
                    </p>
                  )}
                  <Button
                    className="w-full"
                    disabled={notaRequerida && !visibleNote.trim()}
                    onClick={handleEnviarActualizacion}
                  >
                    Enviar actualizacion
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Historial completo</CardTitle>
                </CardHeader>
                <CardContent>
                  <Timeline items={timelineItems} />
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : null}
    </PageShell>
  );
}

function UnassignedGate({ onTomar }: { onTomar: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tomar expediente para trabajar</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <p className="text-[13px] leading-6 text-brand-secondary">
          Este expediente todavia no tiene operador responsable. Para revisar documentos, ver informacion completa,
          cambiar estados o cargar documentos finales, primero debes tomarlo.
        </p>
        <div>
          <Button type="button" onClick={onTomar}>Tomar expediente</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AssignedSummary({ responsable }: { responsable: string }) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-white px-5 py-4"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[.08em] text-brand-secondary">Responsable</p>
        <p className="mt-1 text-[14px] font-semibold text-brand-primary">{responsable}</p>
      </div>
      <Button type="button" variant="outline" disabled>
        Expediente tomado
      </Button>
    </div>
  );
}

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] px-4 py-3" style={{ background: "#F4F7F8" }}>
      <p className="text-[11px] font-semibold uppercase tracking-[.06em] text-brand-secondary">{label}</p>
      <p className="mt-0.5 text-[13px] font-semibold text-brand-primary">{value}</p>
    </div>
  );
}

function SelectField({
  id, label, options, value, onChange,
}: {
  id: string;
  label: string;
  options: string[];
  value: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <select
          id={id}
          className="h-11 w-full appearance-none rounded-[10px] border border-brand-border bg-[#EEF2F3] px-4 pr-12 text-[14px] text-brand-primary outline-none"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        >
          {options.map((option) => (
            <option key={option}>{option}</option>
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
