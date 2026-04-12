-- supabase/migrations/00017_exam_usage.sql

CREATE TABLE IF NOT EXISTS public.exam_usage (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id             UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  stage               TEXT NOT NULL CHECK (stage IN ('extraction', 'adaptation')),
  model_id            TEXT NOT NULL,
  input_tokens        INTEGER NOT NULL DEFAULT 0,
  output_tokens       INTEGER NOT NULL DEFAULT 0,
  estimated_cost_usd  NUMERIC(12,6) NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS exam_usage_exam_stage_idx
  ON public.exam_usage (exam_id, stage);

-- Acesso de leitura/escrita apenas para o service role (backend)
ALTER TABLE public.exam_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to exam_usage"
  ON public.exam_usage
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT ALL ON public.exam_usage TO service_role;
