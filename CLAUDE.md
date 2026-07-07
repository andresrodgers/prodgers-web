# CLAUDE.md — Prodgers Web

Este archivo complementa el CLAUDE.md global (`C:\Users\Andres Rodgers\.claude\CLAUDE.md`).
Las reglas globales siguen vigentes. Aquí solo se documenta lo específico de este proyecto.

---

## Repositorio

**GitHub:** https://github.com/andresrodgers/prodgers-web (privado)

---

## Qué es este proyecto

Portal SaaS de tramitación de expedientes para instalaciones fotovoltaicas.
Prodgers actúa como gestor intermediario entre instaladoras (empresas que hacen las instalaciones)
y los organismos públicos (distribuidoras, Industria, Ayuntamientos).

Tres tipos de usuarios, cada uno con su propio portal:
- **Instaladora** — crea expedientes, sube documentos, consulta estados
- **Operativo (Prodgers)** — tramita expedientes, actualiza estados, registra tasas
- **Admin (Prodgers)** — gestiona instaladoras, usuarios internos y saldos

---

## Stack técnico

- **Next.js** 16.2.7 con App Router
- **React** 19.2.4
- **TypeScript**
- **Tailwind CSS** v4
- **shadcn/ui** para componentes base (Button, Input, Label, Card, Dialog…)
- **lucide-react** para iconos
- **recharts** para gráficas — siempre `height={N}` numérico en ResponsiveContainer, nunca `height="100%"`
- **pg** (node-postgres) — acceso directo a PostgreSQL via `lib/db/pool.ts`
- **jose** — firma y verificación de JWT para sesiones
- **bcryptjs** — hash de contraseñas (cost 12 para login de usuario, cost 10 para passwords temporales admin)

---

## Comandos

```bash
npm run dev      # servidor de desarrollo en localhost:3000
npm run build    # build de producción
npm run lint     # ESLint
npm start        # servidor producción tras build
```

---

## Estructura de carpetas

```
app/
  (admin)/         # portal admin — rutas bajo /admin/*
  (instaladora)/   # portal instaladora — rutas bajo /instaladora/*
  (prodgers)/      # portal operativo — rutas bajo /prodgers/*
  (public)/        # login y cambiar-contraseña (sin auth)
  api/             # API routes — TODAS conectadas a PostgreSQL real

components/
  auth/            # ChangePasswordScreen
  brand/           # Logo
  data/            # MetricCard, DataTableShell, Pagination, ResponsiveList
  documents/       # DocumentUploadCard, DocumentReviewCard, FinalDocumentCard
  expediente/      # StatusBadge, DocumentStatusBadge, Timeline
  feedback/        # EmptyState, InlineAlert, SkeletonBlock
  forms/           # StepIndicator, FormSection
  layout/          # PageShell, PageHeader, layouts por portal (admin/prodgers/instaladora/public/role)
  navigation/      # RoleNavigation
  ui/              # shadcn/ui re-exportados (Button, Input, Card, Dialog, Label…)

hooks/
  use-pagination.ts  # paginación cliente universal
  use-session.ts     # obtiene sesión actual via GET /api/auth, retorna { session, loading }

lib/
  auth/
    jwt.ts           # signToken / verifyToken via jose, cookie name: prodgers_session
    session.ts       # getSession() lee cookie httpOnly; set/clear session cookie
  db/
    pool.ts          # pg.Pool singleton (global var para evitar HMR exhaustion); exporta query()
  permissions/
    guards.ts        # requireAuth(), requireRole(), requireCompanyScope()
  storage/
    paths.ts         # getUploadsRoot(), buildEntradaPath(), buildFinalPath(), ensureDir()
  api/
    responses.ts     # ok(data) / fail(code, message, status)

middleware.ts        # protege /prodgers/*, /instaladora/*, /admin/*; redirige a /login si JWT inválido

modules/
  expedientes/     # constants.ts (estados, statusTone, tipos de servicio), types.ts
  auth/            # types
  clientes/        # types
  instaladoras/    # types
  usuarios/        # types
  documentos/      # constants (TIPO_DOCUMENTO_LABEL)
  catalogos/       # types
  notificaciones/  # types (sin implementar)
  correcciones/    # types
```

---

## Auth — implementación real

Auth propio en Next.js API routes. Sin Supabase Auth.

- **Login**: `POST /api/auth` — busca usuario por `identificador_legal`, bcrypt.compare, firma JWT, setea cookie httpOnly
- **Sesión**: JWT firmado con `SESSION_SECRET`, expiry **24h**, cookie `prodgers_session` (httpOnly, Secure, SameSite=Lax)
- **No hay refresh token** — token único de 24h. Si expira, se redirige a /login.
- **Logout**: `DELETE /api/auth` — borra cookie
- **Sesión actual**: `GET /api/auth` — verifica JWT en cookie, retorna payload o 401
- **Cambio de contraseña**: `POST /api/auth/cambiar-password`
- **Middleware**: `middleware.ts` en raíz verifica JWT antes de servir rutas protegidas

