# PRODGERS Web

Portal SaaS de tramitación de expedientes para instalaciones fotovoltaicas.

## Stack

- Next.js 16.2.7 App Router
- React 19.2.4
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- PostgreSQL 16 (Docker) — acceso directo via `pg` (node-postgres)
- Auth JWT propio via `jose` + cookie httpOnly
- Storage de archivos en disco local (`UPLOADS_PATH`)

## Comandos

```bash
npm run dev
npm run build
npm run lint
npm start
```

## Estructura

```text
app/          Rutas, route groups y API handlers (todos conectados a PostgreSQL).
components/   UI reutilizable.
hooks/        use-pagination, use-session.
lib/          auth/, db/, storage/, permissions/, api/responses.
middleware.ts Protección de rutas por rol.
modules/      Dominio por módulo (types, constants).
styles/       Tokens visuales.
migrations/   Migraciones SQL versionadas.
```

## Reglas

- No commitear `.env.local` ni secretos.
- `SESSION_SECRET` nunca debe ser corto (mínimo 64 caracteres).
- `DATABASE_URL` usa usuario `prodgers_app` en runtime (solo DML).
- Migraciones se ejecutan con usuario `prodgers_migrator` antes de arrancar.
- Los archivos subidos se sirven siempre a través de la API (nunca desde `public/`).

## Rutas base

- `/login`
- `/cambiar-contrasena`
- `/instaladora/inicio`
- `/prodgers/inicio`
- `/admin/inicio`

## Documentación funcional y arquitectónica

Ver `../docs/` — en particular `03_arquitectura/` para decisiones de infraestructura, seguridad y modelo de datos.
