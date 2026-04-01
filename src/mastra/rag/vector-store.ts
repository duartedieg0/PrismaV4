import { LibSQLVector } from "@mastra/libsql";
import { openai } from "@ai-sdk/openai";

const VECTOR_DB_URL = process.env.VECTOR_DB_URL ?? "http://127.0.0.1:8080";
const VECTOR_DB_TOKEN = process.env.VECTOR_DB_TOKEN ?? "";
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL ?? "text-embedding-3-small";

export function createVectorStore() {
  return new LibSQLVector({
    connectionUrl: VECTOR_DB_URL,
    authToken: VECTOR_DB_TOKEN || undefined,
  });
}

export function getEmbeddingModel() {
  return openai.embedding(EMBEDDING_MODEL);
}
