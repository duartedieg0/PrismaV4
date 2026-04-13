ALTER TABLE public.ai_models
  ADD COLUMN input_price_per_million          NUMERIC(10,6) DEFAULT NULL,
  ADD COLUMN output_price_per_million         NUMERIC(10,6) DEFAULT NULL,
  ADD COLUMN cache_read_price_per_million     NUMERIC(10,6) DEFAULT NULL,
  ADD COLUMN cache_creation_price_per_million NUMERIC(10,6) DEFAULT NULL;
