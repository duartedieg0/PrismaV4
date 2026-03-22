import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "../../../..");

describe("release docs", () => {
  it("vendors the operational release playbooks", () => {
    const expected = [
      "docs/release/README.md",
      "docs/release/release-checklist.md",
      "docs/release/rollout-playbook.md",
      "docs/release/rollback-playbook.md",
      "docs/release/regression-matrix.md",
      "docs/release/user-testing-playbook.md",
    ];

    expect(expected.every((relativePath) => existsSync(path.join(projectRoot, relativePath)))).toBe(true);
  });

  it("documents rollout, rollback and user-testing explicitly", () => {
    const rollout = readFileSync(path.join(projectRoot, "docs/release/rollout-playbook.md"), "utf8");
    const rollback = readFileSync(path.join(projectRoot, "docs/release/rollback-playbook.md"), "utf8");
    const userTesting = readFileSync(path.join(projectRoot, "docs/release/user-testing-playbook.md"), "utf8");

    expect(rollout).toMatch(/rollout/i);
    expect(rollback).toMatch(/rollback/i);
    expect(userTesting).toMatch(/usuár/i);
  });
});
