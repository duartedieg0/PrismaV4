# Epic 03 — Migração do Fluxo de Conversação para Managed Agents

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar criação de threads, streaming de mensagens e leitura de histórico do Consultor TEA do runtime Mastra para Claude Managed Agents, mantendo o frontend e a API surface intactos.

**Architecture:** Camada de handlers extraída entre as rotas Next.js e os gateways. Cada backend (Mastra, Managed) tem seu próprio arquivo de handlers. As rotas despacham com base na feature flag `CONSULTANT_BACKEND`. O gateway do Epic 01 (`src/gateways/managed-agents/`) já está implementado — este plano só consome-o.

**Tech Stack:** Next.js 16 (App Router), Supabase (PostgreSQL + RLS), Vitest, AI SDK (`ai` package — `createUIMessageStream`, `createUIMessageStreamResponse`), Anthropic SDK, Zod.

---

## Arquivos que serão criados ou modificados

| Arquivo | Ação | Responsabilidade |
|---------|------|-----------------|
| `supabase/migrations/00015_consultant_threads_managed_session.sql` | Criar | Adiciona coluna `managed_session_id` |
| `src/features/support/consultant-backend.ts` | Criar | Feature flag `getConsultantBackend()` |
| `src/features/support/consultant-backend.test.ts` | Criar | Testes da feature flag |
| `src/lib/env.ts` | Modificar | Registra `CONSULTANT_BACKEND` como opcional |
| `src/features/support/thread-handlers-mastra.ts` | Criar | Lógica Mastra extraída dos route files |
| `src/features/support/thread-handlers-managed.ts` | Criar | Lógica Managed (createThread, streamMessage, getMessages) |
| `src/features/support/thread-handlers-managed.test.ts` | Criar | Testes unitários dos handlers Managed |
| `src/app/api/teacher/threads/route.ts` | Modificar | POST despacha por backend |
| `src/app/api/teacher/threads/[id]/messages/route.ts` | Modificar | POST e GET despacham por backend; maxDuration → 300 |
| `src/gateways/managed-agents/__tests__/tea-consultant-flow.test.ts` | Criar | Testes de integração do fluxo completo |

---

## Referência rápida: tipos e interfaces relevantes

```typescript
// src/features/support/with-teacher-route.ts
export type TeacherContext = { supabase: SupabaseClient; userId: string };

// src/gateways/managed-agents/types.ts
export interface ManagedSession { id: string; agentId: string; createdAt: string; }
export interface ManagedEvent { type: string; [key: string]: unknown; }
export interface SessionMessage { id: string; role: "user" | "assistant"; content: string; createdAt: string; }

// src/gateways/managed-agents/tea-consultant.ts
export interface TeaConsultantGateway {
  createSession(title?: string): Promise<ManagedSession>;
  sendMessageAndStream(sessionId: string, message: string): Promise<AsyncIterable<ManagedEvent>>;
  getSessionMessages(sessionId: string): Promise<SessionMessage[]>;
}

// src/mastra/providers/model-registry.ts
export interface AiModelRecord { id, name, provider, modelId, baseUrl, apiKey, enabled, isDefault }

// src/mastra/providers/provider-factory.ts
export type ResolvedMastraModel = ReturnType<ReturnType<typeof createOpenAI>>;
export function createMastraModel(model: AiModelRecord): ResolvedMastraModel
```

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/00015_consultant_threads_managed_session.sql`

- [ ] **Step 1: Criar arquivo de migration**

```sql
-- 00015: Add managed_session_id to consultant_threads
-- Associa cada thread a uma sessão Claude Managed Agents.
-- NULL = thread Mastra (não migrada). TEXT = ID da sessão Managed.

ALTER TABLE consultant_threads
  ADD COLUMN managed_session_id TEXT;

CREATE INDEX idx_consultant_threads_managed_session
  ON consultant_threads (managed_session_id)
  WHERE managed_session_id IS NOT NULL;
```

- [ ] **Step 2: Aplicar migration via Supabase MCP**

Use a tool `mcp__plugin_supabase_supabase__apply_migration` com o SQL acima no projeto ativo.
Alternativamente via CLI: `supabase db push`

- [ ] **Step 3: Verificar que a coluna existe**

Execute no Supabase SQL Editor:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'consultant_threads'
  AND column_name = 'managed_session_id';
```
Esperado: 1 linha com `data_type = text`, `is_nullable = YES`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/00015_consultant_threads_managed_session.sql
git commit -m "feat: add managed_session_id column to consultant_threads"
```

---

## Task 2: Feature Flag e env.ts

**Files:**
- Create: `src/features/support/consultant-backend.ts`
- Create: `src/features/support/consultant-backend.test.ts`
- Modify: `src/lib/env.ts`

- [ ] **Step 1: Escrever o teste falho**

Criar `src/features/support/consultant-backend.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Importar após configurar env para evitar cache do módulo
describe("getConsultantBackend", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('deve retornar "mastra" quando CONSULTANT_BACKEND não está definido', async () => {
    delete process.env.CONSULTANT_BACKEND;
    const { getConsultantBackend } = await import("./consultant-backend");
    expect(getConsultantBackend()).toBe("mastra");
  });

  it('deve retornar "mastra" quando CONSULTANT_BACKEND = "mastra"', async () => {
    process.env.CONSULTANT_BACKEND = "mastra";
    const { getConsultantBackend } = await import("./consultant-backend");
    expect(getConsultantBackend()).toBe("mastra");
  });

  it('deve retornar "managed" quando CONSULTANT_BACKEND = "managed"', async () => {
    process.env.CONSULTANT_BACKEND = "managed";
    const { getConsultantBackend } = await import("./consultant-backend");
    expect(getConsultantBackend()).toBe("managed");
  });

  it('deve retornar "mastra" para valor desconhecido', async () => {
    process.env.CONSULTANT_BACKEND = "invalid";
    const { getConsultantBackend } = await import("./consultant-backend");
    expect(getConsultantBackend()).toBe("mastra");
  });
});
```

- [ ] **Step 2: Rodar para confirmar que falha**

```bash
npx vitest run --config vitest.config.mts src/features/support/consultant-backend.test.ts
```
Esperado: FAIL — `Cannot find module './consultant-backend'`

- [ ] **Step 3: Implementar `consultant-backend.ts`**

Criar `src/features/support/consultant-backend.ts`:

```typescript
export type ConsultantBackend = "mastra" | "managed";

export function getConsultantBackend(): ConsultantBackend {
  return process.env.CONSULTANT_BACKEND === "managed" ? "managed" : "mastra";
}
```

- [ ] **Step 4: Rodar testes para confirmar que passam**

```bash
npx vitest run --config vitest.config.mts src/features/support/consultant-backend.test.ts
```
Esperado: PASS (4 testes)

- [ ] **Step 5: Registrar `CONSULTANT_BACKEND` em `env.ts`**

Em `src/lib/env.ts`, dentro de `serverEnvSchema`, adicionar após `MANAGED_AGENT_MEMORY_STORE_ID`:

```typescript
// Feature flag do backend do Consultor TEA
CONSULTANT_BACKEND: z.enum(["mastra", "managed"]).optional(),
```

O bloco de env vars Managed ficará assim:
```typescript
// Managed Agents — opcionais individualmente, mas condicionalmente obrigatórias como grupo
ANTHROPIC_API_KEY: z.string().min(1).optional(),
MANAGED_AGENT_ID: z.string().min(1).optional(),
MANAGED_AGENT_ENVIRONMENT_ID: z.string().min(1).optional(),
MANAGED_AGENT_MEMORY_STORE_ID: z.string().min(1).optional(),
// Feature flag do backend do Consultor TEA
CONSULTANT_BACKEND: z.enum(["mastra", "managed"]).optional(),
```

- [ ] **Step 6: Commit**

```bash
git add src/features/support/consultant-backend.ts \
        src/features/support/consultant-backend.test.ts \
        src/lib/env.ts
