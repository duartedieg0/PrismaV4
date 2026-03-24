import { expect, test } from "@playwright/test";

test("admin agent evolution page requires authentication", async ({ page }) => {
  await page.goto("/config/agents/agent-1/evolve");
  await expect(page).toHaveURL(/\/login$/);
});
