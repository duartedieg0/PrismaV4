# TEA Support Thread — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que o professor converse com um agente consultor especializado em TEA via interface de chat, com respostas fundamentadas em documentos pedagógicos (RAG).

**Architecture:** Hybrid storage — Supabase para metadata de threads (listagem, RLS), Mastra/LibSQL para mensagens (memory). Agente Mastra com RAG via vector store Turso, embedding OpenAI. API Next.js como camada fina de auth + delegação ao Mastra. Frontend com chat streaming.

**Tech Stack:** Next.js 16, React 19, Mastra (`@mastra/core`, `@mastra/memory`, `@mastra/libsql`), Supabase, OpenAI embeddings, Turso (LibSQL vector store), Tailwind CSS 4.

**Spec:** `docs/superpowers/specs/2026-04-01-tea-support-thread-design.md`

---

## Mapa de Arquivos

### Novos arquivos

| Arquivo | Responsabilidade |
|---------|------------------|
| `src/mastra/rag/vector-store.ts` | Configuração do LibSQLVector + embedding model |
| `src/mastra/rag/ingest.ts` | Script CLI de ingestão de documentos Markdown |
| `src/mastra/rag/chunker.ts` | Chunking semântico de Markdown por seções |
| `src/mastra/rag/tea-query-tool.ts` | createVectorQueryTool configurado para TEA |
| `src/mastra/agents/tea-consultant-agent.ts` | Factory do agente consultor TEA |
| `src/mastra/prompts/tea-consultant-prompt.ts` | System prompt do consultor TEA |
| `src/domains/support/contracts.ts` | Tipos e constantes do domínio de suporte |
| `src/features/support/support-agents.ts` | Registry de agentes de suporte (cards, slugs, metadata) |
| `src/features/support/with-teacher-route.ts` | Wrapper de auth para rotas de professor |
| `src/features/support/thread-title.ts` | Geração de título via LLM + fallback |
| `supabase/migrations/00014_consultant_threads.sql` | Migração: tabela + RLS |
| `src/app/api/teacher/threads/route.ts` | POST (criar) + GET (listar) threads |
| `src/app/api/teacher/threads/[id]/route.ts` | GET (detalhe) + DELETE thread |
| `src/app/api/teacher/threads/[id]/messages/route.ts` | POST mensagem com streaming |
| `src/app/(auth)/support/page.tsx` | Página de listagem de agentes |
| `src/app/(auth)/support/[agentSlug]/page.tsx` | Página de listagem de threads |
| `src/app/(auth)/support/[agentSlug]/[threadId]/page.tsx` | Página de chat |
| `src/features/support/components/agent-card.tsx` | Card de agente |
| `src/features/support/components/thread-list.tsx` | Lista de threads |
| `src/features/support/components/chat-interface.tsx` | Interface de chat (client component) |
| `src/features/support/components/chat-message.tsx` | Bolha de mensagem com Markdown |
| `src/features/support/components/chat-input.tsx` | Input de mensagem |
| `src/features/support/components/markdown-renderer.tsx` | Wrapper react-markdown |

### Arquivos a modificar

| Arquivo | Mudança |
|---------|---------|
| `package.json` | Adicionar `@mastra/memory`, `react-markdown`, `remark-gfm` |
| `src/mastra/contracts/runtime-contracts.ts` | Adicionar `consultant` ao RUNTIME_STAGES, generalizar metadata |
| `src/mastra/observability/runtime-events.ts` | Union type para eventos exam vs consultant |
| `src/domains/observability/contracts.ts` | Adicionar categoria `consultant` e novos eventos |
| `src/mastra/tools/register-runtime-event-tool.ts` | Suportar campos consultant |
| `src/app-shell/authenticated/teacher-shell.tsx` | Adicionar "Agentes IA de Suporte" ao nav |

---

## Task 1: Instalar dependências

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Instalar pacotes**

```bash
npm install @mastra/memory @mastra/rag @ai-sdk/react react-markdown remark-gfm
```

- [ ] **Step 2: Verificar instalação**

```bash
npm ls @mastra/memory @mastra/rag @ai-sdk/react react-markdown remark-gfm
```

Expected: Todos listados sem erros.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @mastra/memory, @mastra/rag, @ai-sdk/react, react-markdown, remark-gfm"
```

---

## Task 2: Migração Supabase — consultant_threads

**Files:**
- Create: `supabase/migrations/00014_consultant_threads.sql`

- [ ] **Step 1: Criar migração**

> **Nota**: Antes de criar o arquivo, verificar o número da última migração em `supabase/migrations/` e usar o próximo sequencial. O nome abaixo assume que 00013 é a última.

```sql
-- 00014: Consultant Threads
-- Tabela para metadata de threads de consulta com agentes de suporte.
-- Mensagens ficam no Mastra Memory (LibSQL). Esta tabela armazena
-- metadata para listagem, paginação e RLS.

CREATE TABLE IF NOT EXISTS consultant_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  agent_slug TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para listagem paginada
CREATE INDEX idx_consultant_threads_teacher_agent
  ON consultant_threads (teacher_id, agent_slug, updated_at DESC);

-- RLS
ALTER TABLE consultant_threads ENABLE ROW LEVEL SECURITY;

-- Professor só vê suas próprias threads
CREATE POLICY "Teachers can view own threads"
  ON consultant_threads FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid());

-- Professor pode criar threads para si mesmo
CREATE POLICY "Teachers can insert own threads"
  ON consultant_threads FOR INSERT
  TO authenticated
  WITH CHECK (teacher_id = auth.uid());

-- Professor pode atualizar suas próprias threads (título)
CREATE POLICY "Teachers can update own threads"
  ON consultant_threads FOR UPDATE
  TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- Professor pode deletar suas próprias threads
CREATE POLICY "Teachers can delete own threads"
  ON consultant_threads FOR DELETE
  TO authenticated
  USING (teacher_id = auth.uid());

-- Admin pode ver todas as threads (para observabilidade)
CREATE POLICY "Admins can view all threads"
  ON consultant_threads FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON consultant_threads TO authenticated;
