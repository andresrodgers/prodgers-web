import type { UserRole } from "@/lib/permissions/guards";

export type Usuario = {
  id: string;
  nombre: string;
  identificadorLegal: string;
  role: UserRole;
};