Payload del JWT:
```typescript
{ userId: string; rol: 'instaladora_propietario' | 'instaladora_gestor' | 'operativo' | 'admin'; instaladoraId: string | null; nombre: string }
```

---

## Multi-tenant por rol — regla de arquitectura

Cada portal solo ve los datos que le corresponden. Esto se aplica en API, no en cliente:
- **Instaladora** → solo sus propios expedientes, clientes y saldos (WHERE `instaladora_id = session.instaladoraId`)
- **Operativo** → todos los expedientes de todas las instaladoras
- **Admin** → todo + gestión de instaladoras y usuarios internos

---

## API Routes implementadas

```
POST   /api/auth                           # login
GET    /api/auth                           # sesión actual
DELETE /api/auth                           # logout
POST   /api/auth/cambiar-password          # cambio de contraseña propio

GET    /api/expedientes                    # lista (scoped por rol)
POST   /api/expedientes                    # crear expediente (instaladora)
GET    /api/expedientes/[id]               # detalle completo
PATCH  /api/expedientes/[id]              # cambiar estado, responsable, cups, observaciones

GET    /api/clientes                       # lista (scoped; ?instaladora_id= para operativo/admin)
POST   /api/clientes                       # crear cliente

GET    /api/instaladoras                   # lista con saldos calculados
POST   /api/instaladoras                   # crear instaladora + usuario propietario (solo admin)
GET    /api/instaladoras/[id]              # detalle con usuarios y expedientes
PATCH  /api/instaladoras/[id]             # actualizar datos, estado, saldo_base
POST   /api/instaladoras/[id]/reset-password  # resetear contraseña del propietario
GET    /api/instaladoras/me               # datos de la instaladora del usuario autenticado

GET    /api/documentos-entrada             # cola de revisión por estado
POST   /api/documentos-entrada/[id]/upload  # subir archivo (FormData, instaladora)
GET    /api/documentos-entrada/[id]/download  # descargar archivo (autenticado)
PATCH  /api/documentos-entrada/[id]       # validar / marcar incorrecto (operativo/admin)

GET    /api/documentos-finales             # lista por expediente
POST   /api/documentos-finales            # subir documento final (operativo/admin)
GET    /api/documentos-finales/[id]/download  # descargar (instaladora: solo estado Disponible)
PATCH  /api/documentos-finales/[id]       # marcar Disponible (operativo/admin) — notifica instaladora
POST   /api/documentos-finales/enviar     # notificar a instaladora los docs en estado Disponible

GET    /api/correcciones                   # lista por expediente (?expediente_id=) o pendientes globales; scoped por instaladora_id
PATCH  /api/correcciones/[id]             # marcar resuelta (instaladora propietaria/gestora)

GET    /api/tasas                          # lista por expediente o instaladora
POST   /api/tasas                          # registrar tasa (operativo/admin)

GET    /api/admin/usuarios                 # lista usuarios operativo/admin
POST   /api/admin/usuarios                # crear usuario interno
PATCH  /api/admin/usuarios/[id]           # cambiar estado, rol
POST   /api/admin/usuarios/[id]/reset-password  # resetear contraseña
```

---

## Storage de archivos

Los archivos se guardan en disco local. Sin Supabase Storage.

- Variable de entorno: `UPLOADS_PATH` (en producción: `/var/lib/prodgers/uploads`)
- Implementación: `lib/storage/paths.ts`
- Descarga: streaming proxy en API — el cliente descarga via `GET /api/documentos-*/[id]/download`
- No se exponen rutas de disco al cliente

Estructura de rutas en disco:
```
{UPLOADS_PATH}/
  {instaladoraId}/{expedienteId}/{tipoDocumento}/v{n}_{docId}_{nombre}    # documentos de entrada
  {instaladoraId}/{expedienteId}/final_{fase}/{docId}_{nombre}             # documentos finales
```

---

## Convenciones de UI

### Tokens de diseño — fuente de verdad: `styles/tokens.css`

```
Marca
  --brand-primary:        #0B2D3D   texto principal, fondos dark
  --brand-secondary:      #5B6770   texto secundario / muted
  --brand-accent:         #F2B233   amarillo de acento (botones asignar saldo, highlights)

Superficies
  --app-bg:               #F1F4F5   fondo de página
  --app-muted:            #F4F7F8   fondo de secciones internas
  --app-input-bg:         #EEF2F3   fondo de inputs y badges de código
  --app-search-bg:        #E8ECEE   fondo de filtros/chips

Bordes
  --app-border:           rgba(11,45,61,.08)
  --app-border-soft:      rgba(11,45,61,.05)

Sombras
  --shadow-sm:            0 2px 10px -4px rgba(11,45,61,.12)   ← la más usada en cards
  --shadow-md / --shadow-lg                                     ← para modales y elementos flotantes

Estados (StatusBadge)
  --st-blue / --st-amber / --st-green / --st-red / --st-gray
  Badges: --badge-{gray|blue|amber|green|red}-{bg|fg}

Semánticos de UI (no usar los hex directos, usar los tokens):
  error:   #C0492F  (--st-red)
  success: #1f6b48  (--badge-green-fg)
  warning: #9a6b00  (--badge-amber-fg)
```

