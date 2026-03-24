import type { CopyEvent } from "@/features/exams/results/contracts";

type RecordResultEventDependencies = {
  persistEvent(event: CopyEvent): Promise<void>;
};

export async function recordResultEvent(
  event: CopyEvent,
  dependencies: RecordResultEventDependencies,
) {
  try {
    await dependencies.persistEvent(event);
  } catch {
    // Telemetry must never break the teacher-facing flow.
  }
}
