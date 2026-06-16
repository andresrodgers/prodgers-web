export const DOCUMENTOS_ENTRADA_OBLIGATORIOS = [
  "dni_nie_titular",
  "factura_electrica",
  "autorizacion_firmada",
  "fotografias_cubierta",
  "fotografias_contador",
  "fotografias_cuadro_electrico",
] as const;

export type TipoDocumentoEntrada = (typeof DOCUMENTOS_ENTRADA_OBLIGATORIOS)[number];

export const TIPO_DOCUMENTO_LABEL: Record<string, string> = {
  dni_nie_titular: "DNI/NIE titular",
  factura_electrica: "Factura eléctrica",
  autorizacion_firmada: "Autorización firmada",
  fotografias_cubierta: "Fotografías de cubierta",
  fotografias_contador: "Fotografías del contador",
  fotografias_cuadro_electrico: "Fotografías del cuadro eléctrico",
  documentacion_tecnica: "Documentación técnica",
};
