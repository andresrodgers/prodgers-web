import type { ReactNode } from "react";

import { AdminLayout } from "@/components/layout/admin-layout";

export default function Layout({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