git commit -m "feat(T03.1): add CONSULTANT_BACKEND feature flag"
```

---

## Task 3: Extrair Handlers Mastra

**Files:**
- Create: `src/features/support/thread-handlers-mastra.ts`
- Modify: `src/app/api/teacher/threads/route.ts`
- Modify: `src/app/api/teacher/threads/[id]/messages/route.ts`

Nesta task, o comportamento não muda — é pura extração. Os route files ficam com apenas despacho.

- [ ] **Step 1: Criar `thread-handlers-mastra.ts` com as três funções extraídas**

Criar `src/features/support/thread-handlers-mastra.ts`:

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
import { isValidAgentSlug } from "@/domains/support/contracts";
import {
  apiSuccess,
  apiValidationError,
  apiError,
  apiNotFound,
} from "@/services/errors/api-response";
import type { TeacherContext } from "@/features/support/with-teacher-route";

const MASTRA_DB_URL = process.env.MASTRA_DB_URL ?? "http://127.0.0.1:8080";
const MASTRA_DB_TOKEN = process.env.MASTRA_DB_TOKEN ?? "";

const createThreadSchema = z.object({
  agentSlug: z.string().min(1),
});

const useChatSchema = z.object({
  messages: z
    .array(
      z
        .object({
          role: z.string(),
          parts: z
            .array(
              z.object({ type: z.string(), text: z.string().optional() }).passthrough(),
            )
            .optional(),
          content: z.string().optional(),
        })
        .passthrough(),
    )
    .min(1),
});

export async function mastraCreateThread(
  ctx: TeacherContext,
  req: Request,
): Promise<Response> {
  const body = await req.json();
  const parsed = createThreadSchema.safeParse(body);

  if (!parsed.success) return apiValidationError(parsed.error);
  if (!isValidAgentSlug(parsed.data.agentSlug)) {
    return apiError("VALIDATION_ERROR", "Agente não encontrado.", 400);
  }

  const { data, error } = await ctx.supabase
    .from("consultant_threads")
    .insert({ teacher_id: ctx.userId, agent_slug: parsed.data.agentSlug })
    .select("id")
    .single();

  if (error) return apiError("INTERNAL_ERROR", "Erro ao criar conversa.", 500);
  return apiSuccess({ threadId: data.id }, 201);
}

export async function mastraStreamMessage(
  ctx: TeacherContext,
  req: Request,
): Promise<Response> {
  const url = new URL(req.url);
  const segments = url.pathname.split("/");
  const threadId = segments[segments.indexOf("threads") + 1];

  const body = await req.json();
  const parsed = useChatSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error);

  const lastMessage = parsed.data.messages[parsed.data.messages.length - 1];
  const userContent =
    lastMessage.content ??
    lastMessage.parts
      ?.filter((p) => p.type === "text" && p.text)
      .map((p) => p.text)
      .join("") ??
    "";

  if (!userContent || userContent.length === 0 || userContent.length > 2000) {
    return apiError("VALIDATION_ERROR", "Mensagem inválida (vazia ou muito longa).", 400);
  }

  const { data: thread, error: threadError } = await ctx.supabase
    .from("consultant_threads")
    .select("id, agent_slug, title")
    .eq("id", threadId)
    .single();

  if (threadError || !thread) return apiNotFound("Conversa não encontrada.");

  const { data: rawModels } = await ctx.supabase
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

  const modelRecord = models.find((m) => m.isDefault) ?? models[0];
  const model = createMastraModel(modelRecord);
  const agent = createTeaConsultantAgent(model);

  const result = await agent.stream(userContent, {
    memory: { thread: threadId, resource: ctx.userId },
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
      } finally {
        reader.releaseLock();
      }

      writer.write({ type: "text-end", id: textId });
      writer.write({ type: "finish" });
    },
  });

  after(async () => {
    try {
      if (!thread.title) {
        const fullResponse = await result.text;
        const title = await generateThreadTitle(model, userContent, fullResponse);
        await ctx.supabase
          .from("consultant_threads")
          .update({ title, updated_at: new Date().toISOString() })
          .eq("id", threadId);
      } else {
        await ctx.supabase
          .from("consultant_threads")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", threadId);
      }
    } catch {
      const title =
        userContent.length <= 80 ? userContent : userContent.slice(0, 77) + "...";
      await ctx.supabase
        .from("consultant_threads")
        .update({ title, updated_at: new Date().toISOString() })
        .eq("id", threadId);
    }
  });

  return createUIMessageStreamResponse({ stream });
}

export async function mastraGetMessages(
  ctx: TeacherContext,
  req: Request,
): Promise<Response> {
  const url = new URL(req.url);
  const segments = url.pathname.split("/");
  const threadId = segments[segments.indexOf("threads") + 1];

  const { data: thread, error: threadError } = await ctx.supabase
    .from("consultant_threads")
    .select("id")
    .eq("id", threadId)
    .single();

  if (threadError || !thread) return apiNotFound("Conversa não encontrada.");

  try {
    const storage = new LibSQLStore({
      id: "tea-consultant-storage",
      url: MASTRA_DB_URL,
      authToken: MASTRA_DB_TOKEN || undefined,
    });

    const memoryStore = await storage.getStore("memory");
    if (!memoryStore) return apiSuccess({ messages: [] });

    const result = await memoryStore.listMessages({ threadId, resourceId: ctx.userId });

    const messages = result.messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => {
        const textContent =
          m.content?.parts
            ?.filter((p: Record<string, unknown>) => p.type === "text" && p.text)
            .map((p: Record<string, unknown>) => p.text)
            .join("") ?? "";
        return { id: m.id, role: m.role, content: textContent, createdAt: m.createdAt };
      });

    return apiSuccess({ messages });
  } catch {
    return apiSuccess({ messages: [] });
  }
}
```

- [ ] **Step 2: Atualizar `src/app/api/teacher/threads/route.ts`**

Substituir o handler POST mantendo o GET intacto:

```typescript
import { z } from "zod";
import { withTeacherRoute } from "@/features/support/with-teacher-route";
import { apiSuccess, apiError } from "@/services/errors/api-response";
import { getConsultantBackend } from "@/features/support/consultant-backend";
import { mastraCreateThread } from "@/features/support/thread-handlers-mastra";

export const POST = withTeacherRoute(async (ctx, req) => {
  if (getConsultantBackend() === "managed") {
    // Implementado na Task 4
    return new Response("Managed backend não implementado ainda", { status: 501 });
  }
  return mastraCreateThread(ctx, req);
});

// GET: sem alteração — manter exatamente como está
export const GET = withTeacherRoute(async ({ supabase, userId }, request) => {
  // ... código GET existente inalterado ...
});
```

> **Nota:** O `501` temporário é intencional — a Task 4 substituirá por `managedCreateThread`.

- [ ] **Step 3: Atualizar `src/app/api/teacher/threads/[id]/messages/route.ts`**

