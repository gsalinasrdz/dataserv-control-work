-- ================================================================
-- OpsCore — Script de migración completo e idempotente
-- Ejecutar como opscore_owner:
--   psql "postgres://opscore_owner:HEmome2026++@localhost:5432/opscore" -f setup_completo.sql
-- ================================================================

-- ----------------------------------------------------------------
-- 0001: extensiones, schema app, funciones RLS
-- ----------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

CREATE SCHEMA IF NOT EXISTS app;

CREATE OR REPLACE FUNCTION app.usuario_actual() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.usuario_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION app.organizacion_actual() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.organizacion_id', true), '')::uuid
$$;

GRANT USAGE ON SCHEMA public TO app_user;
GRANT USAGE ON SCHEMA app TO app_user;
GRANT EXECUTE ON FUNCTION app.usuario_actual() TO app_user;
GRANT EXECUTE ON FUNCTION app.organizacion_actual() TO app_user;

-- ----------------------------------------------------------------
-- 0002: tablas de tenancy (idempotente con IF NOT EXISTS)
-- ----------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE rol_sistema AS ENUM(
    'administrador','control_costos','contabilidad',
    'residente','capturista','almacenista','direccion'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS organizaciones (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  nombre      varchar(255) NOT NULL,
  rfc         varchar(13),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS empresas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  organizacion_id uuid NOT NULL REFERENCES organizaciones(id),
  nombre          varchar(255) NOT NULL,
  rfc             varchar(13) NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid NOT NULL,
  CONSTRAINT empresas_rfc_org UNIQUE (rfc, organizacion_id)
);

CREATE TABLE IF NOT EXISTS usuarios (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  organizacion_id uuid NOT NULL REFERENCES organizaciones(id),
  email           varchar(255) NOT NULL,
  nombre          varchar(255) NOT NULL,
  password_hash   varchar(255),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid NOT NULL,
  CONSTRAINT usuarios_email_org UNIQUE (email, organizacion_id)
);

CREATE TABLE IF NOT EXISTS usuario_roles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  usuario_id      uuid NOT NULL REFERENCES usuarios(id),
  organizacion_id uuid NOT NULL REFERENCES organizaciones(id),
  rol             rol_sistema NOT NULL,
  proyecto_id     uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid NOT NULL
);

