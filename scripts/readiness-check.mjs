import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

export const requiredEnvKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_API_KEY",
];

export const optionalEnvKeys = [
  "E2E_SUPABASE_TEST_EMAIL",
  "E2E_SUPABASE_TEST_PASSWORD",
];

export const requiredReleaseDocs = [
  "docs/release/README.md",
  "docs/release/release-checklist.md",
  "docs/release/rollout-playbook.md",
  "docs/release/rollback-playbook.md",
  "docs/release/regression-matrix.md",
  "docs/release/user-testing-playbook.md",
];

function parseVersion(version) {
  return version.replace(/^v/, "").split(".").map((part) => Number(part));
}

export function isNodeVersionSatisfied(currentVersion, minimumVersion) {
  const current = parseVersion(currentVersion);
  const minimum = parseVersion(minimumVersion);

  for (let index = 0; index < Math.max(current.length, minimum.length); index += 1) {
    const left = current[index] ?? 0;
    const right = minimum[index] ?? 0;

    if (left > right) return true;
    if (left < right) return false;
  }

  return true;
}

export function readSchemaBaselineMigrationIds(projectRoot) {
  const filePath = path.join(projectRoot, "src/gateways/supabase/schema-baseline.ts");
  const source = readFileSync(filePath, "utf8");
  const match = source.match(/migrationIds:\s*\[([\s\S]*?)\]/);

  if (!match?.[1]) {
    throw new Error("Não foi possível ler migrationIds em schema-baseline.ts.");
  }

  return Array.from(match[1].matchAll(/"([^"]+)"/g), (result) => result[1]);
}

function readMinimumNodeVersion(projectRoot) {
  const packageJson = JSON.parse(
    readFileSync(path.join(projectRoot, "package.json"), "utf8"),
  );

  return String(packageJson.engines?.node ?? ">=22.13.0").replace(">=", "");
}

export function evaluateReadiness({
  projectRoot,
  env,
  nodeVersion,
}) {
  const minimumNodeVersion = readMinimumNodeVersion(projectRoot);
  const blockingFailures = [];
  const warnings = [];
  const checks = [];

  if (!isNodeVersionSatisfied(nodeVersion, minimumNodeVersion)) {
    blockingFailures.push(
      `Node ${nodeVersion} não atende ao mínimo ${minimumNodeVersion}.`,
    );
  } else {
    checks.push(`Node ${nodeVersion} compatível.`);
  }

  for (const key of requiredEnvKeys) {
    if (!env[key]) {
      blockingFailures.push(`Variável obrigatória ausente: ${key}.`);
    }
  }

  if (blockingFailures.length === 0) {
    checks.push("Variáveis obrigatórias presentes.");
  }

  for (const key of optionalEnvKeys) {
    if (!env[key]) {
      warnings.push(`Variável opcional ausente para E2E autenticado: ${key}.`);
    }
  }

  const migrationIds = readSchemaBaselineMigrationIds(projectRoot);
  for (const migrationId of migrationIds) {
    const migrationPath = path.join(projectRoot, `supabase/migrations/${migrationId}.sql`);
    if (!existsSync(migrationPath)) {
      blockingFailures.push(`Migration esperada ausente: ${migrationId}.sql`);
    }
  }

  if (!blockingFailures.some((item) => item.includes("Migration esperada ausente"))) {
    checks.push(`Baseline de migrations presente (${migrationIds.length} arquivos).`);
  }

  for (const relativePath of requiredReleaseDocs) {
    if (!existsSync(path.join(projectRoot, relativePath))) {
      blockingFailures.push(`Documento operacional ausente: ${relativePath}.`);
    }
  }

  if (!blockingFailures.some((item) => item.includes("Documento operacional ausente"))) {
    checks.push("Playbooks operacionais presentes.");
  }

  return {
    ok: blockingFailures.length === 0,
    minimumNodeVersion,
    migrationIds,
    blockingFailures,
    warnings,
    checks,
  };
}

function renderSection(title, items) {
  if (items.length === 0) {
    return `${title}\n- nenhum`;
  }

  return `${title}\n${items.map((item) => `- ${item}`).join("\n")}`;
}

const scriptPath = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === scriptPath;

if (isMainModule) {
  const projectRoot = path.resolve(path.dirname(scriptPath), "..");
  loadEnvConfig(projectRoot);

  const result = evaluateReadiness({
    projectRoot,
    env: process.env,
    nodeVersion: process.versions.node,
  });

  const output = [
    "PrismaV2 Readiness Check",
    "",
    renderSection("Checks", result.checks),
    "",
    renderSection("Warnings", result.warnings),
    "",
    renderSection("Blocking Failures", result.blockingFailures),
  ].join("\n");

  console.log(output);
  process.exit(result.ok ? 0 : 1);
}
