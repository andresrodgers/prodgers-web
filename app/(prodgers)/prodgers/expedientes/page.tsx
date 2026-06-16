"use client";

import Link from "next/link";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { DataTableShell, TableCell, TableCodeCell, TableHead, TableMutedCell, TableRow } from "@/components/data/data-table-shell";
import { Pagination } from "@/components/data/pagination";
import { StatusBadge } from "@/components/expediente/status-badge";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePagination } from "@/hooks/use-pagination";
import { useSession } from "@/hooks/use-session";
import { statusTone } from "@/modules/expedientes/constants";
import type { ExpedienteListItem } from "@/modules/expedientes/types";
import { daysSince, timeAgo } from "@/lib/utils";

const PAGE_SIZE = 10;
const ownershipFilters = ["Todos", "Mios", "Sin asignar"] as const;
const operationFilters = ["Todos", "Doc. pendiente", "Subsanacion", "Finalizados"] as const;
const serviceFilters = ["Todos", "Pack completo", "MTD", "Legalizacion", "Decl. Responsable"] as const;

type OwnershipFilter = (typeof ownershipFilters)[number];
type OperationFilter = (typeof operationFilters)[number];
type ServiceFilter = (typeof serviceFilters)[number];

const SERVICE_FILTER_MAP: Record<ServiceFilter, string | null> = {
  "Todos": null,
  "Pack completo": "Pack completo",
  "MTD": "MTD",
  "Legalizacion": "Legalizacion",
  "Decl. Responsable": "Declaracion Responsable",
};

