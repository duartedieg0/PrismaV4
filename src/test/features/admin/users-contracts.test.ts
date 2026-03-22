import { describe, expect, it } from "vitest";
import { preservedEntities, schemaBaseline } from "@/gateways/supabase/schema-baseline";

describe("admin user governance contracts", () => {
  it("extends the preserved schema with admin audit logs", () => {
    expect(preservedEntities).toContain("admin_audit_logs");
  });

  it("tracks the phase 10 migration in the schema baseline", () => {
    expect(schemaBaseline.migrationIds).toContain("00010_admin_user_audit");
  });
});
