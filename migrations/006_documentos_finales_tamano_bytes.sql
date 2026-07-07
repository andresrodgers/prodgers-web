-- ============================================================
-- PRODGERS MVP — Migración 006: tamano_bytes en documentos_finales
-- El endpoint POST /api/documentos-finales inserta esta columna,
-- pero nunca se agregó a la tabla en el esquema inicial.
-- ============================================================

ALTER TABLE documentos_finales
  ADD COLUMN IF NOT EXISTS tamano_bytes INTEGER CHECK (tamano_bytes > 0);
