"use client";

import { AlertTriangle, Download, FileText, Lock, Upload } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { DocumentStatusBadge } from "@/components/expediente/document-status-badge";
import { StatusBadge } from "@/components/expediente/status-badge";
import { Timeline } from "@/components/expediente/timeline";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { timeAgo } from "@/lib/utils";
import { TIPO_DOCUMENTO_LABEL } from "@/modules/documentos/constants";
import { statusTone } from "@/modules/expedientes/constants";
import type { DocumentoEntrada, DocumentoFinal, ExpedienteDetalle } from "@/modules/expedientes/types";

export default function DetalleExpedienteInstaladoraPage() {
  const params = useParams<{ id: string }>();
  const [expediente, setExpediente] = useState<ExpedienteDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [uploadError, setUploadError] = useState<Record<string, string>>({});
  const [localCorrecciones, setLocalCorrecciones] = useState<ExpedienteDetalle["correcciones"]>([]);
  const [resolviendo, setResolviendo] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch(`/api/expedientes/${params.id}`)
      .then((r) => r.json())
      .then((r) => {
        if (r.ok) {
          setExpediente(r.data);
          setLocalCorrecciones(r.data.correcciones);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  async function handleUploadDoc(docId: string, file: File) {
    setUploading((prev) => ({ ...prev, [docId]: true }));
    setUploadError((prev) => ({ ...prev, [docId]: "" }));

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/documentos-entrada/${docId}/upload`, {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!json.ok) {
        setUploadError((prev) => ({ ...prev, [docId]: json.error?.message ?? "Error al subir." }));
        return;
      }
      // Refresh expediente to get updated document list
      const expRes = await fetch(`/api/expedientes/${params.id}`);
      const expJson = await expRes.json();
      if (expJson.ok) setExpediente(expJson.data);
    } catch {
      setUploadError((prev) => ({ ...prev, [docId]: "Error de conexión." }));
    } finally {
      setUploading((prev) => ({ ...prev, [docId]: false }));
    }
  }

  function handleDownloadDoc(docId: string, nombreArchivo: string) {
    const a = document.createElement("a");
    a.href = `/api/documentos-entrada/${docId}/download`;
    a.download = nombreArchivo;
    a.click();
  }

  function handleDownloadFinalDoc(docId: string, nombreArchivo: string) {
    const a = document.createElement("a");
    a.href = `/api/documentos-finales/${docId}/download`;
    a.download = nombreArchivo;
    a.click();
  }

  async function handleResolverCorreccion(correccionId: string) {
    setResolviendo((prev) => ({ ...prev, [correccionId]: true }));
    try {
      const res = await fetch(`/api/correcciones/${correccionId}`, {
        method: "PATCH",
      });
      const json = await res.json();
      if (json.ok) {
        setLocalCorrecciones((prev) =>
          prev.map((c) => (c.id === correccionId ? { ...c, estado: "Resuelta" as const } : c)),
        );
      }
    } finally {
      setResolviendo((prev) => ({ ...prev, [correccionId]: false }));
    }
  }

  if (loading) {
    return (
      <PageShell eyebrow="Expediente" title="Cargando…">
        <p className="text-[13px] text-brand-secondary">Cargando expediente…</p>
      </PageShell>
    );
  }

  if (!expediente) {
    return (
      <PageShell eyebrow="Expediente" title="No encontrado">
        <p className="text-[13px] text-brand-secondary">El expediente no existe o no tienes acceso.</p>
      </PageShell>
    );
  }

  const correcciones = localCorrecciones.filter((c) => c.estado === "Pendiente");
  const timelineItems = expediente.historial.map((h) => ({
    title: h.titulo,
    description: h.descripcion ?? undefined,
    date: timeAgo(h.createdAt),
  }));

  return (
    <PageShell
      eyebrow="Expediente"
      title={`${expediente.codigo} - ${expediente.cliente}`}
      description={`${expediente.direccion} - ${expediente.potenciaKw} kWp - ${expediente.distribuidora}`}
      actions={<StatusBadge label={expediente.estado} tone={statusTone(expediente.estado)} />}
    >
      <div className="grid items-start gap-4 lg:grid-cols-[1.35fr_0.75fr]">
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Documentacion enviada</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col px-5 pb-5 pt-0">
              {expediente.documentosEntrada.length === 0 ? (
                <p className="py-4 text-[13px] text-brand-secondary">Sin documentos de entrada registrados.</p>
              ) : (
                expediente.documentosEntrada.map((documento) => (
                  <div key={documento.id}>
                    <SentDocumentCard
                      docId={documento.id}
                      title={TIPO_DOCUMENTO_LABEL[documento.tipo] ?? documento.tipo}
                      fileName={documento.nombreArchivo ?? "—"}
                      status={documento.estado as DocumentoEntrada["estado"]}
                      uploading={uploading[documento.id] ?? false}
                      onUpload={(file) => handleUploadDoc(documento.id, file)}
                      onDescargar={
                        documento.estado !== "Pendiente" && documento.nombreArchivo
                          ? () => handleDownloadDoc(documento.id, documento.nombreArchivo!)
                          : undefined
                      }
                    />
                    {uploadError[documento.id] && (
                      <p className="mb-2 rounded-[8px] px-3 py-1.5 text-[11.5px]" style={{ background: "rgba(192,73,47,.12)", color: "#f8a89a" }}>
                        {uploadError[documento.id]}
                      </p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documentos finales</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col px-5 pb-5 pt-0">
              {expediente.documentosFinales.length === 0 ? (
                <p className="py-4 text-[13px] text-brand-secondary">
                  Aún no hay documentos finales disponibles.
                </p>
              ) : (
                expediente.documentosFinales.map((documento) => (
                  <InstallerFinalDocumentCard
                    key={documento.id}
                    doc={documento}
                    onDescargar={
                      documento.estado === "Disponible" && documento.nombreArchivo
                        ? () => handleDownloadFinalDoc(documento.id, documento.nombreArchivo!)
                        : undefined
                    }
                  />
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tasas del expediente</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0">
              {expediente.tasas.length === 0 ? (
                <p className="text-[12.5px] text-brand-secondary">Sin tasas registradas para este expediente.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {expediente.tasas.map((t) => (
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
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4">
          {correcciones.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Correcciones pendientes</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 px-5 pb-5 pt-0">
                {correcciones.map((c) => (
                  <CorrectionCard
                    key={c.id}
                    title={c.campoAfectado}
                    note={c.nota}
                    resolving={resolviendo[c.id] ?? false}
                    onResolver={() => handleResolverCorreccion(c.id)}
                  />
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Historial visible</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline items={timelineItems} />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

function SentDocumentCard({
  docId: _docId,
  title,
  fileName,
  status,
  uploading,
  onUpload,
  onDescargar,
}: {
  docId: string;
  title: string;
  fileName: string;
  status: DocumentoEntrada["estado"];
  uploading: boolean;
  onUpload: (file: File) => void;
  onDescargar?: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const isPendiente = status === "Pendiente";
  const isIncorrecto = status === "Incorrecto";
  const canReplace = isIncorrecto;

  return (
    <div className="flex flex-wrap items-center gap-3 py-[14px] [&:not(:first-child)]:border-t" style={{ borderColor: "rgba(11,45,61,.05)" }}>
      <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[11px] bg-[#EEF2F3] text-brand-secondary">
        <FileText className="h-4 w-4" />
      </div>
      <div className="min-w-[180px] flex-1">
        <p className="text-[13px] font-semibold text-brand-primary">{title}</p>
        <p className="mt-0.5 text-[11px] text-brand-secondary">
          {isPendiente ? "Pendiente de subir" : fileName}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {!isPendiente && (
          <DocumentStatusBadge status={status as "Subido" | "Validado" | "Incorrecto"} />
        )}
        {isPendiente ? (
          <>
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5" />
              {uploading ? "Subiendo…" : "Subir documento"}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f);
                e.target.value = "";
              }}
            />
          </>
        ) : (
          <>
            {onDescargar && (
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={onDescargar}>
                <Download className="h-3.5 w-3.5" />
                Descargar
              </Button>
            )}
            {canReplace ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {uploading ? "Subiendo…" : "Reemplazar"}
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onUpload(f);
                    e.target.value = "";
                  }}
                />
              </>
            ) : (
              <span className="inline-flex h-8 items-center gap-1.5 rounded-[10px] bg-[#EEF2F3] px-3 text-[11.5px] font-semibold text-brand-secondary">
                <Lock className="h-3.5 w-3.5" />
                Solo lectura
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CorrectionCard({
  title,
  note,
  resolving,
  onResolver,
}: {
  title: string;
  note: string;
  resolving?: boolean;
  onResolver?: () => void;
}) {
  return (
    <div className="rounded-[12px] border border-[#f2d395] bg-[#fff8e8] p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[#fbeccf] text-[#9a6b00]">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-brand-primary">{title}</p>
          <p className="mt-1 text-[12.5px] leading-5 text-brand-secondary">{note}</p>
        </div>
      </div>
      {onResolver && (
        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={resolving}
            onClick={onResolver}
            style={{ borderColor: "#c9a227", color: "#9a6b00" }}
          >
            {resolving ? "Resolviendo…" : "Marcar como resuelta"}
          </Button>
        </div>
      )}
    </div>
  );
}

function InstallerFinalDocumentCard({
  doc,
  onDescargar,
}: {
  doc: DocumentoFinal;
  onDescargar?: () => void;
}) {
  const available = doc.estado === "Disponible";
  return (
    <div className="flex flex-wrap items-center gap-3 py-[14px] [&:not(:first-child)]:border-t" style={{ borderColor: "rgba(11,45,61,.05)" }}>
      <div
        className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[11px]"
        style={{
          background: available ? "#dcefe4" : "#EEF2F3",
          color: available ? "#1f6b48" : "#5B6770",
        }}
      >
        <Download className="h-4 w-4" />
      </div>
      <div className="min-w-[180px] flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-secondary">{doc.fase}</p>
        <p className="text-[13px] font-semibold text-brand-primary">{doc.titulo}</p>
      </div>
      <Button
        type="button"
        variant={available ? "default" : "outline"}
        size="sm"
        disabled={!available}
        className="gap-1.5"
        onClick={onDescargar}
      >
        <Download className="h-3.5 w-3.5" />
        {available ? "Descargar" : "No disponible"}
      </Button>
    </div>
  );
}
