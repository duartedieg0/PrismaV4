# Contexto: Migracao do Consultor TEA para Claude Managed Agents

> Este documento contem todo o contexto necessario para entender e executar os epicos desta migracao. Deve ser fornecido como referencia em qualquer sessao de desenvolvimento.

---

## 1. O que e o PRISMA

**"Adapte Minha Prova"** e uma plataforma educacional brasileira que ajuda professores a adaptar provas para alunos com necessidades especiais, particularmente Transtorno do Espectro Autista (TEA).

**Stack:** Next.js 16.2 (TypeScript) + Supabase (PostgreSQL + Auth + Storage) + Mastra (orquestracao de IA) + Vercel (deploy)

**Funcionalidades principais:**
- Upload e extracao automatica de questoes de PDFs
- Adaptacao de questoes via agentes de IA por tipo de suporte educacional
- Consultor TEA (chatbot RAG) para tirar duvidas de professores
- Evolucao automatica de prompts baseada em feedback

---

## 2. Implementacao Atual do Consultor TEA

O Consultor TEA e um chatbot com RAG (Retrieval-Augmented Generation) que responde duvidas de professores sobre adaptacao de avaliacoes para alunos com TEA.

### 2.1 Arquitetura atual

```
Frontend (React)
  useChat hook (AI SDK) + DefaultChatTransport
    ↓
  POST /api/teacher/threads/[id]/messages
    ↓
  withTeacherRoute (auth middleware)
    ↓
  Resolve modelo da tabela ai_models (Supabase)
    ↓
  createTeaConsultantAgent(model)
    ↓
  agent.stream(message, { memory: { thread, resource } })
    ├─ Mastra Memory (LibSQLStore) — carrega ultimas 20 mensagens
    ├─ teaQueryTool — vector search na knowledge base
    └─ LLM gera resposta com citacoes
    ↓
  createUIMessageStream → SSE → Frontend
    ↓
  after() → gerar titulo + atualizar updated_at
```

### 2.2 Arquivos da implementacao atual

**Agente e prompt:**
- `src/mastra/agents/tea-consultant-agent.ts` — Factory que cria agente Mastra com memory, tools e model
- `src/mastra/prompts/tea-consultant-prompt.ts` — System prompt em portugues (versao `tea-consultant@v1`)

**RAG (Knowledge Base):**
- `src/mastra/rag/vector-store.ts` — LibSQLVector com OpenAI embeddings (`text-embedding-3-small`, 1536 dims)
- `src/mastra/rag/chunker.ts` — Segmentacao semantica de Markdown por headers `##`/`###`, detecta tipo (principio, regra, anti-padrao, exemplo, legislacao, geral)
- `src/mastra/rag/tea-query-tool.ts` — `createVectorQueryTool` que busca no indice `tea-knowledge-base`
- `src/mastra/rag/ingest.ts` — Script CLI para ingestao: le .md → chunk → embed → upsert

**API Routes:**
- `src/app/api/teacher/threads/route.ts` — POST (criar thread) e GET (listar threads com paginacao cursor-based)
- `src/app/api/teacher/threads/[id]/route.ts` — GET (detalhe) e DELETE (remover thread)
- `src/app/api/teacher/threads/[id]/messages/route.ts` — POST (enviar mensagem + stream) e GET (historico)

**Feature layer:**
- `src/features/support/with-teacher-route.ts` — Middleware de autenticacao (extrai user do Supabase)
- `src/features/support/thread-title.ts` — Gera titulo da thread via AI SDK `generateText()`
- `src/features/support/support-agents.ts` — Registry de agentes de suporte (slug, nome, descricao)
- `src/features/support/components/chat-interface.tsx` — UI do chat (useChat + history load + streaming)
- `src/features/support/components/chat-message.tsx` — Componente de mensagem (user/assistant)
- `src/features/support/components/chat-input.tsx` — Textarea com auto-resize, max 2000 chars
- `src/features/support/components/markdown-renderer.tsx` — Renderizador Markdown (react-markdown + remark-gfm)

**Dominio:**
- `src/domains/support/contracts.ts` — Tipos: `ConsultantAgentSlug`, `ConsultantThread`, `isValidAgentSlug()`

**Banco de dados:**
- `supabase/migrations/00014_consultant_threads.sql` — Tabela `consultant_threads`

