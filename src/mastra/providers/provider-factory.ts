import { createOpenAI } from "@ai-sdk/openai";
import type { AiModelRecord } from "@/mastra/providers/model-registry";

type OpenAIProvider = ReturnType<typeof createOpenAI>;
export type ResolvedMastraModel = ReturnType<OpenAIProvider>;

export function createMastraModel(model: AiModelRecord): ResolvedMastraModel {
  return createOpenAI({
    apiKey: model.apiKey,
    baseURL: model.baseUrl,
  })(model.modelId);
}
