-- ============================================================
-- Migration 00007: Adapted Alternatives Support
-- Adds adapted_alternatives column to adaptations table
-- ============================================================

-- Add adapted_alternatives column to store adapted alternatives for multiple choice questions
alter table public.adaptations
  add column adapted_alternatives jsonb;

comment on column public.adaptations.adapted_alternatives is 
  'Array of adapted alternatives for multiple choice questions. Structure: [{id, originalText, adaptedText, isCorrect, position}]. Null for non-multiple-choice questions.';