**Modelo:**
- `src/mastra/providers/model-registry.ts` — Resolucao dinamica de modelo (default ou primeiro habilitado)
- `src/mastra/providers/provider-factory.ts` — Cria instancia OpenAI-compatible

### 2.3 Codigo-fonte dos arquivos principais

#### tea-consultant-agent.ts
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
    id: "tea-consultant-storage",
    url: MASTRA_DB_URL,
    authToken: MASTRA_DB_TOKEN || undefined,
  });

  const memory = new Memory({
    storage,
    options: { lastMessages: 20 },
  });

  const teaQueryTool = createTeaQueryTool();

  return new Agent({
    id: "tea-consultant-agent",
    name: "Agente Consultor TEA",
    instructions: TEA_CONSULTANT_INSTRUCTIONS,
    model,
    memory,
    tools: { teaQueryTool: teaQueryTool as unknown as Tool },
  });
}
```

#### tea-consultant-prompt.ts
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

#### tea-query-tool.ts
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
    model: embeddingModel,
    description:
      "Busca informações sobre TEA (Transtorno do Espectro Autista), adaptação de avaliações, legislação brasileira de educação inclusiva e boas práticas pedagógicas na base de conhecimento.",
  });
}
```

#### vector-store.ts
```typescript
import { LibSQLVector } from "@mastra/libsql";
import { openai } from "@ai-sdk/openai";

const VECTOR_DB_URL = process.env.VECTOR_DB_URL ?? "http://127.0.0.1:8080";
const VECTOR_DB_TOKEN = process.env.VECTOR_DB_TOKEN ?? "";
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL ?? "text-embedding-3-small";

export function createVectorStore() {
  return new LibSQLVector({
    id: "tea-vector-store",
    url: VECTOR_DB_URL,
    authToken: VECTOR_DB_TOKEN || undefined,
  });
}

export function getEmbeddingModel() {
  return openai.embedding(EMBEDDING_MODEL);
}
```

#### chunker.ts
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
        type: detectType(`${currentSection} ${currentSubsection}`, text),
      },
    });
    currentContent = [];
  }

  for (const line of lines) {
    const h2Match = line.match(/^## (.+)/);
    const h3Match = line.match(/^### (.+)/);
    if (h2Match) { flushChunk(); currentSection = h2Match[1].trim(); currentSubsection = ""; continue; }
    if (h3Match) { flushChunk(); currentSubsection = h3Match[1].trim(); continue; }
    if (line.match(/^# /)) continue;
    currentContent.push(line);
  }

  flushChunk();
  return chunks;
}
```

#### POST /api/teacher/threads/[id]/messages (rota completa)
```typescript
import { z } from "zod";
import { after } from "next/server";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { LibSQLStore } from "@mastra/libsql";
import { withTeacherRoute } from "@/features/support/with-teacher-route";
import { createTeaConsultantAgent } from "@/mastra/agents/tea-consultant-agent";
import { generateThreadTitle } from "@/features/support/thread-title";
import { createMastraModel } from "@/mastra/providers/provider-factory";
import type { AiModelRecord } from "@/mastra/providers/model-registry";
import { apiSuccess, apiValidationError, apiNotFound, apiError } from "@/services/errors/api-response";

const MASTRA_DB_URL = process.env.MASTRA_DB_URL ?? "http://127.0.0.1:8080";
const MASTRA_DB_TOKEN = process.env.MASTRA_DB_TOKEN ?? "";

export const maxDuration = 60;

const useChatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.string(),
      parts: z.array(z.object({ type: z.string(), text: z.string().optional() }).passthrough()).optional(),
      content: z.string().optional(),
    }).passthrough(),
  ).min(1),
});

