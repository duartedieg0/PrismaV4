import { z } from "zod";
import { createTool } from "@mastra/core/tools";
import { RUNTIME_STAGES } from "@/mastra/contracts/runtime-contracts";

const runtimeEventInputSchema = z.object({
  traceId: z.string(),
  correlationId: z.string(),
  examId: z.string(),
  questionId: z.string().optional(),
  supportId: z.string().optional(),
  stage: z.enum(RUNTIME_STAGES),
  model: z.string(),
  agentId: z.string(),
  promptVersion: z.string(),
  status: z.enum(["started", "completed", "failed"]),
  event: z.string(),
  failureCode: z.string().optional(),
  failureMessage: z.string().optional(),
});

export type RuntimeEventToolInput = z.infer<typeof runtimeEventInputSchema>;

export function createRegisterRuntimeEventTool(
  onRegister?: (input: RuntimeEventToolInput) => Promise<void> | void,
) {
  return createTool({
    id: "register-runtime-event",
    description: "Registra eventos do runtime Mastra para observabilidade do produto.",
    inputSchema: runtimeEventInputSchema,
    outputSchema: z.object({
      recorded: z.literal(true),
    }),
    execute: async (input) => {
      await onRegister?.(input);

      return {
        recorded: true as const,
      };
    },
  });
}
