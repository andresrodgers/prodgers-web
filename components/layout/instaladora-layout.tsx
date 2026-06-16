import type { ReactNode } from "react";

import { RoleLayout } from "@/components/layout/role-layout";
import { NotificationBell } from "@/components/notifications/notification-bell";
import type { NavigationItem } from "@/components/navigation/role-navigation";

const navigation: NavigationItem[] = [
  { label: "Inicio", href: "/instaladora/inicio", icon: "home" },
  { label: "Clientes", href: "/instaladora/clientes", icon: "users" },
  { label: "Expedientes", href: "/instaladora/expedientes", icon: "folder" },
  { label: "Perfil", href: "/instaladora/perfil", icon: "user" },
];

export function InstaladoraLayout({ children }: { children: ReactNode }) {
  return (
    <RoleLayout
      roleLabel="Instaladora"
      navigation={navigation}
      topbarActions={<NotificationBell />}
    >
      {children}
    </RoleLayout>
  );
}
