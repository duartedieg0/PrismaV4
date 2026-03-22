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
