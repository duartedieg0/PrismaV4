import { describe, expect, it } from "vitest";
import {
  extensionReadyEntities,
  preservedEntities,
  schemaBaseline,
} from "@/gateways/supabase/schema-baseline";

describe("schema baseline", () => {
  it("preserves the current Prisma entities as the compatibility baseline", () => {
    expect(preservedEntities).toEqual([
      "profiles",
      "ai_models",
      "agents",
      "supports",
      "subjects",
      "grade_levels",
      "exams",
      "exam_supports",
      "questions",
      "adaptations",
      "feedbacks",
      "agent_evolutions",
      "admin_audit_logs",
    ]);
  });

  it("marks the workflow-sensitive entities as extension-ready", () => {
    expect(extensionReadyEntities).toEqual([
      "exams",
      "questions",
      "adaptations",
      "agent_evolutions",
    ]);
  });

  it("documents the baseline source migrations", () => {
    expect(schemaBaseline.migrationIds).toEqual([
      "00001_initial_schema",
      "00002_rls_policies",
      "00003_triggers_and_indexes",
      "00004_storage",
      "00005_default_model",
      "00006_feedback_dismissed",
      "00007_adapted_alternatives",
      "00008_backfill_existing_profiles",
      "00009_admin_configuration_governance",
      "00010_admin_user_audit",
      "00011_agent_evolution_versioning",
      "00012_grant_table_permissions",
    ]);
  });
});
