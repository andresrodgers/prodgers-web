"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  ClipboardCheck,
  FileText,
  FolderKanban,
  Gauge,
  History,
  Home,
  Receipt,
  Settings,
  User,
  UserCog,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

const icons = {
  bell: Bell,
  building: Building2,
  clipboard: ClipboardCheck,
  file: FileText,
  folder: FolderKanban,
  gauge: Gauge,
  history: History,
  home: Home,
  receipt: Receipt,
  settings: Settings,
  user: User,
  userCog: UserCog,
  users: Users,
};

export type NavigationItem = {
  label: string;
  href: string;
  icon?: keyof typeof icons;
  badge?: number;
};

type RoleNavigationProps = {
  items: NavigationItem[];
  compact?: boolean;
};

export function RoleNavigation({ items, compact = false }: RoleNavigationProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex gap-1", compact ? "flex-row" : "flex-col")}>
      {items.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          active={pathname.startsWith(item.href)}
          compact={compact}
        />
      ))}
    </nav>
  );
}

function NavLink({
  item,
  active,
  compact,
}: {
  item: NavigationItem;
  active: boolean;
  compact: boolean;
}) {
  const Icon = item.icon ? icons[item.icon] : null;

  if (compact) {
    return (
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[11px] px-3 py-1.5 text-[12px] font-semibold transition",
          active
            ? "bg-brand-primary text-white"
            : "bg-app-muted text-brand-secondary hover:bg-app-muted/80"
        )}
      >
        {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" /> : null}
        <span>{item.label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-[11px] rounded-[13px] px-3 py-[11px] text-[13.5px] font-medium transition-colors",
        active
          ? "font-semibold text-white"
          : "hover:text-white"
      )}
      style={
        active
          ? { background: "rgba(255,255,255,.12)", color: "#fff" }
          : { color: "#9fb2bc" }
      }
    >
      {Icon ? (
        <Icon
          className="h-[17px] w-[17px] shrink-0"
          style={{ color: active ? "#F2B233" : "currentColor" }}
        />
      ) : null}
      <span className="flex-1">{item.label}</span>
      {item.badge ? (
        <span
          className="rounded-full px-1.5 py-px font-heading text-[10px] font-bold leading-4 text-brand-primary"
          style={{ background: "#F2B233" }}
        >
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}
