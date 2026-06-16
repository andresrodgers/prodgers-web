"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { DataTableShell, TableCell, TableCodeCell, TableHead, TableMutedCell, TableRow } from "@/components/data/data-table-shell";
import { Pagination } from "@/components/data/pagination";
import { StatusBadge } from "@/components/expediente/status-badge";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePagination } from "@/hooks/use-pagination";

const PAGE_SIZE = 10;

type InstaladoraListItem = {
  id: string;
  nombre: string;
  cif: string;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  estado: "Activa" | "Inactiva";
  saldoBase: number;
  gastado: number;
  disponible: number;
  expedientesCount: number;
};

// ─── Page ────────────────────────────────────────────────────────

export default function InstaladorasAdminPage() {
  const [instaladoras, setInstalAdoras] = useState<InstaladoraListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog: crear instaladora
  const [mostrarCrear, setMostrarCrear] = useState(false);
  const [crearForm, setCrearForm] = useState({ nombre: "", cif: "", contacto: "", telefono: "", email: "" });
  const [crearError, setCrearError] = useState("");
  const [crearLoading, setCrearLoading] = useState(false);

  // Mensaje tras creación exitosa
  const [mensajeCreado, setMensajeCreado] = useState("");
  const [nombreCreado, setNombreCreado] = useState("");

  const { pagina, totalPaginas, itemsPagina, setPagina } = usePagination(instaladoras, PAGE_SIZE);

  useEffect(() => {
    fetch("/api/instaladoras")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setInstalAdoras(json.data);
      })
      .finally(() => setLoading(false));
  }, []);

  function abrirCrear() {
    setCrearForm({ nombre: "", cif: "", contacto: "", telefono: "", email: "" });
    setCrearError("");
    setMensajeCreado("");
    setMostrarCrear(true);
  }

  async function confirmarCrear() {
    if (!crearForm.nombre.trim()) { setCrearError("El nombre es obligatorio."); return; }
    if (!crearForm.cif.trim()) { setCrearError("El CIF es obligatorio."); return; }
    if (!crearForm.contacto.trim()) { setCrearError("El nombre de contacto es obligatorio."); return; }
    if (!crearForm.telefono.trim()) { setCrearError("El teléfono es obligatorio."); return; }
    if (!crearForm.email.trim()) { setCrearError("El email es obligatorio."); return; }
    setCrearLoading(true);
    setCrearError("");
    try {
      const res = await fetch("/api/instaladoras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: crearForm.nombre.trim(),
          cif: crearForm.cif.trim(),
          contacto: crearForm.contacto.trim(),
          telefono: crearForm.telefono.trim(),
          email: crearForm.email.trim(),
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setCrearError(json.error?.message ?? "Error al crear la instaladora.");
        return;
      }
      const nueva: InstaladoraListItem = {
        id: json.data.id,
        nombre: json.data.nombre,
        cif: json.data.cif,
        contacto: crearForm.contacto.trim(),
        telefono: crearForm.telefono.trim(),
        email: crearForm.email.trim(),
        estado: "Activa",
        saldoBase: 0,
        gastado: 0,
        disponible: 0,
        expedientesCount: 0,
      };
      setInstalAdoras((prev) => [...prev, nueva].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setNombreCreado(json.data.nombre);
      setMensajeCreado(json.data.mensajePassword);
    } finally {
      setCrearLoading(false);
    }
  }

  return (
    <PageShell
      eyebrow="PRODGERS admin"
      title="Instaladoras"
      description="Alta y administración de empresas instaladoras y su usuario único."
      actions={<Button onClick={abrirCrear}>Crear instaladora</Button>}
    >
      <DataTableShell>
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ background: "rgba(11,45,61,.02)" }}>
              <TableHead>Empresa</TableHead>
              <TableHead>CIF/NIF</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Expedientes</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="py-8 text-center text-[12.5px] text-brand-secondary">
                    Cargando instaladoras…
                  </div>
                </TableCell>
              </TableRow>
            ) : instaladoras.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="py-8 text-center text-[12.5px] text-brand-secondary">
                    Sin instaladoras registradas.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              itemsPagina.map((instaladora) => (
                <TableRow key={instaladora.id}>
                  <TableCell>
                    <TableCodeCell>{instaladora.nombre}</TableCodeCell>
                  </TableCell>
                  <TableCell>
                    <TableMutedCell>{instaladora.cif}</TableMutedCell>
                  </TableCell>
                  <TableCell>
                    <TableMutedCell>{instaladora.contacto ?? "—"}</TableMutedCell>
                  </TableCell>
                  <TableCell>
                    <TableMutedCell>{instaladora.expedientesCount}</TableMutedCell>
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      label={instaladora.estado}
                      tone={instaladora.estado === "Activa" ? "green" : "neutral"}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/instaladoras/${instaladora.id}`}>Ver detalle</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </tbody>
        </table>
        <Pagination
          pagina={pagina}
          totalPaginas={totalPaginas}
          total={instaladoras.length}
          pageSize={PAGE_SIZE}
          setPagina={setPagina}
        />
      </DataTableShell>

      {/* ── Dialog: Crear instaladora ── */}
      <Dialog
        open={mostrarCrear}
        onOpenChange={(open) => {
          if (!open) { setMensajeCreado(""); setCrearError(""); }
          setMostrarCrear(open);
        }}
      >
        <DialogContent>
          {!mensajeCreado ? (
            <>
              <DialogHeader>
                <DialogTitle>Crear instaladora</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="crear-nombre" className="text-[12px]">Empresa</Label>
                  <Input
                    id="crear-nombre"
                    placeholder="Ej. Instalaciones Solares S.L."
                    value={crearForm.nombre}
                    onChange={(e) => setCrearForm((f) => ({ ...f, nombre: e.target.value }))}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="crear-cif" className="text-[12px]">CIF / NIF</Label>
                  <Input
                    id="crear-cif"
                    placeholder="Ej. B12345678"
                    value={crearForm.cif}
                    onChange={(e) => setCrearForm((f) => ({ ...f, cif: e.target.value }))}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="crear-contacto" className="text-[12px]">Contacto</Label>
                  <Input
                    id="crear-contacto"
                    placeholder="Nombre del responsable"
                    value={crearForm.contacto}
                    onChange={(e) => setCrearForm((f) => ({ ...f, contacto: e.target.value }))}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="crear-telefono" className="text-[12px]">Teléfono</Label>
                  <Input
                    id="crear-telefono"
                    type="tel"
                    placeholder="+34 600 000 000"
                    value={crearForm.telefono}
                    onChange={(e) => setCrearForm((f) => ({ ...f, telefono: e.target.value }))}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="crear-email" className="text-[12px]">Email</Label>
                  <Input
                    id="crear-email"
                    type="email"
                    placeholder="contacto@empresa.es"
                    value={crearForm.email}
                    onChange={(e) => setCrearForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
                {crearError && (
                  <p className="text-[12px] font-medium" style={{ color: "#C0492F" }}>{crearError}</p>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  disabled={
                    !crearForm.nombre.trim() || !crearForm.cif.trim() ||
                    !crearForm.contacto.trim() || !crearForm.telefono.trim() || !crearForm.email.trim() ||
                    crearLoading
                  }
                  onClick={confirmarCrear}
                >
                  {crearLoading ? "Creando…" : "Crear instaladora"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Instaladora creada</DialogTitle>
              </DialogHeader>
              <div className="grid gap-2">
                <p className="text-[12.5px] text-brand-secondary">
                  <strong>{nombreCreado}</strong> ha sido creada correctamente.
                </p>
                <p className="text-[12.5px] text-brand-secondary">{mensajeCreado}</p>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setMostrarCrear(false)}>
                  Cerrar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
