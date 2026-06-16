import type { ReactNode } from "react";

import { RoleLayout, type NavigationGroup } from "@/components/layout/role-layout";
import { NotificationBell } from "@/components/notifications/notification-bell";

const navigationGroups: NavigationGroup[] = [
  {
    label: "PRODGERS admin",
    items: [
      { label: "Dashboard admin", href: "/admin/inicio", icon: "gauge" },
      { label: "Instaladoras", href: "/admin/instaladoras", icon: "building" },
      { label: "Usuarios PRODGERS", href: "/admin/usuarios", icon: "userCog" },
      { label: "Tasas y pagos", href: "/admin/tasas", icon: "receipt" },
      { label: "Auditoria", href: "/admin/auditoria", icon: "history" },
      { label: "Notificaciones", href: "/admin/notificaciones", icon: "bell" },
      { label: "Catalogos", href: "/admin/catalogos", icon: "settings" },
    ],
  },
  {
    label: "PRODGERS operativo",
    items: [
      { label: "Inicio operativo", href: "/prodgers/inicio", icon: "home" },
      { label: "Expedientes", href: "/prodgers/expedientes", icon: "folder" },
      { label: "Instaladoras", href: "/prodgers/instaladoras", icon: "building" },
      { label: "Notificaciones", href: "/prodgers/notificaciones", icon: "bell" },
    ],
  },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RoleLayout
      roleLabel="PRODGERS admin"
      navigationGroups={navigationGroups}
      topbarActions={<NotificationBell />}
    >
      {children}
    </RoleLayout>
  );
}
