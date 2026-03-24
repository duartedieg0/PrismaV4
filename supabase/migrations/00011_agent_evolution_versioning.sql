-- ============================================================
-- Migration 00011: Agent evolution versioning and adaptation traceability
-- Adds explicit version metadata for accepted evolutions and future adaptations
-- ============================================================

ALTER TABLE public.agent_evolutions
  ADD COLUMN model_id uuid references public.ai_models(id),
  ADD COLUMN prompt_version text NOT NULL DEFAULT 'evolution@v1',
  ADD COLUMN current_version integer,
  ADD COLUMN suggested_version integer,
  ADD COLUMN accepted_version integer,
  ADD COLUMN initiated_by uuid references public.profiles(id),
  ADD COLUMN resolved_at timestamptz;

ALTER TABLE public.adaptations
  ADD COLUMN agent_version integer,
  ADD COLUMN prompt_version text;

COMMENT ON COLUMN public.agent_evolutions.model_id IS
  'Model used by the evolution workflow to generate the suggestion.';

COMMENT ON COLUMN public.agent_evolutions.prompt_version IS
  'Version of the evolution prompt module used when generating the suggestion.';

COMMENT ON COLUMN public.agent_evolutions.current_version IS
  'Agent version active when the suggestion was generated.';

COMMENT ON COLUMN public.agent_evolutions.suggested_version IS
  'Version that would become active if the suggestion is accepted.';

COMMENT ON COLUMN public.agent_evolutions.accepted_version IS
  'Version effectively promoted after acceptance, when applicable.';

COMMENT ON COLUMN public.agent_evolutions.initiated_by IS
  'Admin profile responsible for starting the evolution workflow.';

COMMENT ON COLUMN public.agent_evolutions.resolved_at IS
  'Timestamp when the suggestion was explicitly accepted or rejected.';

COMMENT ON COLUMN public.adaptations.agent_version IS
  'Version of the agent prompt active when the adaptation was generated.';

COMMENT ON COLUMN public.adaptations.prompt_version IS
  'Prompt/runtime version associated with the generated adaptation.';
