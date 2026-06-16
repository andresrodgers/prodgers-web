import type { ReactNode } from "react";

import { RoleLayout } from "@/components/layout/role-layout";
import { NotificationBell } from "@/components/notifications/notification-bell";
import type { NavigationItem } from "@/components/navigation/role-navigation";

const navigation: NavigationItem[] = [
  { label: "Inicio operativo", href: "/prodgers/inicio", icon: "home" },
  { label: "Expedientes", href: "/prodgers/expedientes", icon: "folder" },
  { label: "Instaladoras", href: "/prodgers/instaladoras", icon: "building" },
  { label: "Notificaciones", href: "/prodgers/notificaciones", icon: "bell" },
];

export function ProdgersLayout({ children }: { children: ReactNode }) {
  return (
    <RoleLayout roleLabel="PRODGERS operativo" navigation={navigation} topbarActions={<NotificationBell />}>
      {children}
    </RoleLayout>
  );
}
