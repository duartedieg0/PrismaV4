import { Agent } from "@mastra/core/agent";
import { LibSQLStore } from "@mastra/libsql";
import { Memory } from "@mastra/memory";
import type { ResolvedMastraModel } from "@/mastra/providers/provider-factory";
import { TEA_CONSULTANT_INSTRUCTIONS } from "@/mastra/prompts/tea-consultant-prompt";
import { createTeaQueryTool } from "@/mastra/rag/tea-query-tool";
import type { Tool } from "@mastra/core/tools";

const MASTRA_DB_URL = process.env.MASTRA_DB_URL ?? "http://127.0.0.1:8080";
const MASTRA_DB_TOKEN = process.env.MASTRA_DB_TOKEN ?? "";

export function createTeaConsultantAgent(model: ResolvedMastraModel) {
  const storage = new LibSQLStore({
    url: MASTRA_DB_URL,
    authToken: MASTRA_DB_TOKEN || undefined,
  });

  const memory = new Memory({
    storage,
    options: {
      lastMessages: 20,
    },
  });

  const teaQueryTool = createTeaQueryTool();

  return new Agent({
    id: "tea-consultant-agent",
    name: "Agente Consultor TEA",
    instructions: TEA_CONSULTANT_INSTRUCTIONS,
    model,
    memory,
    tools: {
      teaQueryTool: teaQueryTool as unknown as Tool,
    },
  });
}
