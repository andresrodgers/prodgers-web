"use client";

import { useRef, useState } from "react";
import { AlertTriangle, Download, Upload } from "lucide-react";

import { DocumentStatusBadge } from "@/components/expediente/document-status-badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type DocumentUploadCardProps = {
  title: string;
  required?: boolean;
  status: "Pendiente" | "Subido" | "Validado" | "Incorrecto";
  note?: string;
  onUpload?: (file: File) => void;
  templateUrl?: string;
  disclaimer?: string;
};

const cardBorder: Record<DocumentUploadCardProps["status"], string | undefined> = {
  Subido:    "1px solid rgba(31,107,72,.55)",
  Validado:  "1px solid rgba(13,122,107,.45)",
  Incorrecto:"1px solid rgba(192,73,47,.35)",
  Pendiente: undefined,
};

export function DocumentUploadCard({ title, required, status, note, onUpload, templateUrl, disclaimer }: DocumentUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      onUpload(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
    }
    // Reset para poder subir el mismo archivo de nuevo si hace falta
    e.target.value = "";
  }

  return (
    <div
      className="flex items-start gap-2.5 rounded-[10px] bg-white p-[11px]"
      style={{ boxShadow: "var(--shadow-sm)", border: cardBorder[status] }}
    >
      {/* Input oculto */}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Ícono */}
      <div
        className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[11px]"
        style={{ background: "#EEF2F3", color: "#5B6770" }}
      >
        <Upload className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-brand-primary">{title}</p>
            <p className="mt-0.5 text-[10.5px] text-brand-secondary">
              {required ? "Obligatorio" : "Opcional"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {note ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger
                    className="flex h-[28px] w-[28px] shrink-0 cursor-default items-center justify-center rounded-full transition hover:bg-[#fbeccf]"
                    style={{ color: "#9a6b00" }}
                  >
                    <AlertTriangle className="h-[14px] w-[14px]" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px] text-center text-[12px]">
                    {note}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : null}
            <DocumentStatusBadge status={status} />
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" />
            {status === "Pendiente" ? "Subir archivo" : "Reemplazar"}
          </Button>
          {status !== "Pendiente" && previewUrl ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.open(previewUrl, "_blank")}
            >
              Ver archivo
            </Button>
          ) : null}
          {templateUrl ? (
            <Button type="button" variant="outline" size="sm" className="gap-1.5" asChild>
              <a href={templateUrl} download>
                <Download className="h-3.5 w-3.5" />
                Descargar plantilla
              </a>
            </Button>
          ) : null}
        </div>
        {disclaimer ? (
          <p className="mt-1.5 text-[10.5px] leading-4 text-brand-secondary">{disclaimer}</p>
        ) : null}
      </div>
    </div>
  );
}
