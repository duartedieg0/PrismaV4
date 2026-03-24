# Redução de Alternativas na Adaptação — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow the adaptation agent to return fewer alternatives than the original question while guaranteeing the correct answer is always preserved.

**Architecture:** Change the agent's structured output from `string[]` to `Array<{ originalLabel, text }>` so the system knows which original alternative each adapted one maps to. The mapping function `mapAdaptedAlternatives` matches by label instead of by index, validates the correct answer is present, and assigns sequential positions. The prompt is updated to tell the agent it may reduce alternatives. Downstream layers (persistence, UI, copy) already handle variable-length arrays and require zero changes.

**Tech Stack:** TypeScript, Zod, Vitest, Mastra agents

---

## Impact Analysis

### MUST change (3 source files + 4 test files)

| File | What changes |
|------|-------------|
| `src/mastra/agents/analysis-agent-runners.ts` | Schema, `mapAdaptedAlternatives()` |
| `src/mastra/prompts/adaptation-prompt.ts` | Prompt version bump, format instructions |
| `src/mastra/workflows/analyze-and-adapt-workflow.ts` | Export + rewrite `parseAdaptationPayload()` fallback parser |
| `src/test/mastra/analysis-agent-runners.test.ts` | Mock format + new test cases |
| `src/test/mastra/analyze-and-adapt-workflow.test.ts` | Update `promptVersion` from `v1` to `v2` |
| `src/test/mastra/parse-adaptation-payload.test.ts` | **New file** — unit tests for `parseAdaptationPayload` |
| `src/test/features/exams/results/copyable-block.test.ts` | New test for 3-of-5 alternatives |

### NO changes needed (verified)

| File | Why it works already |
|------|---------------------|
| `src/domains/adaptations/contracts.ts` | `AdaptedAlternative[]` — no fixed length |
| `src/mastra/tools/persist-adaptations-tool.ts` | `z.array(schema).nullable()` — any length |
| `src/features/exams/results/copyable-block.ts` | `.map()` + dynamic labels `String.fromCharCode(97 + index)` |
| `src/features/exams/results/get-exam-result.ts` | Pass-through to `createCopyableBlock()` |
| `src/features/exams/results/contracts.ts` | View types use `AdaptedAlternative[] | null` |
| `src/features/exams/results/components/adaptation-result-card.tsx` | `.sort().map()` — length-agnostic |
| `supabase/migrations/*` | JSONB column — any shape |
| `e2e/exam-result.spec.ts` | Seeds 2 alternatives, stays valid |
| `src/test/features/exams/results/contracts.test.ts` | Uses 1 alternative — stays valid |
| `src/test/mastra/runtime-logger.test.ts:41` | Uses `"adaptation@v1"` as opaque fixture data, not imported from constant — won't break |
| `src/test/features/exams/extraction/submit-answers-route.test.ts:132` | Uses `"adaptation@v1"` as mock return value, not compared to constant — won't break |

---

## Task 1: Update Zod schema and `mapAdaptedAlternatives`

**Files:**
- Modify: `src/mastra/agents/analysis-agent-runners.ts:27-30` (schema) and `:36-53` (mapAdaptedAlternatives)
- Test: `src/test/mastra/analysis-agent-runners.test.ts`

### Step-by-step

- [ ] **Step 1: Write the failing test — reduced alternatives mapped by label**

Add this test to `src/test/mastra/analysis-agent-runners.test.ts` inside the existing `describe` block, after the last `it`:

