import { ERROR_CODES } from "@/lib/errors/codes";
import type { SessionPayload } from "@/lib/auth/session";

export type DbRol = "instaladora_propietario" | "instaladora_gestor" | "operativo" | "admin";

// Aliases para compatibilidad con código existente
export type UserRole = DbRol;
export type CurrentUser = SessionPayload;

export function isInstaladora(rol: DbRol) {
  return rol === "instaladora_propietario" || rol === "instaladora_gestor";
}

export function isProdgers(rol: DbRol) {
  return rol === "operativo" || rol === "admin";
}

export function requireAuth(session: SessionPayload | null): SessionPayload {
  if (!session) throw new Error(ERROR_CODES.unauthenticated);
  return session;
}

export function requireRole(session: SessionPayload, roles: DbRol[]): SessionPayload {
  if (!roles.includes(session.rol as DbRol)) throw new Error(ERROR_CODES.forbidden);
  return session;
}

export function requireCompanyScope(session: SessionPayload, instaladoraId: string): SessionPayload {
  if (isInstaladora(session.rol as DbRol) && session.instaladoraId !== instaladoraId) {
    throw new Error(ERROR_CODES.forbiddenCompanyScope);
  }
  return session;
}
