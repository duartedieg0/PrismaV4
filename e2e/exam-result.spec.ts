import { expect, test } from "@playwright/test";
import {
  createAuthenticatedTestClient,
  hasAuthenticatedE2ECredentials,
  seedAuthenticatedTeacherContext,
} from "./helpers/auth-session";

test("completed exam result shows adaptation, allows copy and persists feedback", async ({
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

  const [{ data: subject }, { data: gradeLevel }, { data: support }] = await Promise.all([
    supabase.from("subjects").select("id, name").limit(1).single(),
    supabase.from("grade_levels").select("id, name").limit(1).single(),
    supabase.from("supports").select("id, name").limit(1).single(),
  ]);

  test.skip(
    !subject?.id || !gradeLevel?.id || !support?.id,
    "Missing subjects, grade levels or supports in the seeded database.",
  );

  const examInsert = await supabase
    .from("exams")
    .insert({
      user_id: user.id,
      subject_id: subject.id,
      grade_level_id: gradeLevel.id,
      topic: "Resultado E2E",
      pdf_path: `${user.id}/e2e-result.pdf`,
      status: "completed",
    })
    .select("id")
    .single();

  test.skip(!examInsert.data?.id, "Could not seed an exam for result review.");

  const examId = examInsert.data.id;

  await supabase.from("exam_supports").insert({
    exam_id: examId,
    support_id: support.id,
  });

  const questionInsert = await supabase
    .from("questions")
    .insert({
      exam_id: examId,
      order_num: 1,
      content: "Quanto é 2 + 2?",
      question_type: "objective",
      alternatives: [
        { label: "A", text: "3" },
        { label: "B", text: "4" },
      ],
      correct_answer: "B",
    })
    .select("id")
    .single();

  test.skip(!questionInsert.data?.id, "Could not seed a question for result review.");

  const adaptationInsert = await supabase
    .from("adaptations")
    .insert({
      question_id: questionInsert.data.id,
      support_id: support.id,
      adapted_content: "Quanto é dois mais dois? Marque a opção correta.",
      adapted_alternatives: [
        {
          id: "alt-a",
          label: "A",
          originalText: "3",
          adaptedText: "Três",
          isCorrect: false,
          position: 1,
        },
        {
          id: "alt-b",
          label: "B",
          originalText: "4",
          adaptedText: "Quatro",
          isCorrect: true,
          position: 2,
        },
      ],
      bncc_skills: ["EF02MA03"],
      bloom_level: "Compreender",
      bncc_analysis: "Habilidade compatível com adição simples.",
      bloom_analysis: "Exige compreensão básica da operação.",
      status: "completed",
    })
    .select("id")
    .single();

  test.skip(!adaptationInsert.data?.id, "Could not seed an adaptation for result review.");

  await page.addInitScript(() => {
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          (window as Window & { __copiedText?: string }).__copiedText = text;
        },
      },
    });
  });

  try {
    await page.goto(`/exams/${examId}/result`);
    test.skip(
      /\/login\?error=missing_profile$/.test(page.url()),
      "Authenticated E2E remains blocked by Supabase profile access debt.",
    );

    await expect(page.getByRole("heading", { level: 1, name: /resultado da adaptação/i })).toBeVisible();
    await expect(page.getByText(subject.name)).toBeVisible();
    await expect(page.getByText(/quanto é dois mais dois\?/i)).toBeVisible();
    await expect(page.getByRole("tab", { name: support.name })).toBeVisible();
    await expect(page.getByText(/ef02ma03/i)).toBeVisible();
    await expect(page.getByText(/compreender/i)).toBeVisible();

    await page.getByRole("button", { name: /copiar adaptação/i }).click();

    await expect(page.getByText(/conteúdo copiado\./i)).toBeVisible();

    const copiedText = await page.evaluate(
      () => (window as Window & { __copiedText?: string }).__copiedText,
    );

    expect(copiedText).toContain("Quanto é dois mais dois?");
    expect(copiedText).toContain("a) Três");
    expect(copiedText).toContain("b) Quatro ✓");

    await page.getByRole("radio", { name: /5 estrelas/i }).check();
    await page.getByLabel("Comentário").fill("Adaptação clara e pronta para uso.");
    await page.getByRole("button", { name: /enviar feedback/i }).click();

    await expect(page.getByText(/feedback salvo\./i)).toBeVisible();

    const { data: feedback } = await supabase
      .from("feedbacks")
      .select("rating, comment")
      .eq("adaptation_id", adaptationInsert.data.id)
      .maybeSingle();

    expect(feedback?.rating).toBe(5);
    expect(feedback?.comment).toBe("Adaptação clara e pronta para uso.");
  } finally {
    await supabase.from("exams").delete().eq("id", examId);
  }
});
