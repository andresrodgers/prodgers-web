# ──────────────────────────────────────────────
# Etapa 1: instalar dependencias
# ──────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ──────────────────────────────────────────────
# Etapa 2: build
# ──────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx next build --webpack

# Compilar scripts de DB a CommonJS para poder ejecutarlos con node en el runner
RUN node_modules/.bin/tsc \
  --module commonjs \
  --target es2020 \
  --esModuleInterop \
  --skipLibCheck \
  --outDir scripts-compiled \
  scripts/migrate.ts \
  scripts/seed-admin.ts

# ──────────────────────────────────────────────
# Etapa 3: imagen de producción (mínima)
# ──────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Usuario sin privilegios para correr la app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Archivos del build standalone
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Migraciones y scripts compilados (node scripts/migrate.js, node scripts/seed-admin.js)
COPY --from=builder --chown=nextjs:nodejs /app/migrations ./migrations
COPY --from=builder --chown=nextjs:nodejs /app/scripts-compiled ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/scripts/init-postgres.sh ./scripts/init-postgres.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
