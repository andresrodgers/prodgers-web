# Runbook de producción — Prodgers Web

## Stack de deploy

Sin Vercel, sin Supabase. Self-hosted con Docker en VM Ubuntu, publicado vía Cloudflare Tunnel.

```
GitHub privado (andresrodgers/prodgers-web)
↓
VM Ubuntu del servidor (misma VM que stk-soporte)
↓
Docker Compose — proyecto aislado "prodgers"
↓
prodgers_app  +  prodgers_postgres  +  prodgers_cloudflared  +  prodgers_backup
↓
Cloudflare Tunnel → https://app.prodgersenergy.com
```

## Contenedores

| Contenedor | Imagen | Rol |
|---|---|---|
| `prodgers_app` | build local Next.js | Frontend + backend |
| `prodgers_postgres` | postgres:16-alpine | Base de datos |
| `prodgers_cloudflared` | cloudflare/cloudflared:latest | Túnel HTTPS |
| `prodgers_backup` | postgres:16-alpine | pg_dump diario |

- **Puerto**: app en `3000` dentro del contenedor. Expuesto al host en `127.0.0.1:3003:3000` solo para acceso técnico por Tailscale. El tunnel apunta a `http://app:3000` dentro de la red Docker.
- **PostgreSQL**: sin puerto expuesto al host ni a internet.
- **Backups**: `/opt/backups/prodgers/` en el servidor, retención 30 días.

## Servidor

- Misma VM Ubuntu que stk-soporte.
- Acceso SSH por Tailscale: `ssh stockgiadmin@100.116.114.36`
- Ruta del proyecto en servidor: `/opt/prodgers`

## Cloudflare

- Dominio: `prodgersenergy.com` — debe estar conectado a Cloudflare.
- Crear túnel llamado `prodgers-energy` en el dashboard de Cloudflare Zero Trust.
- Public hostname: `app.prodgersenergy.com → http://app:3000`
- El token del túnel va en `.env.production` como `CLOUDFLARE_TUNNEL_TOKEN`.

## Variables de entorno (.env.production)

Crear solo en el servidor. Nunca subir a Git. Permisos tras crear: `chmod 600 .env.production`

```env
APP_URL=https://app.prodgersenergy.com

POSTGRES_MIGRATOR_PASSWORD=<generar_en_servidor>
POSTGRES_APP_PASSWORD=<generar_en_servidor>

SESSION_SECRET=<minimo_64_chars_aleatorio>

CLOUDFLARE_TUNNEL_TOKEN=<token_del_tunnel_prodgers-energy>

# Solo para el primer deploy — seed del admin inicial
ADMIN_NOMBRE=Andres Rodgers
ADMIN_DNI=<DNI_del_admin>
ADMIN_EMAIL=<email_del_admin>
ADMIN_PASSWORD=<password_inicial_admin>
```

## Primer deploy — paso a paso

```bash
# 1. Conectar al servidor
ssh stockgiadmin@100.116.114.36

# 2. Crear directorio y clonar
mkdir -p /opt/prodgers
cd /opt/prodgers
git clone https://github.com/andresrodgers/prodgers-web.git .

# 3. Permisos del script de init de postgres
chmod +x scripts/init-postgres.sh

# 4. Crear directorio de backups
mkdir -p /opt/backups/prodgers

# 5. Crear y asegurar .env.production
nano .env.production
chmod 600 .env.production

# 6. Build de la app
docker compose --env-file .env.production -p prodgers build app

# 7. Levantar todos los servicios
docker compose --env-file .env.production -p prodgers up -d

# 8. Ejecutar migraciones
docker exec prodgers_app node scripts/migrate.js

# 9. Crear usuario admin inicial
docker exec prodgers_app node scripts/seed-admin.js
```

## Validaciones post-deploy

```bash
docker ps
# prodgers_app, prodgers_postgres, prodgers_cloudflared, prodgers_backup — todos Up

docker logs --tail=50 prodgers_app
# Sin errores de conexion a BD ni de arranque

docker logs --tail=20 prodgers_cloudflared
# "Registered tunnel connection"

curl -I https://app.prodgersenergy.com
# HTTP/2 200
```

Validaciones funcionales:
- Login admin → `/admin/inicio`
- Login operativo → `/prodgers/inicio`
- Login instaladora → `/instaladora/inicio`
- Crear expediente, subir y descargar documento
- Backup reciente en `/opt/backups/prodgers/`

## Actualizaciones futuras

```bash
cd /opt/prodgers
git pull origin master
docker compose --env-file .env.production -p prodgers build --pull=false app
docker compose --env-file .env.production -p prodgers up -d app
# Si hay migraciones nuevas:
docker exec prodgers_app node scripts/migrate.js
```

## Coexistencia con stk-soporte en el mismo servidor

| | Prodgers | StockGI Soporte |
|---|---|---|
| Compose project | `prodgers` | `stk-soporte` |
| Contenedores | `prodgers_*` | `stk-soporte_*` |
| Red Docker | `prodgers_internal` | red propia |
| Puerto host | `3003` | `3002` |
| Backups | `/opt/backups/prodgers/` | `/opt/backups/stockgi/` |
| Dominio | `app.prodgersenergy.com` | `soporte.stockgi.com` |
| PostgreSQL | instancia propia | instancia propia |
