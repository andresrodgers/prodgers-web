import { cn } from "@/lib/utils";

type DocStatus = "Pendiente" | "Subido" | "Validado" | "Incorrecto" | "Reemplazado" | "Error" | "Disponible";

type DocumentStatusBadgeProps = {
  status: DocStatus;
  className?: string;
};

const statusStyles: Record<DocStatus, { bg: string; fg: string }> = {
  Pendiente:    { bg: "rgba(91,103,112,.10)",   fg: "#5B6770" },
  Subido:       { bg: "rgba(26,95,138,.10)",    fg: "#1a5f8a" },
  Validado:     { bg: "rgba(13,122,107,.10)",   fg: "#0d7a6b" },
  Incorrecto:   { bg: "rgba(192,73,47,.10)",    fg: "#C0492F" },
  Reemplazado:  { bg: "rgba(91,103,112,.08)",   fg: "#8b96a0" },
  Error:        { bg: "rgba(192,73,47,.10)",    fg: "#C0492F" },
  Disponible:   { bg: "rgba(31,107,72,.10)",    fg: "#1f6b48" },
};

export function DocumentStatusBadge({ status, className }: DocumentStatusBadgeProps) {
  const { bg, fg } = statusStyles[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-[5px] whitespace-nowrap rounded-[20px] px-[10px] py-1 font-heading text-[11px] font-semibold",
        className
      )}
      style={{ background: bg, color: fg }}
    >
      <span
        className="h-[6px] w-[6px] shrink-0 rounded-full"
        style={{ background: fg }}
      />
      {status}
    </span>
  );
}
