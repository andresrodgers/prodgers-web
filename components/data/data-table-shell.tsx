import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type DataTableShellProps = {
  children: ReactNode;
  className?: string;
};

export function DataTableShell({ children, className }: DataTableShellProps) {
  return (
    <div
      className={cn("w-full overflow-hidden rounded-[14px] bg-white", className)}
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

/* Partes reutilizables de tabla */
export function TableHead({ className, children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "whitespace-nowrap px-4 py-[14px] text-left font-heading text-[11.5px] font-semibold uppercase tracking-[0.05em]",
        className
      )}
      style={{ color: "#8b96a0" }}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({ className, children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("px-4 py-[14px] text-[13px] align-middle text-brand-primary", className)}
      style={{ borderTop: "1px solid rgba(11,45,61,.05)" }}
      {...props}
    >
      {children}
    </td>
  );
}

export function TableRow({ className, children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn("transition-colors hover:bg-app-hover", className)}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableCodeCell({ children }: { children: ReactNode }) {
  return (
    <span className="font-heading text-[13px] font-semibold text-brand-primary">
      {children}
    </span>
  );
}

export function TableMutedCell({
  children,
  style,
  className,
}: {
  children: ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <span className={cn("text-[13px] text-brand-secondary", className)} style={style}>
      {children}
    </span>
  );
}