```typescript
it("maps reduced alternatives by original label", async () => {
  const { runAdaptationAgent } = await import("@/mastra/agents/analysis-agent-runners");

  adaptationGenerate.mockResolvedValueOnce({
    object: {
      adaptedStatement: "Quanto é metade mais um quarto?",
      adaptedAlternatives: [
        { originalLabel: "A", text: "um terço" },
        { originalLabel: "C", text: "três quartos" },
      ],
    },
  });

  const result = await runAdaptationAgent({
    prompt: "Adapte a questão.",
    instructions: "Reduza alternativas.",
    model: {} as never,
    alternatives: [
      { label: "A", text: "1/3" },
      { label: "B", text: "2/3" },
      { label: "C", text: "3/4" },
      { label: "D", text: "1/4" },
    ],
    correctAnswer: "C",
  });

  expect(result).toEqual({
    adaptedContent: "Quanto é metade mais um quarto?",
    adaptedAlternatives: [
      {
        id: "alt-0",
        label: "A",
        originalText: "1/3",
        adaptedText: "um terço",
        isCorrect: false,
        position: 0,
      },
      {
        id: "alt-1",
        label: "C",
        originalText: "3/4",
        adaptedText: "três quartos",
        isCorrect: true,
        position: 1,
      },
    ],
  });
});
```

- [ ] **Step 2: Write the failing test — error when correct answer is removed**

Add this test right after the previous one:

```typescript
it("throws when the adapted alternatives do not include the correct answer", async () => {
  const { runAdaptationAgent } = await import("@/mastra/agents/analysis-agent-runners");

  adaptationGenerate.mockResolvedValueOnce({
    object: {
      adaptedStatement: "Quanto é metade mais um quarto?",
      adaptedAlternatives: [
        { originalLabel: "A", text: "um terço" },
        { originalLabel: "B", text: "dois terços" },
      ],
    },
  });

  await expect(
    runAdaptationAgent({
      prompt: "Adapte a questão.",
      instructions: "Reduza alternativas.",
      model: {} as never,
      alternatives: [
        { label: "A", text: "1/3" },
        { label: "B", text: "2/3" },
        { label: "C", text: "3/4" },
      ],
      correctAnswer: "C",
    }),
  ).rejects.toThrow("A alternativa correta (C) foi removida pelo agente de adaptação.");
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/test/mastra/analysis-agent-runners.test.ts`
Expected: 2 new tests FAIL (schema mismatch and missing function logic)

- [ ] **Step 4: Update the existing test to use the new object format**

In `src/test/mastra/analysis-agent-runners.test.ts`, replace the mock return in the existing test `"maps objective adaptations into the domain shape"` (line 71-75):

Replace:
```typescript
    adaptationGenerate.mockResolvedValueOnce({
      object: {
        adaptedStatement: "Quanto é metade mais um quarto?",
        adaptedAlternatives: ["um terço", "três quartos"],
      },
    });
```

With:
```typescript
    adaptationGenerate.mockResolvedValueOnce({
      object: {
        adaptedStatement: "Quanto é metade mais um quarto?",
        adaptedAlternatives: [
          { originalLabel: "A", text: "um terço" },
          { originalLabel: "B", text: "três quartos" },
        ],
      },
    });
```

- [ ] **Step 5: Implement the schema and mapping changes**

In `src/mastra/agents/analysis-agent-runners.ts`, replace lines 27-30 (`objectiveAdaptationSchema`) with:

```typescript
const adaptedAlternativeItemSchema = z.object({
  originalLabel: z.string().min(1),
  text: z.string().min(1),
});

const objectiveAdaptationSchema = z.object({
  adaptedStatement: z.string().min(1),
  adaptedAlternatives: z.array(adaptedAlternativeItemSchema).min(1),
});
```

**Important:** Do NOT touch lines 32-34 (`essayAdaptationSchema`) — it is still used by the essay branch of `runAdaptationAgent`.

Then replace lines 36-53 (`mapAdaptedAlternatives` function) with:

```typescript
function mapAdaptedAlternatives(
  alternatives: QuestionAlternative[],
  adaptedAlternatives: Array<{ originalLabel: string; text: string }>,
  correctAnswer: string | null,
): AdaptedAlternative[] {
  const originalsByLabel = new Map(
    alternatives.map((alt) => [alt.label, alt]),
  );

  const mapped = adaptedAlternatives.map((adapted, index) => {
    const original = originalsByLabel.get(adapted.originalLabel);
    return {
      id: `alt-${index}`,
      label: adapted.originalLabel,
      originalText: original?.text ?? "",
      adaptedText: adapted.text.trim(),
      isCorrect: correctAnswer === adapted.originalLabel,
      position: index,
    };
  });

  if (
    correctAnswer &&
    !mapped.some((alt) => alt.isCorrect)
  ) {
    throw new Error(
      `A alternativa correta (${correctAnswer}) foi removida pelo agente de adaptação.`,
    );
  }

  return mapped;
}
```

