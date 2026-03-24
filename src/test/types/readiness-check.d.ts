declare module "../../../../scripts/readiness-check.mjs" {
  export const requiredEnvKeys: string[];
  export const optionalEnvKeys: string[];
  export const requiredReleaseDocs: string[];

  export function isNodeVersionSatisfied(
    currentVersion: string,
    minimumVersion: string,
  ): boolean;

  export function readSchemaBaselineMigrationIds(projectRoot: string): string[];

  export function evaluateReadiness(input: {
    projectRoot: string;
    env: Record<string, string | undefined>;
    nodeVersion: string;
  }): {
    ok: boolean;
    minimumNodeVersion: string;
    migrationIds: string[];
    blockingFailures: string[];
    warnings: string[];
    checks: string[];
  };
}
