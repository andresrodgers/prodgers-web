import { getResendClient } from "./resend";
import { plantillaNotificacion } from "./plantilla";

type EnviarEmailParams = {
  to: string;
  nombre: string;
  titulo: string;
  mensaje?: string | null;
  ctaUrl: string;
};

type ResultadoEnvio = { ok: boolean; error?: string };

export async function enviarEmailNotificacion(p: EnviarEmailParams): Promise<ResultadoEnvio> {
  const client = getResendClient();
  if (!client) {
    return { ok: false, error: "RESEND_API_KEY no configurado" };
  }

  const from = process.env.EMAIL_FROM ?? "PRODGERS <notificaciones@prodgersenergy.com>";

  try {
    const { error } = await client.emails.send({
      from,
      to: p.to,
      subject: p.titulo,
      html: plantillaNotificacion({
        nombre: p.nombre,
        titulo: p.titulo,
        mensaje: p.mensaje,
        ctaUrl: p.ctaUrl,
      }),
    });

    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error desconocido al enviar correo" };
  }
}