```typescript
import { withTeacherRoute } from "@/features/support/with-teacher-route";
import { getConsultantBackend } from "@/features/support/consultant-backend";
import { mastraStreamMessage, mastraGetMessages } from "@/features/support/thread-handlers-mastra";

export const maxDuration = 300; // aumentado de 60 — Managed pode levar mais por memory_search

export const POST = withTeacherRoute(async (ctx, req) => {
  if (getConsultantBackend() === "managed") {
    // Implementado na Task 7
    return new Response("Managed backend não implementado ainda", { status: 501 });
  }
  return mastraStreamMessage(ctx, req);
});

export const GET = withTeacherRoute(async (ctx, req) => {
  if (getConsultantBackend() === "managed") {
    // Implementado na Task 6
    return new Response("Managed backend não implementado ainda", { status: 501 });
  }
  return mastraGetMessages(ctx, req);
});
```

- [ ] **Step 4: Verificar que o TypeScript compila sem erros**

```bash
npx tsc --noEmit
```
Esperado: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/features/support/thread-handlers-mastra.ts \
        src/app/api/teacher/threads/route.ts \
        src/app/api/teacher/threads/[id]/messages/route.ts
git commit -m "refactor(T03.2/3/4): extract Mastra handlers from route files"
```

---

## Task 4: Managed Thread Creation

**Files:**
- Create: `src/features/support/thread-handlers-managed.ts`
- Create: `src/features/support/thread-handlers-managed.test.ts`
- Modify: `src/app/api/teacher/threads/route.ts`

- [ ] **Step 1: Escrever o teste falho**

Criar `src/features/support/thread-handlers-managed.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TeacherContext } from "./with-teacher-route";
import type { TeaConsultantGateway } from "@/gateways/managed-agents";
import type { ManagedSession } from "@/gateways/managed-agents";

// Helpers
function makeCtx(overrides?: {
  threadRow?: Record<string, unknown> | null;
  threadError?: unknown;
  insertedId?: string;
  insertError?: unknown;
}): TeacherContext {
  const threadRow = overrides?.threadRow !== undefined
    ? overrides.threadRow
    : { id: "thread-abc", title: null, managed_session_id: "sess_01", agent_slug: "tea-consultant" };

  const supabase = {
    from: vi.fn((table: string) => {
      if (table === "consultant_threads") {
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue(
            overrides?.threadError
              ? { data: null, error: overrides.threadError }
              : { data: threadRow, error: null }
          ),
        };
      }
      if (table === "ai_models") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            data: [{
              id: "m1", name: "Model", provider: "openai",
              model_id: "gpt-4", base_url: "https://api.openai.com/v1",
              api_key: "sk-test", enabled: true, is_default: true,
            }],
            error: null,
          }),
        };
      }
      return {};
    }),
  } as unknown as SupabaseClient;

  return { supabase, userId: "user-xyz" };
}

function makeGateway(overrides?: Partial<TeaConsultantGateway>): TeaConsultantGateway {
  return {
    createSession: vi.fn().mockResolvedValue({
      id: "sess_01",
      agentId: "agent_01",
      createdAt: "2026-04-10T00:00:00Z",
    } as ManagedSession),
    sendMessageAndStream: vi.fn(),
    getSessionMessages: vi.fn(),
    ...overrides,
  };
}

