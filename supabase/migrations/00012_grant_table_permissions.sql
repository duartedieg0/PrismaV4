-- ============================================================
-- Migration 00012: Grant table-level permissions
-- Grants SELECT/INSERT/UPDATE/DELETE to authenticated and
-- service_role roles so that RLS policies can take effect.
-- Without these GRANTs, PostgreSQL denies access before RLS
-- is even evaluated ("permission denied for table ...").
-- ============================================================

-- -------------------------------------------------------
-- 1. profiles
-- -------------------------------------------------------
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- -------------------------------------------------------
-- 2. ai_models
-- -------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_models TO authenticated;
GRANT ALL ON public.ai_models TO service_role;

-- -------------------------------------------------------
-- 3. agents
-- -------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agents TO authenticated;
GRANT ALL ON public.agents TO service_role;

-- -------------------------------------------------------
-- 4. supports
-- -------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supports TO authenticated;
GRANT ALL ON public.supports TO service_role;

-- -------------------------------------------------------
-- 5. subjects
-- -------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subjects TO authenticated;
GRANT ALL ON public.subjects TO service_role;

-- -------------------------------------------------------
-- 6. grade_levels
-- -------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.grade_levels TO authenticated;
GRANT ALL ON public.grade_levels TO service_role;

-- -------------------------------------------------------
-- 7. exams
-- -------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exams TO authenticated;
GRANT ALL ON public.exams TO service_role;

-- -------------------------------------------------------
-- 8. exam_supports
-- -------------------------------------------------------
GRANT SELECT, INSERT, DELETE ON public.exam_supports TO authenticated;
GRANT ALL ON public.exam_supports TO service_role;

-- -------------------------------------------------------
-- 9. questions
-- -------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;

-- -------------------------------------------------------
-- 10. adaptations
-- -------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.adaptations TO authenticated;
GRANT ALL ON public.adaptations TO service_role;

-- -------------------------------------------------------
-- 11. feedbacks
-- -------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedbacks TO authenticated;
GRANT ALL ON public.feedbacks TO service_role;

-- -------------------------------------------------------
-- 12. agent_evolutions
-- -------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_evolutions TO authenticated;
GRANT ALL ON public.agent_evolutions TO service_role;

-- -------------------------------------------------------
-- 13. admin_audit_logs
-- -------------------------------------------------------
GRANT SELECT, INSERT ON public.admin_audit_logs TO authenticated;
GRANT ALL ON public.admin_audit_logs TO service_role;
