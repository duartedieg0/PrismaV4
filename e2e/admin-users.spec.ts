import { expect, test } from "@playwright/test";

test("admin users page requires authentication", async ({ page }) => {
  await page.goto("/users");
  await expect(page).toHaveURL(/\/login$/);
});
