"use client";

import { useState } from "react";

import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CatalogoItem = { label: string; activo: boolean };
type Catalogo = { title: string; items: CatalogoItem[] };

const INITIAL_CATALOGOS: Catalogo[] = [
  {
    title: "Estados de expediente",
    items: [
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
      "Subsanacion",
      "Finalizado",
      "Cancelado",
    ].map((label) => ({ label, activo: true })),
  },
  {
    title: "Distribuidoras",
    items: [
      "Iberdrola",
      "UFD",
      "I-DE",
      "E-Distribucion",
      "E-Redes",
      "Viesgo",
      "Endesa Distribucion",
    ].map((label) => ({ label, activo: true })),
  },
  {
    title: "Documentos de entrada",
    items: [
      "DNI/NIE titular",
      "Factura electrica",
      "Autorizacion firmada",
      "Fotografias de cubierta",
      "Fotografias del contador",
      "Fotografias del cuadro electrico",
      "Presupuesto / propuesta",
      "Otros documentos",
    ].map((label) => ({ label, activo: true })),
  },
  {
    title: "Documentos finales",
    items: [
      "MTD firmada",
      "Justificante de presentacion DR",
      "Documento CAU asignado",
      "Registro Industria",
      "Justificante Ayuntamiento",
      "Carpeta final completa",
    ].map((label) => ({ label, activo: true })),
  },
  {
    title: "Tipos de servicio",
    items: [
      "Pack completo",
      "MTD",
      "Legalizacion",
      "Declaracion Responsable",
    ].map((label) => ({ label, activo: true })),
  },
  {
    title: "Modalidades de autoconsumo",
    items: [
      "Sin excedentes",
      "Con excedentes acogido a compensacion",
      "Con excedentes no acogido a compensacion",
    ].map((label) => ({ label, activo: true })),
  },
];

export default function CatalogosAdminPage() {
  const [catalogos, setCatalogos] = useState<Catalogo[]>(INITIAL_CATALOGOS);

  function toggleItem(catalogoIdx: number, itemIdx: number) {
    setCatalogos((prev) =>
      prev.map((cat, ci) =>
        ci !== catalogoIdx
          ? cat
          : {
              ...cat,
              items: cat.items.map((item, ii) =>
                ii !== itemIdx ? item : { ...item, activo: !item.activo }
              ),
            }
      )
    );
  }

  return (
    <PageShell
      title="Catálogos"
      description="Valores base del sistema. Los elementos desactivados dejan de aparecer en los formularios."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {catalogos.map((catalogo, ci) => (
          <Card key={catalogo.title}>
            <CardHeader>
              <CardTitle>{catalogo.title}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {catalogo.items.map((item, ii) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-[10px] px-4 py-3 transition-all"
                  style={{ background: item.activo ? "#F4F7F8" : "rgba(192,73,47,.06)" }}
                >
                  <span
                    className="text-[13px] font-medium transition-all"
                    style={{ color: item.activo ? "#0B2D3D" : "#C0492F", textDecoration: item.activo ? "none" : "line-through" }}
                  >
                    {item.label}
                  </span>
                  <Button
                    variant={item.activo ? "outline" : "destructive"}
                    size="sm"
                    onClick={() => toggleItem(ci, ii)}
                  >
                    {item.activo ? "Desactivar" : "Activar"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