### Radios y sombras
```
Cards exteriores:   rounded-[14px]  +  boxShadow: var(--shadow-sm)
Elementos internos: rounded-[10px]
Botones / chips:    rounded-[13px]  o  rounded-[10px]
Código / badges:    rounded-[6px]   bg-[#EEF2F3]
```

### Componentes compartidos — no reinventar

| Componente | Ruta | Uso |
|---|---|---|
| `<PageShell>` | components/layout | Wrapper de todas las páginas |
| `<MetricCard>` | components/data | KPIs — prop `accent` para estilo oscuro |
| `<DataTableShell>` | components/data | Wrapper de tablas |
| `<TableRow/Cell/Head/CodeCell/MutedCell>` | components/data | Celdas estándar |
| `<StatusBadge>` | components/expediente | Estado — icono + texto de color, sin contenedor |
| `<Pagination>` | components/data | Paginación — se oculta sola si hay ≤1 página |
| `usePagination(items, pageSize)` | hooks/ | Hook de paginación cliente |
| `useSession()` | hooks/ | Sesión actual — retorna `{ session, loading }` |

### Paginación
- `PAGE_SIZE = 10` en todas las tablas
- Siempre llamar `resetPagina()` al cambiar filtros o búsqueda
- Ver patrón completo: `D:\8. Desarrollo\05_frontend_web\patron_paginacion_cliente_react.md`

### StatusBadge — tonos disponibles
```
"neutral" | "blue" | "amber" | "green" | "red"
```
La función `statusTone(estado)` está en `modules/expedientes/constants.ts`.

---

## Estados de expediente

Fuente de verdad: `modules/expedientes/constants.ts`

```
Recibido
Revision documental
Documentacion pendiente
Documentacion validada
MTD en elaboracion
MTD finalizada
Declaracion Responsable presentada
Justificante Ayuntamiento recibido
Instalacion en ejecucion
Pendiente CIE
CAU solicitado
CAU obtenido
Registro Industria obtenido
Comunicacion distribuidora realizada
Validacion distribuidora pendiente
Compensacion activada
Finalizado
Cancelado
```

Tipos de servicio: `Pack completo | MTD | Legalizacion | Declaracion Responsable`

---

## Datos técnicos del expediente

- Campos de paneles: `marcaPanel`, `modeloPanel`, `cantidadPaneles`, `potenciaPanelWp` (Wp por panel).
- `potenciaKw` (columna `potencia_kw`, mostrado como "Potencia FV") es un campo **calculado** en el wizard de creación: `(cantidadPaneles * potenciaPanelWp) / 1000`. No se pide directamente al usuario.
- `potenciaInversorKwp` es un campo independiente, propio del inversor (label en UI: "Potencia del inversor (kW)").
- Migraciones `005_potencia_panel.sql` (columna `potencia_panel_wp`), `006_documentos_finales_tamano_bytes.sql` y `007_documentos_finales_updated_at.sql` (columnas faltantes en `documentos_finales` que el código ya asumía).

## Documentos finales — fases válidas

Catálogo fijo (constraint en BD, `migrations/001_initial_schema.sql`): `MTD | Declaracion Responsable | CAU | Legalizacion | Justificante Ayuntamiento | Registro Industria | Carpeta final`.
El portal operativo (`/prodgers/expedientes/[id]`) tiene un formulario "Agregar documento final" (select de fase + título + archivo) que crea la primera fila de `documentos_finales` para un expediente — antes no existía forma de crear la primera fila y ese flujo estaba completamente roto.

---

## Variables de entorno requeridas

```
DATABASE_URL=postgresql://prodgers_app:<password>@prodgers_postgres:5432/prodgers_db
SESSION_SECRET=<minimo_64_caracteres>
UPLOADS_PATH=/var/lib/prodgers/uploads
```

En desarrollo local, `DATABASE_URL` apunta a PostgreSQL en Docker puerto 5434.

---

## Regla de mantenimiento

Si en una sesión se produce alguno de estos cambios, actualizar este CLAUDE.md antes de terminar:

- Se añade un portal nuevo o una ruta de primer nivel
- Se crea un componente compartido en `components/` o `hooks/`
- Se añade, elimina o renombra un estado de expediente
- Se añade o modifica un endpoint de API
- Cambia el PAGE_SIZE global o una convención visual de marca
- Se toma una decisión de arquitectura que afecte a más de un portal
