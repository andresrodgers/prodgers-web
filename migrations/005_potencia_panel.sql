-- ============================================================
-- PRODGERS MVP — Migración 005: Potencia de panel (Wp)
-- ============================================================

ALTER TABLE expedientes
  ADD COLUMN IF NOT EXISTS potencia_panel_wp NUMERIC(8,2)
    CHECK (potencia_panel_wp IS NULL OR potencia_panel_wp > 0);
