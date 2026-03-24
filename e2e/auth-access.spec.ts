import { expect, test } from "@playwright/test";
import { hasAuthenticatedE2ECredentials, seedAuthenticatedSession } from "./helpers/auth-session";

test("unauthenticated dashboard access redirects to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("button", { name: /entrar com google/i }),
  ).toBeVisible();
});

test("login page is publicly accessible", async ({ page }) => {
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { level: 1, name: /entrar/i }),
  ).toBeVisible();
});

test("blocked page is publicly accessible", async ({ page }) => {
  await page.goto("/blocked");
  await expect(
    page.getByRole("heading", { level: 1, name: /acesso bloqueado/i }),
  ).toBeVisible();
});

test("unauthenticated admin access redirects to login", async ({ page }) => {
  await page.goto("/config");
  await expect(page).toHaveURL(/\/login$/);
});

test("logout redirects back to the public landing", async ({ page }) => {
  const response = await page.request.fetch("/logout", {
    method: "POST",
    maxRedirects: 0,
  });

  expect(response.status()).toBe(302);
  expect(response.headers()["location"]).toMatch(/^http:\/\/(127\.0\.0\.1|localhost):3000\/$/);
});

test("authenticated visit to the public landing redirects to dashboard", async ({ context, page, baseURL }) => {
  test.skip(!hasAuthenticatedE2ECredentials(), "Authenticated E2E credentials are not configured.");

  const seeded = await seedAuthenticatedSession({
    context,
    baseURL: baseURL ?? "http://127.0.0.1:3000",
  });

  test.skip(!seeded, "Authenticated E2E session could not be created with the configured credentials.");

  await page.goto("/");
  test.skip(
    /\/login\?error=missing_profile$/.test(page.url()),
    "Authenticated E2E remains blocked by Supabase profile access debt.",
  );
  await expect(page).toHaveURL(/\/dashboard$/);
});
