import { expect, test } from "@playwright/test";
import { finalCta, hero } from "@/features/public-experience/content";

test("public landing shell renders", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: hero.title }),
  ).toBeVisible();
  await expect(page.getByRole("region", { name: /como funciona/i })).toBeVisible();
  await expect(page.getByRole("link", { name: finalCta.label })).toBeVisible();
});
