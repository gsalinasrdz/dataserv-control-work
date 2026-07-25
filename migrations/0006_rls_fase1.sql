-- Migración 0006: RLS, permisos y auditoría para tablas de Fase 1
-- Ejecutar como opscore_owner DESPUÉS de:
--   1. npm run migrate (DDL 0005 — crea las tablas)
--   2. 0003_auditoria.sql (crea fn_auditoria que este archivo referencia)

-- ============================================================
-- PERMISOS app_user
-- ============================================================
GRANT SELECT, INSERT, UPDATE ON proyectos   TO app_user;
GRANT SELECT, INSERT, UPDATE ON frentes     TO app_user;
GRANT SELECT, INSERT, UPDATE ON trabajos    TO app_user;
GRANT SELECT, INSERT, UPDATE ON proveedores TO app_user;
GRANT SELECT, INSERT, UPDATE ON materiales  TO app_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
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

-- Políticas SELECT/UPDATE/DELETE (USING filtra filas visibles)
CREATE POLICY org_isolation ON proyectos
  USING (organizacion_id = app.organizacion_actual());
CREATE POLICY org_isolation ON frentes
  USING (organizacion_id = app.organizacion_actual());
CREATE POLICY org_isolation ON trabajos
  USING (organizacion_id = app.organizacion_actual());
CREATE POLICY org_isolation ON proveedores
  USING (organizacion_id = app.organizacion_actual());
CREATE POLICY org_isolation ON materiales
  USING (organizacion_id = app.organizacion_actual());

-- Políticas INSERT (WITH CHECK valida filas al insertar)
CREATE POLICY org_isolation_insert ON proyectos
  FOR INSERT WITH CHECK (organizacion_id = app.organizacion_actual());
CREATE POLICY org_isolation_insert ON frentes
  FOR INSERT WITH CHECK (organizacion_id = app.organizacion_actual());
CREATE POLICY org_isolation_insert ON trabajos
  FOR INSERT WITH CHECK (organizacion_id = app.organizacion_actual());
CREATE POLICY org_isolation_insert ON proveedores
  FOR INSERT WITH CHECK (organizacion_id = app.organizacion_actual());
CREATE POLICY org_isolation_insert ON materiales
  FOR INSERT WITH CHECK (organizacion_id = app.organizacion_actual());

-- ============================================================
-- AUDITORÍA (reutiliza fn_auditoria de 0003_auditoria.sql)
-- ============================================================
CREATE TRIGGER trg_auditoria
  AFTER INSERT OR UPDATE OR DELETE ON proyectos
  FOR EACH ROW EXECUTE FUNCTION app.fn_auditoria();

CREATE TRIGGER trg_auditoria
  AFTER INSERT OR UPDATE OR DELETE ON frentes
  FOR EACH ROW EXECUTE FUNCTION app.fn_auditoria();

CREATE TRIGGER trg_auditoria
  AFTER INSERT OR UPDATE OR DELETE ON trabajos
  FOR EACH ROW EXECUTE FUNCTION app.fn_auditoria();

CREATE TRIGGER trg_auditoria
  AFTER INSERT OR UPDATE OR DELETE ON proveedores
  FOR EACH ROW EXECUTE FUNCTION app.fn_auditoria();

CREATE TRIGGER trg_auditoria
  AFTER INSERT OR UPDATE OR DELETE ON materiales
  FOR EACH ROW EXECUTE FUNCTION app.fn_auditoria();

-- ============================================================
-- ÍNDICES ADICIONALES
-- ============================================================
-- RFC único por org solo cuando no es NULL (proveedores pueden no tener RFC)
CREATE UNIQUE INDEX proveedores_rfc_org_nn ON proveedores (rfc, organizacion_id)
  WHERE rfc IS NOT NULL;
