import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 font-heading text-[10px] font-semibold uppercase tracking-[0.1em] text-brand-secondary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-heading text-[17px] font-semibold text-brand-primary sm:text-[20px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-[12.5px] text-brand-secondary">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
