import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("rounded-lg border border-dashed bg-card p-8 text-center", className)}>
      <h3 className="font-heading text-lg font-semibold text-brand-primary">{title}</h3>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
