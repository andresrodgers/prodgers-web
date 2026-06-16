"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, FileText, FolderOpen, XCircle } from "lucide-react";

import { DataTableShell, TableCell, TableCodeCell, TableHead, TableMutedCell, TableRow } from "@/components/data/data-table-shell";
import { MetricCard } from "@/components/data/metric-card";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/utils";
import { TIPO_DOCUMENTO_LABEL } from "@/modules/documentos/constants";

type DocCola = {
  id: string;
  tipoDocumento: string;
  estado: string;
  nombreArchivo: string | null;
  expedienteId: string;
  expedienteCodigo: string;
  instaladora: string;
  createdAt: string;
};

export default function DocumentosOperativoPage() {
  const [docs, setDocs] = useState<DocCola[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/documentos-entrada?estado=Subido&limit=100")
      .then((r) => r.json())
      .then((r) => {
        if (r.ok) setDocs(r.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <PageShell
      eyebrow="PRODGERS operativo"
      title="Documentos"
    >
      <div className="grid gap-[14px] sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Pendientes de revisar"
          value={docs.length}
          accent
          icon={<FileText className="h-[13px] w-[13px]" />}
        />
        <MetricCard
          label="Incorrectos"
          value={0}
          icon={<XCircle className="h-[13px] w-[13px]" />}
        />
        <MetricCard
          label="Validados"
          value={0}
          icon={<CheckCircle2 className="h-[13px] w-[13px]" />}
        />
        <MetricCard
          label="Finales por cargar"
          value={0}
          icon={<FolderOpen className="h-[13px] w-[13px]" />}
        />
      </div>

      <DataTableShell>
        <div className="px-5 pb-1 pt-5">
          <p className="font-heading text-[15px] font-semibold text-brand-primary">
            Cola de revisión — Pendientes
          </p>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ background: "rgba(11,45,61,.02)" }}>
              <TableHead>Documento</TableHead>
              <TableHead>Expediente</TableHead>
              <TableHead>Instaladora</TableHead>
              <TableHead>Subido</TableHead>
              <TableHead>Acciones</TableHead>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[13px] text-brand-secondary">
                  Cargando cola de documentos…
                </td>
              </tr>
            ) : docs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[13px] text-brand-secondary">
                  No hay documentos pendientes de revisión.
                </td>
              </tr>
            ) : (
              docs.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <TableMutedCell>
                      {TIPO_DOCUMENTO_LABEL[doc.tipoDocumento] ?? doc.tipoDocumento}
                    </TableMutedCell>
                  </TableCell>
                  <TableCell>
                    <TableCodeCell>{doc.expedienteCodigo}</TableCodeCell>
                  </TableCell>
                  <TableCell>
                    <TableMutedCell>{doc.instaladora}</TableMutedCell>
                  </TableCell>
                  <TableCell>
                    <TableMutedCell>{timeAgo(doc.createdAt)}</TableMutedCell>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/prodgers/expedientes/${doc.expedienteId}`}>Ver expediente</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </tbody>
        </table>
      </DataTableShell>
    </PageShell>
  );
}
