# Runbook Producción — Prodgers Web

## Objetivo

Operar Prodgers Web en la VM Ubuntu usando Docker Compose, PostgreSQL local, documentos en storage privado local y Cloudflare Tunnel. Este documento cubre despliegue inicial, actualizaciones, migraciones, backups, restore y diagnóstico.

## Arquitectura de producción

- App: Next.js standalone en contenedor `prodgers_app` (Node 22 Alpine)
- Base de datos: PostgreSQL 16 en contenedor `prodgers_postgres`
- Documentos: volumen privado Docker `prodgers_uploads`, montado en `/var/lib/prodgers/uploads` dentro de la app
- Red interna: `prodgers_internal` (no expuesta)
- Publicación: Cloudflare Tunnel (configurar por separado)
- Proyecto Compose: `prodgers`

PostgreSQL no se expone al host ni a internet. La app escucha solo en `127.0.0.1:3000` para uso técnico local.

Coexiste en el mismo servidor con `stk-soporte`. No comparten red, volúmenes ni base de datos.

## Prerrequisitos VM Ubuntu

```bash
sudo apt update
sudo apt install -y git ca-certificates curl
sudo systemctl status docker
sudo docker version
sudo docker compose version
```

Usuario recomendado: `prodgersadmin` con acceso SSH por llave y permisos para Docker.

Ruta recomendada del proyecto:

```bash
/opt/prodgers-web
```

## Variables de entorno

Crear `.env.production` desde `.env.example` y completar todos los valores reales:

```bash
cp .env.example .env.production
nano .env.production
```

Valores críticos para producción:

```env
APP_ENV=production
APP_URL=https://app.prodgersenergy.com
NODE_ENV=production

DATABASE_URL=postgresql://prodgers_app:<password>@prodgers_postgres:5432/prodgers_db
DATABASE_MIGRATOR_URL=postgresql://prodgers_migrator:<password>@prodgers_postgres:5432/prodgers_db

SESSION_SECRET=<minimo_64_caracteres_aleatorios>

UPLOADS_PATH=/var/lib/prodgers/uploads

POSTGRES_MIGRATOR_PASSWORD=<password_seguro>
POSTGRES_APP_PASSWORD=<password_seguro_distinto>

ADMIN_NOMBRE=Admin Prodgers
ADMIN_DNI=<DNI_NIE_del_admin>
ADMIN_EMAIL=<email_del_admin>
ADMIN_PASSWORD=<password_temporal_debe_cambiarse>
```

Generar `SESSION_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Reglas:
- No subir `.env.production` a Git (está en `.gitignore`)
- Usar passwords distintos para `prodgers_migrator` y `prodgers_app`
- Cambiar secretos si fueron compartidos por chat, correo o capturas

## Despliegue inicial

Desde la VM:

```bash
cd /opt
git clone <repo-privado> prodgers-web
cd /opt/prodgers-web
cp .env.example .env.production
nano .env.production
```

Construir y levantar PostgreSQL primero — esperar a que esté sano:

```bash
docker compose --env-file .env.production up -d postgres
docker logs -f prodgers_postgres
# Esperar: "database system is ready to accept connections"
```

Construir y levantar la app:

```bash
docker compose --env-file .env.production up -d --build app
```

Dar permisos de ejecución al script de init de Postgres (necesario tras git clone en Linux):

```bash
chmod +x scripts/init-postgres.sh
```

Ejecutar migración inicial (crea todo el schema):

```bash
docker exec prodgers_app node scripts/migrate.js
```

Crear usuario admin inicial:

```bash
docker exec prodgers_app node scripts/seed-admin.js
```

Validar estado:

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
docker logs --tail=100 prodgers_app
docker logs --tail=100 prodgers_postgres
curl -I http://127.0.0.1:3000
```

## Actualización de código

Desde `/opt/prodgers-web`:

```bash
git pull
```

Reconstruir solo la app (sin tocar la base de datos ni los uploads):

