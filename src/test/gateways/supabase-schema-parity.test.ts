import { describe, expect, it } from "vitest";
import { schemaBaseline } from "@/gateways/supabase/schema-baseline";

describe("supabase schema parity", () => {
  it("documents the Phase 4 baseline fields consumed by app code and fixtures", () => {
    expect(schemaBaseline.phase41Contracts).toEqual({
      profiles: [
        "id",
        "full_name",
        "email",
        "avatar_url",
        "role",
        "blocked",
        "created_at",
      ],
      subjects: ["id", "name", "enabled", "created_at"],
      gradeLevels: ["id", "name", "enabled", "created_at"],
      exams: [
        "id",
        "user_id",
        "subject_id",
        "grade_level_id",
        "topic",
        "pdf_path",
        "status",
        "error_message",
        "created_at",
        "updated_at",
      ],
    });
  });

  it("states the explicit compatibility migration that repairs legacy auth/profile drift", () => {
    expect(schemaBaseline.phase41CompatibilityMigration).toBe("00008_backfill_existing_profiles");
  });
});
