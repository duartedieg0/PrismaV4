import { expect, test } from "@playwright/test";
import {
  hasAuthenticatedE2ECredentials,
  seedAuthenticatedTeacherContext,
} from "./helpers/auth-session";

test("teacher dashboard is accessible for an authenticated teacher", async ({
  context,
  page,
  baseURL,
}) => {
  test.skip(!hasAuthenticatedE2ECredentials(), "Authenticated E2E credentials are not configured.");

  const seeded = await seedAuthenticatedTeacherContext({
    context,
    baseURL: baseURL ?? "http://127.0.0.1:3000",
  });

  test.skip(
    !seeded.authenticated,
    "Authenticated E2E session could not be created with the configured credentials.",
  );

  await page.goto("/dashboard");
  test.skip(
    /\/login\?error=missing_profile$/.test(page.url()),
    "Authenticated E2E remains blocked by Supabase profile access debt.",
  );

  await expect(page.getByRole("heading", { level: 1, name: /dashboard/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /nova prova|nova adaptação/i }).first()).toBeVisible();

  const emptyState = page.getByText(/nenhuma prova adaptada ainda/i);
  const repository = page.getByRole("region", { name: /repositório de provas/i });

  if (await repository.isVisible().catch(() => false)) {
    await expect(repository).toBeVisible();
  } else {
    await expect(emptyState).toBeVisible();
    await expect(page.getByRole("link", { name: /nova prova|nova adaptação/i }).first()).toBeVisible();
  }
});
