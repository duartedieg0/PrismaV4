-- ============================================================
-- Migration 00010: Admin user governance audit
-- Adds persistent audit trail for administrative user actions
-- ============================================================

CREATE TABLE public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (
    action IN ('user_blocked', 'user_unblocked', 'user_role_changed')
  ),
  previous_state jsonb NOT NULL,
  next_state jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_audit_logs_target_user_id
  ON public.admin_audit_logs(target_user_id, created_at DESC);

CREATE INDEX idx_admin_audit_logs_admin_user_id
  ON public.admin_audit_logs(admin_user_id, created_at DESC);

COMMENT ON TABLE public.admin_audit_logs IS
  'Persistent administrative audit trail for user governance actions.';

COMMENT ON COLUMN public.admin_audit_logs.previous_state IS
  'Snapshot of the user state before the administrative action.';

COMMENT ON COLUMN public.admin_audit_logs.next_state IS
  'Snapshot of the user state after the administrative action.';