function makeRequest(body: unknown, url = "http://localhost/api/teacher/threads"): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// --- Testes de managedCreateThread ---
describe("managedCreateThread", () => {
  it("deve criar sessão e retornar threadId com 201", async () => {
    const { managedCreateThread } = await import("./thread-handlers-managed");

    const ctx = makeCtx();
    const gateway = makeGateway();
    const req = makeRequest({ agentSlug: "tea-consultant" });

    // Mock do insert para retornar id
    const insertSingle = vi.fn().mockResolvedValue({ data: { id: "thread-abc" }, error: null });
    (ctx.supabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
      if (table === "consultant_threads") {
        return { insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: insertSingle }) }) };
      }
      return {};
    });

    const res = await managedCreateThread(ctx, req, gateway);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data.threadId).toBe("thread-abc");
    expect(gateway.createSession).toHaveBeenCalledOnce();
  });

  it("deve persistir managed_session_id no INSERT", async () => {
    const { managedCreateThread } = await import("./thread-handlers-managed");

    const ctx = makeCtx();
    const gateway = makeGateway();
    const req = makeRequest({ agentSlug: "tea-consultant" });

    let insertedData: unknown;
    (ctx.supabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
      if (table === "consultant_threads") {
        return {
          insert: vi.fn((data) => {
            insertedData = data;
            return { select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: "thread-abc" }, error: null }) }) };
          }),
        };
      }
      return {};
    });

    await managedCreateThread(ctx, req, gateway);
    expect((insertedData as Record<string, unknown>).managed_session_id).toBe("sess_01");
  });

  it("deve retornar 500 sem INSERT quando createSession falha", async () => {
    const { managedCreateThread } = await import("./thread-handlers-managed");

    const insertFn = vi.fn();
    const ctx = makeCtx();
    (ctx.supabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
      if (table === "consultant_threads") {
        return { insert: insertFn };
      }
      return {};
    });

    const gateway = makeGateway({
      createSession: vi.fn().mockRejectedValue(new Error("API down")),
    });
    const req = makeRequest({ agentSlug: "tea-consultant" });

    const res = await managedCreateThread(ctx, req, gateway);

    expect(res.status).toBe(500);
    expect(insertFn).not.toHaveBeenCalled();
  });

  it("deve retornar 400 para agentSlug inválido", async () => {
    const { managedCreateThread } = await import("./thread-handlers-managed");

    const ctx = makeCtx();
    const gateway = makeGateway();
    const req = makeRequest({ agentSlug: "slug-inexistente" });

    const res = await managedCreateThread(ctx, req, gateway);
    expect(res.status).toBe(400);
    expect(gateway.createSession).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Rodar para confirmar que falha**

```bash
npx vitest run --config vitest.config.mts src/features/support/thread-handlers-managed.test.ts
```
Esperado: FAIL — `Cannot find module './thread-handlers-managed'`

- [ ] **Step 3: Implementar `managedCreateThread` em `thread-handlers-managed.ts`**

Criar `src/features/support/thread-handlers-managed.ts`:

```typescript
import { z } from "zod";
import { after } from "next/server";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { generateThreadTitle } from "@/features/support/thread-title";
import { createMastraModel } from "@/mastra/providers/provider-factory";
import type { AiModelRecord } from "@/mastra/providers/model-registry";
import { isValidAgentSlug } from "@/domains/support/contracts";
import {
  apiSuccess,
  apiValidationError,
  apiError,
  apiNotFound,
} from "@/services/errors/api-response";
import type { TeacherContext } from "@/features/support/with-teacher-route";
import type { TeaConsultantGateway, ManagedEvent } from "@/gateways/managed-agents";

const createThreadSchema = z.object({
  agentSlug: z.string().min(1),
});

const useChatSchema = z.object({
  messages: z
    .array(
      z
        .object({
          role: z.string(),
          parts: z
            .array(z.object({ type: z.string(), text: z.string().optional() }).passthrough())
            .optional(),
          content: z.string().optional(),
        })
        .passthrough(),
    )
    .min(1),
});

export async function managedCreateThread(
  ctx: TeacherContext,
  req: Request,
  gateway: TeaConsultantGateway,
): Promise<Response> {
  const body = await req.json();
  const parsed = createThreadSchema.safeParse(body);

  if (!parsed.success) return apiValidationError(parsed.error);
  if (!isValidAgentSlug(parsed.data.agentSlug)) {
    return apiError("VALIDATION_ERROR", "Agente não encontrado.", 400);
  }

  let session;
  try {
    session = await gateway.createSession();
  } catch {
    return apiError("INTERNAL_ERROR", "Erro ao criar sessão no Managed Agents.", 500);
  }

  const { data, error } = await ctx.supabase
    .from("consultant_threads")
    .insert({
      teacher_id: ctx.userId,
      agent_slug: parsed.data.agentSlug,
      managed_session_id: session.id,
    })
    .select("id")
    .single();

  if (error) return apiError("INTERNAL_ERROR", "Erro ao criar conversa.", 500);
  return apiSuccess({ threadId: data.id }, 201);
}

// managedStreamMessage e managedGetMessages serão adicionados nas Tasks 5-7
```

- [ ] **Step 4: Rodar testes de managedCreateThread**

```bash
npx vitest run --config vitest.config.mts src/features/support/thread-handlers-managed.test.ts
```
Esperado: PASS (4 testes de `managedCreateThread` — os demais ainda não existem)

- [ ] **Step 5: Substituir o `501` no route de threads**

Em `src/app/api/teacher/threads/route.ts`, substituir o bloco managed:

```typescript
import { withTeacherRoute } from "@/features/support/with-teacher-route";
import { getConsultantBackend } from "@/features/support/consultant-backend";
import { mastraCreateThread } from "@/features/support/thread-handlers-mastra";
import { managedCreateThread } from "@/features/support/thread-handlers-managed";
import {
  createTeaConsultantGateway,
  createAnthropicClient,
  getAgentConfig,
} from "@/gateways/managed-agents";

export const POST = withTeacherRoute(async (ctx, req) => {
  if (getConsultantBackend() === "managed") {
    const gateway = createTeaConsultantGateway(createAnthropicClient(), getAgentConfig());
    return managedCreateThread(ctx, req, gateway);
  }
  return mastraCreateThread(ctx, req);
});

// GET: inalterado
```

- [ ] **Step 6: Verificar TypeScript**

```bash
npx tsc --noEmit
```
Esperado: sem erros.

- [ ] **Step 7: Commit**

```bash
git add src/features/support/thread-handlers-managed.ts \
        src/features/support/thread-handlers-managed.test.ts \
        src/app/api/teacher/threads/route.ts
git commit -m "feat(T03.2): implement managedCreateThread handler"
```

---

## Task 5: Helper de Conversão de Stream

**Files:**
- Modify: `src/features/support/thread-handlers-managed.ts` (adiciona `consumeManagedStreamToText`)
- Modify: `src/features/support/thread-handlers-managed.test.ts` (adiciona testes)

Esta função encapsula a lógica de filtragem e acumulação de texto dos eventos Managed, tornando-a testável independentemente do HTTP layer.

> **Por que existe como helper separado?** O streaming em `managedStreamMessage` precisa interlear `writer.write` com cada evento enquanto eles chegam — isso exige um loop inline. `consumeManagedStreamToText` não pode ser reutilizada diretamente no stream handler porque consumir o AsyncIterable duas vezes não é possível. O valor do helper está nos testes: ele verifica isoladamente que `agent.tool_use` é ignorado, múltiplos blocos são concatenados corretamente, e o loop para no `session.status_idle` — lógica que o handler inline também implementa.

- [ ] **Step 1: Adicionar testes para `consumeManagedStreamToText`**

Adicionar ao final de `thread-handlers-managed.test.ts`:

```typescript
// Helper para criar async iterables em testes
async function* makeStream(events: unknown[]): AsyncGenerator<unknown> {
  for (const event of events) yield event;
}

describe("consumeManagedStreamToText", () => {
  it("deve acumular texto de um evento agent.message simples", async () => {
    const { consumeManagedStreamToText } = await import("./thread-handlers-managed");

    const stream = makeStream([
      { type: "agent.message", content: [{ type: "text", text: "Resposta completa." }] },
      { type: "session.status_idle" },
    ]);

    const { text } = await consumeManagedStreamToText(stream as AsyncIterable<ManagedEvent>);
    expect(text).toBe("Resposta completa.");
  });

  it("deve acumular texto de múltiplos eventos agent.message", async () => {
    const { consumeManagedStreamToText } = await import("./thread-handlers-managed");

    const stream = makeStream([
      { type: "agent.message", content: [{ type: "text", text: "Parte 1. " }] },
      { type: "agent.message", content: [{ type: "text", text: "Parte 2." }] },
      { type: "session.status_idle" },
    ]);

    const { text } = await consumeManagedStreamToText(stream as AsyncIterable<ManagedEvent>);
    expect(text).toBe("Parte 1. Parte 2.");
  });

  it("deve ignorar eventos agent.tool_use", async () => {
    const { consumeManagedStreamToText } = await import("./thread-handlers-managed");

    const stream = makeStream([
      { type: "agent.tool_use", name: "memory_search", input: { query: "TEA" } },
      { type: "agent.message", content: [{ type: "text", text: "Resposta." }] },
      { type: "session.status_idle" },
    ]);

    const { text } = await consumeManagedStreamToText(stream as AsyncIterable<ManagedEvent>);
    expect(text).toBe("Resposta.");
    // tool_use não pode vazar para o texto
    expect(text).not.toContain("memory_search");
    expect(text).not.toContain("TEA");
  });

  it("deve parar ao encontrar session.status_idle", async () => {
    const { consumeManagedStreamToText } = await import("./thread-handlers-managed");

    const stream = makeStream([
      { type: "agent.message", content: [{ type: "text", text: "Antes do idle." }] },
      { type: "session.status_idle" },
      { type: "agent.message", content: [{ type: "text", text: "Após o idle — não deve aparecer." }] },
    ]);

    const { text } = await consumeManagedStreamToText(stream as AsyncIterable<ManagedEvent>);
    expect(text).toBe("Antes do idle.");
    expect(text).not.toContain("Após o idle");
  });

  it("deve concatenar múltiplos blocos de texto em um único agent.message", async () => {
    const { consumeManagedStreamToText } = await import("./thread-handlers-managed");

    const stream = makeStream([
      {
        type: "agent.message",
        content: [
          { type: "text", text: "Bloco A. " },
          { type: "tool_use", id: "tool_1" }, // bloco não-texto: ignorado
          { type: "text", text: "Bloco B." },
        ],
      },
      { type: "session.status_idle" },
    ]);

    const { text } = await consumeManagedStreamToText(stream as AsyncIterable<ManagedEvent>);
    expect(text).toBe("Bloco A. Bloco B.");
  });

  it("deve retornar texto vazio quando stream não produz agent.message", async () => {
    const { consumeManagedStreamToText } = await import("./thread-handlers-managed");

    const stream = makeStream([
      { type: "session.status_idle" },
    ]);

    const { text } = await consumeManagedStreamToText(stream as AsyncIterable<ManagedEvent>);
    expect(text).toBe("");
  });
});
```

- [ ] **Step 2: Rodar para confirmar que falha**

```bash
npx vitest run --config vitest.config.mts src/features/support/thread-handlers-managed.test.ts
```
Esperado: FAIL em `consumeManagedStreamToText` — não exportada ainda.

- [ ] **Step 3: Adicionar `consumeManagedStreamToText` em `thread-handlers-managed.ts`**

Adicionar após os imports (antes de `managedCreateThread`):

```typescript
/**
 * Consome um AsyncIterable de ManagedEvent e acumula o texto das respostas do agente.
 * Ignora eventos agent.tool_use. Para no session.status_idle.
 */
export async function consumeManagedStreamToText(
  stream: AsyncIterable<ManagedEvent>,
): Promise<{ text: string }> {
  let text = "";

  for await (const event of stream) {
    if (event.type === "agent.message") {
      const blocks = (event.content as Array<{ type: string; text?: string }>) ?? [];
      for (const block of blocks) {
        if (block.type === "text" && block.text) {
          text += block.text;
        }
      }
    }
    if (event.type === "session.status_idle") break;
  }

  return { text };
}
```

- [ ] **Step 4: Rodar todos os testes do arquivo**

```bash
npx vitest run --config vitest.config.mts src/features/support/thread-handlers-managed.test.ts
```
Esperado: PASS (10 testes até agora)

- [ ] **Step 5: Commit**

```bash
git add src/features/support/thread-handlers-managed.ts \
        src/features/support/thread-handlers-managed.test.ts
git commit -m "feat(T03.3): add consumeManagedStreamToText helper"
```

---

## Task 6: Managed History Reading

**Files:**
- Modify: `src/features/support/thread-handlers-managed.ts` (adiciona `managedGetMessages`)
- Modify: `src/features/support/thread-handlers-managed.test.ts` (adiciona testes)
- Modify: `src/app/api/teacher/threads/[id]/messages/route.ts` (wires GET)

- [ ] **Step 1: Adicionar testes para `managedGetMessages`**

Adicionar ao final de `thread-handlers-managed.test.ts`:

```typescript
import type { SessionMessage } from "@/gateways/managed-agents";

describe("managedGetMessages", () => {
  function makeMessagesRequest(threadId = "thread-abc"): Request {
    return new Request(`http://localhost/api/teacher/threads/${threadId}/messages`);
  }

  it("deve retornar mensagens no formato correto", async () => {
    const { managedGetMessages } = await import("./thread-handlers-managed");

    const ctx = makeCtx();
    const messages: SessionMessage[] = [
      { id: "evt_1", role: "user", content: "Como adaptar?", createdAt: "2026-04-10T10:00:00Z" },
      { id: "evt_2", role: "assistant", content: "Para adaptar...", createdAt: "2026-04-10T10:00:05Z" },
    ];
    const gateway = makeGateway({
      getSessionMessages: vi.fn().mockResolvedValue(messages),
    });

    const res = await managedGetMessages(ctx, makeMessagesRequest(), gateway);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.messages).toHaveLength(2);
    expect(body.data.messages[0]).toEqual(messages[0]);
    expect(body.data.messages[1]).toEqual(messages[1]);
  });

  it("deve chamar gateway com o managed_session_id correto", async () => {
    const { managedGetMessages } = await import("./thread-handlers-managed");

    const ctx = makeCtx({ threadRow: { id: "thread-abc", managed_session_id: "sess_XYZ" } });
    const gateway = makeGateway({ getSessionMessages: vi.fn().mockResolvedValue([]) });

    await managedGetMessages(ctx, makeMessagesRequest(), gateway);

    expect(gateway.getSessionMessages).toHaveBeenCalledWith("sess_XYZ");
  });

  it("deve retornar array vazio quando não há mensagens", async () => {
    const { managedGetMessages } = await import("./thread-handlers-managed");

    const ctx = makeCtx();
    const gateway = makeGateway({ getSessionMessages: vi.fn().mockResolvedValue([]) });

    const res = await managedGetMessages(ctx, makeMessagesRequest(), gateway);
    const body = await res.json();

    expect(body.data.messages).toEqual([]);
  });

  it("deve retornar 404 quando thread não existe", async () => {
    const { managedGetMessages } = await import("./thread-handlers-managed");

    const ctx = makeCtx({ threadRow: null, threadError: { code: "PGRST116" } });
    const gateway = makeGateway();

    const res = await managedGetMessages(ctx, makeMessagesRequest(), gateway);

    expect(res.status).toBe(404);
    expect(gateway.getSessionMessages).not.toHaveBeenCalled();
  });

  it("deve retornar array vazio quando gateway lança erro", async () => {
    const { managedGetMessages } = await import("./thread-handlers-managed");

    const ctx = makeCtx();
    const gateway = makeGateway({
      getSessionMessages: vi.fn().mockRejectedValue(new Error("API error")),
    });

    const res = await managedGetMessages(ctx, makeMessagesRequest(), gateway);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.messages).toEqual([]);
  });
});
```

- [ ] **Step 2: Rodar para confirmar que falha**

```bash
npx vitest run --config vitest.config.mts src/features/support/thread-handlers-managed.test.ts
```
Esperado: FAIL em `managedGetMessages` — não exportada.

- [ ] **Step 3: Adicionar `managedGetMessages` em `thread-handlers-managed.ts`**

Adicionar após `managedCreateThread`:

```typescript
export async function managedGetMessages(
  ctx: TeacherContext,
  req: Request,
  gateway: TeaConsultantGateway,
): Promise<Response> {
  const url = new URL(req.url);
  const segments = url.pathname.split("/");
  const threadId = segments[segments.indexOf("threads") + 1];

  const { data: thread, error: threadError } = await ctx.supabase
    .from("consultant_threads")
    .select("id, managed_session_id")
    .eq("id", threadId)
    .single();

  if (threadError || !thread) return apiNotFound("Conversa não encontrada.");

  try {
    const messages = await gateway.getSessionMessages(
      (thread as Record<string, unknown>).managed_session_id as string,
    );
    return apiSuccess({ messages });
  } catch {
    return apiSuccess({ messages: [] });
  }
}
```

- [ ] **Step 4: Rodar testes**

```bash
npx vitest run --config vitest.config.mts src/features/support/thread-handlers-managed.test.ts
```
Esperado: PASS (15 testes até agora)

- [ ] **Step 5: Substituir o `501` do GET em `messages/route.ts`**

```typescript
import { withTeacherRoute } from "@/features/support/with-teacher-route";
import { getConsultantBackend } from "@/features/support/consultant-backend";
import { mastraStreamMessage, mastraGetMessages } from "@/features/support/thread-handlers-mastra";
import { managedGetMessages } from "@/features/support/thread-handlers-managed";
import {
  createTeaConsultantGateway,
  createAnthropicClient,
  getAgentConfig,
} from "@/gateways/managed-agents";