GRANT ALL ON consultant_threads TO service_role;
```

- [ ] **Step 2: Aplicar migração**

```bash
npx supabase db push
```

ou se usando Supabase CLI local:

```bash
npx supabase migration up --local
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/00014_consultant_threads.sql
git commit -m "feat(db): add consultant_threads table with RLS"
```

---

## Task 3: Generalizar sistema de observabilidade

**Files:**
- Modify: `src/mastra/contracts/runtime-contracts.ts`
- Modify: `src/domains/observability/contracts.ts`
- Modify: `src/mastra/observability/runtime-events.ts`
- Modify: `src/mastra/tools/register-runtime-event-tool.ts`

- [ ] **Step 1: Adicionar `consultant` ao RUNTIME_STAGES e generalizar metadata**

Em `src/mastra/contracts/runtime-contracts.ts`, substituir o conteúdo por:

```typescript
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
```

> **Nota**: A função antiga `createRuntimeExecutionMetadata` foi renomeada para `createExamExecutionMetadata`. Atualize todos os call sites existentes (procurar por `createRuntimeExecutionMetadata` no projeto e renomear).

- [ ] **Step 2: Adicionar eventos consultant aos contracts de observabilidade**

Em `src/domains/observability/contracts.ts`, adicionar:

```typescript
export const OBSERVABLE_EVENT_CATEGORIES = [
  "auth",
  "exam",
  "question",
  "adaptation",
  "feedback",
  "agent",
  "workflow",
  "storage",
  "system",
  "error",
  "consultant",
] as const;

// ... (manter tipos existentes)

export const OBSERVABLE_EVENTS = [
  "upload_started",
  "extraction_started",
  "extraction_completed",
  "adaptation_started",
  "adaptation_completed",
  "feedback_saved",
  "agent_evolution_started",
  "agent_evolution_completed",
  "consultant_thread_created",
  "consultant_message_sent",
  "consultant_response_completed",
  "consultant_response_failed",
] as const;

// ... (manter tipos existentes)

export interface ObservableEntityIds {
  requestId?: string;
  examId?: string;
  questionId?: string;
  adaptationId?: string;
  workflowId?: string;
  threadId?: string;
}
```

- [ ] **Step 3: Atualizar RuntimeEventRecord para union type**

Em `src/mastra/observability/runtime-events.ts`, substituir por:

```typescript
import type { ObservableEventName } from "@/domains/observability/contracts";
import type {
  ExamExecutionMetadata,
  ConsultantExecutionMetadata,
  RuntimeExecutionMetadata,
  RuntimeFailure,
  ExamStage,
} from "@/mastra/contracts/runtime-contracts";

export type RuntimeEventStatus = "started" | "completed" | "failed";

export interface ExamEventRecord {
  category: "workflow";
  event: ObservableEventName;
  status: RuntimeEventStatus;
  traceId: string;
  correlationId: string;
  examId: string;
  questionId?: string;
  supportId?: string;
  stage: ExamStage;
  model: string;
  agentId: string;
  promptVersion: string;
  failureCode?: string;
  failureMessage?: string;
}

export interface ConsultantEventRecord {
  category: "consultant";
  event: ObservableEventName;
  status: RuntimeEventStatus;
  traceId: string;
  correlationId: string;
  threadId: string;
  agentSlug: string;
  teacherId: string;
  model: string;
  agentId: string;
  promptVersion: string;
  failureCode?: string;
  failureMessage?: string;
}

export type RuntimeEventRecord = ExamEventRecord | ConsultantEventRecord;

function mapExamStageToEvent(
  stage: ExamStage,
  status: RuntimeEventStatus,
): ObservableEventName {
  if (stage === "extraction") {
    return status === "completed" ? "extraction_completed" : "extraction_started";
  }

  if (stage === "evolution") {
    return status === "completed"
      ? "agent_evolution_completed"
      : "agent_evolution_started";
  }

  return status === "completed" ? "adaptation_completed" : "adaptation_started";
}

function mapConsultantStatusToEvent(
  status: RuntimeEventStatus,
  isThreadCreation: boolean,
): ObservableEventName {
  if (isThreadCreation) return "consultant_thread_created";
  if (status === "started") return "consultant_message_sent";
  if (status === "completed") return "consultant_response_completed";
  return "consultant_response_failed";
}

export function createExamEventRecord(
  metadata: ExamExecutionMetadata,
  status: RuntimeEventStatus,
  failure?: RuntimeFailure,
): ExamEventRecord {
  return {
    category: "workflow",
    event: mapExamStageToEvent(metadata.stage, status),
    status,
    traceId: metadata.traceId,
    correlationId: metadata.correlationId,
    examId: metadata.examId,
    questionId: metadata.questionId,
    supportId: metadata.supportId,
    stage: metadata.stage,
    model: metadata.model,
    agentId: metadata.agentId,
    promptVersion: metadata.promptVersion,
    ...(failure
      ? { failureCode: failure.code, failureMessage: failure.message }
      : {}),
  };
}

export function createConsultantEventRecord(
  metadata: ConsultantExecutionMetadata,
  status: RuntimeEventStatus,
  isThreadCreation = false,
  failure?: RuntimeFailure,
): ConsultantEventRecord {
  return {
    category: "consultant",
    event: mapConsultantStatusToEvent(status, isThreadCreation),
    status,
    traceId: metadata.traceId,
    correlationId: metadata.correlationId,
    threadId: metadata.threadId,
    agentSlug: metadata.agentSlug,
    teacherId: metadata.teacherId,
    model: metadata.model,
    agentId: metadata.agentId,
    promptVersion: metadata.promptVersion,
    ...(failure
      ? { failureCode: failure.code, failureMessage: failure.message }
      : {}),
  };
}
```

> **Nota**: A função antiga `createRuntimeEventRecord` foi renomeada para `createExamEventRecord`. Atualizar todos os call sites existentes.

- [ ] **Step 4: Atualizar register-runtime-event-tool para suportar campos opcionais**

Em `src/mastra/tools/register-runtime-event-tool.ts`, tornar `examId` opcional e adicionar campos consultant:

```typescript
import { z } from "zod";
import { createTool } from "@mastra/core/tools";
import { RUNTIME_STAGES } from "@/mastra/contracts/runtime-contracts";

