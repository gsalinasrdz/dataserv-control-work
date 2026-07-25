CREATE TYPE "public"."estado_proyecto" AS ENUM('activo', 'pausado', 'cerrado');
--> statement-breakpoint
CREATE TABLE "proyectos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizacion_id" uuid NOT NULL,
	"empresa_id" uuid,
	"nombre" varchar(255) NOT NULL,
	"clave" varchar(50) NOT NULL,
	"descripcion" text,
	"estado" "estado_proyecto" DEFAULT 'activo' NOT NULL,
	"fecha_inicio" date,
	"fecha_fin_estimada" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	CONSTRAINT "proyectos_clave_org" UNIQUE("clave","organizacion_id")
);
--> statement-breakpoint
CREATE TABLE "frentes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proyecto_id" uuid NOT NULL,
	"organizacion_id" uuid NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"clave" varchar(50) NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	CONSTRAINT "frentes_clave_proyecto" UNIQUE("clave","proyecto_id")
);
--> statement-breakpoint
CREATE TABLE "trabajos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"frente_id" uuid NOT NULL,
	"proyecto_id" uuid NOT NULL,
	"organizacion_id" uuid NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"clave" varchar(50) NOT NULL,
	"unidad" varchar(20) NOT NULL,
	"presupuesto_cantidad" numeric(15, 4) DEFAULT '0' NOT NULL,
	"presupuesto_unitario" numeric(15, 4) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	CONSTRAINT "trabajos_clave_frente" UNIQUE("clave","frente_id")
);
--> statement-breakpoint
CREATE TABLE "proveedores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizacion_id" uuid NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"rfc" varchar(13),
	"contacto" varchar(255),
	"telefono" varchar(20),
	"email" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "materiales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizacion_id" uuid NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"clave" varchar(50) NOT NULL,
	"unidad" varchar(20) NOT NULL,
	"descripcion" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	CONSTRAINT "materiales_clave_org" UNIQUE("clave","organizacion_id")
);
--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "password_hash" varchar(255);
--> statement-breakpoint
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_organizacion_id_organizaciones_id_fk" FOREIGN KEY ("organizacion_id") REFERENCES "public"."organizaciones"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_empresa_id_empresas_id_fk" FOREIGN KEY ("empresa_id") REFERENCES "public"."empresas"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "frentes" ADD CONSTRAINT "frentes_proyecto_id_proyectos_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "frentes" ADD CONSTRAINT "frentes_organizacion_id_organizaciones_id_fk" FOREIGN KEY ("organizacion_id") REFERENCES "public"."organizaciones"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "trabajos" ADD CONSTRAINT "trabajos_frente_id_frentes_id_fk" FOREIGN KEY ("frente_id") REFERENCES "public"."frentes"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "trabajos" ADD CONSTRAINT "trabajos_proyecto_id_proyectos_id_fk" FOREIGN KEY ("proyecto_id") REFERENCES "public"."proyectos"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "trabajos" ADD CONSTRAINT "trabajos_organizacion_id_organizaciones_id_fk" FOREIGN KEY ("organizacion_id") REFERENCES "public"."organizaciones"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "proveedores" ADD CONSTRAINT "proveedores_organizacion_id_organizaciones_id_fk" FOREIGN KEY ("organizacion_id") REFERENCES "public"."organizaciones"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "materiales" ADD CONSTRAINT "materiales_organizacion_id_organizaciones_id_fk" FOREIGN KEY ("organizacion_id") REFERENCES "public"."organizaciones"("id") ON DELETE no action ON UPDATE no action;
