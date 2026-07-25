#!/bin/bash
# Ejecutar UNA SOLA VEZ como superusuario antes de aplicar migraciones.
# Uso: PGPASSWORD=<superuser_pass> bash scripts/init-db.sh
# Variables de entorno requeridas: PGHOST, PGPORT, PGPASSWORD
set -euo pipefail

PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"

echo "Creando roles y base de datos en ${PGHOST}:${PGPORT}..."

psql -h "$PGHOST" -p "$PGPORT" -U postgres <<'ENDSQL'
-- Rol dueño de las tablas (solo para migraciones)
DO $$ BEGIN
  CREATE ROLE opscore_owner LOGIN PASSWORD 'CAMBIAR_OWNER_PASS';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Crear la base de datos si no existe
SELECT 'CREATE DATABASE opscore OWNER opscore_owner'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'opscore')\gexec

-- Conectar a opscore y crear app_user
\c opscore

DO $$ BEGIN
  CREATE ROLE app_user LOGIN PASSWORD 'CAMBIAR_APP_PASS';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

GRANT CONNECT ON DATABASE opscore TO app_user;
ENDSQL

echo "Roles creados. Ahora aplica las migraciones:"
echo "  psql -h \$PGHOST -U opscore_owner -d opscore -f migrations/0001_init_roles_extensions.sql"
echo "  DATABASE_URL_OWNER=postgres://opscore_owner:PASS@\$PGHOST/opscore npm run migrate"