const runtimeEventInputSchema = z.object({
  traceId: z.string(),
  correlationId: z.string(),
  examId: z.string().optional(),
  questionId: z.string().optional(),
  supportId: z.string().optional(),
  threadId: z.string().optional(),
  agentSlug: z.string().optional(),
  teacherId: z.string().optional(),
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
```

- [ ] **Step 5: Atualizar call sites existentes**

Buscar e renomear em todo o projeto:
- `createRuntimeExecutionMetadata` → `createExamExecutionMetadata`
- `createRuntimeEventRecord` → `createExamEventRecord`

```bash
grep -rn "createRuntimeExecutionMetadata\|createRuntimeEventRecord" src/
```

Atualizar cada ocorrência mantendo a mesma lógica, apenas renomeando.

- [ ] **Step 6: Verificar build**

```bash
npm run build
```

Expected: Build sem erros de tipo.

- [ ] **Step 7: Commit**

```bash
git add src/mastra/contracts/runtime-contracts.ts src/domains/observability/contracts.ts src/mastra/observability/runtime-events.ts src/mastra/tools/register-runtime-event-tool.ts
git add -u  # arquivos modificados com renaming
git commit -m "refactor(observability): generalize runtime events for consultant support"
```

---

## Task 4: Vector store + embedding

**Files:**
- Create: `src/mastra/rag/vector-store.ts`

- [ ] **Step 1: Criar configuração do vector store**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/mastra/rag/vector-store.ts
git commit -m "feat(rag): add vector store and embedding configuration"
```

---

## Task 5: Chunker semântico de Markdown

**Files:**
- Create: `src/mastra/rag/chunker.ts`
- Create: `src/mastra/rag/__tests__/chunker.test.ts`

- [ ] **Step 1: Escrever o teste do chunker**

```typescript
import { describe, it, expect } from "vitest";
import { chunkMarkdown } from "../chunker";

const SAMPLE_MD = `# Documento TEA

## Princípios Gerais

### Princípio 1: Clareza Visual

Texto sobre clareza visual na adaptação de questões.
Mais detalhes sobre o princípio.

### Princípio 2: Linguagem Objetiva

Texto sobre linguagem objetiva.

## Legislação

### Lei Brasileira de Inclusão

Detalhes sobre a LBI e TEA.

## Anti-padrões

### Infantilização

Exemplo de infantilização e por que evitar.
`;

describe("chunkMarkdown", () => {
  it("should split by ## and ### headers", () => {
    const chunks = chunkMarkdown(SAMPLE_MD, "test-doc.md");
    expect(chunks.length).toBeGreaterThanOrEqual(4);
  });

  it("should include metadata in each chunk", () => {
    const chunks = chunkMarkdown(SAMPLE_MD, "test-doc.md");
    for (const chunk of chunks) {
      expect(chunk.metadata).toHaveProperty("source", "test-doc.md");
      expect(chunk.metadata).toHaveProperty("section");
      expect(chunk.text).toBeTruthy();
    }
  });

  it("should detect section types from content", () => {
    const chunks = chunkMarkdown(SAMPLE_MD, "test-doc.md");
    const legislacaoChunk = chunks.find((c) =>
      c.metadata.section.includes("Legislação"),
    );
    expect(legislacaoChunk?.metadata.type).toBe("legislação");

    const antiPadraoChunk = chunks.find((c) =>
      c.metadata.section.includes("Anti-padrões"),
    );
    expect(antiPadraoChunk?.metadata.type).toBe("anti-padrão");
  });
});
```

- [ ] **Step 2: Rodar teste para confirmar que falha**

```bash
npx vitest run src/mastra/rag/__tests__/chunker.test.ts
```

Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar chunker**

```typescript
export interface DocumentChunk {
  text: string;
  metadata: {
    source: string;
    section: string;
    subsection: string;
    type: "princípio" | "regra" | "anti-padrão" | "exemplo" | "legislação" | "geral";
  };
}

const TYPE_PATTERNS: [RegExp, DocumentChunk["metadata"]["type"]][] = [
  [/legisla[çc][aã]o|lei\s|decreto|portaria|resolu[çc][aã]o/i, "legislação"],
  [/anti[-\s]?padr[aãoõ]/i, "anti-padrão"],
  [/princ[ií]pio|diretriz/i, "princípio"],
  [/exemplo|caso|ilustra/i, "exemplo"],
  [/regra|obrigat[oó]ri|deve[-\s]?se|nunca|sempre/i, "regra"],
];

function detectType(
  sectionTitle: string,
  content: string,
): DocumentChunk["metadata"]["type"] {
  const combined = `${sectionTitle} ${content}`;
  for (const [pattern, type] of TYPE_PATTERNS) {
    if (pattern.test(combined)) return type;
  }
  return "geral";
}

export function chunkMarkdown(
  markdown: string,
  source: string,
): DocumentChunk[] {
  const lines = markdown.split("\n");
  const chunks: DocumentChunk[] = [];

  let currentSection = "";
  let currentSubsection = "";
  let currentContent: string[] = [];

  function flushChunk() {
    const text = currentContent.join("\n").trim();
    if (!text) return;

    chunks.push({
      text,
      metadata: {
        source,
        section: currentSection || "Introdução",
        subsection: currentSubsection,
        type: detectType(
          `${currentSection} ${currentSubsection}`,
          text,
        ),
      },
    });
    currentContent = [];
  }

  for (const line of lines) {
    const h2Match = line.match(/^## (.+)/);
    const h3Match = line.match(/^### (.+)/);

    if (h2Match) {
      flushChunk();
      currentSection = h2Match[1].trim();
      currentSubsection = "";
      continue;
    }

    if (h3Match) {
      flushChunk();
      currentSubsection = h3Match[1].trim();
      continue;
    }

    // Ignorar h1 (título do documento)
    if (line.match(/^# /)) continue;

    currentContent.push(line);
  }

  flushChunk();
  return chunks;
}
```

- [ ] **Step 4: Rodar teste para confirmar que passa**

```bash
npx vitest run src/mastra/rag/__tests__/chunker.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/mastra/rag/chunker.ts src/mastra/rag/__tests__/chunker.test.ts
git commit -m "feat(rag): add semantic markdown chunker with type detection"
```

---

## Task 6: Pipeline de ingestão

**Files:**
- Create: `src/mastra/rag/ingest.ts`
- Modify: `package.json` (adicionar script)

- [ ] **Step 1: Criar script de ingestão**

```typescript
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { embed } from "ai";
import { chunkMarkdown } from "./chunker";
import { createVectorStore, getEmbeddingModel } from "./vector-store";

const TEA_INDEX_NAME = "tea-knowledge-base";

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
```

- [ ] **Step 2: Adicionar script ao package.json**

Adicionar em `scripts`:

```json
"rag:ingest": "tsx src/mastra/rag/ingest.ts"
```

- [ ] **Step 3: Commit**

```bash
git add src/mastra/rag/ingest.ts package.json
git commit -m "feat(rag): add document ingestion CLI pipeline"
```

---

## Task 7: Query tool para RAG

**Files:**
- Create: `src/mastra/rag/tea-query-tool.ts`

- [ ] **Step 1: Criar query tool**

```typescript
import { createVectorQueryTool } from "@mastra/rag";
import { createVectorStore, getEmbeddingModel } from "./vector-store";

const TEA_INDEX_NAME = "tea-knowledge-base";

export function createTeaQueryTool() {
  const vectorStore = createVectorStore();
  const embeddingModel = getEmbeddingModel();

  return createVectorQueryTool({
    vectorStoreName: "tea-knowledge-base",
    indexName: TEA_INDEX_NAME,
    vectorStore,
    embeddingModel,
    description:
      "Busca informações sobre TEA (Transtorno do Espectro Autista), adaptação de avaliações, legislação brasileira de educação inclusiva e boas práticas pedagógicas na base de conhecimento.",
    topK: 5,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/mastra/rag/tea-query-tool.ts
git commit -m "feat(rag): add TEA knowledge base query tool"
```

---

## Task 8: System prompt do consultor TEA

**Files:**
- Create: `src/mastra/prompts/tea-consultant-prompt.ts`

- [ ] **Step 1: Criar prompt**

```typescript
export const TEA_CONSULTANT_PROMPT_VERSION = "tea-consultant@v1";

export const TEA_CONSULTANT_INSTRUCTIONS = `Você é um assistente pedagógico especializado em adaptação de avaliações para estudantes com Transtorno do Espectro Autista (TEA).

## Seu papel

- Responder dúvidas de professores sobre como adaptar provas e avaliações para alunos com TEA
- Explicar princípios de adaptação com base em evidências científicas e documentos pedagógicos
- Orientar sobre o que fazer e o que evitar ao adaptar questões (ex: infantilização, rebaixamento cognitivo)
- Esclarecer aspectos da legislação brasileira de educação inclusiva relacionados a TEA

## Suas regras

1. **Sempre consulte a base de conhecimento** antes de responder. Use a ferramenta de busca disponível.
2. **Cite a fonte ou seção** quando a informação vier de um documento específico. Exemplo: "Segundo o documento Discovery-TEA, seção Princípios Gerais, ..."
3. **Se não encontrar a informação na base**, diga claramente: "Não encontrei essa informação na minha base de conhecimento. Sugiro consultar um especialista em educação inclusiva."
4. **Não dê diagnósticos clínicos** nem substitua profissionais de saúde.
5. **Não peça nome, CPF ou dados identificáveis** de alunos.
6. **Mantenha tom profissional e acessível** — você conversa com professores que podem não ter formação em educação especial.
7. **Responda sempre em português brasileiro.**
8. **Não responda perguntas sobre o PRISMA** (bugs, funcionalidades, senha). Seu escopo é consultoria pedagógica sobre TEA.

## Formato das respostas

- Use Markdown para formatação (listas, negrito, citações)
- Seja conciso mas completo
- Quando relevante, dê exemplos práticos de como aplicar a orientação

## Primeira mensagem de uma conversa

Quando for a primeira mensagem de uma conversa (não há mensagens anteriores), apresente-se brevemente e sugira exemplos de perguntas:

"Olá! Sou o assistente pedagógico do PRISMA para adaptação de avaliações TEA. Posso ajudar com:

- **Princípios de adaptação**: Como adaptar questões mantendo o rigor pedagógico?
- **O que evitar**: Quais são os erros mais comuns ao adaptar provas para TEA?
- **Legislação**: O que a legislação brasileira diz sobre avaliações inclusivas?
- **Boas práticas**: Como aplicar clareza visual e linguagem objetiva em questões?

Como posso ajudar?"
`;
```

- [ ] **Step 2: Commit**

```bash
git add src/mastra/prompts/tea-consultant-prompt.ts
git commit -m "feat(agent): add TEA consultant system prompt"
```

---

## Task 9: Agente consultor TEA

**Files:**
- Create: `src/mastra/agents/tea-consultant-agent.ts`

- [ ] **Step 1: Criar factory do agente**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/mastra/agents/tea-consultant-agent.ts
git commit -m "feat(agent): add TEA consultant agent with memory and RAG"
```

---

## Task 10: Contratos do domínio de suporte + registry de agentes

**Files:**
- Create: `src/domains/support/contracts.ts`
- Create: `src/features/support/support-agents.ts`

- [ ] **Step 1: Criar contratos do domínio**

```typescript
export const CONSULTANT_AGENT_SLUGS = ["tea-consultant"] as const;

export type ConsultantAgentSlug = (typeof CONSULTANT_AGENT_SLUGS)[number];

export function isValidAgentSlug(
  slug: string,
): slug is ConsultantAgentSlug {
  return (CONSULTANT_AGENT_SLUGS as readonly string[]).includes(slug);
}

export interface ConsultantThread {
  id: string;
  teacherId: string;
  agentSlug: ConsultantAgentSlug;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 2: Criar registry de agentes de suporte**

```typescript
import type { ConsultantAgentSlug } from "@/domains/support/contracts";

export interface SupportAgentInfo {
  slug: ConsultantAgentSlug;
  name: string;
  description: string;
  icon: string;
}

export const SUPPORT_AGENTS: SupportAgentInfo[] = [
  {
    slug: "tea-consultant",
    name: "Agente Consultor TEA",
    description:
      "Tire dúvidas sobre adaptação de avaliações para estudantes com Transtorno do Espectro Autista. Respostas baseadas em evidências científicas e legislação.",
    icon: "brain",
  },
];

export function getSupportAgent(
  slug: string,
): SupportAgentInfo | undefined {
  return SUPPORT_AGENTS.find((a) => a.slug === slug);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/domains/support/contracts.ts src/features/support/support-agents.ts
git commit -m "feat(support): add domain contracts and agent registry"
```

---

## Task 11: Helper de auth para rotas do professor + geração de título

**Files:**
- Create: `src/features/support/with-teacher-route.ts`
- Create: `src/features/support/thread-title.ts`

- [ ] **Step 1: Criar wrapper de auth para rotas do professor**

Segue o padrão de `src/app/api/admin/with-admin-route.ts`:

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/gateways/supabase/server";
import { apiUnauthorized, apiInternalError } from "@/services/errors/api-response";
import { logError } from "@/services/observability/logger";
import { createRequestContext } from "@/services/runtime/request-context";

export type TeacherContext = {
  supabase: SupabaseClient;
  userId: string;
};

type TeacherRouteHandler = (
  ctx: TeacherContext,
  request: Request,
) => Promise<Response>;

export function withTeacherRoute(handler: TeacherRouteHandler) {
  return async (
    request: Request,
    routeContext?: { params: Promise<Record<string, string>> },
  ) => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiUnauthorized();
    }

    try {
      return await handler({ supabase, userId: user.id }, request);
    } catch (error) {
      logError("Erro em rota do professor", createRequestContext(), error);
      return apiInternalError();
    }
  };
}
```

- [ ] **Step 2: Criar geração de título com fallback**

```typescript
import { generateText } from "ai";
import type { ResolvedMastraModel } from "@/mastra/providers/provider-factory";

export async function generateThreadTitle(
  model: ResolvedMastraModel,
  userMessage: string,
  assistantResponse: string,
): Promise<string> {
  try {
    const { text } = await generateText({
      model,
      prompt: `Com base na seguinte conversa entre um professor e um assistente pedagógico, gere um título curto (máximo 60 caracteres) que resuma o tema principal. Retorne APENAS o título, sem aspas nem pontuação final.

Professor: ${userMessage.slice(0, 500)}

Assistente: ${assistantResponse.slice(0, 500)}`,
    });

    const title = text.trim().slice(0, 80);
    return title || fallbackTitle(userMessage);
  } catch {
    return fallbackTitle(userMessage);
  }
}

function fallbackTitle(userMessage: string): string {
  const clean = userMessage.replace(/\s+/g, " ").trim();
  if (clean.length <= 80) return clean;
  return clean.slice(0, 77) + "...";
}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/support/with-teacher-route.ts src/features/support/thread-title.ts
git commit -m "feat(support): add teacher route wrapper and title generation"
```

---

## Task 12: API — POST + GET /api/teacher/threads

**Files:**
- Create: `src/app/api/teacher/threads/route.ts`

- [ ] **Step 1: Implementar POST (criar thread) e GET (listar threads)**

```typescript
import { z } from "zod";
import { withTeacherRoute } from "@/features/support/with-teacher-route";
import { isValidAgentSlug } from "@/domains/support/contracts";
import {
  apiSuccess,
  apiValidationError,
  apiError,
} from "@/services/errors/api-response";

const createThreadSchema = z.object({
  agentSlug: z.string().min(1),
});

export const POST = withTeacherRoute(async ({ supabase, userId }, request) => {
  const body = await request.json();
  const parsed = createThreadSchema.safeParse(body);

  if (!parsed.success) {
    return apiValidationError(parsed.error);
  }

  if (!isValidAgentSlug(parsed.data.agentSlug)) {
    return apiError("VALIDATION_ERROR", "Agente não encontrado.", 400);
  }

  const { data, error } = await supabase
    .from("consultant_threads")
    .insert({
      teacher_id: userId,
      agent_slug: parsed.data.agentSlug,
    })
    .select("id")
    .single();

  if (error) {
    return apiError("INTERNAL_ERROR", "Erro ao criar conversa.", 500);
  }

  return apiSuccess({ threadId: data.id }, 201);
});

export const GET = withTeacherRoute(async ({ supabase, userId }, request) => {
  const url = new URL(request.url);
  const agentSlug = url.searchParams.get("agentSlug");
  const cursor = url.searchParams.get("cursor");
  const limit = 20;

  let query = supabase
    .from("consultant_threads")
    .select("id, agent_slug, title, created_at, updated_at")
    .eq("teacher_id", userId)
    .order("updated_at", { ascending: false })
    .limit(limit + 1);

  if (agentSlug) {
    query = query.eq("agent_slug", agentSlug);
  }

  if (cursor) {
    query = query.lt("updated_at", cursor);
  }

  const { data, error } = await query;

  if (error) {
    return apiError("INTERNAL_ERROR", "Erro ao listar conversas.", 500);
  }

  const hasMore = (data?.length ?? 0) > limit;
  const threads = data?.slice(0, limit) ?? [];
  const nextCursor = hasMore
    ? threads[threads.length - 1]?.updated_at
    : null;

  return apiSuccess({ threads, nextCursor });
});
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/teacher/threads/route.ts
git commit -m "feat(api): add POST and GET /api/teacher/threads"
```

---

## Task 13: API — GET + DELETE /api/teacher/threads/[id]

**Files:**
- Create: `src/app/api/teacher/threads/[id]/route.ts`

- [ ] **Step 1: Implementar GET (detalhe) e DELETE**

```typescript
import { withTeacherRoute } from "@/features/support/with-teacher-route";
import {
  apiSuccess,
  apiNotFound,
  apiError,
} from "@/services/errors/api-response";

export const GET = withTeacherRoute(async ({ supabase }, request) => {
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop();

  const { data: thread, error } = await supabase
    .from("consultant_threads")
    .select("id, agent_slug, title, created_at, updated_at")
    .eq("id", id)
    .single();

  if (error || !thread) {
    return apiNotFound("Conversa não encontrada.");
  }

  // Mensagens são carregadas pelo frontend via Mastra Memory
  // O endpoint retorna apenas metadata da thread
  return apiSuccess({ thread });
});

export const DELETE = withTeacherRoute(async ({ supabase }, request) => {
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop();

  // Verificar que a thread existe (RLS garante ownership)
  const { data: thread, error: fetchError } = await supabase
    .from("consultant_threads")
    .select("id")
    .eq("id", id)
    .single();

  if (fetchError || !thread) {
    return apiNotFound("Conversa não encontrada.");
  }

  // TODO: Deletar thread no Mastra Memory (LibSQL)
  // Quando @mastra/memory expuser um método de delete, adicionar aqui.
  // Por enquanto, as mensagens órfãs no LibSQL não causam problemas
  // pois são acessadas apenas via threadId.

  // Deletar metadata no Supabase
  const { error: deleteError } = await supabase
    .from("consultant_threads")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return apiError("INTERNAL_ERROR", "Erro ao deletar conversa.", 500);
  }

  return apiSuccess({ deleted: true });
});
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/teacher/threads/[id]/route.ts
git commit -m "feat(api): add GET and DELETE /api/teacher/threads/[id]"
```

---

## Task 14: API — POST /api/teacher/threads/[id]/messages (streaming)

**Files:**
- Create: `src/app/api/teacher/threads/[id]/messages/route.ts`

- [ ] **Step 1: Implementar endpoint de mensagem com streaming**

```typescript
import { z } from "zod";
import { after } from "next/server";
import { withTeacherRoute } from "@/features/support/with-teacher-route";
import { createTeaConsultantAgent } from "@/mastra/agents/tea-consultant-agent";
import { generateThreadTitle } from "@/features/support/thread-title";
import { createMastraModel } from "@/mastra/providers/provider-factory";
import type { AiModelRecord } from "@/mastra/providers/model-registry";
import {
  apiValidationError,
  apiNotFound,
  apiError,
} from "@/services/errors/api-response";

