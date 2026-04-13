-- Popula os preços dos modelos Anthropic já cadastrados.
-- Se o model_id não existir no banco, o UPDATE é no-op silencioso.
UPDATE public.ai_models SET
  input_price_per_million          = 0.80,
  output_price_per_million         = 4.00,
  cache_read_price_per_million     = 0.08,
  cache_creation_price_per_million = 1.00
WHERE model_id = 'claude-sonnet-4-6';

UPDATE public.ai_models SET
  input_price_per_million          = 0.08,
  output_price_per_million         = 0.40,
  cache_read_price_per_million     = 0.008,
  cache_creation_price_per_million = 0.10
WHERE model_id = 'claude-haiku-4-5';

UPDATE public.ai_models SET
  input_price_per_million          = 15.00,
  output_price_per_million         = 75.00,
  cache_read_price_per_million     = 1.50,
  cache_creation_price_per_million = 18.75
WHERE model_id = 'claude-opus-4-6';