export default function ExpedientesOperativoPage() {
  const { session } = useSession();
  const [expedientes, setExpedientes] = useState<ExpedienteListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipFilter>("Todos");
  const [operationFilter, setOperationFilter] = useState<OperationFilter>("Todos");
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>("Todos");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/expedientes?limit=500")
      .then((r) => r.json())
      .then((r) => {
        if (r.ok) setExpedientes(r.data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredExpedientes = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const servicioFiltro = SERVICE_FILTER_MAP[serviceFilter];
    const miNombre = session?.nombre ?? "";

    return expedientes.filter((expediente) => {
      const matchesSearch =
        !normalizedSearch ||
        expediente.codigo.toLowerCase().includes(normalizedSearch) ||
        expediente.instaladora.toLowerCase().includes(normalizedSearch) ||
        expediente.cliente.toLowerCase().includes(normalizedSearch);

      const matchesOwnership =
        ownershipFilter === "Todos" ||
        (ownershipFilter === "Mios" && expediente.responsable === miNombre) ||
        (ownershipFilter === "Sin asignar" && expediente.responsable === "Sin asignar");

      const matchesOperation =
        operationFilter === "Todos" ||
        (operationFilter === "Doc. pendiente" && expediente.estado === "Documentacion pendiente") ||
        (operationFilter === "Subsanacion" && expediente.estado === "Subsanacion") ||
        (operationFilter === "Finalizados" && expediente.estado === "Finalizado");

      const matchesService = !servicioFiltro || expediente.servicio === servicioFiltro;

      return matchesSearch && matchesOwnership && matchesOperation && matchesService;
    }).sort((a, b) => {
      const miNombreSort = session?.nombre ?? "";
      const pa = getOperationalPriority(a, miNombreSort);
      const pb = getOperationalPriority(b, miNombreSort);
      const priorityDiff = pa - pb;
      if (priorityDiff !== 0) return priorityDiff;
      return daysSince(a.createdAt) - daysSince(b.createdAt);
    });
  }, [operationFilter, ownershipFilter, serviceFilter, search, expedientes, session]);

  const { pagina, totalPaginas, itemsPagina, setPagina, resetPagina } =
    usePagination(filteredExpedientes, PAGE_SIZE);

  function handleOwnershipFilter(f: OwnershipFilter) { setOwnershipFilter(f); resetPagina(); }
  function handleOperationFilter(f: OperationFilter) { setOperationFilter(f); resetPagina(); }
  function handleServiceFilter(f: ServiceFilter) { setServiceFilter(f); resetPagina(); }
  function handleSearch(v: string) { setSearch(v); resetPagina(); }

  return (
    <PageShell
      eyebrow="PRODGERS operativo"
      title="Expedientes"
      description={`${filteredExpedientes.length} expedientes filtrados de ${expedientes.length} en total`}
    >
      <div
        className="flex flex-wrap items-center gap-2 rounded-[14px] bg-white p-4"
        style={{ boxShadow: "var(--shadow-sm)" }}
      >
        <Input
          value={search}
          onChange={(event) => handleSearch(event.target.value)}
          placeholder="Buscar por instaladora, cliente final o codigo de expediente"
          className="min-w-[260px] flex-1"
        />
        <FilterSelect
          label="Asignación"
          value={ownershipFilter}
          options={ownershipFilters as unknown as string[]}
          onChange={(v) => handleOwnershipFilter(v as OwnershipFilter)}
        />
        <FilterSelect
          label="Estado"
          value={operationFilter}
          options={operationFilters as unknown as string[]}
          onChange={(v) => handleOperationFilter(v as OperationFilter)}
        />
        <FilterSelect
          label="Servicio"
          value={serviceFilter}
          options={serviceFilters as unknown as string[]}
          onChange={(v) => handleServiceFilter(v as ServiceFilter)}
        />
      </div>

      <DataTableShell>
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ background: "rgba(11,45,61,.02)" }}>
              <TableHead>Codigo</TableHead>
              <TableHead>Instaladora</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead>Servicio</TableHead>
              <TableHead>Enviado</TableHead>
              <TableHead />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <div className="py-8 text-center text-[13px] font-medium text-brand-secondary">
                    Cargando expedientes…
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              itemsPagina.map((expediente) => {
                const dias = daysSince(expediente.createdAt);
                return (
                  <TableRow key={expediente.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TableCodeCell>{expediente.codigo}</TableCodeCell>
                        {dias >= 5 ? (
                          <span
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#fff2d6] text-[#9a6b00]"
                            title={`Expediente creado hace ${dias} días.`}
                          >
                            <AlertTriangle className="h-3.5 w-3.5" />
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>{expediente.instaladora}</TableCell>
                    <TableCell>
                      <TableMutedCell>{expediente.cliente}</TableMutedCell>
                    </TableCell>
                    <TableCell>
                      <StatusBadge label={expediente.estado} tone={statusTone(expediente.estado)} />
                    </TableCell>
                    <TableCell>
                      <TableMutedCell
                        style={expediente.responsable === "Sin asignar" ? { color: "#9a6b00" } : undefined}
                      >
                        {expediente.responsable}
                      </TableMutedCell>
                    </TableCell>
                    <TableCell>
                      <TableMutedCell>{expediente.servicio}</TableMutedCell>
                    </TableCell>
                    <TableCell>
                      <TableMutedCell>{timeAgo(expediente.createdAt)}</TableMutedCell>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/prodgers/expedientes/${expediente.id}`}>Ver</Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
            {!loading && filteredExpedientes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <div className="py-8 text-center text-[13px] font-medium text-brand-secondary">
                    No hay expedientes para los filtros seleccionados.
                  </div>
                </TableCell>
              </TableRow>
            ) : null}
          </tbody>
        </table>
        <Pagination
          pagina={pagina}
          totalPaginas={totalPaginas}
          total={filteredExpedientes.length}
          pageSize={PAGE_SIZE}
          setPagina={setPagina}
        />
      </DataTableShell>
    </PageShell>
  );
}

function getOperationalPriority(expediente: ExpedienteListItem, miNombre: string) {
  if (expediente.estado === "Documentacion pendiente" || expediente.estado === "Subsanacion") return 0;
  if (expediente.responsable === "Sin asignar") return 1;
  if (expediente.responsable === miNombre) return 2;
  if (expediente.estado === "Finalizado") return 4;
  return 3;
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const isActive = value !== "Todos";
  return (
    <div className="relative">
      <select
        className="h-[42px] appearance-none rounded-[13px] pl-3 pr-8 font-heading text-[12.5px] font-semibold outline-none transition"
        style={
          isActive
            ? { background: "#0B2D3D", color: "#fff" }
            : { background: "#F4F7F8", color: "#5B6770" }
        }
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt === "Todos" ? label : opt}</option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2"
        style={{ color: isActive ? "#fff" : "#5B6770" }}
        strokeWidth={2}
      />
    </div>
  );
}