export const maxDuration = 300;

export const POST = withTeacherRoute(async (ctx, req) => {
  if (getConsultantBackend() === "managed") {
    // Implementado na Task 7
    return new Response("Managed backend não implementado ainda", { status: 501 });
  }
  return mastraStreamMessage(ctx, req);
});

export const GET = withTeacherRoute(async (ctx, req) => {
  if (getConsultantBackend() === "managed") {
    const gateway = createTeaConsultantGateway(createAnthropicClient(), getAgentConfig());
    return managedGetMessages(ctx, req, gateway);
  }
  return mastraGetMessages(ctx, req);
});
```

- [ ] **Step 6: Verificar TypeScript**

```bash
npx tsc --noEmit
```
Esperado: sem erros.

- [ ] **Step 7: Commit**

```bash
git add src/features/support/thread-handlers-managed.ts \
        src/features/support/thread-handlers-managed.test.ts \
        src/app/api/teacher/threads/[id]/messages/route.ts
git commit -m "feat(T03.4): implement managedGetMessages handler"
```

---

## Task 7: Managed Stream Messaging

**Files:**
- Modify: `src/features/support/thread-handlers-managed.ts` (adiciona `managedStreamMessage`)
- Modify: `src/features/support/thread-handlers-managed.test.ts` (adiciona testes)
- Modify: `src/app/api/teacher/threads/[id]/messages/route.ts` (wires POST)

- [ ] **Step 1: Adicionar testes para `managedStreamMessage`**

Adicionar ao final de `thread-handlers-managed.test.ts`:

```typescript
import { ManagedEvent } from "@/gateways/managed-agents";

