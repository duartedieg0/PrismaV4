import { normalizeCorrelationId } from "@/services/runtime/correlation-id";

export const RUNTIME_STAGES = [
  "extraction",
  "bncc_analysis",
  "bloom_analysis",
  "adaptation",
  "evolution",
] as const;

export type RuntimeStage = (typeof RUNTIME_STAGES)[number];

export interface RuntimeExecutionMetadata<TStage extends RuntimeStage = RuntimeStage> {
  traceId: string;
  correlationId: string;
  examId: string;
  questionId?: string;
  supportId?: string;
  stage: TStage;
  model: string;
  agentId: string;
  promptVersion: string;
  startedAt: string;
}

export interface RuntimeFailure<TStage extends RuntimeStage = RuntimeStage> {
  stage: TStage;
  code: string;
  message: string;
  retryable: boolean;
}

type RuntimeExecutionMetadataInput<TStage extends RuntimeStage> = Omit<
  RuntimeExecutionMetadata<TStage>,
  "traceId" | "correlationId" | "startedAt"
> & {
  correlationId?: string | null;
};

export function createRuntimeExecutionMetadata<TStage extends RuntimeStage>(
  input: RuntimeExecutionMetadataInput<TStage>,
): RuntimeExecutionMetadata<TStage> {
  return {
    ...input,
    traceId: crypto.randomUUID(),
    correlationId: normalizeCorrelationId(input.correlationId),
    startedAt: new Date().toISOString(),
  };
}

export function createRuntimeFailure<TStage extends RuntimeStage>(
  input: RuntimeFailure<TStage>,
): RuntimeFailure<TStage> {
  return input;
}
