import { cn } from "@/lib/utils";

type DocStatus = "Pendiente" | "Subido" | "Validado" | "Incorrecto" | "Reemplazado" | "Error" | "Disponible";

type DocumentStatusBadgeProps = {
  status: DocStatus;
  className?: string;
};

const statusFg: Record<DocStatus, string> = {
  Pendiente:    "#5B6770",
  Subido:       "#1f6b48",
  Validado:     "#0d7a6b",
  Incorrecto:   "#C0492F",
  Reemplazado:  "#8b96a0",
  Error:        "#C0492F",
  Disponible:   "#1f6b48",
};

export function DocumentStatusBadge({ status, className }: DocumentStatusBadgeProps) {
  const fg = statusFg[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-[6px] whitespace-nowrap font-heading text-[11px] font-semibold",
        className
      )}
      style={{ color: fg }}
    >
      <span
        className="h-[6px] w-[6px] shrink-0 rounded-full"
        style={{ background: fg }}
      />
      {status}
    </span>
  );
}
