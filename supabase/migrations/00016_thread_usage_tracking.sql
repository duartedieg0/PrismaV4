-- 00016: Thread Usage Tracking
-- Adiciona rastreamento cumulativo de tokens e custo estimado por thread.
-- Os valores são atualizados em background após cada mensagem via syncSessionUsage().

ALTER TABLE consultant_threads
  ADD COLUMN total_input_tokens INTEGER DEFAULT 0,
  ADD COLUMN total_output_tokens INTEGER DEFAULT 0,
  ADD COLUMN total_cache_read_tokens INTEGER DEFAULT 0,
  ADD COLUMN total_cache_creation_tokens INTEGER DEFAULT 0,
  ADD COLUMN estimated_cost_usd NUMERIC(10,6) DEFAULT 0,
  ADD COLUMN last_usage_sync_at TIMESTAMPTZ;
