import { Resend } from "resend";

let client: Resend | null = null;

// Sin RESEND_API_KEY (ej. en desarrollo local) el envío se salta con gracia
// en vez de romper — ver lib/notificaciones/crear.ts.
export function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}
