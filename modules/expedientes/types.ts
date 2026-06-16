import type { ExpedienteStatus } from "./constants";

export type { ExpedienteStatus };

export type ExpedienteListItem = {
  id: string;
  codigo: string;
  instaladoraId: string;
  instaladora: string;
  clienteId: string;
  cliente: string;
  municipio: string;
  provincia: string;
  estado: ExpedienteStatus;
  servicio: string;
  responsableId: string | null;
  responsable: string;
  potenciaKw: number;
  distribuidora: string;
  createdAt: string;
  updatedAt: string;
};

export type DocumentoEntrada = {
  id: string;
  tipo: string;
  titulo: string;
  estado: "Pendiente" | "Subido" | "Validado" | "Incorrecto";
  version: number;
  nombreArchivo: string | null;
  storagePath: string | null;
  createdAt: string;
};

export type DocumentoFinal = {
  id: string;
  fase: string;
  titulo: string;
  estado: "Pendiente" | "Disponible";
  nombreArchivo: string | null;
  storagePath: string | null;
  createdAt: string;
};

export type HistorialEntry = {
  id: string;
  titulo: string;
  descripcion: string | null;
  estadoAnterior: string | null;
  estadoNuevo: string | null;
  createdAt: string;
};

export type Correccion = {
  id: string;
  campoAfectado: string;
  nota: string;
  estado: "Pendiente" | "Resuelta";
  createdAt: string;
};

export type Tasa = {
  id: string;
  concepto: string;
  monto: number;
  createdAt: string;
};

export type ExpedienteDetalle = ExpedienteListItem & {
  direccion: string;
  codigoPostal: string | null;
  cups: string | null;
  observaciones: string | null;
  marcaPanel: string;
  modeloPanel: string;
  cantidadPaneles: number;
  marcaInversor: string;
  modeloInversor: string;
  potenciaInversorKwp: number;
  modalidadAutoconsumo: string;
  clienteDni: string;
  clienteTelefono: string | null;
  clienteCorreo: string | null;
  documentosEntrada: DocumentoEntrada[];
  documentosFinales: DocumentoFinal[];
  historial: HistorialEntry[];
  correcciones: Correccion[];
  tasas: Tasa[];
};
