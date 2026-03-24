import { describe, expect, it } from "vitest";
import {
  createAdaptationWorkflowInput,
} from "@/mastra/contracts/adaptation-contracts";
import {
  createExtractionWorkflowInput,
  createExtractionWorkflowFailure,
  createExtractionWorkflowSuccess,
} from "@/mastra/contracts/extraction-contracts";
import {
  createRuntimeExecutionMetadata,
  createRuntimeFailure,
} from "@/mastra/contracts/runtime-contracts";

describe("mastra runtime contracts", () => {
  it("creates stable execution metadata with normalized correlation data", () => {
    const metadata = createRuntimeExecutionMetadata({
      correlationId: " exam:phase7 ",
      examId: "exam-1",
      stage: "extraction",
      model: "openai/gpt-5.4",
      agentId: "extraction-agent",
      promptVersion: "extraction@v1",
    });

    expect(metadata).toMatchObject({
      correlationId: expect.any(String),
      examId: "exam-1",
      stage: "extraction",
      model: "openai/gpt-5.4",
      agentId: "extraction-agent",
      promptVersion: "extraction@v1",
    });
    expect(metadata.traceId).toEqual(expect.any(String));
    expect(metadata.startedAt).toEqual(expect.any(String));
  });

  it("creates stable failure payloads for workflow and runtime layers", () => {
    const runtimeFailure = createRuntimeFailure({
      stage: "adaptation",
      code: "MODEL_DISABLED",
      message: "O modelo configurado para o apoio está desabilitado.",
      retryable: false,
    });
    const workflowFailure = createExtractionWorkflowFailure({
      metadata: createRuntimeExecutionMetadata({
        correlationId: "phase7",
        examId: "exam-2",
        stage: "extraction",
        model: "openai/gpt-5.4",
        agentId: "extraction-agent",
        promptVersion: "extraction@v1",
      }),
      failure: runtimeFailure,
      status: "error",
    });

    expect(runtimeFailure.code).toBe("MODEL_DISABLED");
    expect(workflowFailure.outcome).toBe("error");
    expect(workflowFailure.failure.retryable).toBe(false);
    expect(workflowFailure.status).toBe("error");
  });

  it("creates extraction and adaptation workflow payloads with explicit metadata", () => {
    const extractionInput = createExtractionWorkflowInput({
      examId: "exam-3",
      initiatedBy: "teacher-1",
      pdfPath: "teacher-1/exam-3.pdf",
      correlationId: "phase7-extraction",
    });
    const adaptationInput = createAdaptationWorkflowInput({
      examId: "exam-3",
      initiatedBy: "teacher-1",
      questionIds: ["question-1"],
      supportIds: ["support-1"],
      correlationId: "phase7-adaptation",
    });
    const extractionSuccess = createExtractionWorkflowSuccess({
      metadata: createRuntimeExecutionMetadata({
        correlationId: "phase7-extraction",
        examId: "exam-3",
        stage: "extraction",
        model: "openai/gpt-5.4",
        agentId: "extraction-agent",
        promptVersion: "extraction@v1",
      }),
      status: "awaiting_answers",
      warnings: ["Questão 2 com imagem parcial."],
      questionsCount: 4,
    });

    expect(extractionInput.examId).toBe("exam-3");
    expect(adaptationInput.supportIds).toEqual(["support-1"]);
    expect(extractionSuccess.questionsCount).toBe(4);
    expect(extractionSuccess.status).toBe("awaiting_answers");
  });
});
