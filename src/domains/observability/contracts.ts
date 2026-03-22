export const OBSERVABLE_EVENT_CATEGORIES = [
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
] as const;

export type ObservableEventCategory =
  (typeof OBSERVABLE_EVENT_CATEGORIES)[number];

export const DEFAULT_OBSERVABLE_EVENT_CATEGORY: ObservableEventCategory =
  "system";

export function getDefaultObservableEventCategory(): ObservableEventCategory {
  return DEFAULT_OBSERVABLE_EVENT_CATEGORY;
}

export const OBSERVABLE_EVENTS = [
  "upload_started",
  "extraction_started",
  "extraction_completed",
  "adaptation_started",
  "adaptation_completed",
  "feedback_saved",
  "agent_evolution_started",
  "agent_evolution_completed",
] as const;

export type ObservableEventName = (typeof OBSERVABLE_EVENTS)[number];

export interface ObservableEntityIds {
  requestId?: string;
  examId?: string;
  questionId?: string;
  adaptationId?: string;
  workflowId?: string;
}

export interface ObservableEventContext extends ObservableEntityIds {
  correlationId: string;
  category?: ObservableEventCategory;
  event?: ObservableEventName;
}

export type LogSafeMetadata = Record<string, string>;