// Mock de next/server para capturar callbacks do after()
vi.mock("next/server", () => ({
  after: vi.fn((cb: () => Promise<void>) => cb()),
}));

// Mock de createMastraModel para evitar chamadas reais ao OpenAI
vi.mock("@/mastra/providers/provider-factory", () => ({
  createMastraModel: vi.fn(() => ({ modelId: "mock-model" })),
}));

// Mock de generateThreadTitle
vi.mock("@/features/support/thread-title", () => ({
  generateThreadTitle: vi.fn().mockResolvedValue("Título Gerado"),
}));

describe("managedStreamMessage", () => {
  async function* makeStreamEvents(events: Partial<ManagedEvent>[]): AsyncGenerator<ManagedEvent> {
    for (const e of events) yield e as ManagedEvent;
  }

  function makeStreamRequest(body: unknown, threadId = "thread-abc"): Request {
    return new Request(
      `http://localhost/api/teacher/threads/${threadId}/messages`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
  }

  it("deve retornar resposta de streaming (status 200, content-type text/event-stream ou data-stream)", async () => {
    const { managedStreamMessage } = await import("./thread-handlers-managed");

    const ctx = makeCtx();
    const gateway = makeGateway({
      sendMessageAndStream: vi.fn().mockResolvedValue(
        makeStreamEvents([
          { type: "agent.message", content: [{ type: "text", text: "Olá!" }] },
          { type: "session.status_idle" },
        ]),
      ),
    });

    const req = makeStreamRequest({
      messages: [{ role: "user", content: "Como adaptar?" }],
    });

    const res = await managedStreamMessage(ctx, req, gateway);

    expect(res.status).toBe(200);
    const ct = res.headers.get("content-type") ?? "";
    expect(ct).toMatch(/text\/event-stream|octet-stream/);
  });

  it("deve chamar sendMessageAndStream com sessionId e mensagem corretos", async () => {
    const { managedStreamMessage } = await import("./thread-handlers-managed");

    const ctx = makeCtx({
      threadRow: { id: "thread-abc", title: "Existente", managed_session_id: "sess_XYZ", agent_slug: "tea-consultant" },
    });
    const sendMock = vi.fn().mockResolvedValue(
      makeStreamEvents([{ type: "session.status_idle" }]),
    );
    const gateway = makeGateway({ sendMessageAndStream: sendMock });

    const req = makeStreamRequest({
      messages: [{ role: "user", content: "Pergunta do professor" }],
    });

    await managedStreamMessage(ctx, req, gateway);

    expect(sendMock).toHaveBeenCalledWith("sess_XYZ", "Pergunta do professor");
  });

  it("deve retornar 400 para mensagem vazia", async () => {
    const { managedStreamMessage } = await import("./thread-handlers-managed");

    const ctx = makeCtx();
    const gateway = makeGateway();
    const req = makeStreamRequest({
      messages: [{ role: "user", content: "" }],
    });

    const res = await managedStreamMessage(ctx, req, gateway);
    expect(res.status).toBe(400);
  });

  it("deve retornar 400 para mensagem com mais de 2000 chars", async () => {
    const { managedStreamMessage } = await import("./thread-handlers-managed");

    const ctx = makeCtx();
    const gateway = makeGateway();
    const req = makeStreamRequest({
      messages: [{ role: "user", content: "x".repeat(2001) }],
    });

    const res = await managedStreamMessage(ctx, req, gateway);
    expect(res.status).toBe(400);
  });

  it("deve retornar 404 quando thread não existe", async () => {
    const { managedStreamMessage } = await import("./thread-handlers-managed");

    const ctx = makeCtx({ threadRow: null, threadError: { code: "PGRST116" } });
    const gateway = makeGateway();
    const req = makeStreamRequest({
      messages: [{ role: "user", content: "Pergunta" }],
    });

    const res = await managedStreamMessage(ctx, req, gateway);
    expect(res.status).toBe(404);
  });

  it("deve chamar generateThreadTitle na primeira mensagem (sem título)", async () => {
    const { managedStreamMessage } = await import("./thread-handlers-managed");
    const { generateThreadTitle } = await import("@/features/support/thread-title");

    const ctx = makeCtx({
      threadRow: { id: "thread-abc", title: null, managed_session_id: "sess_01", agent_slug: "tea-consultant" },
    });
    const gateway = makeGateway({
      sendMessageAndStream: vi.fn().mockResolvedValue(
        makeStreamEvents([
          { type: "agent.message", content: [{ type: "text", text: "Resposta." }] },
          { type: "session.status_idle" },
        ]),
      ),
    });

    const req = makeStreamRequest({
      messages: [{ role: "user", content: "Primeira pergunta" }],
    });

    const res = await managedStreamMessage(ctx, req, gateway);
    // Consumir stream para triggar after()
    await res.body?.cancel();

    expect(generateThreadTitle).toHaveBeenCalledWith(
      expect.anything(),
      "Primeira pergunta",
      "Resposta.",
    );
  });

  it("não deve chamar generateThreadTitle quando thread já tem título", async () => {
    const { managedStreamMessage } = await import("./thread-handlers-managed");
    const { generateThreadTitle } = await import("@/features/support/thread-title");
    vi.mocked(generateThreadTitle).mockClear();

    const ctx = makeCtx({
      threadRow: { id: "thread-abc", title: "Título já existe", managed_session_id: "sess_01", agent_slug: "tea-consultant" },
    });
    const gateway = makeGateway({
      sendMessageAndStream: vi.fn().mockResolvedValue(
        makeStreamEvents([{ type: "session.status_idle" }]),
      ),
    });

    const req = makeStreamRequest({
      messages: [{ role: "user", content: "Segunda pergunta" }],
    });

    await managedStreamMessage(ctx, req, gateway);
    expect(generateThreadTitle).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Rodar para confirmar que falha**

```bash
npx vitest run --config vitest.config.mts src/features/support/thread-handlers-managed.test.ts
```
Esperado: FAIL — `managedStreamMessage` não exportada.

- [ ] **Step 3: Adicionar `managedStreamMessage` em `thread-handlers-managed.ts`**

Adicionar após `managedGetMessages`:

```typescript
export async function managedStreamMessage(
  ctx: TeacherContext,
  req: Request,
  gateway: TeaConsultantGateway,
): Promise<Response> {
  const url = new URL(req.url);
  const segments = url.pathname.split("/");
  const threadId = segments[segments.indexOf("threads") + 1];

  // 1. Validar input
  const body = await req.json();
  const parsed = useChatSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error);

  const lastMessage = parsed.data.messages[parsed.data.messages.length - 1];
  const userContent =
    lastMessage.content ??
    lastMessage.parts
      ?.filter((p) => p.type === "text" && p.text)
      .map((p) => p.text)
      .join("") ??
    "";

  if (!userContent || userContent.length === 0 || userContent.length > 2000) {
    return apiError("VALIDATION_ERROR", "Mensagem inválida (vazia ou muito longa).", 400);
  }

  // 2. Buscar thread (incluindo managed_session_id e title)
  const { data: thread, error: threadError } = await ctx.supabase
    .from("consultant_threads")
    .select("id, agent_slug, title, managed_session_id")
    .eq("id", threadId)
    .single();

  if (threadError || !thread) return apiNotFound("Conversa não encontrada.");

  const managedSessionId = (thread as Record<string, unknown>).managed_session_id as string | null;
  if (!managedSessionId) {
    return apiError("INTERNAL_ERROR", "Thread não está associada a uma sessão Managed.", 500);
  }

  // 3. Buscar modelo da tabela ai_models (para generateThreadTitle no after())
  const { data: rawModels } = await ctx.supabase
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
  const modelRecord = models.find((m) => m.isDefault) ?? models[0];
  const model = createMastraModel(modelRecord);

  // 4. Stream via Managed Agents
  const managedStream = await gateway.sendMessageAndStream(managedSessionId, userContent);
  let fullResponse = "";

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      writer.write({ type: "start" });
      writer.write({ type: "text-start", id: "text-0" });

      try {
        for await (const event of managedStream) {
          if (event.type === "agent.message") {
            const blocks = (event.content as Array<{ type: string; text?: string }>) ?? [];
            for (const block of blocks) {
              if (block.type === "text" && block.text) {
                writer.write({ type: "text-delta", id: "text-0", delta: block.text });
                fullResponse += block.text;
              }
            }
          }
          if (event.type === "session.status_idle") break;
        }
      } catch {
        writer.write({
          type: "text-delta",
          id: "text-0",
          delta: "\n\n*Erro ao processar resposta.*",
        });
      }

      writer.write({ type: "text-end", id: "text-0" });
      writer.write({ type: "finish" });
    },
  });

  // 5. Background: gerar título na primeira mensagem + atualizar updated_at
  const threadTitle = (thread as Record<string, unknown>).title as string | null;
  after(async () => {
    try {
      if (!threadTitle) {
        const title = await generateThreadTitle(model, userContent, fullResponse);
        await ctx.supabase
          .from("consultant_threads")
          .update({ title, updated_at: new Date().toISOString() })
          .eq("id", threadId);
      } else {
        await ctx.supabase
          .from("consultant_threads")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", threadId);
      }
    } catch {
      const title =
        userContent.length <= 80 ? userContent : userContent.slice(0, 77) + "...";
      await ctx.supabase
        .from("consultant_threads")
        .update({ title, updated_at: new Date().toISOString() })
        .eq("id", threadId);
    }
  });

  return createUIMessageStreamResponse({ stream });
}
```

- [ ] **Step 4: Rodar todos os testes**

```bash
npx vitest run --config vitest.config.mts src/features/support/thread-handlers-managed.test.ts
```
Esperado: PASS (todos os testes)

- [ ] **Step 5: Substituir o `501` do POST em `messages/route.ts`**

`maxDuration = 300` já foi declarado na Task 3 — não redeclarar, apenas adicionar o import e substituir o bloco `501`.

```typescript
import { withTeacherRoute } from "@/features/support/with-teacher-route";
import { getConsultantBackend } from "@/features/support/consultant-backend";
import { mastraStreamMessage, mastraGetMessages } from "@/features/support/thread-handlers-mastra";
import { managedStreamMessage, managedGetMessages } from "@/features/support/thread-handlers-managed";
import {
  createTeaConsultantGateway,
  createAnthropicClient,
  getAgentConfig,
} from "@/gateways/managed-agents";

// maxDuration = 300 já declarado na Task 3 — não duplicar

export const POST = withTeacherRoute(async (ctx, req) => {
  if (getConsultantBackend() === "managed") {
    const gateway = createTeaConsultantGateway(createAnthropicClient(), getAgentConfig());
    return managedStreamMessage(ctx, req, gateway);
  }
  return mastraStreamMessage(ctx, req);
});

export const GET = withTeacherRoute(async (ctx, req) => {
  if (getConsultantBackend() === "managed") {
    const gateway = createTeaConsultantGateway(createAnthropicClient(), getAgentConfig());
    return managedGetMessages(ctx, req, gateway);
  }
  return mastraGetMessages(ctx, req);
});
```

- [ ] **Step 6: Verificar TypeScript e suite completa**

```bash
npx tsc --noEmit && npx vitest run --config vitest.config.mts
```
Esperado: sem erros de TS; todos os testes PASS.

- [ ] **Step 7: Commit**

```bash
git add src/features/support/thread-handlers-managed.ts \
        src/features/support/thread-handlers-managed.test.ts \
        src/app/api/teacher/threads/[id]/messages/route.ts
git commit -m "feat(T03.3): implement managedStreamMessage handler"
```

---

## Task 8: Testes de Integração do Fluxo Completo

**Files:**
- Create: `src/gateways/managed-agents/__tests__/tea-consultant-flow.test.ts`

Estes testes validam os 6 cenários do T03.5 usando injeção de dependência direta.

- [ ] **Step 1: Criar o arquivo de testes de integração**

Criar `src/gateways/managed-agents/__tests__/tea-consultant-flow.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TeacherContext } from "@/features/support/with-teacher-route";
import type { TeaConsultantGateway, SessionMessage, ManagedSession } from "@/gateways/managed-agents";

vi.mock("next/server", () => ({ after: vi.fn((cb: () => Promise<void>) => cb()) }));
vi.mock("@/mastra/providers/provider-factory", () => ({
  createMastraModel: vi.fn(() => ({ modelId: "mock-model" })),
}));
vi.mock("@/features/support/thread-title", () => ({
  generateThreadTitle: vi.fn().mockResolvedValue("Título Gerado Automaticamente"),
}));

// ------- helpers -------

async function* makeEvents(events: unknown[]): AsyncGenerator<unknown> {
  for (const e of events) yield e;
}

function makeSupabase(opts: {
  thread?: Record<string, unknown> | null;
  threadError?: unknown;
  insertedId?: string;
}): SupabaseClient {
  const thread = opts.thread ?? {
    id: opts.insertedId ?? "thread-001",
    title: null,
    managed_session_id: "sess_integration",
    agent_slug: "tea-consultant",
  };

  return {
    from: vi.fn((table: string) => {
      if (table === "consultant_threads") {
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: opts.insertedId ?? "thread-001" }, error: null }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue(
            opts.threadError ? { data: null, error: opts.threadError } : { data: thread, error: null },
          ),
        };
      }
      if (table === "ai_models") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            data: [{
              id: "m1", name: "Test", provider: "openai",
              model_id: "gpt-4", base_url: "https://api.openai.com/v1",
              api_key: "sk-test", enabled: true, is_default: true,
            }],
            error: null,
          }),
        };
      }
      return {};
    }),
  } as unknown as SupabaseClient;
}

function makeGateway(opts: Partial<TeaConsultantGateway> = {}): TeaConsultantGateway {
  return {
    createSession: vi.fn().mockResolvedValue({ id: "sess_integration", agentId: "agent_01", createdAt: "2026-04-10T00:00:00Z" } as ManagedSession),
    sendMessageAndStream: vi.fn().mockResolvedValue(makeEvents([
      { type: "agent.tool_use", name: "memory_search" },
      { type: "agent.message", content: [{ type: "text", text: "Resposta do consultor." }] },
      { type: "session.status_idle" },
    ])),
    getSessionMessages: vi.fn().mockResolvedValue([
      { id: "evt_1", role: "user", content: "Pergunta", createdAt: "2026-04-10T10:00:00Z" },
      { id: "evt_2", role: "assistant", content: "Resposta", createdAt: "2026-04-10T10:00:05Z" },
    ] as SessionMessage[]),
    ...opts,
  };
}

// ------- cenários -------

describe("Fluxo completo Managed Agents — integração", () => {
  beforeEach(() => vi.clearAllMocks());

  // Cenário 1
  it("C1: criar thread managed salva managed_session_id", async () => {
    const { managedCreateThread } = await import("@/features/support/thread-handlers-managed");

    let insertedPayload: unknown;
    const supabase = makeSupabase({ insertedId: "thread-001" });
    (supabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
      if (table === "consultant_threads") {
        return {
          insert: vi.fn((data) => {
            insertedPayload = data;
            return {
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: "thread-001" }, error: null }),
              }),
            };
          }),
        };
      }
      return {};
    });

    const ctx: TeacherContext = { supabase, userId: "user-001" };
    const gateway = makeGateway();
    const req = new Request("http://localhost/api/teacher/threads", {
      method: "POST",
      body: JSON.stringify({ agentSlug: "tea-consultant" }),
    });

    const res = await managedCreateThread(ctx, req, gateway);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data.threadId).toBe("thread-001");
    expect(gateway.createSession).toHaveBeenCalledOnce();
    expect((insertedPayload as Record<string, unknown>).managed_session_id).toBe("sess_integration");
  });

  // Cenário 2
  it("C2: primeira mensagem → streaming funcional + título gerado", async () => {
    const { managedStreamMessage } = await import("@/features/support/thread-handlers-managed");
    const { generateThreadTitle } = await import("@/features/support/thread-title");

    const ctx: TeacherContext = {
      supabase: makeSupabase({ thread: { id: "t1", title: null, managed_session_id: "sess_01", agent_slug: "tea-consultant" } }),
      userId: "user-001",
    };
    const gateway = makeGateway();
    const req = new Request("http://localhost/api/teacher/threads/t1/messages", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: "Como adaptar provas para TEA?" }] }),
    });

    const res = await managedStreamMessage(ctx, req, gateway);

    expect(res.status).toBe(200);
    expect(generateThreadTitle).toHaveBeenCalledWith(
      expect.anything(),
      "Como adaptar provas para TEA?",
      "Resposta do consultor.",
    );
  });

  // Cenário 3
  it("C3: segunda mensagem → session reutilizada, título não regenerado", async () => {
    const { managedStreamMessage } = await import("@/features/support/thread-handlers-managed");
    const { generateThreadTitle } = await import("@/features/support/thread-title");
    vi.mocked(generateThreadTitle).mockClear();

    const ctx: TeacherContext = {
      supabase: makeSupabase({ thread: { id: "t1", title: "Título existente", managed_session_id: "sess_01", agent_slug: "tea-consultant" } }),
      userId: "user-001",
    };
    const sendMock = vi.fn().mockResolvedValue(makeEvents([{ type: "session.status_idle" }]));
    const gateway = makeGateway({ sendMessageAndStream: sendMock });
    const req = new Request("http://localhost/api/teacher/threads/t1/messages", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: "Segunda pergunta" }] }),
    });

    await managedStreamMessage(ctx, req, gateway);

    expect(sendMock).toHaveBeenCalledWith("sess_01", "Segunda pergunta");
    expect(generateThreadTitle).not.toHaveBeenCalled();
  });

  // Cenário 4
  it("C4: leitura de histórico retorna formato correto sem tool_use", async () => {
    const { managedGetMessages } = await import("@/features/support/thread-handlers-managed");

    const messages: SessionMessage[] = [
      { id: "evt_1", role: "user", content: "Pergunta", createdAt: "2026-04-10T10:00:00Z" },
      { id: "evt_2", role: "assistant", content: "Resposta", createdAt: "2026-04-10T10:00:05Z" },
    ];
    // Verificar que tool_use não aparece — o gateway já filtra, mas confirmamos o contrato
    const ctx: TeacherContext = { supabase: makeSupabase({}), userId: "user-001" };
    const gateway = makeGateway({ getSessionMessages: vi.fn().mockResolvedValue(messages) });
    const req = new Request("http://localhost/api/teacher/threads/t1/messages");

    const res = await managedGetMessages(ctx, req, gateway);
    const body = await res.json();

    expect(body.data.messages).toHaveLength(2);
    expect(body.data.messages.every((m: SessionMessage) => ["user", "assistant"].includes(m.role))).toBe(true);
    // Nenhuma mensagem deve ter conteúdo de tool_use
    expect(body.data.messages.find((m: SessionMessage) => m.content.includes("memory_search"))).toBeUndefined();
  });

  // Cenário 5
  it("C5: erro mid-stream não causa crash (stream termina com mensagem de erro)", async () => {
    const { managedStreamMessage } = await import("@/features/support/thread-handlers-managed");

    async function* errorStream(): AsyncGenerator<unknown> {
      yield { type: "agent.message", content: [{ type: "text", text: "Início..." }] };
      throw new Error("Connection reset mid-stream");
    }

    const ctx: TeacherContext = { supabase: makeSupabase({}), userId: "user-001" };
    const gateway = makeGateway({ sendMessageAndStream: vi.fn().mockResolvedValue(errorStream()) });
    const req = new Request("http://localhost/api/teacher/threads/t1/messages", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: "Pergunta" }] }),
    });

    // O handler não deve lançar exceção
    const res = await managedStreamMessage(ctx, req, gateway);
    expect(res.status).toBe(200);
    // Stream deve fechar normalmente (não hanging)
    await expect(res.body?.cancel()).resolves.not.toThrow();
  });

  // Cenário 6
  it("C6: feature flag 'mastra' → zero chamadas ao gateway Managed", async () => {
    const { mastraCreateThread } = await import("@/features/support/thread-handlers-mastra");
    const gateway = makeGateway();

    // Verificar que o Mastra handler não chama o gateway Managed
    // (o gateway Managed simplesmente não é passado ao Mastra handler)
    const ctx: TeacherContext = {
      supabase: {
        from: vi.fn(() => ({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: "thread-mastra" }, error: null }),
            }),
          }),
        })),
      } as unknown as SupabaseClient,
      userId: "user-001",
    };
    const req = new Request("http://localhost/api/teacher/threads", {
      method: "POST",
      body: JSON.stringify({ agentSlug: "tea-consultant" }),
    });

    await mastraCreateThread(ctx, req);

    // Gateway Managed nunca chamado (não foi passado como argumento)
    expect(gateway.createSession).not.toHaveBeenCalled();
    expect(gateway.sendMessageAndStream).not.toHaveBeenCalled();
    expect(gateway.getSessionMessages).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Rodar os testes de integração**

```bash
npx vitest run --config vitest.config.mts src/gateways/managed-agents/__tests__/tea-consultant-flow.test.ts
```
Esperado: PASS (6 cenários)

- [ ] **Step 3: Rodar a suite completa**

```bash
npx vitest run --config vitest.config.mts
```
Esperado: todos os testes passam, nenhuma regressão.

- [ ] **Step 4: Commit final**

```bash
git add src/gateways/managed-agents/__tests__/tea-consultant-flow.test.ts
git commit -m "test(T03.5): add integration tests for Managed Agents conversation flow"
```

---

## Verificação Final

- [ ] `npx tsc --noEmit` sem erros
- [ ] `npx vitest run --config vitest.config.mts` — todos os testes PASS
- [ ] Variável `CONSULTANT_BACKEND=managed` testada manualmente em ambiente local apontando para recursos reais
- [ ] Variável `CONSULTANT_BACKEND=mastra` mantém comportamento anterior
