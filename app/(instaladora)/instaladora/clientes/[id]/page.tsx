"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { StatusBadge } from "@/components/expediente/status-badge";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { statusTone, type ExpedienteStatus } from "@/modules/expedientes/constants";

type ExpedienteResumen = {
  id: string;
  codigo: string;
  estado: ExpedienteStatus;
  servicio: string;
  municipio: string;
  potenciaKw: number;
  createdAt: string;
  updatedAt: string;
};

type ClienteDetalle = {
  id: string;
  nombre: string;
  dniNie: string;
  telefono: string | null;
  correo: string | null;
  expedientes: ExpedienteResumen[];
};

export default function DetalleClientePage() {
  const params = useParams<{ id: string }>();
  const [cliente, setCliente] = useState<ClienteDetalle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/clientes/${params.id}`)
      .then((r) => r.json())
      .then((r) => {
        if (r.ok) setCliente(r.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <PageShell eyebrow="Cliente final" title="Cargando…">
        <p className="text-[13px] text-brand-secondary">Cargando cliente…</p>
      </PageShell>
    );
  }

  if (!cliente) {
    return (
      <PageShell eyebrow="Cliente final" title="No encontrado">
        <p className="text-[13px] text-brand-secondary">El cliente no existe o no tienes acceso.</p>
      </PageShell>
    );
  }

  const contacto = [cliente.telefono, cliente.correo].filter(Boolean).join(" · ");

  return (
    <PageShell
      eyebrow="Cliente final"
      title={cliente.nombre}
      description={`${cliente.dniNie}${contacto ? ` · ${contacto}` : ""}`}
      actions={
        <Button asChild>
          <Link href="/instaladora/expedientes/nuevo">Nuevo expediente</Link>
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>
            Expedientes asociados
            <span className="ml-2 text-[13px] font-normal text-brand-secondary">
              ({cliente.expedientes.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2.5 px-5 pb-5 pt-0">
          {cliente.expedientes.length === 0 ? (
            <p className="text-[13px] text-brand-secondary">
              Este cliente no tiene expedientes aún.
            </p>
          ) : (
            cliente.expedientes.map((expediente) => (
              <div
                key={expediente.id}
                className="flex flex-col gap-3 rounded-[10px] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                style={{ background: "#F4F7F8" }}
              >
                <div>
                  <p className="font-heading text-[13px] font-semibold text-brand-primary">
                    {expediente.codigo}
                  </p>
                  <p className="text-[12px] text-brand-secondary">
                    {expediente.municipio} · {expediente.potenciaKw} kWp · {expediente.servicio}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge label={expediente.estado} tone={statusTone(expediente.estado)} />
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/instaladora/expedientes/${expediente.id}`}>Ver</Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
