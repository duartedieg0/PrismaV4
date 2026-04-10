import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { embed } from "ai";
import { chunkMarkdown } from "./chunker";
import { createVectorStore, getEmbeddingModel } from "./vector-store";

const TEA_INDEX_NAME = "tea_knowledge_base";

async function ingest(filePaths: string[]) {
  const vectorStore = createVectorStore();
  const embeddingModel = getEmbeddingModel();

  // Criar índice se não existir
  await vectorStore.createIndex({
    indexName: TEA_INDEX_NAME,
    dimension: 1536,
  });

  for (const filePath of filePaths) {
    const absolutePath = resolve(filePath);
    const content = readFileSync(absolutePath, "utf-8");
    const fileName = absolutePath.split(/[\\/]/).pop() ?? filePath;

    console.log(`Processando: ${fileName}`);

    const chunks = chunkMarkdown(content, fileName);
    console.log(`  ${chunks.length} chunks encontrados`);

    for (const chunk of chunks) {
      const { embedding } = await embed({
        model: embeddingModel,
        value: chunk.text,
      });

      await vectorStore.upsert({
        indexName: TEA_INDEX_NAME,
        vectors: [embedding],
        metadata: [chunk.metadata],
        ids: [
          `${chunk.metadata.source}:${chunk.metadata.section}:${chunk.metadata.subsection}`,
        ],
      });
    }

    console.log(`  ✓ ${fileName} indexado`);
  }

  console.log("Ingestão concluída.");
}

// CLI: npx tsx src/mastra/rag/ingest.ts <arquivo1> <arquivo2> ...
const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("Uso: npx tsx src/mastra/rag/ingest.ts <arquivo.md> [...]");
  process.exit(1);
}

ingest(files).catch((err) => {
  console.error("Erro na ingestão:", err);
  process.exit(1);
});
