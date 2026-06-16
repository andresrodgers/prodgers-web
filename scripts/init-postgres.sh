#!/bin/bash
# Este script lo ejecuta el contenedor PostgreSQL la primera vez que arranca.
# Crea el usuario prodgers_app (solo DML). El usuario prodgers_migrator
# ya lo crea Docker a partir de POSTGRES_USER.
# Los permisos DML se otorgan al final de migrations/001_initial_schema.sql.
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  CREATE USER prodgers_app WITH PASSWORD '$POSTGRES_APP_PASSWORD';
EOSQL

echo "Usuario prodgers_app creado."
