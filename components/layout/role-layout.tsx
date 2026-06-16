import type { ReactNode } from "react";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { SessionUserDisplay } from "@/components/layout/session-user-display";
import { RoleNavigation, type NavigationItem } from "@/components/navigation/role-navigation";

export type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

type RoleLayoutProps = {
  roleLabel: string;
  navigation?: NavigationItem[];
  navigationGroups?: NavigationGroup[];
  topbarActions?: ReactNode;
  children: ReactNode;
};

export function RoleLayout({
  roleLabel,
  navigation,
  navigationGroups,
  topbarActions,
  children,
}: RoleLayoutProps) {

  // Normalizar siempre a grupos para el render
  const groups: NavigationGroup[] = navigationGroups
    ?? (navigation ? [{ label: roleLabel, items: navigation }] : []);

  // Lista plana para nav móvil
  const allItems = groups.flatMap((g) => g.items);

  return (
    <div className="flex min-h-screen">
      {/* ── Sidebar ── */}
      <aside
        className="fixed inset-y-0 left-0 z-20 hidden w-[222px] flex-col lg:flex"
        style={{ background: "linear-gradient(170deg, #11455e 0%, #0B2D3D 60%, #082230 100%)" }}
      >
        {/* Logo */}
        <div className="px-4 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,.10)" }}>
          <Logo variant="onDark" size="sm" />
        </div>

        {/* Nav */}
        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4">
          {groups.map((group, i) => (
            <div key={group.label} className={i > 0 ? "mt-4" : ""}>
              {(groups.length > 1 || group.label !== roleLabel) && (
                <>
                  {i > 0 && (
                    <div
                      className="mb-3 mt-1 h-px"
                      style={{ background: "rgba(255,255,255,.08)" }}
                    />
                  )}
                  <p
                    className="mb-1 px-3 font-heading text-[10px] font-semibold uppercase tracking-[0.12em]"
                    style={{ color: "rgba(255,255,255,.35)" }}
                  >
                    {group.label}
                  </p>
                </>
              )}
              <RoleNavigation items={group.items} />
            </div>
          ))}
        </div>

        {/* User footer */}
        <div className="p-4" style={{ borderTop: "1px solid rgba(255,255,255,.10)" }}>
          <SessionUserDisplay roleLabel={roleLabel} />
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex flex-1 flex-col bg-app-bg lg:pl-[222px]">
        {/* Topbar */}
        <header
          className="topbar-glass sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between px-6"
          style={{ borderBottom: "1px solid rgba(11,45,61,.05)" }}
        >
          {/* Móvil: logo */}
          <div className="flex items-center lg:hidden">
            <Logo variant="onLight" size="sm" />
          </div>

          {/* Desktop: título de página */}
          <div className="hidden lg:block">
            <p className="font-heading text-[17px] font-semibold text-brand-primary">
              {roleLabel}
            </p>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-3">
            {topbarActions}
            <Link
              href="/login"
              className="rounded-[11px] px-3 py-1.5 text-xs font-semibold text-brand-secondary transition hover:bg-app-muted"
            >
              Cerrar sesion
            </Link>
          </div>
        </header>

        {/* Nav móvil */}
        <div
          className="overflow-x-auto px-4 py-2 lg:hidden"
          style={{ borderBottom: "1px solid rgba(11,45,61,.06)" }}
        >
          <RoleNavigation items={allItems} compact />
        </div>

        {/* Contenido */}
        {children}
      </div>
    </div>
  );
}
