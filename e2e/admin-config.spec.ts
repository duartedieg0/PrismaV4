import { expect, test } from "@playwright/test";

test("admin config requires authentication", async ({ page }) => {
  await page.goto("/config");
  await expect(page).toHaveURL(/\/login$/);
});