```bash
docker compose --env-file .env.production build --pull=false app
docker compose --env-file .env.production up -d --force-recreate app
```

Si hay nuevas migraciones SQL en `migrations/`:

```bash
docker exec prodgers_app node scripts/migrate.js
```

Verificar después de actualizar:

```bash
docker logs --tail=100 prodgers_app
curl -I http://127.0.0.1:3000
```

## Cloudflare Tunnel

El tunnel apunta al servicio interno `app:3000` (nombre de red Docker, no localhost).

Configuración esperada en el dashboard de Cloudflare Tunnel:
- Public hostname: `app.prodgersenergy.com`
- Service: `http://prodgers_app:3000` (o `http://localhost:3000` si el tunnel corre en el host, no en Docker)

Si el tunnel corre en el host (no en contenedor):

```bash
# Instalar cloudflared en la VM si no está
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
cloudflared tunnel run --token <CLOUDFLARE_TUNNEL_TOKEN>
```

Validar:

```bash
curl -I https://app.prodgersenergy.com
```

## Backup de base de datos

El servicio `prodgers_backup` corre automáticamente en el Compose. Hace un `pg_dump` diario (cada 24h) a `/opt/backups/` y elimina dumps con más de 30 días. Los logs del backup están en `docker logs prodgers_backup`.

Crear el directorio antes del primer `docker compose up` si no existe:

```bash
sudo mkdir -p /opt/backups
```

Ver dumps disponibles:

```bash
ls -lh /opt/backups/prodgers_*.dump
```

Backup manual puntual (antes de migraciones o actualizaciones importantes):

```bash
docker exec prodgers_postgres pg_dump -U prodgers_migrator -Fc prodgers_db > /opt/backups/prodgers_$(date +%Y%m%d_%H%M%S).dump
```

**Regla operativa:**
- Hacer backup manual antes de cualquier migración nueva
- Hacer backup manual antes de cada actualización que modifique datos
- Copiar los dumps fuera del servidor periódicamente (semanalmente como mínimo)
- Los documentos en `prodgers_uploads` también deben copiarse fuera del servidor

Backup del volumen de documentos:

```bash
docker run --rm \
  -v prodgers_uploads:/source:ro \
  -v /opt/backups:/dest \
  alpine tar czf /dest/prodgers_uploads_$(date +%Y%m%d).tar.gz -C /source .
```

## Restore de prueba

No probar restore directamente sobre la base de producción. Crear base temporal:

```bash
docker exec prodgers_postgres createdb -U prodgers_migrator prodgers_restore_test
```

Restaurar dump en base temporal:

```bash
docker exec -i prodgers_postgres pg_restore \
  -U prodgers_migrator \
  -d prodgers_restore_test \
  --clean --if-exists < /opt/backups/NOMBRE_DEL_BACKUP.dump
```

Validar conteos mínimos:

```bash
docker exec prodgers_postgres psql -U prodgers_migrator -d prodgers_restore_test \
  -c "SELECT COUNT(*) AS instaladoras FROM instaladoras;
      SELECT COUNT(*) AS expedientes FROM expedientes;
      SELECT COUNT(*) AS usuarios FROM usuarios;"
```

Eliminar base temporal:

```bash
docker exec prodgers_postgres dropdb -U prodgers_migrator prodgers_restore_test
```