- [ ] **Step 6: Run all tests to verify they pass**

Run: `npx vitest run src/test/mastra/analysis-agent-runners.test.ts`
Expected: ALL 5 tests PASS

- [ ] **Step 7: Commit**

```bash
git add src/mastra/agents/analysis-agent-runners.ts src/test/mastra/analysis-agent-runners.test.ts
git commit -m "feat: allow reduced alternatives mapped by original label"
```

---

## Task 2: Update the adaptation prompt

**Files:**
- Modify: `src/mastra/prompts/adaptation-prompt.ts:3,51-62`

- [ ] **Step 1: Bump prompt version and update format instructions**

In `src/mastra/prompts/adaptation-prompt.ts`, replace line 3:

```typescript
export const ADAPTATION_PROMPT_VERSION = "adaptation@v1";
```

With:

```typescript
export const ADAPTATION_PROMPT_VERSION = "adaptation@v2";
```

Then replace lines 51-62 (the JSON format block and ATENÇÃO block):

```typescript
Retorne sua resposta no seguinte formato JSON (IMPORTANTE: use \\n para quebras de linha dentro das strings):
{
  "adaptedStatement": "texto do enunciado adaptado",
  "adaptedAlternatives": [
    {"originalLabel": "A", "text": "texto da alternativa a adaptada"},
    {"originalLabel": "B", "text": "texto da alternativa b adaptada"}
  ]
}

ATENÇÃO:
- Cada elemento de adaptedAlternatives deve conter "originalLabel" (a letra da alternativa original) e "text" (o texto adaptado)
- Cada "text" deve ser apenas o texto da alternativa, SEM os prefixos "a)", "b)", etc.
- Você PODE reduzir a quantidade de alternativas se isso for pedagogicamente adequado para o apoio ${supportName}
- Você NUNCA deve remover a alternativa correta (${correctAnswer ?? "Não informada"})
- Se reduzir, mantenha no mínimo 2 alternativas (incluindo a correta)
- Aplique o mesmo nível de adaptação tanto no enunciado quanto nas alternativas
- Use \\n para representar quebras de linha dentro das strings JSON (não use quebras de linha literais)`;
```

- [ ] **Step 2: Run existing tests to verify nothing breaks**

Run: `npx vitest run src/test/mastra`
Expected: ALL tests PASS (the prompt builder is tested indirectly through workflow and agent runner tests)

- [ ] **Step 3: Commit**

```bash
git add src/mastra/prompts/adaptation-prompt.ts
git commit -m "feat: update adaptation prompt to v2 with reduced alternatives format"
```

---

## Task 3: Export and rewrite `parseAdaptationPayload` with tests

**Files:**
- Modify: `src/mastra/workflows/analyze-and-adapt-workflow.ts:115-157`
- Create: `src/test/mastra/parse-adaptation-payload.test.ts`

`parseAdaptationPayload` is an internal fallback parser not currently called in the workflow (structured output handles the happy path). It must be updated for the new label-based format, exported for testability, and covered by unit tests.

- [ ] **Step 1: Write the failing tests for `parseAdaptationPayload`**

Create `src/test/mastra/parse-adaptation-payload.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { parseAdaptationPayload } from "@/mastra/workflows/analyze-and-adapt-workflow";