export const POST = withTeacherRoute(async ({ supabase, userId }, request) => {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const threadId = segments[segments.indexOf("threads") + 1];

  const body = await request.json();
  const parsed = useChatSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error);

  const lastMessage = parsed.data.messages[parsed.data.messages.length - 1];
  const userContent =
    lastMessage.content ??
    lastMessage.parts?.filter((p) => p.type === "text" && p.text).map((p) => p.text).join("") ?? "";

  if (!userContent || userContent.length === 0 || userContent.length > 2000) {
    return apiError("VALIDATION_ERROR", "Mensagem inválida (vazia ou muito longa).", 400);
  }

  const { data: thread, error: threadError } = await supabase
    .from("consultant_threads").select("id, agent_slug, title").eq("id", threadId).single();
  if (threadError || !thread) return apiNotFound("Conversa não encontrada.");

  const { data: rawModels } = await supabase.from("ai_models").select("*").eq("enabled", true);
  if (!rawModels || rawModels.length === 0) {
    return apiError("INTERNAL_ERROR", "Nenhum modelo de IA configurado.", 500);
  }

  const models: AiModelRecord[] = rawModels.map((m: Record<string, unknown>) => ({
    id: m.id as string, name: m.name as string, provider: m.provider as string,
    modelId: m.model_id as string, baseUrl: m.base_url as string, apiKey: m.api_key as string,
    enabled: m.enabled as boolean, isDefault: m.is_default as boolean,
  }));

  const modelRecord = models.find((m) => m.isDefault) ?? models[0];
  const model = createMastraModel(modelRecord);
  const agent = createTeaConsultantAgent(model);

  const result = await agent.stream(userContent, {
    memory: { thread: threadId, resource: userId },
  });

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const textId = "text-0";
      writer.write({ type: "start" });
      writer.write({ type: "text-start", id: textId });
      const reader = result.textStream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          writer.write({ type: "text-delta", id: textId, delta: value });
        }
      } finally { reader.releaseLock(); }
      writer.write({ type: "text-end", id: textId });
      writer.write({ type: "finish" });
    },
  });

  after(async () => {
    try {
      if (!thread.title) {
        const fullResponse = await result.text;
        const title = await generateThreadTitle(model, userContent, fullResponse);
        await supabase.from("consultant_threads").update({ title, updated_at: new Date().toISOString() }).eq("id", threadId);
      } else {
        await supabase.from("consultant_threads").update({ updated_at: new Date().toISOString() }).eq("id", threadId);
      }
    } catch {
      const title = userContent.length <= 80 ? userContent : userContent.slice(0, 77) + "...";
      await supabase.from("consultant_threads").update({ title, updated_at: new Date().toISOString() }).eq("id", threadId);
    }
  });

  return createUIMessageStreamResponse({ stream });
});

export const GET = withTeacherRoute(async ({ supabase, userId }, request) => {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const threadId = segments[segments.indexOf("threads") + 1];

  const { data: thread, error: threadError } = await supabase
    .from("consultant_threads").select("id").eq("id", threadId).single();
  if (threadError || !thread) return apiNotFound("Conversa não encontrada.");

  try {
    const storage = new LibSQLStore({
      id: "tea-consultant-storage", url: MASTRA_DB_URL, authToken: MASTRA_DB_TOKEN || undefined,
    });
    const memoryStore = await storage.getStore("memory");
    if (!memoryStore) return apiSuccess({ messages: [] });

    const result = await memoryStore.listMessages({ threadId, resourceId: userId });
    const messages = result.messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => {
        const textContent = m.content?.parts
          ?.filter((p: Record<string, unknown>) => p.type === "text" && p.text)
          .map((p: Record<string, unknown>) => p.text).join("") ?? "";
        return { id: m.id, role: m.role, content: textContent, createdAt: m.createdAt };
      });
    return apiSuccess({ messages });
  } catch { return apiSuccess({ messages: [] }); }
});
```

#### POST /api/teacher/threads (rota completa)
```typescript
import { z } from "zod";
import { withTeacherRoute } from "@/features/support/with-teacher-route";
import { isValidAgentSlug } from "@/domains/support/contracts";
import { apiSuccess, apiValidationError, apiError } from "@/services/errors/api-response";

const createThreadSchema = z.object({ agentSlug: z.string().min(1) });

export const POST = withTeacherRoute(async ({ supabase, userId }, request) => {
  const body = await request.json();
  const parsed = createThreadSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error);
  if (!isValidAgentSlug(parsed.data.agentSlug)) {
    return apiError("VALIDATION_ERROR", "Agente não encontrado.", 400);
  }

  const { data, error } = await supabase
    .from("consultant_threads")
    .insert({ teacher_id: userId, agent_slug: parsed.data.agentSlug })
    .select("id").single();

  if (error) return apiError("INTERNAL_ERROR", "Erro ao criar conversa.", 500);
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

  if (agentSlug) query = query.eq("agent_slug", agentSlug);
  if (cursor) query = query.lt("updated_at", cursor);

  const { data, error } = await query;
  if (error) return apiError("INTERNAL_ERROR", "Erro ao listar conversas.", 500);

  const hasMore = (data?.length ?? 0) > limit;
  const threads = data?.slice(0, limit) ?? [];
  const nextCursor = hasMore ? threads[threads.length - 1]?.updated_at : null;
  return apiSuccess({ threads, nextCursor });
});
```

#### chat-interface.tsx
```tsx
"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { Loader2 } from "lucide-react";

