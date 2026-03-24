import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "../../..");

describe("supabase filesystem baseline", () => {
  it("vendors the canonical migration set and seed file in the repository", () => {
    const expectedPaths = [
      "supabase/migrations/00001_initial_schema.sql",
      "supabase/migrations/00002_rls_policies.sql",
      "supabase/migrations/00003_triggers_and_indexes.sql",
      "supabase/migrations/00004_storage.sql",
      "supabase/migrations/00005_default_model.sql",
      "supabase/migrations/00006_feedback_dismissed.sql",
      "supabase/migrations/00007_adapted_alternatives.sql",
      "supabase/migrations/00008_backfill_existing_profiles.sql",
      "supabase/migrations/00009_admin_configuration_governance.sql",
      "supabase/migrations/00010_admin_user_audit.sql",
      "supabase/migrations/00011_agent_evolution_versioning.sql",
      "supabase/migrations/00012_grant_table_permissions.sql",
      "supabase/seed.sql",
    ];

    expect(
      expectedPaths.map((relativePath) => existsSync(path.join(projectRoot, relativePath))),
    ).toEqual([true, true, true, true, true, true, true, true, true, true, true, true, true]);
  });
});