describe("parseAdaptationPayload", () => {
  it("returns plain text for essay questions (no alternatives)", () => {
    const result = parseAdaptationPayload(
      "  Texto adaptado da dissertativa.  ",
      null,
      null,
    );

    expect(result).toEqual({
      adaptedContent: "Texto adaptado da dissertativa.",
      adaptedAlternatives: null,
    });
  });

  it("parses label-based alternatives from clean JSON", () => {
    const json = JSON.stringify({
      adaptedStatement: "Quanto é metade mais um quarto?",
      adaptedAlternatives: [
        { originalLabel: "A", text: "um terço" },
        { originalLabel: "C", text: "três quartos" },
      ],
    });

    const result = parseAdaptationPayload(
      json,
      [
        { label: "A", text: "1/3" },
        { label: "B", text: "2/3" },
        { label: "C", text: "3/4" },
      ],
      "C",
    );

    expect(result).toEqual({
      adaptedContent: "Quanto é metade mais um quarto?",
      adaptedAlternatives: [
        {
          id: "alt-0",
          label: "A",
          originalText: "1/3",
          adaptedText: "um terço",
          isCorrect: false,
          position: 0,
        },
        {
          id: "alt-1",
          label: "C",
          originalText: "3/4",
          adaptedText: "três quartos",
          isCorrect: true,
          position: 1,
        },
      ],
    });
  });

  it("extracts JSON from markdown code blocks", () => {
    const text = 'Some preamble\n```json\n{"adaptedStatement": "Enunciado", "adaptedAlternatives": [{"originalLabel": "B", "text": "Adaptada B"}]}\n```';

    const result = parseAdaptationPayload(
      text,
      [
        { label: "A", text: "Original A" },
        { label: "B", text: "Original B" },
      ],
      "B",
    );

    expect(result.adaptedContent).toBe("Enunciado");
    expect(result.adaptedAlternatives).toHaveLength(1);
    expect(result.adaptedAlternatives![0]).toMatchObject({
      label: "B",
      originalText: "Original B",
      isCorrect: true,
    });
  });

  it("handles unknown originalLabel gracefully with empty originalText", () => {
    const json = JSON.stringify({
      adaptedStatement: "Enunciado",
      adaptedAlternatives: [
        { originalLabel: "Z", text: "alternativa fantasma" },
      ],
    });

    const result = parseAdaptationPayload(
      json,
      [{ label: "A", text: "Original A" }],
      "A",
    );

    expect(result.adaptedAlternatives![0]).toMatchObject({
      label: "Z",
      originalText: "",
      adaptedText: "alternativa fantasma",
      isCorrect: false,
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/test/mastra/parse-adaptation-payload.test.ts`
Expected: FAIL — `parseAdaptationPayload` is not exported.

- [ ] **Step 3: Export the function and update to new format**

In `src/mastra/workflows/analyze-and-adapt-workflow.ts`, replace lines 115-157 (the entire `parseAdaptationPayload` function):

```typescript
export function parseAdaptationPayload(
  text: string,
  alternatives: Array<{ label: string; text: string }> | null,
  correctAnswer: string | null,
): AdaptationAgentResult {
  if (!alternatives || alternatives.length === 0) {
    return {
      adaptedContent: text.trim(),
      adaptedAlternatives: null,
    };
  }

  let parsed: {
    adaptedStatement?: string;
    adaptedAlternatives?: Array<{ originalLabel: string; text: string }>;
  } | null = null;

  try {
    parsed = JSON.parse(text) as typeof parsed;
  } catch {
    const jsonMatch =
      text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ??
      text.match(/(\{[\s\S]*\})/);

    if (jsonMatch?.[1]) {
      parsed = JSON.parse(jsonMatch[1]) as typeof parsed;
    }
  }

  const originalsByLabel = new Map(
    alternatives.map((alt) => [alt.label, alt]),
  );

  const adaptedAlternatives = parsed?.adaptedAlternatives?.map((adapted, index) => ({
    id: `alt-${index}`,
    label: adapted.originalLabel,
    originalText: originalsByLabel.get(adapted.originalLabel)?.text ?? "",
    adaptedText: adapted.text?.trim() || "",
    isCorrect: correctAnswer === adapted.originalLabel,
    position: index,
  })) ?? null;

  return {
    adaptedContent: parsed?.adaptedStatement ?? text.trim(),
    adaptedAlternatives,
  };
}
```

Note: The only changes from the original are: (1) added `export` keyword, (2) changed `adaptedAlternatives` type from `string[]` to `Array<{ originalLabel: string; text: string }>`, (3) mapping uses `adapted.originalLabel` and `originalsByLabel` instead of index-based lookup.

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/test/mastra/parse-adaptation-payload.test.ts`
Expected: ALL 4 tests PASS

- [ ] **Step 5: Run workflow tests to ensure no regression**

Run: `npx vitest run src/test/mastra/analyze-and-adapt-workflow.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/mastra/workflows/analyze-and-adapt-workflow.ts src/test/mastra/parse-adaptation-payload.test.ts
git commit -m "refactor: export and rewrite parseAdaptationPayload with label-based format and tests"
```

---

## Task 4: Add copyable-block test for reduced alternatives

**Files:**
- Test: `src/test/features/exams/results/copyable-block.test.ts`

- [ ] **Step 1: Write the test for reduced alternatives**

Add this test inside the existing `describe("copyable block")` block, after the essay test:

```typescript
it("formats reduced alternatives with sequential labels and correct marker", () => {
  const block = createCopyableBlock({
    adaptedContent: "Quanto é metade mais um quarto?",
    questionType: "objective",
    adaptedAlternatives: [
      {
        id: "alt-0",
        label: "A",
        originalText: "1/3",
        adaptedText: "um terço",
        isCorrect: false,
        position: 0,
      },
      {
        id: "alt-1",
        label: "C",
        originalText: "3/4",
        adaptedText: "três quartos",
        isCorrect: true,
        position: 1,
      },
      {
        id: "alt-2",
        label: "E",
        originalText: "1/1",
        adaptedText: "um inteiro",
        isCorrect: false,
        position: 2,
      },
    ],
  });

  expect(block).toEqual({
    type: "objective",
    text: "Quanto é metade mais um quarto?\n\na) um terço\nb) três quartos ✓\nc) um inteiro",
  });
});
```

- [ ] **Step 2: Run the test**

Run: `npx vitest run src/test/features/exams/results/copyable-block.test.ts`
Expected: ALL tests PASS (the function already handles variable-length arrays — this test documents it)

- [ ] **Step 3: Commit**

```bash
git add src/test/features/exams/results/copyable-block.test.ts
git commit -m "test: add coverage for reduced alternatives in copyable block"
```

---

## Task 5: Update prompt version references and run full suite

Three test files contain hardcoded `"adaptation@v1"` strings:

| File | Line | Action |
|------|------|--------|
| `src/test/mastra/analyze-and-adapt-workflow.test.ts` | 109 | **MUST update** — asserts `promptVersion` composed from `ADAPTATION_PROMPT_VERSION`, will fail |
| `src/test/mastra/runtime-logger.test.ts` | 41 | No change — opaque fixture string, not derived from the constant |
| `src/test/features/exams/extraction/submit-answers-route.test.ts` | 132 | No change — mock return value, not compared to the constant |

- [ ] **Step 1: Update the workflow test**

In `src/test/mastra/analyze-and-adapt-workflow.test.ts`, line 109, replace:
```typescript
promptVersion: "adaptation@v1/agent-v3",
```
With:
```typescript
promptVersion: "adaptation@v2/agent-v3",
```

- [ ] **Step 2: Run the full test suite**

Run: `npx vitest run`
Expected: ALL tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/test/mastra/analyze-and-adapt-workflow.test.ts
git commit -m "chore: update prompt version to v2 in workflow test assertion"
```

---

## Summary

| Task | Files | Effort |
|------|-------|--------|
| 1. Schema + mapping | `analysis-agent-runners.ts` + test | Core change |
| 2. Prompt v2 | `adaptation-prompt.ts` | Prompt text |
| 3. Fallback parser + tests | `analyze-and-adapt-workflow.ts` + **new** test file | Export, rewrite, cover |
| 4. Copyable block test | `copyable-block.test.ts` | Coverage |
| 5. Version refs + suite | `analyze-and-adapt-workflow.test.ts` | Verification |

**Total source files changed:** 3
**Total test files changed:** 4 (3 modified + 1 new)
**Database migrations:** 0
**UI changes:** 0
