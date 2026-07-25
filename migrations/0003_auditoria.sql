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
CREATE OR REPLACE FUNCTION app.fn_auditoria() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO auditoria (
    tabla, operacion, registro_id, organizacion_id, usuario_id,
    datos_antes, datos_despues
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    COALESCE(NEW.id, OLD.id),
    COALESCE(
      NEW.organizacion_id, OLD.organizacion_id,
      CASE WHEN TG_TABLE_NAME = 'organizaciones' THEN COALESCE(NEW.id, OLD.id) END
    ),
    app.usuario_actual(),
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END
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
