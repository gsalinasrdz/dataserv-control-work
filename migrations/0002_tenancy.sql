CREATE TYPE "public"."rol_sistema" AS ENUM('administrador', 'control_costos', 'contabilidad', 'residente', 'capturista', 'almacenista', 'direccion');--> statement-breakpoint
CREATE TABLE "empresas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizacion_id" uuid NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"rfc" varchar(13) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	CONSTRAINT "empresas_rfc_org" UNIQUE("rfc","organizacion_id")
);
--> statement-breakpoint
CREATE TABLE "organizaciones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"rfc" varchar(13),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usuario_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"organizacion_id" uuid NOT NULL,
	"rol" "rol_sistema" NOT NULL,
	"proyecto_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizacion_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	CONSTRAINT "usuarios_email_org" UNIQUE("email","organizacion_id")
);
--> statement-breakpoint
ALTER TABLE "empresas" ADD CONSTRAINT "empresas_organizacion_id_organizaciones_id_fk" FOREIGN KEY ("organizacion_id") REFERENCES "public"."organizaciones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuario_roles" ADD CONSTRAINT "usuario_roles_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuario_roles" ADD CONSTRAINT "usuario_roles_organizacion_id_organizaciones_id_fk" FOREIGN KEY ("organizacion_id") REFERENCES "public"."organizaciones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_organizacion_id_organizaciones_id_fk" FOREIGN KEY ("organizacion_id") REFERENCES "public"."organizaciones"("id") ON DELETE no action ON UPDATE no action;

-- ============================================================
-- RLS — OBLIGATORIO: ENABLE + FORCE en todas las tablas
-- ============================================================

ALTER TABLE organizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizaciones FORCE  ROW LEVEL SECURITY;

ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas FORCE  ROW LEVEL SECURITY;

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios FORCE  ROW LEVEL SECURITY;

ALTER TABLE usuario_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_roles FORCE  ROW LEVEL SECURITY;

-- Políticas: solo ver datos de la propia organización
CREATE POLICY org_isolation ON organizaciones
  USING (id = app.organizacion_actual());

CREATE POLICY org_isolation ON empresas
  USING (organizacion_id = app.organizacion_actual());

CREATE POLICY org_isolation ON usuarios
  USING (organizacion_id = app.organizacion_actual());

CREATE POLICY org_isolation ON usuario_roles
  USING (organizacion_id = app.organizacion_actual());

-- Permisos DML para app_user (RLS decide qué filas ve)
GRANT SELECT, INSERT, UPDATE ON organizaciones TO app_user;
GRANT SELECT, INSERT, UPDATE ON empresas TO app_user;
GRANT SELECT, INSERT, UPDATE ON usuarios TO app_user;
GRANT SELECT, INSERT, UPDATE ON usuario_roles TO app_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_user;