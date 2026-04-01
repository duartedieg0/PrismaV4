-- 00014: Consultant Threads
-- Tabela para metadata de threads de consulta com agentes de suporte.
-- Mensagens ficam no Mastra Memory (LibSQL). Esta tabela armazena
-- metadata para listagem, paginação e RLS.

CREATE TABLE IF NOT EXISTS consultant_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  agent_slug TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para listagem paginada
CREATE INDEX idx_consultant_threads_teacher_agent
  ON consultant_threads (teacher_id, agent_slug, updated_at DESC);

-- RLS
ALTER TABLE consultant_threads ENABLE ROW LEVEL SECURITY;

-- Professor só vê suas próprias threads
CREATE POLICY "Teachers can view own threads"
  ON consultant_threads FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid());

-- Professor pode criar threads para si mesmo
CREATE POLICY "Teachers can insert own threads"
  ON consultant_threads FOR INSERT
  TO authenticated
  WITH CHECK (teacher_id = auth.uid());

-- Professor pode atualizar suas próprias threads (título)
CREATE POLICY "Teachers can update own threads"
  ON consultant_threads FOR UPDATE
  TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- Professor pode deletar suas próprias threads
CREATE POLICY "Teachers can delete own threads"
  ON consultant_threads FOR DELETE
  TO authenticated
  USING (teacher_id = auth.uid());

-- Admin pode ver todas as threads (para observabilidade)
CREATE POLICY "Admins can view all threads"
  ON consultant_threads FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON consultant_threads TO authenticated;
GRANT ALL ON consultant_threads TO service_role;
