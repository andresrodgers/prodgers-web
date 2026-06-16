import { AlertCircle, CheckCircle2, Circle, Loader, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import type { StatusBadgeTone } from "@/modules/expedientes/constants";

export type { StatusBadgeTone };

type StatusBadgeProps = {
  label: string;
  tone?: StatusBadgeTone;
  className?: string;
};

const toneColor: Record<StatusBadgeTone, string> = {
  neutral: "#5B6770",
  blue:    "#1a5f8a",
  teal:    "#0d7a6b",
  amber:   "#9a6b00",
  green:   "#1f6b48",
  red:     "#C0492F",
};

const toneIcon: Record<StatusBadgeTone, React.ReactNode> = {
  neutral: <Circle size={7} fill="currentColor" strokeWidth={0} />,
  blue:    <Loader size={11} strokeWidth={2.5} />,
  teal:    <CheckCircle2 size={11} strokeWidth={2.5} />,
  amber:   <AlertCircle size={11} strokeWidth={2.5} />,
  green:   <CheckCircle2 size={11} strokeWidth={2.5} />,
  red:     <XCircle size={11} strokeWidth={2.5} />,
};

export function StatusBadge({ label, tone = "neutral", className }: StatusBadgeProps) {
  const color = toneColor[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-[5px] whitespace-nowrap font-heading text-[12px] font-semibold",
        className
      )}
      style={{ color }}
    >
      {toneIcon[tone]}
      {label}
    </span>
  );
}
