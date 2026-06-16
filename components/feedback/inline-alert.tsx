import type { ReactNode } from "react";

import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

import { cn } from "@/lib/utils";

type InlineAlertProps = {
  title: string;
  children?: ReactNode;
  tone?: "info" | "warning" | "success" | "danger";
};

const toneMap = {
  info: "border-sky-200 bg-sky-50 text-sky-900",
  warning: "border-brand-accent/40 bg-brand-accent/10 text-brand-primary",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  danger: "border-red-200 bg-red-50 text-red-900",
};

export function InlineAlert({ title, children, tone = "info" }: InlineAlertProps) {
  const Icon = tone === "success" ? CheckCircle2 : tone === "info" ? Info : AlertTriangle;

  return (
    <div className={cn("flex gap-3 rounded-lg border p-3 text-sm", toneMap[tone])}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="font-semibold">{title}</p>
        {children ? <div className="mt-1 text-current/80">{children}</div> : null}
      </div>
    </div>
  );
}
