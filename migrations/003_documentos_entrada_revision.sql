-- ============================================================
-- PRODGERS MVP — Migración 003: Columnas de revisión en documentos_entrada
-- ============================================================

ALTER TABLE documentos_entrada
  ADD COLUMN IF NOT EXISTS nota_revision TEXT,
  ADD COLUMN IF NOT EXISTS revisado_por  UUID REFERENCES usuarios(id),
  ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMPTZ NOT NULL DEFAULT now();
