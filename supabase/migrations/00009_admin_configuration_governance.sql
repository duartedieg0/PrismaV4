-- ============================================================
-- Migration 00009: Admin configuration governance fields
-- Adds minimum operational metadata required by Phase 9
-- ============================================================

ALTER TABLE public.ai_models
  ADD COLUMN provider text NOT NULL DEFAULT 'openai',
  ADD COLUMN system_role text;

ALTER TABLE public.agents
  ADD COLUMN objective text,
  ADD COLUMN version integer NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.ai_models.provider IS
  'Provider identifier consumed by the runtime, e.g. openai.';

COMMENT ON COLUMN public.ai_models.system_role IS
  'Optional operational role for admin governance, e.g. extraction, adaptation or evolution.';

COMMENT ON COLUMN public.agents.objective IS
  'Operational objective that explains when this agent should be used.';

COMMENT ON COLUMN public.agents.version IS
  'Monotonic version of the current prompt configuration.';