export const maxDuration = 60;

const messageSchema = z.object({
  content: z.string().min(1).max(2000),
});

export const POST = withTeacherRoute(async ({ supabase, userId }, request) => {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const threadId = segments[segments.indexOf("threads") + 1];

  // Validar input
  const body = await request.json();
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError(parsed.error);
  }

  // Verificar ownership da thread (RLS)
  const { data: thread, error: threadError } = await supabase
    .from("consultant_threads")
    .select("id, agent_slug, title")
    .eq("id", threadId)
    .single();

  if (threadError || !thread) {
    return apiNotFound("Conversa não encontrada.");
  }

  // Resolver modelo do agente (mapear snake_case do Supabase → camelCase)
  const { data: rawModels } = await supabase
    .from("ai_models")
    .select("*")
    .eq("enabled", true);

  if (!rawModels || rawModels.length === 0) {
    return apiError("INTERNAL_ERROR", "Nenhum modelo de IA configurado.", 500);
  }

  const models: AiModelRecord[] = rawModels.map((m: Record<string, unknown>) => ({
    id: m.id as string,
    name: m.name as string,
    provider: m.provider as string,
    modelId: m.model_id as string,
    baseUrl: m.base_url as string,
    apiKey: m.api_key as string,
    enabled: m.enabled as boolean,
    isDefault: m.is_default as boolean,
  }));

  // Usar modelo default ou primeiro habilitado
  const modelRecord = models.find((m) => m.isDefault) ?? models[0];
  const model = createMastraModel(modelRecord);

  // Criar agente
  const agent = createTeaConsultantAgent(model);

  // Stream da resposta
  const result = await agent.stream(parsed.data.content, {
    threadId,
    resourceId: userId,
  });

  // Gerar título após primeira mensagem + atualizar updated_at (em background)
  // Usamos result.text (promise que resolve com a resposta completa)
  // em paralelo ao streaming — não bloqueia a response.
  after(async () => {
    try {
      if (!thread.title) {
        const fullResponse = await result.text;
        const title = await generateThreadTitle(
          model,
          parsed.data.content,
          fullResponse,
        );
        await supabase
          .from("consultant_threads")
          .update({ title, updated_at: new Date().toISOString() })
          .eq("id", threadId);
      } else {
        await supabase
          .from("consultant_threads")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", threadId);
      }
    } catch {
      // Fallback: usar mensagem do professor truncada
      const title =
        parsed.data.content.length <= 80
          ? parsed.data.content
          : parsed.data.content.slice(0, 77) + "...";
      await supabase
        .from("consultant_threads")
        .update({ title, updated_at: new Date().toISOString() })
        .eq("id", threadId);
    }
  });

  return result.toDataStreamResponse();
});
```

> **Nota sobre streaming**: `agent.stream()` do Mastra retorna um objeto com `toDataStreamResponse()` que gera a Response com streaming. O frontend consome via `useChat` do `ai` SDK ou via `ReadableStream` manual.

- [ ] **Step 2: Commit**

```bash
git add src/app/api/teacher/threads/[id]/messages/route.ts
git commit -m "feat(api): add POST /api/teacher/threads/[id]/messages with streaming"
```

---

## Task 15: Atualizar sidebar do professor

**Files:**
- Modify: `src/app-shell/authenticated/teacher-shell.tsx`

- [ ] **Step 1: Adicionar item "Agentes IA de Suporte" ao sidebar**

No import, adicionar `MessageCircle` (ou `Bot`) do lucide-react:

```typescript
import { LayoutGrid, FilePlus, LogOut, User, Bot } from "lucide-react";
```

Atualizar o tipo `activeNav` para incluir `"support"`:

```typescript
activeNav?: "dashboard" | "new-exam" | "results" | "support";
```

Adicionar ao array `navigationItems`:

```typescript
const navigationItems = [
  { id: "dashboard" as const, label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { id: "new-exam" as const, label: "Nova Prova", href: "/exams/new", icon: FilePlus },
  { id: "support" as const, label: "Agentes IA de Suporte", href: "/support", icon: Bot },
];
```

- [ ] **Step 2: Verificar build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/app-shell/authenticated/teacher-shell.tsx
git commit -m "feat(nav): add AI support agents item to teacher sidebar"
```

---

## Task 16: Página de listagem de agentes (/support)

**Files:**
- Create: `src/features/support/components/agent-card.tsx`
- Create: `src/app/(auth)/support/page.tsx`

- [ ] **Step 1: Criar componente AgentCard**

```tsx
import Link from "next/link";
import { Bot } from "lucide-react";
import type { SupportAgentInfo } from "@/features/support/support-agents";

export function AgentCard({ agent }: { agent: SupportAgentInfo }) {
  return (
    <Link
      href={`/support/${agent.slug}`}
      className="group flex flex-col gap-3 rounded-2xl border border-border-default bg-white p-6 transition-all hover:border-brand-300 hover:shadow-soft"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100">
        <Bot className="h-6 w-6" />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-text-primary">
          {agent.name}
        </h3>
        <p className="text-sm leading-relaxed text-text-secondary">
          {agent.description}
        </p>
      </div>
    </Link>
  );
}
```

- [ ] **Step 2: Criar página /support**

```tsx
import { TeacherShell } from "@/app-shell/authenticated/teacher-shell";
import { SUPPORT_AGENTS } from "@/features/support/support-agents";
import { AgentCard } from "@/features/support/components/agent-card";

export default function SupportPage() {
  return (
    <TeacherShell
      title="Agentes IA de Suporte"
      description="Converse com agentes especializados para tirar dúvidas sobre adaptação de avaliações."
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Agentes IA de Suporte", href: "/support" },
      ]}
      activeNav="support"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SUPPORT_AGENTS.map((agent) => (
          <AgentCard key={agent.slug} agent={agent} />
        ))}
      </div>
    </TeacherShell>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/support/components/agent-card.tsx src/app/(auth)/support/page.tsx
git commit -m "feat(ui): add support agents listing page"
```

---

## Task 17: Página de listagem de threads (/support/[agentSlug])

**Files:**
- Create: `src/features/support/components/thread-list.tsx`
- Create: `src/app/(auth)/support/[agentSlug]/page.tsx`

- [ ] **Step 1: Criar componente ThreadList (client component)**

```tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Trash2, MessageCircle } from "lucide-react";
import { Button } from "@/design-system/components/button";

interface ThreadItem {
  id: string;
  title: string | null;
  updated_at: string;
}

export function ThreadList({ agentSlug }: { agentSlug: string }) {
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchThreads();
  }, [agentSlug]);

  async function fetchThreads() {
    setLoading(true);
    const res = await fetch(
      `/api/teacher/threads?agentSlug=${agentSlug}`,
    );
    const json = await res.json();
    setThreads(json.data?.threads ?? []);
    setLoading(false);
  }

  async function createThread() {
    setCreating(true);
    const res = await fetch("/api/teacher/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentSlug }),
    });
    const json = await res.json();
    if (json.data?.threadId) {
      window.location.href = `/support/${agentSlug}/${json.data.threadId}`;
    }
    setCreating(false);
  }

  async function deleteThread(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta conversa?")) return;

    await fetch(`/api/teacher/threads/${id}`, { method: "DELETE" });
    setThreads((prev) => prev.filter((t) => t.id !== id));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-text-secondary">
        Carregando conversas...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <Button
          variant="accent"
          size="md"
          onClick={createThread}
          disabled={creating}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          {creating ? "Criando..." : "Nova conversa"}
        </Button>
      </div>

      {threads.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border-default py-16 text-center">
          <MessageCircle className="h-10 w-10 text-text-muted" />
          <p className="text-sm text-text-secondary">
            Nenhuma conversa ainda. Clique em "Nova conversa" para começar.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {threads.map((thread) => (
            <div
              key={thread.id}
              className="flex items-center justify-between rounded-xl border border-border-default bg-white px-4 py-3 transition-colors hover:border-brand-200"
            >
              <Link
                href={`/support/${agentSlug}/${thread.id}`}
                className="flex-1"
              >
                <p className="text-sm font-medium text-text-primary">
                  {thread.title ?? "Conversa sem título"}
                </p>
                <p className="text-xs text-text-muted">
                  {new Date(thread.updated_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </Link>
              <button
                onClick={() => deleteThread(thread.id)}
                className="ml-3 rounded-lg p-2 text-text-muted transition-colors hover:bg-red-50 hover:text-red-600"
                aria-label="Excluir conversa"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Criar página /support/[agentSlug]**

```tsx
import { notFound } from "next/navigation";
import { TeacherShell } from "@/app-shell/authenticated/teacher-shell";
import { getSupportAgent } from "@/features/support/support-agents";
import { ThreadList } from "@/features/support/components/thread-list";

type Props = {
  params: Promise<{ agentSlug: string }>;
};

export default async function AgentThreadsPage({ params }: Props) {
  const { agentSlug } = await params;
  const agent = getSupportAgent(agentSlug);

  if (!agent) {
    notFound();
  }

  return (
    <TeacherShell
      title={agent.name}
      description={agent.description}
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Agentes IA de Suporte", href: "/support" },
        { label: agent.name, href: `/support/${agentSlug}` },
      ]}
      activeNav="support"
    >
      <ThreadList agentSlug={agentSlug} />
    </TeacherShell>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/support/components/thread-list.tsx src/app/(auth)/support/[agentSlug]/page.tsx
git commit -m "feat(ui): add thread listing page with create/delete"
```

---

## Task 18: Componentes de chat — Markdown, mensagem, input

**Files:**
- Create: `src/features/support/components/markdown-renderer.tsx`
- Create: `src/features/support/components/chat-message.tsx`
- Create: `src/features/support/components/chat-input.tsx`

- [ ] **Step 1: Criar Markdown renderer**

```tsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => (
          <ul className="mb-2 ml-4 list-disc last:mb-0">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-2 ml-4 list-decimal last:mb-0">{children}</ol>
        ),
        li: ({ children }) => <li className="mb-1">{children}</li>,
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        blockquote: ({ children }) => (
          <blockquote className="mb-2 border-l-2 border-brand-300 pl-3 text-text-secondary italic last:mb-0">
            {children}
          </blockquote>
        ),
        code: ({ children, className }) => {
          const isBlock = className?.includes("language-");
          if (isBlock) {
            return (
              <pre className="mb-2 overflow-x-auto rounded-lg bg-surface-dark p-3 text-sm text-white last:mb-0">
                <code>{children}</code>
              </pre>
            );
          }
          return (
            <code className="rounded bg-surface-muted px-1.5 py-0.5 text-sm">
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
```

- [ ] **Step 2: Criar componente ChatMessage**

```tsx
import { Bot, User } from "lucide-react";
import { MarkdownRenderer } from "./markdown-renderer";

type ChatMessageProps = {
  role: "user" | "assistant";
  content: string;
};

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser
            ? "bg-brand-100 text-brand-600"
            : "bg-surface-muted text-text-secondary"
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-brand-600 text-white"
            : "bg-white border border-border-default text-text-primary"
        }`}
      >
        {isUser ? (
          <p>{content}</p>
        ) : (
          <MarkdownRenderer content={content} />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Criar componente ChatInput**

```tsx
"use client";

import { useRef } from "react";
import { Send } from "lucide-react";

type ChatInputProps = {
  onSend: (message: string) => void;
  disabled: boolean;
};

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit() {
    const value = textareaRef.current?.value.trim();
    if (!value || disabled) return;

    onSend(value);
    if (textareaRef.current) {
      textareaRef.current.value = "";
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleInput() {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 160) + "px";
    }
  }

  return (
    <div className="flex items-end gap-2 rounded-2xl border border-border-default bg-white p-2">
      <textarea
        ref={textareaRef}
        placeholder="Digite sua mensagem..."
        rows={1}
        maxLength={2000}
        disabled={disabled}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none disabled:opacity-50"
      />
      <button
        onClick={handleSubmit}
        disabled={disabled}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
        aria-label="Enviar mensagem"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/features/support/components/markdown-renderer.tsx src/features/support/components/chat-message.tsx src/features/support/components/chat-input.tsx
git commit -m "feat(ui): add chat message, markdown renderer, and input components"
```

---

## Task 19: Interface de chat completa + página

**Files:**
- Create: `src/features/support/components/chat-interface.tsx`
- Create: `src/app/(auth)/support/[agentSlug]/[threadId]/page.tsx`

- [ ] **Step 1: Criar ChatInterface (client component com streaming)**

```tsx
"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef } from "react";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { Loader2 } from "lucide-react";

type ChatInterfaceProps = {
  threadId: string;
  agentSlug: string;
};

export function ChatInterface({ threadId, agentSlug }: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, append } =
    useChat({
      api: `/api/teacher/threads/${threadId}/messages`,
      body: { threadId },
    });

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  function handleSend(content: string) {
    append({ role: "user", content });
  }

  return (
    <div className="flex h-[calc(100vh-14rem)] flex-col lg:h-[calc(100vh-12rem)]">
      {/* Área de mensagens */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-2 py-4"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              role={message.role as "user" | "assistant"}
              content={message.content}
            />
          ))}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              Digitando...
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="mx-auto w-full max-w-3xl px-2 pb-4">
        <ChatInput onSend={handleSend} disabled={isLoading} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Criar página de chat**

> **Nota de design**: A página de chat usa layout full-screen intencionalmente (sem `TeacherShell`/sidebar). Isso maximiza espaço para a conversa, especialmente em mobile. O botão "Voltar" no header permite retornar à listagem de threads, que tem a sidebar.

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSupportAgent } from "@/features/support/support-agents";
import { ChatInterface } from "@/features/support/components/chat-interface";

type Props = {
  params: Promise<{ agentSlug: string; threadId: string }>;
};

export default async function ChatPage({ params }: Props) {
  const { agentSlug, threadId } = await params;
  const agent = getSupportAgent(agentSlug);

  if (!agent) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border-default bg-white/90 px-4 py-3 backdrop-blur-md">
        <Link
          href={`/support/${agentSlug}`}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-muted"
          aria-label="Voltar para conversas"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-sm font-semibold text-text-primary">
            {agent.name}
          </h1>
        </div>
      </header>

      {/* Chat */}
      <main className="flex-1">
        <ChatInterface threadId={threadId} agentSlug={agentSlug} />
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/support/components/chat-interface.tsx src/app/(auth)/support/[agentSlug]/[threadId]/page.tsx
git commit -m "feat(ui): add chat interface page with streaming support"
```

---

## Task 20: Build final + verificação

**Files:** Nenhum novo — apenas verificação.

- [ ] **Step 1: Verificar build completo**

```bash
npm run build
```

Corrigir quaisquer erros de tipo ou importação.

- [ ] **Step 2: Verificar que todas as rotas existem**

```bash
ls -la src/app/api/teacher/threads/
ls -la src/app/api/teacher/threads/\[id\]/
ls -la src/app/api/teacher/threads/\[id\]/messages/
ls -la src/app/\(auth\)/support/
ls -la src/app/\(auth\)/support/\[agentSlug\]/
ls -la src/app/\(auth\)/support/\[agentSlug\]/\[threadId\]/
```

- [ ] **Step 3: Rodar testes**

```bash
npm test
```

Garantir que nenhum teste existente quebrou com as mudanças no observability.

- [ ] **Step 4: Commit final se houve correções**

```bash
git add -u
git commit -m "fix: resolve build and test issues from TEA support thread integration"
```
