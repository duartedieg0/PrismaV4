ALTER TABLE consultant_threads
  ADD COLUMN managed_session_id TEXT;

CREATE INDEX idx_consultant_threads_session
  ON consultant_threads (managed_session_id)
  WHERE managed_session_id IS NOT NULL;

COMMENT ON COLUMN consultant_threads.managed_session_id IS
  'ID da session no Claude Managed Agents API (sess_...)';
