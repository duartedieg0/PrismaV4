import { expect, test } from "@playwright/test";
import {
  createAuthenticatedTestClient,
  hasAuthenticatedE2ECredentials,
  seedAuthenticatedTeacherContext,
} from "./helpers/auth-session";

test("extraction review shows warnings, accepts answers and returns to processing", async ({
  context,
  page,
  baseURL,
}) => {
  test.skip(!hasAuthenticatedE2ECredentials(), "Authenticated E2E credentials are not configured.");

  const seededSession = await seedAuthenticatedTeacherContext({
    context,
    baseURL: baseURL ?? "http://127.0.0.1:3000",
  });

  test.skip(
    !seededSession.authenticated,
    "Authenticated E2E session could not be created with the configured credentials.",
  );

  const authenticatedClient = await createAuthenticatedTestClient();

  test.skip(
    !authenticatedClient,
    "Authenticated Supabase test client could not be created with the configured credentials.",
  );

  const { supabase, user } = authenticatedClient;

  const [{ data: subject }, { data: gradeLevel }] = await Promise.all([
    supabase.from("subjects").select("id").limit(1).single(),
    supabase.from("grade_levels").select("id").limit(1).single(),
  ]);

  test.skip(!subject?.id || !gradeLevel?.id, "Missing subjects or grade levels in the seeded database.");

  const examInsert = await supabase
    .from("exams")
    .insert({
      user_id: user.id,
      subject_id: subject.id,
      grade_level_id: gradeLevel.id,
      topic: "Frações E2E",
      pdf_path: `${user.id}/e2e-extraction.pdf`,
      status: "awaiting_answers",
    })
    .select("id")
    .single();

  test.skip(!examInsert.data?.id, "Could not seed an exam for extraction review.");

  const examId = examInsert.data.id;

  await supabase.from("questions").insert([
    {
      exam_id: examId,
      order_num: 1,
      content: "Quanto é 2 + 2?",
      question_type: "objective",
      alternatives: [
        { label: "A", text: "3" },
        { label: "B", text: "4" },
      ],
      extraction_warning: "Alternativa C estava ilegível.",
    },
    {
      exam_id: examId,
      order_num: 2,
      content: "Explique o ciclo da água.",
      question_type: "essay",
      visual_elements: [
        { type: "diagram", description: "Esquema do ciclo da água." },
      ],
    },
  ]);

  await page.route(`**/api/exams/${examId}/answers`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
      }),
    });
  });

  await page.goto(`/exams/${examId}/extraction`);

  await expect(page.getByRole("heading", { level: 1, name: /revisão da extração/i })).toBeVisible();
  await expect(page.getByText(/alternativa c estava ilegível/i)).toBeVisible();
  await expect(page.getByText(/esquema do ciclo da água/i)).toBeVisible();

  await page.getByRole("radio", { name: /b 4/i }).check();
  await page.getByLabel(/resposta esperada da questão 2/i).fill(
    "Processo de evaporação e condensação.",
  );
  await page.getByRole("button", { name: /avançar para adaptação/i }).click();

  await expect(page).toHaveURL(new RegExp(`/exams/${examId}/processing$`));

  await supabase.from("exams").delete().eq("id", examId);
});