-- RLS tenancy (idempotente)
ALTER TABLE organizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizaciones FORCE  ROW LEVEL SECURITY;
ALTER TABLE empresas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas       FORCE  ROW LEVEL SECURITY;
ALTER TABLE usuarios       ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios       FORCE  ROW LEVEL SECURITY;
ALTER TABLE usuario_roles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_roles  FORCE  ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY org_isolation ON organizaciones USING (id = app.organizacion_actual());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY org_isolation ON empresas USING (organizacion_id = app.organizacion_actual());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY org_isolation ON usuarios USING (organizacion_id = app.organizacion_actual());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY org_isolation ON usuario_roles USING (organizacion_id = app.organizacion_actual());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY org_isolation_insert ON organizaciones FOR INSERT WITH CHECK (app.usuario_actual() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY org_isolation_insert ON empresas FOR INSERT WITH CHECK (organizacion_id = app.organizacion_actual());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY org_isolation_insert ON usuarios FOR INSERT WITH CHECK (organizacion_id = app.organizacion_actual());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY org_isolation_insert ON usuario_roles FOR INSERT WITH CHECK (organizacion_id = app.organizacion_actual());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

GRANT SELECT, INSERT, UPDATE ON organizaciones TO app_user;
GRANT SELECT, INSERT, UPDATE ON empresas TO app_user;
GRANT SELECT, INSERT, UPDATE ON usuarios TO app_user;
GRANT SELECT, INSERT, UPDATE ON usuario_roles TO app_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- ----------------------------------------------------------------
-- 0003: auditoría
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auditoria (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tabla           text        NOT NULL,
  operacion       text        NOT NULL CHECK (operacion IN ('INSERT','UPDATE','DELETE')),
  registro_id     uuid        NOT NULL,
  organizacion_id uuid,
  usuario_id      uuid,
  datos_antes     jsonb,
  datos_despues   jsonb,
  ocurrido_en     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auditoria_tabla_registro ON auditoria (tabla, registro_id);
CREATE INDEX IF NOT EXISTS auditoria_ocurrido_en    ON auditoria (ocurrido_en DESC);

GRANT INSERT ON auditoria TO app_user;

CREATE OR REPLACE FUNCTION app.fn_auditoria() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_nuevo       jsonb;
  v_anterior    jsonb;
  v_registro_id uuid;
  v_org_id      uuid;
BEGIN
  IF TG_OP IN ('INSERT','UPDATE') THEN
    v_nuevo       := to_jsonb(NEW);
    v_registro_id := (v_nuevo->>'id')::uuid;
  END IF;
  IF TG_OP IN ('UPDATE','DELETE') THEN
    v_anterior    := to_jsonb(OLD);
    v_registro_id := COALESCE(v_registro_id, (v_anterior->>'id')::uuid);
  END IF;
  v_org_id := COALESCE(
    (COALESCE(v_nuevo, v_anterior)->>'organizacion_id')::uuid,
    CASE WHEN TG_TABLE_NAME = 'organizaciones' THEN v_registro_id END
  );
  INSERT INTO auditoria (tabla,operacion,registro_id,organizacion_id,usuario_id,datos_antes,datos_despues)
  VALUES (TG_TABLE_NAME,TG_OP,v_registro_id,v_org_id,app.usuario_actual(),v_anterior,v_nuevo);
  RETURN COALESCE(NEW, OLD);
END;
$$;

DO $$ BEGIN
  CREATE TRIGGER trg_auditoria AFTER INSERT OR UPDATE OR DELETE ON organizaciones FOR EACH ROW EXECUTE FUNCTION app.fn_auditoria();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_auditoria AFTER INSERT OR UPDATE OR DELETE ON empresas FOR EACH ROW EXECUTE FUNCTION app.fn_auditoria();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_auditoria AFTER INSERT OR UPDATE OR DELETE ON usuarios FOR EACH ROW EXECUTE FUNCTION app.fn_auditoria();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_auditoria AFTER INSERT OR UPDATE OR DELETE ON usuario_roles FOR EACH ROW EXECUTE FUNCTION app.fn_auditoria();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------------------------------
-- 0004: tablas auth (Auth.js / @auth/pg-adapter)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth_users (
  id            text PRIMARY KEY,
  name          text,
  email         text UNIQUE,
  "emailVerified" timestamptz,
  image         text
);

CREATE TABLE IF NOT EXISTS auth_accounts (
  id                  text PRIMARY KEY,
  "userId"            text NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  type                text NOT NULL,
  provider            text NOT NULL,
  "providerAccountId" text NOT NULL,
  refresh_token       text,
  access_token        text,
  expires_at          bigint,
  token_type          text,
  scope               text,
  id_token            text,
  session_state       text,
  UNIQUE (provider, "providerAccountId")
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id             text PRIMARY KEY,
  "sessionToken" text UNIQUE NOT NULL,
  "userId"       text NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  expires        timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_verification_tokens (
  identifier text        NOT NULL,
  expires    timestamptz NOT NULL,
  token      text        UNIQUE NOT NULL,
  PRIMARY KEY (identifier, token)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON auth_users, auth_accounts, auth_sessions, auth_verification_tokens TO app_user;

-- ----------------------------------------------------------------
-- 0005: Fase 1 — proyectos, frentes, trabajos, proveedores, materiales
-- ----------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE estado_proyecto AS ENUM('activo','pausado','cerrado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS proyectos (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  organizacion_id     uuid NOT NULL REFERENCES organizaciones(id),
  empresa_id          uuid REFERENCES empresas(id),
  nombre              varchar(255) NOT NULL,
  clave               varchar(50) NOT NULL,
  descripcion         text,
  estado              estado_proyecto NOT NULL DEFAULT 'activo',
  fecha_inicio        date,
  fecha_fin_estimada  date,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  created_by          uuid NOT NULL,
  CONSTRAINT proyectos_clave_org UNIQUE (clave, organizacion_id)
);

CREATE TABLE IF NOT EXISTS frentes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  proyecto_id     uuid NOT NULL REFERENCES proyectos(id),
  organizacion_id uuid NOT NULL REFERENCES organizaciones(id),
  nombre          varchar(255) NOT NULL,
  clave           varchar(50) NOT NULL,
  orden           integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid NOT NULL,
  CONSTRAINT frentes_clave_proyecto UNIQUE (clave, proyecto_id)
);

CREATE TABLE IF NOT EXISTS trabajos (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  frente_id             uuid NOT NULL REFERENCES frentes(id),
  proyecto_id           uuid NOT NULL REFERENCES proyectos(id),
  organizacion_id       uuid NOT NULL REFERENCES organizaciones(id),
  nombre                varchar(255) NOT NULL,
  clave                 varchar(50) NOT NULL,
  unidad                varchar(20) NOT NULL,
  presupuesto_cantidad  numeric(15,4) NOT NULL DEFAULT 0,
  presupuesto_unitario  numeric(15,4) NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  created_by            uuid NOT NULL,
  CONSTRAINT trabajos_clave_frente UNIQUE (clave, frente_id)
);

CREATE TABLE IF NOT EXISTS proveedores (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  organizacion_id uuid NOT NULL REFERENCES organizaciones(id),
  nombre          varchar(255) NOT NULL,
  rfc             varchar(13),
  contacto        varchar(255),
  telefono        varchar(20),
  email           varchar(255),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS materiales (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  organizacion_id uuid NOT NULL REFERENCES organizaciones(id),
  nombre          varchar(255) NOT NULL,
  clave           varchar(50) NOT NULL,
  unidad          varchar(20) NOT NULL,
  descripcion     text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid NOT NULL,
  CONSTRAINT materiales_clave_org UNIQUE (clave, organizacion_id)
);

-- ----------------------------------------------------------------
-- 0006: RLS Fase 1
-- ----------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE ON proyectos   TO app_user;
GRANT SELECT, INSERT, UPDATE ON frentes     TO app_user;
GRANT SELECT, INSERT, UPDATE ON trabajos    TO app_user;
GRANT SELECT, INSERT, UPDATE ON proveedores TO app_user;
GRANT SELECT, INSERT, UPDATE ON materiales  TO app_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_user;

ALTER TABLE proyectos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyectos   FORCE  ROW LEVEL SECURITY;
ALTER TABLE frentes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE frentes     FORCE  ROW LEVEL SECURITY;
ALTER TABLE trabajos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE trabajos    FORCE  ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores FORCE  ROW LEVEL SECURITY;
ALTER TABLE materiales  ENABLE ROW LEVEL SECURITY;
ALTER TABLE materiales  FORCE  ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY org_isolation ON proyectos   USING (organizacion_id = app.organizacion_actual()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY org_isolation ON frentes     USING (organizacion_id = app.organizacion_actual()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY org_isolation ON trabajos    USING (organizacion_id = app.organizacion_actual()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY org_isolation ON proveedores USING (organizacion_id = app.organizacion_actual()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY org_isolation ON materiales  USING (organizacion_id = app.organizacion_actual()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE POLICY org_isolation_insert ON proyectos   FOR INSERT WITH CHECK (organizacion_id = app.organizacion_actual()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY org_isolation_insert ON frentes     FOR INSERT WITH CHECK (organizacion_id = app.organizacion_actual()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY org_isolation_insert ON trabajos    FOR INSERT WITH CHECK (organizacion_id = app.organizacion_actual()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY org_isolation_insert ON proveedores FOR INSERT WITH CHECK (organizacion_id = app.organizacion_actual()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY org_isolation_insert ON materiales  FOR INSERT WITH CHECK (organizacion_id = app.organizacion_actual()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TRIGGER trg_auditoria AFTER INSERT OR UPDATE OR DELETE ON proyectos   FOR EACH ROW EXECUTE FUNCTION app.fn_auditoria(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_auditoria AFTER INSERT OR UPDATE OR DELETE ON frentes     FOR EACH ROW EXECUTE FUNCTION app.fn_auditoria(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_auditoria AFTER INSERT OR UPDATE OR DELETE ON trabajos    FOR EACH ROW EXECUTE FUNCTION app.fn_auditoria(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_auditoria AFTER INSERT OR UPDATE OR DELETE ON proveedores FOR EACH ROW EXECUTE FUNCTION app.fn_auditoria(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_auditoria AFTER INSERT OR UPDATE OR DELETE ON materiales  FOR EACH ROW EXECUTE FUNCTION app.fn_auditoria(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS proveedores_rfc_org_nn ON proveedores (rfc, organizacion_id) WHERE rfc IS NOT NULL;

-- ----------------------------------------------------------------
-- 0007: Fase 2 — CFDI, asignaciones, movimientos de costo
-- ----------------------------------------------------------------
DO $$ BEGIN CREATE TYPE estado_factura AS ENUM('recibida','parcialmente_asignada','asignada','cerrada'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE categoria_costo AS ENUM('materiales','mano_obra','subcontratos','equipo_renta','fletes','indirectos','otros'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE estado_asignacion AS ENUM('autorizada','cancelada'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE origen_movimiento AS ENUM('factura_concepto','alta_manual','mano_obra','prorrateo','ajuste'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS facturas (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  organizacion_id uuid        NOT NULL REFERENCES organizaciones(id),
  empresa_id      uuid        REFERENCES empresas(id),
  uuid_fiscal     varchar(36) NOT NULL,
  serie           varchar(25),
  folio           varchar(40),
  fecha_emision   timestamptz NOT NULL,
  fecha_timbrado  timestamptz NOT NULL,
  rfc_emisor      varchar(13) NOT NULL,
  nombre_emisor   varchar(255) NOT NULL,
  rfc_receptor    varchar(13) NOT NULL,
  subtotal        numeric(18,4) NOT NULL,
  total           numeric(18,4) NOT NULL,
  moneda          varchar(3) NOT NULL DEFAULT 'MXN',
  tipo_cambio     numeric(10,6) NOT NULL DEFAULT 1,
  estado          estado_factura NOT NULL DEFAULT 'recibida',
  xml_crudo       text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid NOT NULL,
  CONSTRAINT facturas_uuid_fiscal_org UNIQUE (uuid_fiscal, organizacion_id)
);

CREATE TABLE IF NOT EXISTS factura_conceptos (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  factura_id        uuid        NOT NULL REFERENCES facturas(id),
  organizacion_id   uuid        NOT NULL REFERENCES organizaciones(id),
  numero_linea      integer     NOT NULL,
  clave_prod_serv   varchar(8),
  no_identificacion varchar(100),
  descripcion       text        NOT NULL,
  clave_unidad      varchar(20),
  unidad            varchar(50),
  cantidad          numeric(18,6) NOT NULL,
  valor_unitario    numeric(18,6) NOT NULL,
  importe           numeric(18,4) NOT NULL,
  descuento         numeric(18,4) NOT NULL DEFAULT 0,
  objeto_imp        varchar(2),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  created_by        uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS asignaciones (
  id                  uuid           PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  factura_concepto_id uuid           NOT NULL REFERENCES factura_conceptos(id),
  trabajo_id          uuid           NOT NULL REFERENCES trabajos(id),
  proyecto_id         uuid           NOT NULL REFERENCES proyectos(id),
  organizacion_id     uuid           NOT NULL REFERENCES organizaciones(id),
  importe             numeric(18,4)  NOT NULL,
  categoria           categoria_costo NOT NULL,
  fecha_devengo       date           NOT NULL,
  estado              estado_asignacion NOT NULL DEFAULT 'autorizada',
  created_at          timestamptz    NOT NULL DEFAULT now(),
  updated_at          timestamptz    NOT NULL DEFAULT now(),
  created_by          uuid           NOT NULL,
  CONSTRAINT asignaciones_importe_positivo CHECK (importe > 0)
);

CREATE TABLE IF NOT EXISTS movimientos_costo (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  trabajo_id      uuid          NOT NULL REFERENCES trabajos(id),
  proyecto_id     uuid          NOT NULL REFERENCES proyectos(id),
  organizacion_id uuid          NOT NULL REFERENCES organizaciones(id),
  categoria       categoria_costo NOT NULL,
  importe         numeric(18,4) NOT NULL,
  signo           integer       NOT NULL DEFAULT 1,
  fecha_devengo   date          NOT NULL,
  origen_tipo     origen_movimiento NOT NULL,
  origen_id       uuid          NOT NULL,
  descripcion     text,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now(),
  created_by      uuid          NOT NULL,
  CONSTRAINT movimientos_costo_signo_check   CHECK (signo IN (1,-1)),
  CONSTRAINT movimientos_costo_importe_check CHECK (importe > 0)
);

CREATE INDEX IF NOT EXISTS facturas_org_estado          ON facturas (organizacion_id, estado);
CREATE INDEX IF NOT EXISTS facturas_org_fecha           ON facturas (organizacion_id, fecha_emision DESC);
CREATE INDEX IF NOT EXISTS factura_conceptos_factura_id ON factura_conceptos (factura_id);
CREATE INDEX IF NOT EXISTS asignaciones_concepto_id     ON asignaciones (factura_concepto_id);
CREATE INDEX IF NOT EXISTS asignaciones_trabajo_id      ON asignaciones (trabajo_id);
CREATE INDEX IF NOT EXISTS movimientos_costo_trabajo    ON movimientos_costo (trabajo_id);
CREATE INDEX IF NOT EXISTS movimientos_costo_proyecto   ON movimientos_costo (proyecto_id, fecha_devengo);

-- ----------------------------------------------------------------
-- 0008: RLS Fase 2
-- ----------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE ON facturas          TO app_user;
GRANT SELECT, INSERT         ON factura_conceptos TO app_user;
GRANT SELECT, INSERT, UPDATE ON asignaciones      TO app_user;
GRANT SELECT, INSERT         ON movimientos_costo TO app_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_user;

ALTER TABLE facturas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas          FORCE  ROW LEVEL SECURITY;
ALTER TABLE factura_conceptos ENABLE ROW LEVEL SECURITY;
ALTER TABLE factura_conceptos FORCE  ROW LEVEL SECURITY;
ALTER TABLE asignaciones      ENABLE ROW LEVEL SECURITY;
ALTER TABLE asignaciones      FORCE  ROW LEVEL SECURITY;
ALTER TABLE movimientos_costo ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_costo FORCE  ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY org_isolation ON facturas          USING (organizacion_id = app.organizacion_actual()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY org_isolation ON factura_conceptos USING (organizacion_id = app.organizacion_actual()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY org_isolation ON asignaciones      USING (organizacion_id = app.organizacion_actual()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY org_isolation ON movimientos_costo USING (organizacion_id = app.organizacion_actual()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE POLICY org_isolation_insert ON facturas          FOR INSERT WITH CHECK (organizacion_id = app.organizacion_actual()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY org_isolation_insert ON factura_conceptos FOR INSERT WITH CHECK (organizacion_id = app.organizacion_actual()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY org_isolation_insert ON asignaciones      FOR INSERT WITH CHECK (organizacion_id = app.organizacion_actual()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY org_isolation_insert ON movimientos_costo FOR INSERT WITH CHECK (organizacion_id = app.organizacion_actual()); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TRIGGER trg_auditoria AFTER INSERT OR UPDATE OR DELETE ON facturas          FOR EACH ROW EXECUTE FUNCTION app.fn_auditoria(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_auditoria AFTER INSERT OR UPDATE OR DELETE ON factura_conceptos FOR EACH ROW EXECUTE FUNCTION app.fn_auditoria(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_auditoria AFTER INSERT OR UPDATE OR DELETE ON asignaciones      FOR EACH ROW EXECUTE FUNCTION app.fn_auditoria(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_auditoria AFTER INSERT OR UPDATE OR DELETE ON movimientos_costo FOR EACH ROW EXECUTE FUNCTION app.fn_auditoria(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION app.fn_check_asignacion_importe()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_importe_concepto numeric(18,4);
  v_importe_asignado numeric(18,4);
BEGIN
  SELECT importe INTO v_importe_concepto FROM factura_conceptos WHERE id = NEW.factura_concepto_id;
  SELECT COALESCE(SUM(importe),0) INTO v_importe_asignado
  FROM asignaciones
  WHERE factura_concepto_id = NEW.factura_concepto_id AND estado = 'autorizada' AND id IS DISTINCT FROM NEW.id;
  IF v_importe_asignado + NEW.importe > v_importe_concepto THEN
    RAISE EXCEPTION 'Asignación excede el importe del concepto: asignado=% nuevo=% total_concepto=%',
      v_importe_asignado, NEW.importe, v_importe_concepto;
  END IF;
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  CREATE TRIGGER trg_check_asignacion_importe
    BEFORE INSERT OR UPDATE ON asignaciones
    FOR EACH ROW WHEN (NEW.estado = 'autorizada')
    EXECUTE FUNCTION app.fn_check_asignacion_importe();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ================================================================
-- DATOS INICIALES: Organización + Usuario Guillermo Salinas
-- ================================================================
DO $$
DECLARE
  v_org_id  uuid := 'a0000000-0000-0000-0000-000000000001';
  v_user_id uuid := 'b0000000-0000-0000-0000-000000000001';
BEGIN
  -- Organización (bypass RLS — opscore_owner es exempt)
  INSERT INTO organizaciones (id, nombre, rfc, created_by)
  VALUES (v_org_id, 'OpsCore Demo', 'ORG000000000', v_user_id)
  ON CONFLICT (id) DO NOTHING;

  -- Usuario Guillermo Salinas
  INSERT INTO usuarios (id, organizacion_id, email, nombre, password_hash, created_by)
  VALUES (
    v_user_id,
    v_org_id,
    'gsalinasrdz@gmail.com',
    'Guillermo Salinas',
    '$2b$12$mOldnpx4yNAGRVfu.LgePu050Xfdd9PMo/AKlcIDH47P5/e2ObIRu',
    v_user_id
  )
  ON CONFLICT ON CONSTRAINT usuarios_email_org DO UPDATE SET
    nombre        = EXCLUDED.nombre,
    password_hash = EXCLUDED.password_hash,
    updated_at    = now();

  -- Rol administrador
  INSERT INTO usuario_roles (usuario_id, organizacion_id, rol, created_by)
  VALUES (v_user_id, v_org_id, 'administrador', v_user_id)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Setup completo. org_id=% user_id=%', v_org_id, v_user_id;
END $$;

-- Verificación final
SELECT 'organizaciones' AS tabla, count(*) FROM organizaciones
UNION ALL SELECT 'usuarios', count(*) FROM usuarios
UNION ALL SELECT 'usuario_roles', count(*) FROM usuario_roles
UNION ALL SELECT 'proyectos', count(*) FROM proyectos
UNION ALL SELECT 'facturas', count(*) FROM facturas;
