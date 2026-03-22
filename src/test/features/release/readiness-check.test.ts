import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "../../../..");
const readinessModuleUrl = pathToFileURL(
  path.join(projectRoot, "scripts/readiness-check.mjs"),
).href;

describe("readiness check", () => {
  it("accepts the repository baseline node version", async () => {
    const { isNodeVersionSatisfied } = await import(readinessModuleUrl);

    expect(isNodeVersionSatisfied("22.22.1", "22.13.0")).toBe(true);
    expect(isNodeVersionSatisfied("20.10.0", "22.13.0")).toBe(false);
  });

  it("reads the migration baseline from the repository contract", async () => {
    const { readSchemaBaselineMigrationIds } = await import(readinessModuleUrl);
    const migrations = readSchemaBaselineMigrationIds(projectRoot);

    expect(migrations).toContain("00011_agent_evolution_versioning");
    expect(migrations[0]).toBe("00001_initial_schema");
  });

  it("reports blocking failures for missing required env vars", async () => {
    const { evaluateReadiness, requiredEnvKeys } = await import(readinessModuleUrl);
    const result = evaluateReadiness({
      projectRoot,
      env: {},
      nodeVersion: "22.22.1",
    });

    expect(result.ok).toBe(false);
    expect(result.blockingFailures.join(" ")).toContain(requiredEnvKeys[0]);
  });

  it("keeps authenticated e2e credentials as warnings instead of blockers", async () => {
    const { evaluateReadiness } = await import(readinessModuleUrl);
    const result = evaluateReadiness({
      projectRoot,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_x",
        SUPABASE_SECRET_API_KEY: "sb_secret_x",
      },
      nodeVersion: "22.22.1",
    });

    expect(result.blockingFailures).toHaveLength(0);
    expect(result.warnings.join(" ")).toContain("E2E_SUPABASE_TEST_EMAIL");
  });
});