## Checklist después de deploy

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
docker logs --tail=100 prodgers_app
docker logs --tail=100 prodgers_postgres
curl -I http://127.0.0.1:3000
```

Validar en navegador:

- Login admin (`/login`) — debe redirigir a `/admin/inicio`
- Login instaladora — debe redirigir a `/instaladora/inicio`
- Login operativo — debe redirigir a `/prodgers/inicio`
- Crear instaladora desde admin
- Crear expediente desde instaladora
- Subir documento desde instaladora
- Descargar documento desde operativo
- Logout

Validar seguridad básica:

- `prodgers_postgres` no tiene puerto público en `docker ps`
- `.env.production` no está en Git
- `SESSION_SECRET` tiene al menos 64 caracteres
- Cloudflare Tunnel publica solo la app, no PostgreSQL
- `prodgers_backup` aparece en `docker ps` y está `Up`
- Existe backup reciente en `/opt/backups/` (`ls -lh /opt/backups/prodgers_*.dump`)

## Diagnóstico rápido

**App no responde:**

```bash
docker logs --tail=200 prodgers_app
docker inspect prodgers_app --format '{{json .State}}'
curl -v http://127.0.0.1:3000
```

**PostgreSQL no está sano:**

```bash
docker logs --tail=200 prodgers_postgres
docker exec prodgers_postgres pg_isready -U prodgers_migrator -d prodgers_db
```

**Error de conexión a DB desde la app:**

```bash
# Verificar que ambos contenedores estén en la misma red
docker network inspect prodgers_prodgers_internal
# Verificar que prodgers_app puede ver prodgers_postgres
docker exec prodgers_app ping -c 2 prodgers_postgres
```

**Documentos no se descargan:**

```bash
# Verificar que el volumen esté montado
docker exec prodgers_app ls -lah /var/lib/prodgers/uploads

# Ver paths en DB
docker exec prodgers_postgres psql -U prodgers_migrator -d prodgers_db \
  -c "SELECT id, storage_path, nombre_archivo FROM documentos_entrada ORDER BY created_at DESC LIMIT 10;"
```

**Migraciones fallan con `ENOTFOUND postgres`:**

- Ejecutarlas siempre desde dentro del contenedor (`docker exec prodgers_app ...`)
- El hostname `prodgers_postgres` solo resuelve dentro de la red Docker

**Tunnel no publica:**

```bash
# Si cloudflared corre en host
systemctl status cloudflared
cloudflared tunnel info

# Si hay un contenedor
docker logs --tail=200 <nombre_contenedor_cloudflared>
curl -I http://127.0.0.1:3000   # verificar que la app está OK localmente
```

## Rollback básico

Si el deploy nuevo falla pero la base de datos no cambió:

```bash
git log --oneline -5
git checkout <commit_anterior>
docker compose --env-file .env.production build --pull=false app
docker compose --env-file .env.production up -d --force-recreate app
```

Si hubo migraciones nuevas aplicadas y hay que hacer rollback: no revertir directamente. Restaurar backup verificado en base temporal, evaluar impacto, y decidir ventana de mantenimiento antes de actuar sobre producción.

## Comandos frecuentes

```bash
# Ver estado de contenedores
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Logs en tiempo real
docker logs -f prodgers_app
docker logs -f prodgers_postgres

# Reiniciar solo la app
docker compose --env-file .env.production restart app

# Reiniciar todo el stack
docker compose --env-file .env.production up -d app postgres

# Detener app sin borrar datos
docker compose --env-file .env.production stop app

# Detener todo sin borrar volúmenes
docker compose --env-file .env.production down

# PELIGRO: esto borra los datos — nunca en producción sin backup verificado
# docker compose --env-file .env.production down -v
```

## Scripts disponibles

En desarrollo local (con `tsx`):

```bash
npm run db:migrate        # aplica migraciones pendientes
npm run db:seed-admin     # crea el usuario admin inicial
```

En producción (dentro del contenedor — scripts compilados a JS en el build):

```bash
docker exec prodgers_app node scripts/migrate.js
docker exec prodgers_app node scripts/seed-admin.js
```

## Pendientes antes del primer deploy en producción

| Elemento | Estado | Descripción |
|---|---|---|
| Servicio backup en Compose | ✓ Implementado | `prodgers_backup` corre diariamente, retiene 30 días en `/opt/backups/`. |
| Servicio cloudflared en Compose | Opcional | Puede correr en el host en lugar de contenedor. |
| `.env.production` | Pendiente | Crear con valores reales en la VM antes del deploy. |

Los scripts `init-postgres.sh`, `migrate.ts` y `seed-admin.ts` ya están implementados.
