-- Migración 0008: RLS, permisos, auditoría e invariantes para tablas Fase 2
-- Ejecutar como opscore_owner DESPUÉS de 0007_fase2_cfdi.sql y 0003_auditoria.sql

-- ============================================================
-- PERMISOS app_user
-- ============================================================
GRANT SELECT, INSERT, UPDATE ON facturas          TO app_user;
GRANT SELECT, INSERT         ON factura_conceptos TO app_user;
GRANT SELECT, INSERT, UPDATE ON asignaciones      TO app_user;
GRANT SELECT, INSERT         ON movimientos_costo TO app_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE facturas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas          FORCE  ROW LEVEL SECURITY;
ALTER TABLE factura_conceptos ENABLE ROW LEVEL SECURITY;
ALTER TABLE factura_conceptos FORCE  ROW LEVEL SECURITY;
ALTER TABLE asignaciones      ENABLE ROW LEVEL SECURITY;
ALTER TABLE asignaciones      FORCE  ROW LEVEL SECURITY;
ALTER TABLE movimientos_costo ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_costo FORCE  ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON facturas
  USING (organizacion_id = app.organizacion_actual());
CREATE POLICY org_isolation ON factura_conceptos
  USING (organizacion_id = app.organizacion_actual());
CREATE POLICY org_isolation ON asignaciones
  USING (organizacion_id = app.organizacion_actual());
CREATE POLICY org_isolation ON movimientos_costo
  USING (organizacion_id = app.organizacion_actual());

CREATE POLICY org_isolation_insert ON facturas
  FOR INSERT WITH CHECK (organizacion_id = app.organizacion_actual());
CREATE POLICY org_isolation_insert ON factura_conceptos
  FOR INSERT WITH CHECK (organizacion_id = app.organizacion_actual());
CREATE POLICY org_isolation_insert ON asignaciones
  FOR INSERT WITH CHECK (organizacion_id = app.organizacion_actual());
CREATE POLICY org_isolation_insert ON movimientos_costo
  FOR INSERT WITH CHECK (organizacion_id = app.organizacion_actual());

-- ============================================================
-- AUDITORÍA (reutiliza fn_auditoria de 0003_auditoria.sql)
-- ============================================================
CREATE TRIGGER trg_auditoria
  AFTER INSERT OR UPDATE OR DELETE ON facturas
  FOR EACH ROW EXECUTE FUNCTION app.fn_auditoria();

CREATE TRIGGER trg_auditoria
  AFTER INSERT OR UPDATE OR DELETE ON factura_conceptos
  FOR EACH ROW EXECUTE FUNCTION app.fn_auditoria();

CREATE TRIGGER trg_auditoria
  AFTER INSERT OR UPDATE OR DELETE ON asignaciones
  FOR EACH ROW EXECUTE FUNCTION app.fn_auditoria();

CREATE TRIGGER trg_auditoria
  AFTER INSERT OR UPDATE OR DELETE ON movimientos_costo
  FOR EACH ROW EXECUTE FUNCTION app.fn_auditoria();

-- ============================================================
-- INVARIANTE: SUMA(asignaciones) <= importe del concepto
-- SECURITY DEFINER para poder leer factura_conceptos sin depender del contexto RLS
-- ============================================================
CREATE OR REPLACE FUNCTION app.fn_check_asignacion_importe()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_importe_concepto numeric(18,4);
  v_importe_asignado numeric(18,4);
BEGIN
  SELECT importe INTO v_importe_concepto
  FROM factura_conceptos
  WHERE id = NEW.factura_concepto_id;

  SELECT COALESCE(SUM(importe), 0) INTO v_importe_asignado
  FROM asignaciones
  WHERE factura_concepto_id = NEW.factura_concepto_id
    AND estado = 'autorizada'
    AND id IS DISTINCT FROM NEW.id;

  IF v_importe_asignado + NEW.importe > v_importe_concepto THEN
    RAISE EXCEPTION
      'Asignación excede el importe del concepto: asignado=% nuevo=% total_concepto=%',
      v_importe_asignado, NEW.importe, v_importe_concepto;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_asignacion_importe
  BEFORE INSERT OR UPDATE ON asignaciones
  FOR EACH ROW
  WHEN (NEW.estado = 'autorizada')
  EXECUTE FUNCTION app.fn_check_asignacion_importe();
