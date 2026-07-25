-- Migración 0003: tabla de auditoría y trigger genérico
-- Ejecutar como opscore_owner

CREATE TABLE auditoria (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tabla           text        NOT NULL,
  operacion       text        NOT NULL CHECK (operacion IN ('INSERT', 'UPDATE', 'DELETE')),
  registro_id     uuid        NOT NULL,
  organizacion_id uuid,
  usuario_id      uuid,
  datos_antes     jsonb,
  datos_despues   jsonb,
  ocurrido_en     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX auditoria_tabla_registro ON auditoria (tabla, registro_id);
CREATE INDEX auditoria_ocurrido_en    ON auditoria (ocurrido_en DESC);

-- app_user puede escribir (el trigger necesita insertar); no puede leer (sin RLS = rol dueño/contabilidad)
GRANT INSERT ON auditoria TO app_user;

-- Función genérica de auditoría
-- Usa JSONB para acceso dinámico a campos: evita errores cuando la tabla
-- no tiene columna organizacion_id (ej. la propia tabla organizaciones).
CREATE OR REPLACE FUNCTION app.fn_auditoria() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_nuevo       jsonb;
  v_anterior    jsonb;
  v_registro_id uuid;
  v_org_id      uuid;
BEGIN
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    v_nuevo       := to_jsonb(NEW);
    v_registro_id := (v_nuevo->>'id')::uuid;
  END IF;
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    v_anterior    := to_jsonb(OLD);
    v_registro_id := COALESCE(v_registro_id, (v_anterior->>'id')::uuid);
  END IF;

  -- Acceso NULL-safe a organizacion_id vía jsonb (retorna NULL si el campo no existe)
  v_org_id := COALESCE(
    (COALESCE(v_nuevo, v_anterior)->>'organizacion_id')::uuid,
    CASE WHEN TG_TABLE_NAME = 'organizaciones' THEN v_registro_id END
  );

  INSERT INTO auditoria (
    tabla, operacion, registro_id, organizacion_id, usuario_id,
    datos_antes, datos_despues
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    v_registro_id,
    v_org_id,
    app.usuario_actual(),
    v_anterior,
    v_nuevo
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Aplicar trigger a las tablas de tenancy
CREATE TRIGGER trg_auditoria
  AFTER INSERT OR UPDATE OR DELETE ON organizaciones
  FOR EACH ROW EXECUTE FUNCTION app.fn_auditoria();

CREATE TRIGGER trg_auditoria
  AFTER INSERT OR UPDATE OR DELETE ON empresas
  FOR EACH ROW EXECUTE FUNCTION app.fn_auditoria();

CREATE TRIGGER trg_auditoria
  AFTER INSERT OR UPDATE OR DELETE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION app.fn_auditoria();

CREATE TRIGGER trg_auditoria
  AFTER INSERT OR UPDATE OR DELETE ON usuario_roles
  FOR EACH ROW EXECUTE FUNCTION app.fn_auditoria();
