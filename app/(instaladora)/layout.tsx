import type { ReactNode } from "react";

import { InstaladoraLayout } from "@/components/layout/instaladora-layout";

export default function Layout({ children }: { children: ReactNode }) {
  return <InstaladoraLayout>{children}</InstaladoraLayout>;
}
