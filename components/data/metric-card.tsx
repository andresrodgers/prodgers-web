import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  accent?: boolean;
  className?: string;
};

export function MetricCard({ label, value, description, icon, accent = false, className }: MetricCardProps) {
  if (accent) {
    return (
      <div className={cn("kpi-accent flex flex-col gap-1.5 rounded-[14px] p-[18px]", className)}>
        <div className="flex items-start justify-between gap-3">
          <p className="text-[12.5px] font-medium" style={{ color: "#aebfc8" }}>
            {label}
          </p>
          {icon ? (
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px]"
              style={{ background: "rgba(255,255,255,.10)", color: "#aebfc8" }}
            >
              {icon}
            </div>
          ) : null}
        </div>
        <p className="font-heading text-[32px] font-semibold leading-none text-brand-accent">
          {value}
        </p>
        {description ? (
          <p className="text-[12px]" style={{ color: "#aebfc8" }}>
            {description}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn("flex flex-col gap-1.5 rounded-[14px] bg-white p-[18px]", className)}
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12.5px] font-medium text-brand-secondary">{label}</p>
        {icon ? (
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px]"
            style={{ background: "#EEF2F3", color: "#5B6770" }}
          >
            {icon}
          </div>
        ) : null}
      </div>
      <p className="font-heading text-[32px] font-semibold leading-none text-brand-primary">
        {value}
      </p>
      {description ? (
        <p className="text-[12px] text-brand-secondary">{description}</p>
      ) : null}
    </div>
  );
}
