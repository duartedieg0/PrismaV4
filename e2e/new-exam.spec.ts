import { expect, test } from "@playwright/test";
import {
  hasAuthenticatedE2ECredentials,
  seedAuthenticatedTeacherContext,
} from "./helpers/auth-session";

test("new exam form shows validation errors and redirects on successful submission", async ({
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

  await page.route("**/api/exams", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        examId: "exam-e2e",
      }),
    });
  });

  await page.goto("/exams/new");
  test.skip(
    /\/login\?error=missing_profile$/.test(page.url()),
    "Authenticated E2E remains blocked by Supabase profile access debt.",
  );

  await page.getByRole("button", { name: /enviar para adaptação/i }).click();

  await expect(page.getByText(/selecione uma disciplina valida/i)).toBeVisible();
  await expect(page.getByText(/selecione um ano\/série valido/i)).toBeVisible();
  await expect(page.getByText(/selecione ao menos um apoio/i)).toBeVisible();
  await expect(page.getByText(/selecione um arquivo pdf/i)).toBeVisible();

  const subjectValues = await page.getByLabel("Disciplina").locator("option").evaluateAll(
    (options) =>
      options
        .map((option) => (option as HTMLOptionElement).value)
        .filter((value) => value.length > 0),
  );
  const gradeLevelValues = await page.getByLabel("Ano/Série").locator("option").evaluateAll(
    (options) =>
      options
        .map((option) => (option as HTMLOptionElement).value)
        .filter((value) => value.length > 0),
  );

  if (subjectValues[0]) {
    await page.getByLabel("Disciplina").selectOption(subjectValues[0]);
  }

  if (gradeLevelValues[0]) {
    await page.getByLabel("Ano/Série").selectOption(gradeLevelValues[0]);
  }

  await page.getByLabel("Tema").fill("Frações");
  await page.getByRole("checkbox").first().check();
  await page.getByLabel("Arquivo PDF").setInputFiles({
    name: "avaliacao.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("pdf"),
  });

  await page.getByRole("button", { name: /enviar para adaptação/i }).click();

  await expect(page).toHaveURL(/\/exams\/exam-e2e\/processing$/);
});
