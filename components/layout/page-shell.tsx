import type { ReactNode } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";

type PageShellProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function PageShell({
  title,
  description,
  eyebrow,
  actions,
  children,
  className,
}: PageShellProps) {
  return (
    <main className={cn("flex flex-1 flex-col gap-[18px] p-6 lg:p-[26px]", className)}>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={actions}
      />
      {children}
    </main>
  );
}
