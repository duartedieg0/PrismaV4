import { normalizeCorrelationId } from "@/services/runtime/correlation-id";

export const RUNTIME_STAGES = [
  "extraction",
  "bncc_analysis",
  "bloom_analysis",
  "adaptation",
  "evolution",
  "consultant",
] as const;

export type RuntimeStage = (typeof RUNTIME_STAGES)[number];

export type ExamStage = Exclude<RuntimeStage, "consultant">;

interface BaseRuntimeMetadata<TStage extends RuntimeStage = RuntimeStage> {
  traceId: string;
  correlationId: string;
  stage: TStage;
  model: string;
  agentId: string;
  promptVersion: string;
  startedAt: string;
}

export interface ExamExecutionMetadata<TStage extends ExamStage = ExamStage>
  extends BaseRuntimeMetadata<TStage> {
  examId: string;
  questionId?: string;
  supportId?: string;
}

export interface ConsultantExecutionMetadata
  extends BaseRuntimeMetadata<"consultant"> {
  threadId: string;
  agentSlug: string;
  teacherId: string;
}

export type RuntimeExecutionMetadata =
  | ExamExecutionMetadata
  | ConsultantExecutionMetadata;

export interface RuntimeFailure<TStage extends RuntimeStage = RuntimeStage> {
  stage: TStage;
  code: string;
  message: string;
  retryable: boolean;
}

type ExamMetadataInput<TStage extends ExamStage> = Omit<
  ExamExecutionMetadata<TStage>,
  "traceId" | "correlationId" | "startedAt"
> & {
  correlationId?: string | null;
};

type ConsultantMetadataInput = Omit<
  ConsultantExecutionMetadata,
  "traceId" | "correlationId" | "startedAt"
> & {
  correlationId?: string | null;
};

export function createExamExecutionMetadata<TStage extends ExamStage>(
  input: ExamMetadataInput<TStage>,
): ExamExecutionMetadata<TStage> {
  return {
    ...input,
    traceId: crypto.randomUUID(),
    correlationId: normalizeCorrelationId(input.correlationId),
    startedAt: new Date().toISOString(),
  };
}

export function createConsultantExecutionMetadata(
  input: ConsultantMetadataInput,
): ConsultantExecutionMetadata {
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
