import type { ReactNode } from "react";

import { AdminLayout } from "@/components/layout/admin-layout";
import { ProdgersLayout } from "@/components/layout/prodgers-layout";
import { getSession } from "@/lib/auth/session";

export default async function Layout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (session?.rol === "admin") return <AdminLayout>{children}</AdminLayout>;
  return <ProdgersLayout>{children}</ProdgersLayout>;
}
