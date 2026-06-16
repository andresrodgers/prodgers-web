import type { ReactNode } from "react";

type ResponsiveListProps = {
  children: ReactNode;
};

export function ResponsiveList({ children }: ResponsiveListProps) {
  return <div className="grid gap-3">{children}</div>;
}
