import { describe, expect, it } from "vitest";
import { schemaBaseline } from "@/gateways/supabase/schema-baseline";
import { preservedEntities } from "@/gateways/supabase/schema-baseline";

describe("admin contracts baseline", () => {
  it("keeps admin-governed entities in the preserved schema set", () => {
    expect(preservedEntities).toContain("ai_models");
    expect(preservedEntities).toContain("agents");
    expect(preservedEntities).toContain("supports");
    expect(preservedEntities).toContain("subjects");
    expect(preservedEntities).toContain("grade_levels");
  });

  it("includes the phase 9 governance migration in the repository baseline", () => {
    expect(schemaBaseline.migrationIds).toContain("00009_admin_configuration_governance");
  });
});
