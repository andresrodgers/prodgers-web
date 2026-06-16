"use client";

import type { ReactNode } from "react";

import { AdminLayout } from "@/components/layout/admin-layout";
import { ProdgersLayout } from "@/components/layout/prodgers-layout";
import { useSession } from "@/hooks/use-session";

export default function Layout({ children }: { children: ReactNode }) {
  const { session } = useSession();
  if (session?.rol === "admin") return <AdminLayout>{children}</AdminLayout>;
  return <ProdgersLayout>{children}</ProdgersLayout>;
}