type ChatInterfaceProps = { threadId: string; agentSlug: string };
type HistoryMessage = { id: string; role: "user" | "assistant"; content: string; createdAt: string };

export function ChatInterface({ threadId, agentSlug }: ChatInterfaceProps) {
  const [initialMessages, setInitialMessages] = useState<UIMessage[] | null>(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch(`/api/teacher/threads/${threadId}/messages`);
        if (!res.ok) { setInitialMessages([]); return; }
        const json = await res.json();
        const history: HistoryMessage[] = json.data?.messages ?? [];
        const uiMessages: UIMessage[] = history.map((m) => ({
          id: m.id, role: m.role,
          parts: [{ type: "text" as const, text: m.content }],
          createdAt: new Date(m.createdAt),
        }));
        setInitialMessages(uiMessages);
      } catch { setInitialMessages([]); }
    }
    loadHistory();
  }, [threadId]);

  if (initialMessages === null) {
    return (
      <div className="flex h-[calc(100vh-14rem)] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />Carregando conversa...</div>
      </div>
    );
  }

  return <ChatReady threadId={threadId} initialMessages={initialMessages} />;
}

function ChatReady({ threadId, initialMessages }: { threadId: string; initialMessages: UIMessage[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const transport = useMemo(() => new DefaultChatTransport({ api: `/api/teacher/threads/${threadId}/messages` }), [threadId]);
  const { messages, status, sendMessage } = useChat({ transport, messages: initialMessages });
  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function handleSend(content: string) { sendMessage({ text: content }); }

  function getMessageContent(message: (typeof messages)[number]): string {
    return message.parts.filter((p): p is { type: "text"; text: string } => p.type === "text").map((p) => p.text).join("");
  }

  return (
    <div className="flex h-[calc(100vh-14rem)] flex-col lg:h-[calc(100vh-12rem)]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-2 py-4">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} role={message.role as "user" | "assistant"} content={getMessageContent(message)} />
          ))}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Loader2 className="h-4 w-4 animate-spin" />Digitando...</div>
          )}
        </div>
      </div>
      <div className="mx-auto w-full max-w-3xl px-2 pb-4">
        <ChatInput onSend={handleSend} disabled={isLoading} />
      </div>
    </div>
  );
}
```

#### thread-title.ts
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
  } catch { return fallbackTitle(userMessage); }
}

function fallbackTitle(userMessage: string): string {
  const clean = userMessage.replace(/\s+/g, " ").trim();
  if (clean.length <= 80) return clean;
  return clean.slice(0, 77) + "...";
}
```

#### with-teacher-route.ts
```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/gateways/supabase/server";
import { apiUnauthorized, apiInternalError } from "@/services/errors/api-response";
import { logError } from "@/services/observability/logger";
import { createRequestContext } from "@/services/runtime/request-context";

export type TeacherContext = { supabase: SupabaseClient; userId: string };
type TeacherRouteHandler = (ctx: TeacherContext, request: Request) => Promise<Response>;

export function withTeacherRoute(handler: TeacherRouteHandler) {
  return async (request: Request, routeContext?: { params: Promise<Record<string, string>> }) => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return apiUnauthorized();
    try {
      return await handler({ supabase, userId: user.id }, request);
    } catch (error) {
      logError("Erro em rota do professor", createRequestContext(), error);
      return apiInternalError();
    }
  };
}
```

#### contracts.ts
```typescript
export const CONSULTANT_AGENT_SLUGS = ["tea-consultant"] as const;
export type ConsultantAgentSlug = (typeof CONSULTANT_AGENT_SLUGS)[number];

export function isValidAgentSlug(slug: string): slug is ConsultantAgentSlug {
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

#### Migracao do banco (00014_consultant_threads.sql)
```sql
CREATE TABLE consultant_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  agent_slug TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_consultant_threads_teacher_agent
  ON consultant_threads (teacher_id, agent_slug, updated_at DESC);

ALTER TABLE consultant_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers see own threads"
  ON consultant_threads FOR SELECT USING (teacher_id = auth.uid());
CREATE POLICY "Teachers create own threads"
  ON consultant_threads FOR INSERT WITH CHECK (teacher_id = auth.uid());
