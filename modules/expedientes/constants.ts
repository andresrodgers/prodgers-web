export const EXPEDIENTE_ESTADOS = [
  "Recibido",
  "Revision documental",
  "Documentacion pendiente",
  "Documentacion validada",
  "MTD en elaboracion",
  "MTD finalizada",
  "Declaracion Responsable presentada",
  "Justificante Ayuntamiento recibido",
  "Instalacion en ejecucion",
  "Pendiente CIE",
  "CAU solicitado",
  "CAU obtenido",
  "Registro Industria obtenido",
  "Comunicacion distribuidora realizada",
  "Validacion distribuidora pendiente",
  "Compensacion activada",
  "Finalizado",
  "Subsanacion",
  "Cancelado",
] as const;

export type ExpedienteStatus = (typeof EXPEDIENTE_ESTADOS)[number];

export type StatusBadgeTone = "neutral" | "blue" | "teal" | "amber" | "green" | "red";

export const TIPOS_SERVICIO = [
  "Pack completo",
  "MTD",
  "Legalizacion",
  "Declaracion Responsable",
] as const;

const STATUS_TONE: Record<ExpedienteStatus, StatusBadgeTone> = {
  // Entrada — neutro
  "Recibido":                              "neutral",

  // En proceso — azul
  "Revision documental":                   "blue",
  "MTD en elaboracion":                    "blue",
  "Declaracion Responsable presentada":    "blue",
  "CAU solicitado":                        "blue",
  "Comunicacion distribuidora realizada":  "blue",
  "Instalacion en ejecucion":              "blue",

  // Hito completado — teal
  "Documentacion validada":                "teal",
  "MTD finalizada":                        "teal",
  "Justificante Ayuntamiento recibido":    "teal",
  "CAU obtenido":                          "teal",
  "Registro Industria obtenido":           "teal",

  // Pendiente / bloqueado — amber
  "Documentacion pendiente":               "amber",
  "Pendiente CIE":                         "amber",
  "Validacion distribuidora pendiente":    "amber",

  // Finalizado — verde
  "Compensacion activada":                 "green",
  "Finalizado":                            "green",

  // Problema — rojo
  "Subsanacion":                           "red",
  "Cancelado":                             "red",
};

export function statusTone(status: ExpedienteStatus): StatusBadgeTone {
  return STATUS_TONE[status] ?? "neutral";
}
