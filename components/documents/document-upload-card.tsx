"use client";

import { useRef } from "react";
import { AlertTriangle, Upload } from "lucide-react";

import { DocumentStatusBadge } from "@/components/expediente/document-status-badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type DocumentUploadCardProps = {
  title: string;
  required?: boolean;
  status: "Pendiente" | "Subido" | "Validado" | "Incorrecto";
  note?: string;
  onUpload?: (file: File) => void;
};

const cardBorder: Record<DocumentUploadCardProps["status"], string | undefined> = {
  Subido:    "1px solid rgba(46,125,91,.35)",
  Validado:  "1px solid rgba(46,125,91,.45)",
  Incorrecto:"1px solid rgba(192,73,47,.35)",
  Pendiente: undefined,
};

export function DocumentUploadCard({ title, required, status, note, onUpload }: DocumentUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      onUpload(file);
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
          {status !== "Pendiente" ? (
            <Button type="button" variant="outline" size="sm">Ver archivo</Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
