import type {
  ObservableEventCategory,
  ObservableEventName,
} from "@/domains/observability/contracts";
import type { RequestContext } from "@/services/runtime/request-context";
import { toLogSafeMetadata } from "@/services/runtime/request-context";

type StructuredLogLevel = "info" | "warn" | "error";

type StructuredLogEntryInput = {
  level: StructuredLogLevel;
  message: string;
  context: RequestContext;
};

type ObservableEventInput = {
  category: ObservableEventCategory;
  event: ObservableEventName;
  context: RequestContext;
};

export function createStructuredLogEntry({
  level,
  message,
  context,
}: StructuredLogEntryInput) {
  return {
    level,
    message,
    metadata: toLogSafeMetadata(context),
  };
}

export function createObservableEvent({
  category,
  event,
  context,
}: ObservableEventInput) {
  return {
    category,
    event,
    ...toLogSafeMetadata(context),
  };
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return { raw: String(error) };
}

export function logInfo(message: string, context: RequestContext) {
  const entry = createStructuredLogEntry({ level: "info", message, context });
  console.log(JSON.stringify(entry));
}

export function logWarn(message: string, context: RequestContext) {
  const entry = createStructuredLogEntry({ level: "warn", message, context });
  console.warn(JSON.stringify(entry));
}

export function logError(
  message: string,
  context: RequestContext,
  error?: unknown,
) {
  const entry = createStructuredLogEntry({ level: "error", message, context });
  const payload = error
    ? { ...entry, error: serializeError(error) }
    : entry;
  console.error(JSON.stringify(payload));
}
