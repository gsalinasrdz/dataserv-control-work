-- Migración 0001: extensiones, schema app, funciones de contexto RLS
-- Ejecutar como opscore_owner (no como superusuario)
-- Idempotente: usar IF NOT EXISTS en todo

-- Extensiones
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Schema de contexto separado de public
CREATE SCHEMA IF NOT EXISTS app;

-- Función: devuelve el UUID del usuario en sesión
-- Devuelve NULL si no está establecido (= sin contexto = 0 filas por RLS)
CREATE OR REPLACE FUNCTION app.usuario_actual() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.usuario_id', true), '')::uuid
$$;

-- Función: devuelve el UUID de la organización en sesión
CREATE OR REPLACE FUNCTION app.organizacion_actual() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.organizacion_id', true), '')::uuid
$$;

-- Permisos base para app_user
GRANT USAGE ON SCHEMA public TO app_user;
GRANT USAGE ON SCHEMA app TO app_user;
GRANT EXECUTE ON FUNCTION app.usuario_actual() TO app_user;
GRANT EXECUTE ON FUNCTION app.organizacion_actual() TO app_user;
