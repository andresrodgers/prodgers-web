"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

import {
  DataTableShell,
  TableCell,
  TableCodeCell,
  TableHead,
  TableMutedCell,
  TableRow,
} from "@/components/data/data-table-shell";
import { StatusBadge } from "@/components/expediente/status-badge";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ─── Types ───────────────────────────────────────────────────────

type Rol = "operativo" | "admin";
type Estado = "Activo" | "Inactivo";

type Usuario = {
  id: string;
  nombre: string;
  identificadorLegal: string;
  email: string | null;
  telefono: string | null;
  rol: Rol;
  estado: Estado;
  debeCambiarPassword: boolean;
};

// ─── Helpers ─────────────────────────────────────────────────────

function rolLabel(rol: Rol): string {
  return rol === "admin" ? "Admin" : "Operador";
}

function validarDni(dni: string): boolean {
  return /^[A-Z0-9]{7,10}$/i.test(dni.trim());
}

// ─── Page ────────────────────────────────────────────────────────

export default function UsuariosAdminPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loadingLista, setLoadingLista] = useState(true);

  // ── Crear usuario ──
  const [mostrarCrear, setMostrarCrear] = useState(false);
  const [crearForm, setCrearForm] = useState({ nombre: "", identificador: "", email: "", telefono: "", rol: "operativo" as Rol });
  const [crearError, setCrearError] = useState("");
  const [crearLoading, setCrearLoading] = useState(false);
  const [pwdCreado, setPwdCreado] = useState("");
  const [pwdCopiadoCrear, setPwdCopiadoCrear] = useState(false);

  // ── Editar usuario ──
  const [mostrarEditar, setMostrarEditar] = useState(false);
  const [editTarget, setEditTarget] = useState<Usuario | null>(null);
  const [editForm, setEditForm] = useState({ nombre: "", identificador: "", rol: "operativo" as Rol });
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // ── Restablecer contraseña ──
  const [mostrarRestablecer, setMostrarRestablecer] = useState(false);
  const [restablecerTarget, setRestablecerTarget] = useState<Usuario | null>(null);
  const [pwdRestablecido, setPwdRestablecido] = useState("");
  const [pwdCopiadoRest, setPwdCopiadoRest] = useState(false);
  const [restablecerLoading, setRestablecerLoading] = useState(false);

  // ── Toggle activo/inactivo ──
  const [mostrarToggle, setMostrarToggle] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<Usuario | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [toggleError, setToggleError] = useState("");

  useEffect(() => {
    fetch("/api/admin/usuarios")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setUsuarios(json.data);
      })
      .finally(() => setLoadingLista(false));
  }, []);

  function abrirCrear() {
    setCrearForm({ nombre: "", identificador: "", email: "", telefono: "", rol: "operativo" });
    setCrearError("");
    setPwdCreado("");
    setPwdCopiadoCrear(false);
    setMostrarCrear(true);
  }

  async function confirmarCrear() {
    if (!crearForm.nombre.trim()) { setCrearError("El nombre es obligatorio."); return; }
    if (!validarDni(crearForm.identificador)) { setCrearError("Introduce un DNI/NIE válido (7-10 caracteres)."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(crearForm.email)) { setCrearError("Introduce un email válido."); return; }
    setCrearLoading(true);
    setCrearError("");
    try {
      const res = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: crearForm.nombre.trim(),
          identificadorLegal: crearForm.identificador.trim().toUpperCase(),
          email: crearForm.email.trim().toLowerCase(),
          telefono: crearForm.telefono.trim() || undefined,
          rol: crearForm.rol,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setCrearError(json.error?.message ?? "Error al crear el usuario.");
        return;
      }
      const nuevo: Usuario = {
        id: json.data.id,
        nombre: json.data.nombre,
        identificadorLegal: json.data.identificadorLegal,
        email: crearForm.email.trim().toLowerCase(),
        telefono: crearForm.telefono.trim() || null,
        rol: json.data.rol,
        estado: "Activo",
        debeCambiarPassword: true,
      };
      setUsuarios((prev) => [...prev, nuevo]);
      setPwdCreado(crearForm.identificador.trim().toUpperCase());
    } finally {
      setCrearLoading(false);
    }
  }

  function abrirEditar(u: Usuario) {
    setEditTarget(u);
    setEditForm({ nombre: u.nombre, identificador: u.identificadorLegal, rol: u.rol });
    setEditError("");
    setMostrarEditar(true);
  }

  async function confirmarEditar() {
    if (!editForm.nombre.trim()) { setEditError("El nombre es obligatorio."); return; }
    if (!validarDni(editForm.identificador)) { setEditError("Introduce un DNI/NIE válido."); return; }
    setEditLoading(true);
    setEditError("");
    try {
      const res = await fetch(`/api/admin/usuarios/${editTarget!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: editForm.nombre.trim(),
          identificadorLegal: editForm.identificador.trim().toUpperCase(),
          rol: editForm.rol,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setEditError(json.error?.message ?? "Error al guardar los cambios.");
        return;
      }
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id !== editTarget?.id
            ? u
            : { ...u, nombre: json.data.nombre, identificadorLegal: json.data.identificadorLegal, rol: json.data.rol }
        )
      );
      setMostrarEditar(false);
    } finally {
      setEditLoading(false);
    }
  }

  function abrirRestablecer(u: Usuario) {
    setRestablecerTarget(u);
    setPwdRestablecido("");
    setPwdCopiadoRest(false);
    setMostrarRestablecer(true);
  }

  async function confirmarRestablecer() {
    setRestablecerLoading(true);
    try {
      const res = await fetch(`/api/admin/usuarios/${restablecerTarget!.id}/reset-password`, { method: "POST" });
      const json = await res.json();
      if (json.ok) {
        setPwdRestablecido(json.data.passwordTemporal);
      }
    } finally {
      setRestablecerLoading(false);
    }
  }

  function abrirToggle(u: Usuario) {
    setToggleTarget(u);
    setToggleError("");
    setMostrarToggle(true);
  }

  async function confirmarToggle() {
    if (!toggleTarget) return;
    setToggleLoading(true);
    setToggleError("");
    const nuevoEstado: Estado = toggleTarget.estado === "Activo" ? "Inactivo" : "Activo";
    try {
      const res = await fetch(`/api/admin/usuarios/${toggleTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      const json = await res.json();
      if (!json.ok) {
        setToggleError(json.error?.message ?? "Error al cambiar el estado.");
        return;
      }
      setUsuarios((prev) =>
        prev.map((u) => u.id !== toggleTarget.id ? u : { ...u, estado: nuevoEstado })
      );
      setMostrarToggle(false);
    } finally {
      setToggleLoading(false);
    }
  }

  return (
    <PageShell
      title="Usuarios PRODGERS"
      description="Operadores y administradores internos. El identificador de acceso es el DNI/NIE."
      actions={<Button onClick={abrirCrear}>Crear usuario</Button>}
    >
      <DataTableShell>
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ background: "rgba(11,45,61,.02)" }}>
              <TableHead>Nombre</TableHead>
              <TableHead>DNI/NIE</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </tr>
          </thead>
          <tbody>
            {loadingLista ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <div className="py-8 text-center text-[12.5px] text-brand-secondary">
                    Cargando usuarios…
                  </div>
                </TableCell>
              </TableRow>
            ) : usuarios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <div className="py-8 text-center text-[12.5px] text-brand-secondary">
                    Sin usuarios registrados.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              usuarios.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <TableCodeCell>{u.nombre}</TableCodeCell>
                  </TableCell>
                  <TableCell>
                    <TableMutedCell>{u.identificadorLegal}</TableMutedCell>
                  </TableCell>
                  <TableCell>
                    <TableMutedCell>{rolLabel(u.rol)}</TableMutedCell>
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      label={u.estado}
                      tone={u.estado === "Activo" ? "green" : "neutral"}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant={u.estado === "Activo" ? "destructive" : "default"}
                        size="sm"
                        onClick={() => abrirToggle(u)}
                      >
                        {u.estado === "Activo" ? "Desactivar" : "Activar"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => abrirEditar(u)}>
                        Editar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => abrirRestablecer(u)}>
                        Contraseña
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </tbody>
        </table>
      </DataTableShell>

      {/* ── Dialog: Crear usuario ── */}
      <Dialog
        open={mostrarCrear}
        onOpenChange={(open) => {
          if (!open) { setPwdCreado(""); setPwdCopiadoCrear(false); setCrearError(""); }
          setMostrarCrear(open);
        }}
      >
        <DialogContent>
          {!pwdCreado ? (
            <>
              <DialogHeader>
                <DialogTitle>Crear usuario interno</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="crear-nombre" className="text-[12px]">Nombre completo</Label>
                    <Input
                      id="crear-nombre"
                      placeholder="Ej. Carlos Mendez"
                      value={crearForm.nombre}
                      onChange={(e) => setCrearForm((f) => ({ ...f, nombre: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="crear-dni" className="text-[12px]">DNI / NIE</Label>
                    <Input
                      id="crear-dni"
                      placeholder="Ej. 12345678Z"
                      value={crearForm.identificador}
                      onChange={(e) => setCrearForm((f) => ({ ...f, identificador: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="crear-email" className="text-[12px]">Email</Label>
                  <Input
                    id="crear-email"
                    type="email"
                    placeholder="carlos@prodgers.es"
                    value={crearForm.email}
                    onChange={(e) => setCrearForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="crear-tel" className="text-[12px]">Teléfono <span className="font-normal text-brand-secondary">(opcional)</span></Label>
                  <Input
                    id="crear-tel"
                    type="tel"
                    placeholder="+34 600 000 000"
                    value={crearForm.telefono}
                    onChange={(e) => setCrearForm((f) => ({ ...f, telefono: e.target.value }))}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="crear-rol" className="text-[12px]">Rol</Label>
                  <select
                    id="crear-rol"
                    className="h-[42px] w-full appearance-none rounded-[13px] border border-transparent bg-[#EEF2F3] px-[14px] text-[13px] text-brand-primary outline-none"
                    value={crearForm.rol}
                    onChange={(e) => setCrearForm((f) => ({ ...f, rol: e.target.value as Rol }))}
                  >
                    <option value="operativo">Operador</option>
                    <option value="admin">Admin</option>
                  </select>
                  <p className="text-[11.5px] text-brand-secondary">
                    {crearForm.rol === "operativo"
                      ? "Puede gestionar expedientes asignados."
                      : "Acceso completo: expedientes, instaladoras, usuarios y configuración."}
                  </p>
                </div>
                {crearError && (
                  <p className="text-[12px] font-medium" style={{ color: "#C0492F" }}>{crearError}</p>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  disabled={!crearForm.nombre.trim() || !crearForm.identificador.trim() || !crearForm.email.trim() || crearLoading}
                  onClick={confirmarCrear}
                >
                  {crearLoading ? "Creando…" : "Crear usuario"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Usuario creado</DialogTitle>
              </DialogHeader>
              <div className="grid gap-2">
                <p className="text-[12.5px] text-brand-secondary">
                  El usuario <strong>{crearForm.nombre.trim()}</strong> ha sido creado. Comparte esta contraseña temporal por un canal seguro. La primera vez que acceda, el sistema le pedirá que la cambie.
                </p>
                <PasswordBox
                  pwd={pwdCreado}
                  copiado={pwdCopiadoCrear}
                  onCopy={async () => {
                    await navigator.clipboard.writeText(pwdCreado);
                    setPwdCopiadoCrear(true);
                    setTimeout(() => setPwdCopiadoCrear(false), 2000);
                  }}
                />
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

      {/* ── Dialog: Editar usuario ── */}
      <Dialog open={mostrarEditar} onOpenChange={setMostrarEditar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="edit-nombre" className="text-[12px]">Nombre completo</Label>
              <Input
                id="edit-nombre"
                value={editForm.nombre}
                onChange={(e) => setEditForm((f) => ({ ...f, nombre: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-dni" className="text-[12px]">DNI / NIE</Label>
              <Input
                id="edit-dni"
                value={editForm.identificador}
                onChange={(e) => setEditForm((f) => ({ ...f, identificador: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-rol" className="text-[12px]">Rol</Label>
              <select
                id="edit-rol"
                className="h-[42px] w-full appearance-none rounded-[13px] border border-transparent bg-[#EEF2F3] px-[14px] text-[13px] text-brand-primary outline-none"
                value={editForm.rol}
                onChange={(e) => setEditForm((f) => ({ ...f, rol: e.target.value as Rol }))}
              >
                <option value="operativo">Operador</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {editError && (
              <p className="text-[12px] font-medium" style={{ color: "#C0492F" }}>{editError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              disabled={!editForm.nombre.trim() || !editForm.identificador.trim() || editLoading}
              onClick={confirmarEditar}
            >
              {editLoading ? "Guardando…" : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Restablecer contraseña ── */}
      <Dialog
        open={mostrarRestablecer}
        onOpenChange={(open) => {
          if (!open) { setPwdRestablecido(""); setPwdCopiadoRest(false); }
          setMostrarRestablecer(open);
        }}
      >
        <DialogContent>
          {!pwdRestablecido ? (
            <>
              <DialogHeader>
                <DialogTitle>Restablecer contraseña</DialogTitle>
              </DialogHeader>
              <p className="text-[13px] leading-5 text-brand-secondary">
                Se generará una contraseña temporal para <strong>{restablecerTarget?.nombre}</strong>. La contraseña actual dejará de funcionar inmediatamente.
              </p>
              <DialogFooter>
                <Button type="button" disabled={restablecerLoading} onClick={confirmarRestablecer}>
                  {restablecerLoading ? "Generando…" : "Confirmar"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Contraseña restablecida</DialogTitle>
              </DialogHeader>
              <div className="grid gap-2">
                <p className="text-[12.5px] text-brand-secondary">
                  Comparte esta contraseña con <strong>{restablecerTarget?.nombre}</strong>. Solo se muestra una vez.
                </p>
                <PasswordBox
                  pwd={pwdRestablecido}
                  copiado={pwdCopiadoRest}
                  onCopy={async () => {
                    await navigator.clipboard.writeText(pwdRestablecido);
                    setPwdCopiadoRest(true);
                    setTimeout(() => setPwdCopiadoRest(false), 2000);
                  }}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setMostrarRestablecer(false)}>
                  Cerrar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Desactivar / Activar ── */}
      <Dialog open={mostrarToggle} onOpenChange={setMostrarToggle}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {toggleTarget?.estado === "Activo" ? "Desactivar usuario" : "Activar usuario"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-[13px] leading-5 text-brand-secondary">
            {toggleTarget?.estado === "Activo"
              ? `Al desactivar a ${toggleTarget.nombre}, no podrá iniciar sesión hasta que sea reactivado.`
              : `Al activar a ${toggleTarget?.nombre}, podrá volver a iniciar sesión con normalidad.`}
          </p>
          {toggleError && (
            <p className="text-[12px] font-medium" style={{ color: "#C0492F" }}>{toggleError}</p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant={toggleTarget?.estado === "Activo" ? "destructive" : "default"}
              disabled={toggleLoading}
              onClick={confirmarToggle}
            >
              {toggleLoading ? "Guardando…" : toggleTarget?.estado === "Activo" ? "Desactivar" : "Activar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

// ─── Sub-components ──────────────────────────────────────────────

function PasswordBox({ pwd, copiado, onCopy }: { pwd: string; copiado: boolean; onCopy: () => void }) {
  return (
    <div className="flex items-center gap-2 rounded-[10px] px-4 py-3" style={{ background: "#F4F7F8" }}>
      <span className="flex-1 font-mono text-[14px] font-semibold tracking-widest text-brand-primary">
        {pwd}
      </span>
      <button
        type="button"
        onClick={onCopy}
        className="inline-flex items-center gap-1 rounded-[8px] px-3 py-1.5 text-[12px] font-semibold transition-all"
        style={{
          background: copiado ? "#dcefe4" : "#EEF2F3",
          color: copiado ? "#1f6b48" : "#0B2D3D",
        }}
      >
        {copiado ? <Check size={12} /> : <Copy size={12} />}
        {copiado ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}
