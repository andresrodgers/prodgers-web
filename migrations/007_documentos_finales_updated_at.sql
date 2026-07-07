-- ============================================================
-- PRODGERS MVP — Migración 007: updated_at en documentos_finales
-- El endpoint PATCH /api/documentos-finales/[id] (marcar Disponible)
-- y el POST de subida actualizan esta columna, pero nunca se agregó
-- a la tabla en el esquema inicial.
-- ============================================================

ALTER TABLE documentos_finales
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
