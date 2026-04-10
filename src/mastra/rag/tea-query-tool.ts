import { createVectorQueryTool } from "@mastra/rag";
import { createVectorStore, getEmbeddingModel } from "./vector-store";

const TEA_INDEX_NAME = "tea_knowledge_base";

export function createTeaQueryTool() {
  const vectorStore = createVectorStore();
  const embeddingModel = getEmbeddingModel();

  return createVectorQueryTool({
    vectorStoreName: "tea_knowledge_base",
    indexName: TEA_INDEX_NAME,
    vectorStore,
    model: embeddingModel,
    description:
      "Busca informações sobre TEA (Transtorno do Espectro Autista), adaptação de avaliações, legislação brasileira de educação inclusiva e boas práticas pedagógicas na base de conhecimento.",
  });
}