CREATE POLICY "Teachers update own threads"
  ON consultant_threads FOR UPDATE USING (teacher_id = auth.uid());
CREATE POLICY "Teachers delete own threads"
  ON consultant_threads FOR DELETE USING (teacher_id = auth.uid());
CREATE POLICY "Admins see all threads"
  ON consultant_threads FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
```

### 2.4 Dependencias npm relevantes

```json
{
  "@mastra/core": "^1.15.0",
  "@mastra/libsql": "^1.7.1",
  "@mastra/memory": "^1.12.1",
  "@mastra/rag": "^2.1.3",
  "@ai-sdk/openai": "^3.0.47",
  "@ai-sdk/react": "^3.0.144",
  "ai": "latest",
  "@supabase/supabase-js": "^2.95.3"
}
```

### 2.5 Variaveis de ambiente atuais

```
MASTRA_DB_URL        — LibSQL para memory e vector store (default: http://127.0.0.1:8080)
MASTRA_DB_TOKEN      — Auth token LibSQL
VECTOR_DB_URL        — Vector store (tipicamente igual ao MASTRA_DB_URL)
VECTOR_DB_TOKEN      — Auth token vector store
EMBEDDING_MODEL      — Modelo de embedding (default: text-embedding-3-small)
```

---

## 3. O que e Claude Managed Agents

Infraestrutura gerenciada da Anthropic para rodar Claude como agente autonomo. Ao inves de construir agent loop, tool execution e runtime proprios, voce ganha um ambiente cloud completo.

**Status:** Beta (`managed-agents-2026-04-01`). Memory, Outcomes e Multi-agent sao research preview.

### 3.1 Conceitos centrais

| Conceito | Descricao |
|----------|-----------|
| **Agent** | Definicao reutilizavel: modelo, system prompt, tools, MCP servers |
| **Environment** | Template de container cloud: packages, networking |
| **Session** | Instancia do agent em execucao dentro de um environment |
| **Events** | Mensagens trocadas entre a aplicacao e o agent (user events + agent events) |
| **Memory Store** | Colecao de documentos de texto persistentes entre sessions |

### 3.2 Fluxo basico

1. Criar Agent (uma vez) → retorna `agent_id`
2. Criar Environment (uma vez) → retorna `environment_id`
3. Criar Session (por conversa) → referencia agent + environment → retorna `session_id`
4. Enviar `user.message` event → Agent processa autonomamente
5. Receber agent events via SSE stream (`agent.message`, `agent.tool_use`, `session.status_idle`)

### 3.3 Tools built-in

| Tool | Descricao |
|------|-----------|
| bash | Executar comandos shell |
| read | Ler arquivos |
| write | Escrever arquivos |
| edit | Editar arquivos |
| glob | Buscar arquivos por padrao |
| grep | Buscar conteudo em arquivos |
| web_fetch | Buscar conteudo de URLs |
| web_search | Buscar na web |

Quando um Memory Store esta attached, o agent ganha acesso automatico a:
| Tool | Descricao |
|------|-----------|
| memory_search | Busca full-text no conteudo das memories |
| memory_read | Le conteudo de uma memory |
| memory_list | Lista memories no store |

### 3.4 Memory Store

- Colecao de documentos de texto (memories) com path hierarquico
- Attached a session via `resources[]`
- Acesso `read_only` ou `read_write`
- Limite: 100KB por memory, 8 stores por session
- Busca full-text operada pelo proprio Claude (sem embeddings)
- CRUD via API: `memories.write()`, `memories.list()`, `memories.retrieve()`
- Versionamento imutavel para auditoria

### 3.5 Session usage e custos

O objeto session retornado por `sessions.retrieve()` inclui:

```json
{
  "usage": {
    "input_tokens": 5000,
    "output_tokens": 3200,
    "cache_creation_input_tokens": 2000,
    "cache_read_input_tokens": 20000
  },
  "stats": {
    "active_seconds": 15,
    "duration_seconds": 45
  }
}
```

Custos calculados a partir de tokens. Nao ha campo monetario na API.

### 3.6 Event types relevantes

**User events (enviados pela aplicacao):**
- `user.message` — mensagem com conteudo de texto

**Agent events (recebidos via stream):**
- `agent.message` — resposta com blocos de texto
- `agent.tool_use` — agente invocou uma tool
- `agent.tool_result` — resultado da execucao de tool

**Session events:**
- `session.status_running` — processando
- `session.status_idle` — terminou, aguardando input
- `session.status_terminated` — erro irrecuperavel

**Span events:**
- `span.model_request_end` — chamada ao modelo concluida, inclui `model_usage` com tokens

### 3.7 SDK TypeScript

```bash
npm install @anthropic-ai/sdk
```

```typescript
import Anthropic from "@anthropic-ai/sdk";
const client = new Anthropic(); // usa ANTHROPIC_API_KEY do env

// Criar agent
const agent = await client.beta.agents.create({
  name: "...", model: "claude-sonnet-4-6", system: "...",
  tools: [{ type: "agent_toolset_20260401" }],
});

// Criar environment
const env = await client.beta.environments.create({
  name: "...", config: { type: "cloud", networking: { type: "unrestricted" } },
});

// Criar memory store
const store = await client.beta.memoryStores.create({
  name: "...", description: "...",
});

// Escrever memory
await client.beta.memoryStores.memories.write(store.id, {
  path: "/doc/section.md", content: "...",
});

// Criar session com memory store
const session = await client.beta.sessions.create({
  agent: agent.id, environment_id: env.id,
  resources: [{
    type: "memory_store", memory_store_id: store.id,
    access: "read_only", prompt: "...",
  }],
});

// Enviar mensagem
await client.beta.sessions.events.send(session.id, {
  events: [{ type: "user.message", content: [{ type: "text", text: "..." }] }],
});

// Stream de eventos
const stream = await client.beta.sessions.events.stream(session.id);
for await (const event of stream) {
  if (event.type === "agent.message") { /* texto da resposta */ }
  if (event.type === "session.status_idle") { break; }
}

// Listar eventos (historico)
for await (const event of client.beta.sessions.events.list(session.id)) {
  // ...
}

// Buscar usage
const retrieved = await client.beta.sessions.retrieve(session.id);
console.log(retrieved.usage); // { input_tokens, output_tokens, ... }
```

### 3.8 Rate limits

| Operacao | Limite |
|----------|--------|
| Create (agents, sessions, environments) | 60 req/min |
| Read (retrieve, list, stream) | 600 req/min |

---

## 4. Decisoes Arquiteturais da Migracao

### 4.1 Backend Adapter Pattern

O frontend (`ChatInterface`, `useChat`, `DefaultChatTransport`) nao sera alterado. As API routes Next.js continuam como fachada, trocando Mastra por Managed Agents internamente. Isso garante:
- Rollback por troca de import
- Frontend inalterado
- Migracao incremental

### 4.2 Feature flag

`CONSULTANT_BACKEND` env var controla qual backend usar (`mastra` | `managed`). Default: `mastra`. Removida apos validacao.

### 4.3 Conversao de streaming

O Managed Agent emite eventos SSE diferentes do formato `UIMessageStream` que o `useChat` espera. A API route converte em tempo real:

```
Managed Agent SSE                    UIMessageStream
─────────────────                    ────────────────
session.status_running           →   (ignorado)
agent.tool_use (memory_search)   →   (ignorado — transparente)
agent.message { text }           →   text-delta { delta: text }
session.status_idle              →   finish
```

### 4.4 Mapeamento thread ↔ session

A tabela `consultant_threads` ganha coluna `managed_session_id` (TEXT, nullable). Threads Mastra tem NULL; threads Managed tem `sess_...`. O lookup e feito pelo `threadId` do Supabase, que resolve o `sessionId` para chamadas a API Anthropic.

### 4.5 Knowledge base: vector → full-text

A knowledge base migra de LibSQLVector (embeddings + cosine similarity) para Memory Store (full-text search operado por Claude). O chunker existente e reutilizado para manter a mesma granularidade. Uma validacao de qualidade de busca e feita antes de prosseguir.

### 4.6 Modelo fixo

Hoje o modelo e dinamico (tabela `ai_models`). Com Managed Agents, o modelo e fixo no agent (`claude-sonnet-4-6`). O admin perde a opcao de trocar modelo do consultor pela UI. Os demais workflows (extracao, analise, adaptacao) nao sao afetados e continuam com modelo dinamico.

### 4.7 Geracao de titulo

A funcao `generateThreadTitle()` continua usando AI SDK + modelo Mastra (tabela `ai_models`). Funciona independente do backend do consultor. Nao e necessario migrar essa funcionalidade.
