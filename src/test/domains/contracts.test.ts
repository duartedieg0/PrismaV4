import { describe, expect, it } from "vitest";

import {
  ADAPTATION_STATUSES,
  DEFAULT_ADAPTATION_STATUS,
  getDefaultAdaptationStatus,
  type AdaptationStatus,
  DEFAULT_USER_ROLE,
  getDefaultUserRole,
  isUserRole,
  USER_ROLES,
  type UserRole,
} from "@/domains";
import {
  DEFAULT_EXAM_STATUS,
  DEFAULT_QUESTION_TYPE,
  EXAM_STATUSES,
  QUESTION_TYPES,
  getDefaultExamStatus,
  getDefaultQuestionType,
  type ExamStatus,
  type QuestionType,
  getExamRoute,
  getExamStatusDisplay,
} from "@/domains/exams/contracts";
import {
  DEFAULT_OBSERVABLE_EVENT_CATEGORY,
  DEFAULT_PRODUCT_ERROR_CATEGORY,
  OBSERVABLE_EVENTS,
  OBSERVABLE_EVENT_CATEGORIES,
  PRODUCT_ERROR_CATEGORIES,
  getDefaultObservableEventCategory,
  getDefaultProductErrorCategory,
  type ObservableEventCategory,
  type ProductErrorCategory,
} from "@/domains";
import {
  createCorrelationId,
  normalizeCorrelationId,
} from "@/services/runtime/correlation-id";
import {
  createRequestContext,
  toLogSafeMetadata,
  type RequestContext,
} from "@/services/runtime/request-context";

describe("domain contracts", () => {
  it("formalizes auth roles and defaults", () => {
    const roles = [...USER_ROLES];
    const role: UserRole = DEFAULT_USER_ROLE;

    expect(roles).toEqual(["teacher", "admin"]);
    expect(role).toBe("teacher");
    expect(DEFAULT_USER_ROLE).toBe("teacher");
    expect(getDefaultUserRole()).toBe("teacher");
    expect(isUserRole("teacher")).toBe(true);
    expect(isUserRole("blocked")).toBe(false);
  });

  it("formalizes exam status, question type, and adaptation status contracts", () => {
    const examStatuses = [...EXAM_STATUSES];
    const questionTypes = [...QUESTION_TYPES];
    const adaptationStatuses = [...ADAPTATION_STATUSES];
    const examStatus: ExamStatus = DEFAULT_EXAM_STATUS;
    const questionType: QuestionType = DEFAULT_QUESTION_TYPE;
    const adaptationStatus: AdaptationStatus = DEFAULT_ADAPTATION_STATUS;

    expect(examStatuses).toEqual([
      "uploading",
      "extracting",
      "awaiting_answers",
      "analyzing",
      "completed",
      "error",
    ]);
    expect(questionTypes).toEqual(["objective", "essay"]);
    expect(adaptationStatuses).toEqual([
      "pending",
      "processing",
      "completed",
      "error",
    ]);
    expect(examStatus).toBe("uploading");
    expect(questionType).toBe("objective");
    expect(adaptationStatus).toBe("pending");
    expect(DEFAULT_EXAM_STATUS).toBe("uploading");
    expect(DEFAULT_QUESTION_TYPE).toBe("objective");
    expect(DEFAULT_ADAPTATION_STATUS).toBe("pending");
    expect(getDefaultExamStatus()).toBe("uploading");
    expect(getDefaultQuestionType()).toBe("objective");
    expect(getDefaultAdaptationStatus()).toBe("pending");
  });

  it("formalizes display helpers for exam status", () => {
    expect(getExamStatusDisplay("uploading")).toEqual({
      label: "Processando",
      variant: "secondary",
    });
    expect(getExamStatusDisplay("awaiting_answers")).toEqual({
      label: "Aguardando respostas",
      variant: "outline",
    });
    expect(getExamStatusDisplay("completed")).toEqual({
      label: "Concluído",
      variant: "default",
    });
    expect(getExamRoute("exam-123", "awaiting_answers")).toBe(
      "/exams/exam-123/extraction",
    );
    expect(getExamRoute("exam-123", "completed")).toBe(
      "/exams/exam-123/result",
    );
    expect(getExamRoute("exam-123", "error")).toBe(
      "/exams/exam-123/processing",
    );
  });

  it("formalizes product error and observability categories", () => {
    const productErrorCategories = [...PRODUCT_ERROR_CATEGORIES];
    const observableEventCategories = [...OBSERVABLE_EVENT_CATEGORIES];
    const productErrorCategory: ProductErrorCategory = DEFAULT_PRODUCT_ERROR_CATEGORY;
    const observableEventCategory: ObservableEventCategory =
      DEFAULT_OBSERVABLE_EVENT_CATEGORY;

    expect(productErrorCategories).toEqual([
      "validation",
      "authentication",
      "authorization",
      "domain",
      "integration",
      "processing",
      "infrastructure",
    ]);
    expect(observableEventCategories).toEqual([
      "auth",
      "exam",
      "question",
      "adaptation",
      "feedback",
      "agent",
      "workflow",
      "storage",
      "system",
      "error",
    ]);
    expect(OBSERVABLE_EVENTS).toEqual([
      "upload_started",
      "extraction_started",
      "extraction_completed",
      "adaptation_started",
      "adaptation_completed",
      "feedback_saved",
      "agent_evolution_started",
      "agent_evolution_completed",
    ]);
    expect(productErrorCategory).toBe("infrastructure");
    expect(observableEventCategory).toBe("system");
    expect(DEFAULT_PRODUCT_ERROR_CATEGORY).toBe("infrastructure");
    expect(DEFAULT_OBSERVABLE_EVENT_CATEGORY).toBe("system");
    expect(getDefaultProductErrorCategory()).toBe("infrastructure");
    expect(getDefaultObservableEventCategory()).toBe("system");
  });

  it("creates and normalizes correlation ids and request context metadata", () => {
    const correlationId = createCorrelationId();

    expect(correlationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(normalizeCorrelationId("  external-id  ")).toBe("external-id");
    expect(normalizeCorrelationId("")).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(normalizeCorrelationId(" bad value with spaces ")).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(normalizeCorrelationId("bad\nvalue")).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    const context = createRequestContext({
      correlationId: "  request-id  ",
      requestId: " req-1 ",
      examId: "exam-1",
      questionId: "",
      adaptationId: null,
      workflowId: "workflow-1",
    });

    expect(context).toEqual<RequestContext>({
      correlationId: "request-id",
      requestId: "req-1",
      examId: "exam-1",
      questionId: undefined,
      adaptationId: undefined,
      workflowId: "workflow-1",
    });

    expect(toLogSafeMetadata(context)).toEqual({
      correlationId: "request-id",
      requestId: "req-1",
      examId: "exam-1",
      workflowId: "workflow-1",
    });
  });
});
