-- ============================================================
-- Migration 00013: Add error_message to adaptations
-- Captures the failure reason at the individual adaptation
-- level so errors can be diagnosed without server logs.
-- ============================================================

ALTER TABLE adaptations ADD COLUMN IF NOT EXISTS error_message TEXT;
