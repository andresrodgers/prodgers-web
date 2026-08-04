// Plantilla HTML de correo, con estilos inline (los clientes de correo
// ignoran <style> en la mayoría de los casos). Colores tomados del
// brandkit de PRODGERS — ver BRANDKIT.md en la raíz del proyecto.
//
// Se fuerza modo claro siempre (meta color-scheme + refuerzo con clases
// en @media prefers-color-scheme:dark) para que la marca se vea igual
// sin importar el modo del cliente de correo del destinatario. Gmail/
// Outlook/Apple Mail reinterpretan colores por su cuenta si no se les
// dice explícitamente que no lo hagan.

type PlantillaParams = {
  nombre: string;
  titulo: string;
  mensaje?: string | null;
  ctaUrl: string;
  ctaLabel?: string;
};

export function plantillaNotificacion({ nombre, titulo, mensaje, ctaUrl, ctaLabel = "Ver en PRODGERS" }: PlantillaParams): string {
  const appUrl = process.env.APP_URL ?? "http://localhost:3001";
  const logoUrl = `${appUrl}/brand/prodgers-isotipo-email.png`;

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light only">
    <meta name="supported-color-schemes" content="light only">
    <title>${escapeHtml(titulo)}</title>
    <style>
      /* Refuerzo: algunos clientes de correo ignoran el meta color-scheme
         y aplican su propio modo oscuro vía prefers-color-scheme. Estas
         reglas ganan esa pelea y mantienen los colores de marca fijos. */
      @media (prefers-color-scheme: dark) {
        .pg-bg { background-color: #F1F4F5 !important; }
        .pg-card { background-color: #ffffff !important; }
        .pg-header { background-color: #0B2D3D !important; }
        .pg-brand { color: #ffffff !important; }
        .pg-eyebrow { color: #8b96a0 !important; }
        .pg-title { color: #0B2D3D !important; }
        .pg-msg { color: #5B6770 !important; }
        .pg-cta-cell { background-color: #F2B233 !important; }
        .pg-cta-text { color: #0B2D3D !important; }
        .pg-footer { color: #8b96a0 !important; }
      }
    </style>
  </head>
  <body class="pg-bg" style="margin:0;padding:0;background-color:#F1F4F5;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="pg-bg" style="background-color:#F1F4F5;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" class="pg-card" style="max-width:480px;width:100%;background-color:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px -4px rgba(11,45,61,.12);">
            <tr>
              <td class="pg-header" style="background-color:#0B2D3D;padding:20px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:middle;padding-right:10px;">
                      <img src="${logoUrl}" width="28" height="28" alt="" style="display:block;width:28px;height:28px;">
                    </td>
                    <td style="vertical-align:middle;">
                      <span class="pg-brand" style="font-size:18px;font-weight:600;color:#ffffff;letter-spacing:.02em;">PRODGERS</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p class="pg-eyebrow" style="margin:0 0 4px;font-size:12px;color:#8b96a0;">Hola ${escapeHtml(nombre)},</p>
                <h1 class="pg-title" style="margin:0 0 16px;font-size:20px;line-height:1.3;font-weight:600;color:#0B2D3D;">${escapeHtml(titulo)}</h1>
                ${mensaje ? `<p class="pg-msg" style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#5B6770;">${escapeHtml(mensaje)}</p>` : ""}
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td class="pg-cta-cell" style="background-color:#F2B233;border-radius:10px;">
                      <a href="${ctaUrl}" class="pg-cta-text" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#0B2D3D;text-decoration:none;">${escapeHtml(ctaLabel)}</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;border-top:1px solid rgba(11,45,61,.08);">
                <p class="pg-footer" style="margin:0;font-size:11px;color:#8b96a0;">Notificación automática de PRODGERS — gestión de expedientes fotovoltaicos.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
