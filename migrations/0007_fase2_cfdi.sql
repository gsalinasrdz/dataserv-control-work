-- Migración 0007: DDL Fase 2 — CFDI, asignaciones, movimientos de costo
-- Ejecutar como opscore_owner DESPUÉS de npm run migrate (0002 + 0005)
-- NOTA: facturas NO lleva proyecto_id — la factura pertenece a la empresa,
--       el proyecto se deriva de las asignaciones de sus conceptos.

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE "public"."estado_factura" AS ENUM(
  'recibida', 'parcialmente_asignada', 'asignada', 'cerrada'
);

CREATE TYPE "public"."categoria_costo" AS ENUM(
  'materiales', 'mano_obra', 'subcontratos', 'equipo_renta',
  'fletes', 'indirectos', 'otros'
);

CREATE TYPE "public"."estado_asignacion" AS ENUM('autorizada', 'cancelada');

CREATE TYPE "public"."origen_movimiento" AS ENUM(
  'factura_concepto', 'alta_manual', 'mano_obra', 'prorrateo', 'ajuste'
);

-- ============================================================
-- TABLA: facturas
-- ============================================================
CREATE TABLE "facturas" (
  "id"              uuid        PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organizacion_id" uuid        NOT NULL
    REFERENCES "organizaciones"("id"),
  "empresa_id"      uuid
    REFERENCES "empresas"("id"),
  "uuid_fiscal"     varchar(36) NOT NULL,
  "serie"           varchar(25),
  "folio"           varchar(40),
  "fecha_emision"   timestamptz NOT NULL,
  "fecha_timbrado"  timestamptz NOT NULL,
  "rfc_emisor"      varchar(13) NOT NULL,
  "nombre_emisor"   varchar(255) NOT NULL,
  "rfc_receptor"    varchar(13) NOT NULL,
  "subtotal"        numeric(18,4) NOT NULL,
  "total"           numeric(18,4) NOT NULL,
  "moneda"          varchar(3)  NOT NULL DEFAULT 'MXN',
  "tipo_cambio"     numeric(10,6) NOT NULL DEFAULT 1,
  "estado"          estado_factura NOT NULL DEFAULT 'recibida',
  "xml_crudo"       text        NOT NULL,
  "created_at"      timestamptz NOT NULL DEFAULT now(),
  "updated_at"      timestamptz NOT NULL DEFAULT now(),
  "created_by"      uuid        NOT NULL,
  CONSTRAINT "facturas_uuid_fiscal_org" UNIQUE ("uuid_fiscal", "organizacion_id")
);

-- ============================================================
-- TABLA: factura_conceptos (INMUTABLE — nunca UPDATE ni DELETE desde la app)
-- ============================================================
CREATE TABLE "factura_conceptos" (
  "id"                uuid        PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "factura_id"        uuid        NOT NULL REFERENCES "facturas"("id"),
  "organizacion_id"   uuid        NOT NULL REFERENCES "organizaciones"("id"),
  "numero_linea"      integer     NOT NULL,
  "clave_prod_serv"   varchar(8),
  "no_identificacion" varchar(100),
  "descripcion"       text        NOT NULL,
  "clave_unidad"      varchar(20),
  "unidad"            varchar(50),
  "cantidad"          numeric(18,6) NOT NULL,
  "valor_unitario"    numeric(18,6) NOT NULL,
  "importe"           numeric(18,4) NOT NULL,
  "descuento"         numeric(18,4) NOT NULL DEFAULT 0,
  "objeto_imp"        varchar(2),
  "created_at"        timestamptz NOT NULL DEFAULT now(),
  "updated_at"        timestamptz NOT NULL DEFAULT now(),
  "created_by"        uuid        NOT NULL
);

-- ============================================================
-- TABLA: asignaciones
-- ============================================================
CREATE TABLE "asignaciones" (
  "id"                   uuid           PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "factura_concepto_id"  uuid           NOT NULL REFERENCES "factura_conceptos"("id"),
  "trabajo_id"           uuid           NOT NULL REFERENCES "trabajos"("id"),
  "proyecto_id"          uuid           NOT NULL REFERENCES "proyectos"("id"),
  "organizacion_id"      uuid           NOT NULL REFERENCES "organizaciones"("id"),
  "importe"              numeric(18,4)  NOT NULL,
  "categoria"            categoria_costo NOT NULL,
  "fecha_devengo"        date           NOT NULL,
  "estado"               estado_asignacion NOT NULL DEFAULT 'autorizada',
  "created_at"           timestamptz    NOT NULL DEFAULT now(),
  "updated_at"           timestamptz    NOT NULL DEFAULT now(),
  "created_by"           uuid           NOT NULL,
  CONSTRAINT "asignaciones_importe_positivo" CHECK (importe > 0)
);

-- ============================================================
-- TABLA: movimientos_costo (libro mayor — nunca DELETE ni UPDATE desde la app)
-- ============================================================
CREATE TABLE "movimientos_costo" (
  "id"            uuid          PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "trabajo_id"    uuid          NOT NULL REFERENCES "trabajos"("id"),
  "proyecto_id"   uuid          NOT NULL REFERENCES "proyectos"("id"),
  "organizacion_id" uuid        NOT NULL REFERENCES "organizaciones"("id"),
  "categoria"     categoria_costo NOT NULL,
  "importe"       numeric(18,4) NOT NULL,
  "signo"         integer       NOT NULL DEFAULT 1,
  "fecha_devengo" date          NOT NULL,
  "origen_tipo"   origen_movimiento NOT NULL,
  "origen_id"     uuid          NOT NULL,
  "descripcion"   text,
  "created_at"    timestamptz   NOT NULL DEFAULT now(),
  "updated_at"    timestamptz   NOT NULL DEFAULT now(),
  "created_by"    uuid          NOT NULL,
  CONSTRAINT "movimientos_costo_signo_check"    CHECK (signo IN (1, -1)),
  CONSTRAINT "movimientos_costo_importe_check"  CHECK (importe > 0)
);

-- ============================================================
-- ÍNDICES de rendimiento
-- ============================================================
CREATE INDEX "facturas_org_estado"          ON facturas (organizacion_id, estado);
CREATE INDEX "facturas_org_fecha"           ON facturas (organizacion_id, fecha_emision DESC);
CREATE INDEX "factura_conceptos_factura_id" ON factura_conceptos (factura_id);
CREATE INDEX "asignaciones_concepto_id"     ON asignaciones (factura_concepto_id);
CREATE INDEX "asignaciones_trabajo_id"      ON asignaciones (trabajo_id);
CREATE INDEX "movimientos_costo_trabajo"    ON movimientos_costo (trabajo_id);
CREATE INDEX "movimientos_costo_proyecto"   ON movimientos_costo (proyecto_id, fecha_devengo);
