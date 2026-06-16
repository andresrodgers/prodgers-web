import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function timeAgo(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 1) return "Ahora";
  if (diffMins < 60) return `Hace ${diffMins} min`;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86_400_000);
  const dateMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const hhmm = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

  if (dateMidnight.getTime() === today.getTime()) return `Hoy ${hhmm}`;
  if (dateMidnight.getTime() === yesterday.getTime()) return `Ayer ${hhmm}`;

  const days = Math.floor((today.getTime() - dateMidnight.getTime()) / 86_400_000);
  return `Hace ${days} días`;
}

export function daysSince(isoDate: string): number {
  const date = new Date(isoDate);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / 86_400_000);
}

export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
