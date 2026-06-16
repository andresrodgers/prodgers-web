import { AlertTriangle, Download, FileText } from "lucide-react";

import { DocumentStatusBadge } from "@/components/expediente/document-status-badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type DocumentReviewCardProps = {
  title: string;
  fileName: string;
  status: "Subido" | "Validado" | "Incorrecto";
  note?: string;
  onDescargar?: () => void;
  onValidar?: () => void;
  onMarkIncorrect?: (title: string, note?: string) => void;
};

export function DocumentReviewCard({
  title,
  fileName,
  status,
  note,
  onDescargar,
  onValidar,
  onMarkIncorrect,
}: DocumentReviewCardProps) {
  return (
    <div
      className="flex items-center gap-3 py-[14px] [&:not(:first-child)]:border-t"
      style={{ borderColor: "rgba(11,45,61,.05)" }}
    >
      <div
        className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[11px]"
        style={{ background: "#EEF2F3", color: "#5B6770" }}
      >
        <FileText className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-brand-primary">{title}</p>
        <p className="mt-0.5 text-[11px] text-brand-secondary">{fileName}</p>
      </div>

      {note ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              className="flex h-[30px] w-[30px] shrink-0 cursor-default items-center justify-center rounded-full transition hover:bg-[#fbeccf]"
              style={{ color: "#9a6b00" }}
            >
              <AlertTriangle className="h-[15px] w-[15px]" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[220px] text-center text-[12px]">
              {note}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : null}

      <div className="flex shrink-0 items-center gap-2">
        <DocumentStatusBadge status={status} />
        <Button variant="outline" size="sm" className="gap-1.5" onClick={onDescargar}>
          <Download className="h-3.5 w-3.5" />
          Descargar
        </Button>
        {status !== "Validado" && (
          <>
            <Button type="button" size="sm" onClick={onValidar}>
              Validar
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => onMarkIncorrect?.(title, note)}
            >
              Incorrecto
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
