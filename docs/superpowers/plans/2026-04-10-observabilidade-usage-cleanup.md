# Epic 04 — Observabilidade de Custos e Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar rastreamento de tokens/custo por sessão do Consultor TEA, UI admin de Usage, e remover todo o código Mastra/feature-flag que não é mais necessário.

**Architecture:** O usage é sincronizado em background via `after()` após cada streaming de mensagem. A UI admin usa dois endpoints REST com queries simples ao Supabase. O cleanup remove a feature flag e os artefatos Mastra do consultor que não são mais utilizados.

**Tech Stack:** Next.js 16.2 (App Router), Supabase (PostgreSQL), Anthropic SDK (beta.sessions), Vitest, Tailwind CSS, Lucide React.

---

## File Map

### Criar
- `supabase/migrations/00016_thread_usage_tracking.sql` — colunas de usage na tabela `consultant_threads`
- `src/gateways/managed-agents/usage.ts` — `CLAUDE_PRICING` + `syncSessionUsage()`
- `src/gateways/managed-agents/__tests__/usage.test.ts` — testes unitários do módulo de usage
- `src/app/api/admin/usage/route.ts` — `GET /api/admin/usage`
- `src/app/api/admin/usage/[userId]/route.ts` — `GET /api/admin/usage/[userId]`
- `src/test/features/admin/usage-route.test.ts` — testes dos endpoints admin
- `src/features/admin/usage/contracts.ts` — tipos `AdminUsageUser` e `AdminUsageThread`
- `src/features/admin/usage/components/usage-users-table.tsx` — tabela de usuários
- `src/features/admin/usage/components/usage-threads-table.tsx` — tabela de threads
- `src/app/(admin)/usage/page.tsx` — página `/usage`
- `src/app/(admin)/usage/[userId]/page.tsx` — página `/usage/[userId]`

### Modificar
- `src/gateways/managed-agents/index.ts` — exportar `syncSessionUsage`
- `src/features/support/thread-handlers-managed.ts` — adicionar parâmetro `anthropic` + chamar `syncSessionUsage` no `after()`
- `src/app-shell/admin/admin-shell.tsx` — adicionar `"usage"` ao `AdminNavId` + item de navegação
- `src/app/api/teacher/threads/route.ts` — remover feature flag (T04.4)
- `src/app/api/teacher/threads/[id]/messages/route.ts` — remover feature flag (T04.4)
- `src/lib/env.ts` — tornar vars Anthropic obrigatórias, remover `CONSULTANT_BACKEND` (T04.4)
- `src/lib/__tests__/env.test.ts` — atualizar testes do env (T04.4)

### Deletar
- `src/features/support/consultant-backend.ts`
- `src/features/support/consultant-backend.test.ts`
- `src/features/support/thread-handlers-mastra.ts`
- `src/mastra/agents/tea-consultant-agent.ts`
- `src/mastra/prompts/tea-consultant-prompt.ts`
- `src/mastra/rag/tea-query-tool.ts`
- `src/mastra/rag/vector-store.ts`
- `src/mastra/rag/ingest.ts`

---

## Task 1: Migração SQL — colunas de usage

**Files:**
- Create: `supabase/migrations/00016_thread_usage_tracking.sql`

- [ ] **Step 1: Criar o arquivo de migração**

```sql
-- 00016: Thread Usage Tracking
-- Adiciona rastreamento cumulativo de tokens e custo estimado por thread.
-- Os valores são atualizados em background após cada mensagem via syncSessionUsage().

ALTER TABLE consultant_threads
  ADD COLUMN total_input_tokens INTEGER DEFAULT 0,
  ADD COLUMN total_output_tokens INTEGER DEFAULT 0,
  ADD COLUMN total_cache_read_tokens INTEGER DEFAULT 0,
  ADD COLUMN total_cache_creation_tokens INTEGER DEFAULT 0,
  ADD COLUMN estimated_cost_usd NUMERIC(10,6) DEFAULT 0,
  ADD COLUMN last_usage_sync_at TIMESTAMPTZ;
```

- [ ] **Step 2: Aplicar a migração localmente**

```bash
npx supabase db push
```

Expected: migração aplicada sem erros, colunas visíveis no schema.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/00016_thread_usage_tracking.sql
git commit -m "feat(T04.1): add usage tracking columns to consultant_threads"
```

---

## Task 2: Módulo `usage.ts` — TDD

**Files:**
- Create: `src/gateways/managed-agents/__tests__/usage.test.ts`
- Create: `src/gateways/managed-agents/usage.ts`

- [ ] **Step 1: Escrever os testes**

Criar `src/gateways/managed-agents/__tests__/usage.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { syncSessionUsage, CLAUDE_PRICING } from "../usage";

const mockSessionRetrieve = vi.fn();

const mockAnthropicClient = {
  beta: {
    sessions: {
      retrieve: mockSessionRetrieve,
    },
  },
} as unknown as Anthropic;

function makeSupabaseMock() {
  const mockEq = vi.fn().mockResolvedValue({ error: null });
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
  const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });
  return {
    supabase: { from: mockFrom } as unknown as SupabaseClient,
    mockFrom,
    mockUpdate,
    mockEq,
  };
}

describe("CLAUDE_PRICING", () => {
  it("deve definir os 4 tipos de preço", () => {
    expect(CLAUDE_PRICING.inputPerMillion).toBe(3.00);
    expect(CLAUDE_PRICING.outputPerMillion).toBe(15.00);
    expect(CLAUDE_PRICING.cacheReadPerMillion).toBe(0.30);
    expect(CLAUDE_PRICING.cacheCreationPerMillion).toBe(3.75);
  });
});

describe("syncSessionUsage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve calcular custo correto para 1M de cada tipo de token", async () => {
    mockSessionRetrieve.mockResolvedValue({
      usage: {
        input_tokens: 1_000_000,
        output_tokens: 1_000_000,
        cache_read_input_tokens: 1_000_000,
        cache_creation_input_tokens: 1_000_000,
      },
    });
    const { supabase, mockUpdate } = makeSupabaseMock();

    await syncSessionUsage(mockAnthropicClient, supabase, "thread-1", "sess-1");

    const updateArg = mockUpdate.mock.calls[0][0];
    // 3.00 + 15.00 + 0.30 + 3.75 = 22.05
    expect(updateArg.estimated_cost_usd).toBeCloseTo(22.05, 5);
  });

  it("deve persistir os 4 contadores de token no Supabase", async () => {
    mockSessionRetrieve.mockResolvedValue({
      usage: {
        input_tokens: 5000,
        output_tokens: 3200,
        cache_read_input_tokens: 20000,
        cache_creation_input_tokens: 2000,
      },
    });
    const { supabase, mockFrom, mockUpdate, mockEq } = makeSupabaseMock();

    await syncSessionUsage(mockAnthropicClient, supabase, "thread-abc", "sess-abc");

    expect(mockFrom).toHaveBeenCalledWith("consultant_threads");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        total_input_tokens: 5000,
        total_output_tokens: 3200,
        total_cache_read_tokens: 20000,
        total_cache_creation_tokens: 2000,
      }),
    );
    expect(mockEq).toHaveBeenCalledWith("id", "thread-abc");
  });

  it("deve definir last_usage_sync_at como ISO string recente", async () => {
    mockSessionRetrieve.mockResolvedValue({ usage: {} });
    const { supabase, mockUpdate } = makeSupabaseMock();

    const before = Date.now();
    await syncSessionUsage(mockAnthropicClient, supabase, "thread-1", "sess-1");
    const after = Date.now();

    const updateArg = mockUpdate.mock.calls[0][0];
    const syncedAt = new Date(updateArg.last_usage_sync_at).getTime();
    expect(syncedAt).toBeGreaterThanOrEqual(before);
    expect(syncedAt).toBeLessThanOrEqual(after);
  });

  it("deve tratar usage ausente como zeros", async () => {
    mockSessionRetrieve.mockResolvedValue({});
    const { supabase, mockUpdate } = makeSupabaseMock();

    await syncSessionUsage(mockAnthropicClient, supabase, "thread-1", "sess-1");

    const updateArg = mockUpdate.mock.calls[0][0];
    expect(updateArg.total_input_tokens).toBe(0);
    expect(updateArg.total_output_tokens).toBe(0);
    expect(updateArg.total_cache_read_tokens).toBe(0);
    expect(updateArg.total_cache_creation_tokens).toBe(0);
    expect(updateArg.estimated_cost_usd).toBe(0);
  });

  it("deve propagar erro quando SDK falha (caller captura)", async () => {
    mockSessionRetrieve.mockRejectedValue(new Error("API error"));
    const { supabase } = makeSupabaseMock();

    await expect(
      syncSessionUsage(mockAnthropicClient, supabase, "thread-1", "sess-1"),
    ).rejects.toThrow("API error");
  });
});
```

- [ ] **Step 2: Rodar os testes para confirmar falha**

```bash
npm run test -- src/gateways/managed-agents/__tests__/usage.test.ts
```

Expected: FAIL — `Cannot find module '../usage'`

- [ ] **Step 3: Implementar `usage.ts`**

Criar `src/gateways/managed-agents/usage.ts`:

```typescript
import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";

// NOTE: Preços por 1M tokens do Claude Sonnet 4.6 — atualizar se Anthropic alterar a tabela de preços.
// Referência: https://www.anthropic.com/pricing
export const CLAUDE_PRICING = {
  inputPerMillion: 3.00,
  outputPerMillion: 15.00,
  cacheReadPerMillion: 0.30,
  cacheCreationPerMillion: 3.75,
} as const;

export async function syncSessionUsage(
  anthropic: Anthropic,
  supabase: SupabaseClient,
  threadId: string,
  sessionId: string,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = await (anthropic.beta.sessions as any).retrieve(sessionId);

  const usage = (session.usage ?? {}) as Record<string, number>;
  const inputTokens = usage.input_tokens ?? 0;
  const outputTokens = usage.output_tokens ?? 0;
  const cacheReadTokens = usage.cache_read_input_tokens ?? 0;
  const cacheCreationTokens = usage.cache_creation_input_tokens ?? 0;

  const estimatedCostUsd =
    (inputTokens / 1_000_000) * CLAUDE_PRICING.inputPerMillion +
    (outputTokens / 1_000_000) * CLAUDE_PRICING.outputPerMillion +
    (cacheReadTokens / 1_000_000) * CLAUDE_PRICING.cacheReadPerMillion +
    (cacheCreationTokens / 1_000_000) * CLAUDE_PRICING.cacheCreationPerMillion;

  await supabase
    .from("consultant_threads")
    .update({
      total_input_tokens: inputTokens,
      total_output_tokens: outputTokens,
      total_cache_read_tokens: cacheReadTokens,
      total_cache_creation_tokens: cacheCreationTokens,
      estimated_cost_usd: estimatedCostUsd,
      last_usage_sync_at: new Date().toISOString(),
    })
    .eq("id", threadId);
}
```

- [ ] **Step 4: Rodar os testes para confirmar que passam**

```bash
npm run test -- src/gateways/managed-agents/__tests__/usage.test.ts
```

Expected: PASS — 6 testes passando

- [ ] **Step 5: Exportar do index**

Em `src/gateways/managed-agents/index.ts`, adicionar:

```typescript
export { syncSessionUsage, CLAUDE_PRICING } from "./usage";
```

- [ ] **Step 6: Commit**

```bash
git add src/gateways/managed-agents/usage.ts \
        src/gateways/managed-agents/__tests__/usage.test.ts \
        src/gateways/managed-agents/index.ts
git commit -m "feat(T04.2): add syncSessionUsage module with cost calculation"
```

---

## Task 3: Integrar `syncSessionUsage` na rota de streaming

**Files:**
- Modify: `src/features/support/thread-handlers-managed.ts`

A função `managedStreamMessage` recebe um novo parâmetro `anthropic: Anthropic`. No bloco `after()` existente, `syncSessionUsage` é chamado após o bloco de título.

- [ ] **Step 1: Adicionar import e novo parâmetro**

Em `src/features/support/thread-handlers-managed.ts`:

1. Adicionar o import de `Anthropic`:
```typescript
import type Anthropic from "@anthropic-ai/sdk";
```

2. Adicionar o import de `syncSessionUsage`:
```typescript
import { syncSessionUsage } from "@/gateways/managed-agents";
```

3. Adicionar o import de `logError` e `createRequestContext`:
```typescript
import { logError } from "@/services/observability/logger";
import { createRequestContext } from "@/services/runtime/request-context";
```

4. Atualizar a assinatura de `managedStreamMessage`:
```typescript
export async function managedStreamMessage(
  ctx: TeacherContext,
  req: Request,
  gateway: TeaConsultantGateway,
  anthropic: Anthropic,
): Promise<Response>
```

- [ ] **Step 2: Adicionar chamada no bloco `after()`**

Dentro do bloco `after()`, após o bloco de geração de título existente, adicionar:

```typescript
// Sincronizar usage em background — erro é logado e swallowed
try {
  await syncSessionUsage(anthropic, ctx.supabase, threadId, managedSessionId);
} catch (error) {
  logError("Erro ao sincronizar usage da sessão", createRequestContext(), error);
}
```

- [ ] **Step 3: Atualizar o chamador (rota)**

> **Nota:** Este passo modifica o bloco `managed` para passar o `client` criado ao `managedStreamMessage`. A feature flag (`getConsultantBackend()`) e o branch Mastra permanecem aqui — eles serão removidos na Task 9 (T04.4). Não remover agora.

Em `src/app/api/teacher/threads/[id]/messages/route.ts`, dentro do bloco `if (getConsultantBackend() === "managed")`, substituir a criação do gateway por:

```typescript
export const POST = withTeacherRoute(async (ctx, req) => {
  if (getConsultantBackend() === "managed") {
    const client = createAnthropicClient();
    const gateway = createTeaConsultantGateway(client, getAgentConfig());
    return managedStreamMessage(ctx, req, gateway, client); // client agora passado aqui
  }
  return mastraStreamMessage(ctx, req);
});
```

- [ ] **Step 4: Rodar testes existentes**

```bash
npm run test -- src/features/support/thread-handlers-managed.test.ts
```

Expected: PASS — os testes existentes devem continuar passando. (O mock de `syncSessionUsage` pode ser adicionado ao arquivo de teste existente se ele falhar por não encontrar o módulo — adicionar `vi.mock("@/gateways/managed-agents", ...)` com `syncSessionUsage: vi.fn().mockResolvedValue(undefined)`.)

- [ ] **Step 5: Commit**

```bash
git add src/features/support/thread-handlers-managed.ts \
        src/app/api/teacher/threads/[id]/messages/route.ts \
        src/features/support/thread-handlers-managed.test.ts
git commit -m "feat(T04.2): integrate syncSessionUsage into after() block of streaming route"
```

---

## Task 4: Contratos de tipo para Usage Admin

**Files:**
- Create: `src/features/admin/usage/contracts.ts`

- [ ] **Step 1: Criar o arquivo de contratos**

```typescript
export type AdminUsageUser = {
  userId: string;
  name: string | null;
  email: string | null;
  threadCount: number;
  estimatedCostUSD: number;
  lastActivityAt: string | null;
};

export type AdminUsageThread = {
  threadId: string;
  title: string | null;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  estimatedCostUSD: number;
  updatedAt: string;
};

export type AdminUsageTotals = {
  sessions: number;
  estimatedCostUSD: number;
};

export type AdminUsageSummary = {
  totals: AdminUsageTotals;
  users: AdminUsageUser[];
};

export type AdminUsageUserDetail = {
  user: { name: string | null; email: string | null };
  threads: AdminUsageThread[];
};
```

- [ ] **Step 2: Commit**

```bash
git add src/features/admin/usage/contracts.ts
git commit -m "feat(T04.3): add admin usage type contracts"
```

---

## Task 5: Endpoint `GET /api/admin/usage` — TDD

**Files:**
- Create: `src/test/features/admin/usage-route.test.ts`
- Create: `src/app/api/admin/usage/route.ts`

- [ ] **Step 1: Escrever os testes**

Criar `src/test/features/admin/usage-route.test.ts`:

```typescript
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdminRouteAccess = vi.fn();
const threadsListResult = vi.fn();

vi.mock("@/features/admin/shared/admin-guard", () => ({
  requireAdminRouteAccess,
}));

vi.mock("@/gateways/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from(table: string) {
      if (table === "consultant_threads") {
        return {
          select: vi.fn().mockReturnThis(),
          not: threadsListResult,
        };
      }
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { full_name: "Maria Silva", email: "maria@escola.br" },
            error: null,
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  })),
}));

describe("GET /api/admin/usage", () => {
  beforeEach(() => {
    requireAdminRouteAccess.mockResolvedValue({ kind: "ok", userId: "admin-1" });
    vi.clearAllMocks();
  });

  it("deve retornar 401 para não-admin", async () => {
    requireAdminRouteAccess.mockResolvedValue({
      kind: "error",
      response: new Response(null, { status: 401 }),
    });

    const { GET } = await import("@/app/api/admin/usage/route");
    const res = await GET(new Request("http://localhost/api/admin/usage"));
    expect(res.status).toBe(401);
  });

  it("deve retornar totais e lista de usuários agregada", async () => {
    threadsListResult.mockResolvedValue({
      data: [
        {
          teacher_id: "user-1",
          estimated_cost_usd: 0.05,
          updated_at: "2026-04-10T10:00:00Z",
          profiles: { full_name: "Maria Silva", email: "maria@escola.br" },
        },
        {
          teacher_id: "user-1",
          estimated_cost_usd: 0.03,
          updated_at: "2026-04-10T11:00:00Z",
          profiles: { full_name: "Maria Silva", email: "maria@escola.br" },
        },
        {
          teacher_id: "user-2",
          estimated_cost_usd: 0.10,
          updated_at: "2026-04-09T08:00:00Z",
          profiles: { full_name: "João Santos", email: "joao@escola.br" },
        },
      ],
      error: null,
    });

    const { GET } = await import("@/app/api/admin/usage/route");
    const res = await GET(new Request("http://localhost/api/admin/usage"));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data.totals.sessions).toBe(3);
    expect(body.data.totals.estimatedCostUSD).toBeCloseTo(0.18, 5);
    expect(body.data.users).toHaveLength(2);

    const user1 = body.data.users.find((u: { userId: string }) => u.userId === "user-1");
    expect(user1.threadCount).toBe(2);
    expect(user1.estimatedCostUSD).toBeCloseTo(0.08, 5);
  });

  it("deve retornar lista vazia quando não há threads managed", async () => {
    threadsListResult.mockResolvedValue({ data: [], error: null });

    const { GET } = await import("@/app/api/admin/usage/route");
    const res = await GET(new Request("http://localhost/api/admin/usage"));

    const body = await res.json();
    expect(body.data.totals.sessions).toBe(0);
    expect(body.data.users).toHaveLength(0);
  });
});

describe("GET /api/admin/usage/[userId]", () => {
  beforeEach(() => {
    requireAdminRouteAccess.mockResolvedValue({ kind: "ok", userId: "admin-1" });
    vi.clearAllMocks();
  });

  it("deve retornar dados do usuário e suas threads", async () => {
    const { GET: GETUser } = await import("@/app/api/admin/usage/[userId]/route");
    // Testar depois de criar o arquivo
    expect(GETUser).toBeDefined();
  });
});
```

- [ ] **Step 2: Rodar para confirmar falha**

```bash
npm run test -- src/test/features/admin/usage-route.test.ts
```

Expected: FAIL — módulo não existe ainda.

- [ ] **Step 3: Implementar `GET /api/admin/usage`**

Criar `src/app/api/admin/usage/route.ts`:

```typescript
import { withAdminRoute } from "@/app/api/admin/with-admin-route";
import { apiSuccess, apiInternalError } from "@/services/errors/api-response";
import type { AdminUsageUser } from "@/features/admin/usage/contracts";

export const GET = withAdminRoute(async ({ supabase }) => {
  const { data, error } = await supabase
    .from("consultant_threads")
    .select(
      "teacher_id, estimated_cost_usd, updated_at, profiles(full_name, email)",
    )
    .not("managed_session_id", "is", null);

  if (error) return apiInternalError(error.message);

  const threads = data ?? [];

  // Agregar por usuário em JS (evita GROUP BY no Supabase JS)
  const userMap = new Map<string, AdminUsageUser>();

  for (const thread of threads) {
    const profile = thread.profiles as { full_name: string | null; email: string | null } | null;
    const cost = (thread.estimated_cost_usd as number) ?? 0;
    const updatedAt = thread.updated_at as string;

    if (!userMap.has(thread.teacher_id)) {
      userMap.set(thread.teacher_id, {
        userId: thread.teacher_id,
        name: profile?.full_name ?? null,
        email: profile?.email ?? null,
        threadCount: 0,
        estimatedCostUSD: 0,
        lastActivityAt: updatedAt,
      });
    }

    const user = userMap.get(thread.teacher_id)!;
    user.threadCount++;
    user.estimatedCostUSD += cost;
    if (updatedAt > (user.lastActivityAt ?? "")) {
      user.lastActivityAt = updatedAt;
    }
  }

  const users = [...userMap.values()].sort(
    (a, b) => b.estimatedCostUSD - a.estimatedCostUSD,
  );

  const totals = {
    sessions: threads.length,
    estimatedCostUSD: users.reduce((sum, u) => sum + u.estimatedCostUSD, 0),
  };

  return apiSuccess({ totals, users });
});
```

- [ ] **Step 4: Rodar os testes**

```bash
npm run test -- src/test/features/admin/usage-route.test.ts
```

Expected: os testes do `GET /api/admin/usage` passam. O teste do `[userId]` fica pendente (módulo ainda não existe).

---

## Task 6: Endpoint `GET /api/admin/usage/[userId]`

**Files:**
- Create: `src/app/api/admin/usage/[userId]/route.ts`

- [ ] **Step 1: Implementar o endpoint**

Criar `src/app/api/admin/usage/[userId]/route.ts`:

```typescript
import { withAdminRoute } from "@/app/api/admin/with-admin-route";
import { apiSuccess, apiInternalError, apiNotFound } from "@/services/errors/api-response";
import type { AdminUsageThread } from "@/features/admin/usage/contracts";

export const GET = withAdminRoute(async ({ supabase }, request) => {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const userId = segments[segments.indexOf("usage") + 1];

  if (!userId) return apiNotFound("Usuário não encontrado.");

  const [profileResult, threadsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .single(),
    supabase
      .from("consultant_threads")
      .select(
        "id, title, total_input_tokens, total_output_tokens, total_cache_read_tokens, total_cache_creation_tokens, estimated_cost_usd, updated_at",
      )
      .eq("teacher_id", userId)
      .not("managed_session_id", "is", null)
      .order("updated_at", { ascending: false }),
  ]);

  if (profileResult.error) return apiInternalError(profileResult.error.message);
  if (!profileResult.data) return apiNotFound("Usuário não encontrado.");

  const profile = profileResult.data as { full_name: string | null; email: string | null };
  const rawThreads = threadsResult.data ?? [];

  const threads: AdminUsageThread[] = rawThreads.map((t) => ({
    threadId: t.id as string,
    title: t.title as string | null,
    inputTokens: (t.total_input_tokens as number) ?? 0,
    outputTokens: (t.total_output_tokens as number) ?? 0,
    cacheReadTokens: (t.total_cache_read_tokens as number) ?? 0,
    cacheCreationTokens: (t.total_cache_creation_tokens as number) ?? 0,
    estimatedCostUSD: (t.estimated_cost_usd as number) ?? 0,
    updatedAt: t.updated_at as string,
  }));

  return apiSuccess({
    user: { name: profile.full_name, email: profile.email },
    threads,
  });
});
```

- [ ] **Step 2: Completar o teste stub do `[userId]`**

No arquivo `src/test/features/admin/usage-route.test.ts`, adicionar um mock para `profiles` na função `createClient` e expandir o describe do `[userId]` com assertions reais:

```typescript
// Adicionar ao mock de createClient:
if (table === "profiles") {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: { full_name: "Maria Silva", email: "maria@escola.br" },
      error: null,
    }),
  };
}

// Adicionar mock para threads do usuário específico:
const userThreadsResult = vi.fn();
// (na tabela "consultant_threads", diferenciar pelo método chamado — .eq("teacher_id") vs .not())
```

Adicionar testes no describe `GET /api/admin/usage/[userId]`:

```typescript
it("deve retornar dados do usuário e lista de threads", async () => {
  // Mock para threads do usuário
  threadsListResult.mockResolvedValue({
    data: [
      {
        id: "thread-1",
        title: "Adaptação de questões",
        total_input_tokens: 5000,
        total_output_tokens: 3200,
        total_cache_read_tokens: 20000,
        total_cache_creation_tokens: 2000,
        estimated_cost_usd: 0.063,
        updated_at: "2026-04-10T10:00:00Z",
      },
    ],
    error: null,
  });

  const { GET: GETUser } = await import("@/app/api/admin/usage/[userId]/route");
  const req = new Request("http://localhost/api/admin/usage/user-1");
  const res = await GETUser(req, { params: Promise.resolve({ userId: "user-1" }) });

  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.data.user.name).toBe("Maria Silva");
  expect(body.data.threads).toHaveLength(1);
  expect(body.data.threads[0].threadId).toBe("thread-1");
  expect(body.data.threads[0].estimatedCostUSD).toBeCloseTo(0.063, 5);
});

it("deve retornar 401 para não-admin", async () => {
  requireAdminRouteAccess.mockResolvedValue({
    kind: "error",
    response: new Response(null, { status: 401 }),
  });

  const { GET: GETUser } = await import("@/app/api/admin/usage/[userId]/route");
  const res = await GETUser(new Request("http://localhost/api/admin/usage/user-1"), {
    params: Promise.resolve({ userId: "user-1" }),
  });
  expect(res.status).toBe(401);
});
```

**Nota:** O mock de `createClient` para o endpoint `[userId]` precisa suportar duas chamadas a `from("consultant_threads")` (uma para profiles via join ou separado, outra para threads). Ajuste o mock conforme necessário para que ambos os endpoints convivam no mesmo arquivo de teste.

- [ ] **Step 3: Rodar todos os testes de usage**

```bash
npm run test -- src/test/features/admin/usage-route.test.ts
```

Expected: todos os testes passam, incluindo os do `[userId]`.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/usage/route.ts \
        src/app/api/admin/usage/[userId]/route.ts \
        src/test/features/admin/usage-route.test.ts \
        src/features/admin/usage/contracts.ts
git commit -m "feat(T04.3): add admin usage endpoints with user aggregation and thread drill-down"
```

---

## Task 7: Componentes de tabela UI

**Files:**
- Create: `src/features/admin/usage/components/usage-users-table.tsx`
- Create: `src/features/admin/usage/components/usage-threads-table.tsx`

- [ ] **Step 1: Criar `usage-users-table.tsx`**

```tsx
"use client";

import Link from "next/link";
import { DataTableWrapper } from "@/design-system/components/data-table-wrapper";
import { EmptyState } from "@/design-system/components/empty-state";
import type { AdminUsageUser } from "@/features/admin/usage/contracts";

type UsageUsersTableProps = {
  users: AdminUsageUser[];
};

export function UsageUsersTable({ users }: UsageUsersTableProps) {
  if (users.length === 0) {
    return <EmptyState message="Nenhuma sessão registrada ainda." />;
  }

  return (
    <div className="rounded-2xl border border-border-default bg-white p-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <strong className="text-sm font-semibold text-text-primary">
              Uso por professor
            </strong>
            <span className="text-sm text-text-secondary">
              Clique em um professor para ver o detalhamento por conversa.
            </span>
          </div>
          <span className="font-mono text-xs text-text-secondary">
            {users.length} professores
          </span>
        </div>
        <DataTableWrapper>
          <table>
            <thead>
              <tr>
                <th align="left">Professor</th>
                <th align="left">E-mail</th>
                <th align="right">Conversas</th>
                <th align="right">Custo estimado (USD)</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.userId}>
                  <td>
                    <Link
                      href={`/usage/${user.userId}`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      {user.name ?? "—"}
                    </Link>
                  </td>
                  <td>{user.email ?? "—"}</td>
                  <td align="right">{user.threadCount}</td>
                  <td align="right" className="font-mono text-sm">
                    ${user.estimatedCostUSD.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableWrapper>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Criar `usage-threads-table.tsx`**

```tsx
"use client";

import { DataTableWrapper } from "@/design-system/components/data-table-wrapper";
import { EmptyState } from "@/design-system/components/empty-state";
import type { AdminUsageThread } from "@/features/admin/usage/contracts";

type UsageThreadsTableProps = {
  threads: AdminUsageThread[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function UsageThreadsTable({ threads }: UsageThreadsTableProps) {
  if (threads.length === 0) {
    return <EmptyState message="Nenhuma conversa com uso registrado." />;
  }

  return (
    <div className="rounded-2xl border border-border-default bg-white p-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <strong className="text-sm font-semibold text-text-primary">
            Conversas
          </strong>
          <span className="font-mono text-xs text-text-secondary">
            {threads.length} conversas
          </span>
        </div>
        <DataTableWrapper>
          <table>
            <thead>
              <tr>
                <th align="left">Título</th>
                <th align="right">Input</th>
                <th align="right">Output</th>
                <th align="right">Cache read</th>
                <th align="right">Cache creation</th>
                <th align="right">Custo (USD)</th>
                <th align="left">Última atividade</th>
              </tr>
            </thead>
            <tbody>
              {threads.map((thread) => (
                <tr key={thread.threadId}>
                  <td>{thread.title ?? "—"}</td>
                  <td align="right" className="font-mono text-sm">
                    {thread.inputTokens.toLocaleString("pt-BR")}
                  </td>
                  <td align="right" className="font-mono text-sm">
                    {thread.outputTokens.toLocaleString("pt-BR")}
                  </td>
                  <td align="right" className="font-mono text-sm">
                    {thread.cacheReadTokens.toLocaleString("pt-BR")}
                  </td>
                  <td align="right" className="font-mono text-sm">
                    {thread.cacheCreationTokens.toLocaleString("pt-BR")}
                  </td>
                  <td align="right" className="font-mono text-sm">
                    ${thread.estimatedCostUSD.toFixed(4)}
                  </td>
                  <td className="text-sm text-text-secondary">
                    {formatDate(thread.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableWrapper>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/admin/usage/components/usage-users-table.tsx \
        src/features/admin/usage/components/usage-threads-table.tsx
git commit -m "feat(T04.3): add admin usage table components"
```

---

## Task 8: Navegação e páginas admin

**Files:**
- Modify: `src/app-shell/admin/admin-shell.tsx`
- Create: `src/app/(admin)/usage/page.tsx`
- Create: `src/app/(admin)/usage/[userId]/page.tsx`

- [ ] **Step 1: Adicionar "usage" ao `AdminShell`**

Em `src/app-shell/admin/admin-shell.tsx`:

1. Atualizar o import de ícones adicionando `BarChart3`:
```typescript
import {
  Home, Cpu, Bot, HeartHandshake, BookOpen, GraduationCap, Users, User, LogOut, BarChart3,
} from "lucide-react";
```

2. Atualizar o tipo `AdminNavId`:
```typescript
type AdminNavId =
  | "home"
  | "models"
  | "agents"
  | "supports"
  | "subjects"
  | "grade-levels"
  | "users"
  | "usage";
```

3. Adicionar item ao array `navigationItems` (após `users`):
```typescript
{ id: "usage" as const, label: "Usage", href: "/usage", icon: BarChart3 },
```

- [ ] **Step 2: Criar a página `/usage`**

Criar `src/app/(admin)/usage/page.tsx`:

```tsx
import { AdminShell } from "@/app-shell/admin/admin-shell";
import { UsageUsersTable } from "@/features/admin/usage/components/usage-users-table";
import type { AdminUsageSummary } from "@/features/admin/usage/contracts";

async function loadUsageSummary(): Promise<AdminUsageSummary> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/admin/usage`, {
    cache: "no-store",
    headers: { "x-internal-request": "1" },
  });

  if (!res.ok) {
    return { totals: { sessions: 0, estimatedCostUSD: 0 }, users: [] };
  }

  const body = await res.json();
  return body.data as AdminUsageSummary;
}

export default async function AdminUsagePage() {
  const summary = await loadUsageSummary();

  return (
    <AdminShell
      title="Usage"
      description="Rastreamento de tokens e custo estimado por professor e conversa."
      activeNav="usage"
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Admin", href: "/config" },
        { label: "Usage", href: "/usage" },
      ]}
    >
      <div className="flex flex-col gap-6">
        {/* Cards de resumo */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border-default bg-white p-5">
            <p className="text-sm text-text-secondary">Total de sessões</p>
            <p className="mt-1 text-2xl font-semibold text-text-primary">
              {summary.totals.sessions.toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="rounded-2xl border border-border-default bg-white p-5">
            <p className="text-sm text-text-secondary">Custo estimado total</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-text-primary">
              ${summary.totals.estimatedCostUSD.toFixed(4)} USD
            </p>
          </div>
        </div>

        <UsageUsersTable users={summary.users} />
      </div>
    </AdminShell>
  );
}
```

**Nota:** A página usa `fetch` interno para reutilizar a autenticação via cookie. Se o projeto usa Server Actions ou Supabase direto nas páginas (como `/users/page.tsx`), prefira o padrão do `users/page.tsx` — criar o client Supabase diretamente na página, usando `withAdminRoute` equivalente ou `requireAdminPageAccess`. Veja `src/app/(admin)/users/page.tsx` como referência.

**Padrão alternativo (recomendado se a abordagem fetch não funcionar):**

```tsx
import { redirect } from "next/navigation";
import { requireAdminPageAccess } from "@/features/admin/shared/admin-guard";
import { createClient } from "@/gateways/supabase/server";
import { AdminShell } from "@/app-shell/admin/admin-shell";
import { UsageUsersTable } from "@/features/admin/usage/components/usage-users-table";
import type { AdminUsageSummary, AdminUsageUser } from "@/features/admin/usage/contracts";

async function loadUsageSummary(): Promise<AdminUsageSummary> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("consultant_threads")
    .select("teacher_id, estimated_cost_usd, updated_at, profiles(full_name, email)")
    .not("managed_session_id", "is", null);

  if (error || !data) {
    return { totals: { sessions: 0, estimatedCostUSD: 0 }, users: [] };
  }

  const userMap = new Map<string, AdminUsageUser>();
  for (const thread of data) {
    const profile = thread.profiles as { full_name: string | null; email: string | null } | null;
    const cost = (thread.estimated_cost_usd as number) ?? 0;
    const updatedAt = thread.updated_at as string;
    if (!userMap.has(thread.teacher_id)) {
      userMap.set(thread.teacher_id, {
        userId: thread.teacher_id,
        name: profile?.full_name ?? null,
        email: profile?.email ?? null,
        threadCount: 0,
        estimatedCostUSD: 0,
        lastActivityAt: updatedAt,
      });
    }
    const user = userMap.get(thread.teacher_id)!;
    user.threadCount++;
    user.estimatedCostUSD += cost;
    if (updatedAt > (user.lastActivityAt ?? "")) user.lastActivityAt = updatedAt;
  }

  const users = [...userMap.values()].sort((a, b) => b.estimatedCostUSD - a.estimatedCostUSD);
  return {
    totals: {
      sessions: data.length,
      estimatedCostUSD: users.reduce((s, u) => s + u.estimatedCostUSD, 0),
    },
    users,
  };
}

export default async function AdminUsagePage() {
  const access = await requireAdminPageAccess();
  if (access.kind === "redirect") redirect(access.redirectTo);

  const summary = await loadUsageSummary();
  // ... resto igual
}
```

- [ ] **Step 3: Criar a página `/usage/[userId]`**

Criar `src/app/(admin)/usage/[userId]/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdminPageAccess } from "@/features/admin/shared/admin-guard";
import { createClient } from "@/gateways/supabase/server";
import { AdminShell } from "@/app-shell/admin/admin-shell";
import { UsageThreadsTable } from "@/features/admin/usage/components/usage-threads-table";
import type { AdminUsageThread } from "@/features/admin/usage/contracts";

async function loadUserUsage(userId: string) {
  const supabase = await createClient();

  const [profileResult, threadsResult] = await Promise.all([
    supabase.from("profiles").select("full_name, email").eq("id", userId).single(),
    supabase
      .from("consultant_threads")
      .select(
        "id, title, total_input_tokens, total_output_tokens, total_cache_read_tokens, total_cache_creation_tokens, estimated_cost_usd, updated_at",
      )
      .eq("teacher_id", userId)
      .not("managed_session_id", "is", null)
      .order("updated_at", { ascending: false }),
  ]);

  const profile = profileResult.data as { full_name: string | null; email: string | null } | null;
  const rawThreads = threadsResult.data ?? [];

  const threads: AdminUsageThread[] = rawThreads.map((t) => ({
    threadId: t.id as string,
    title: t.title as string | null,
    inputTokens: (t.total_input_tokens as number) ?? 0,
    outputTokens: (t.total_output_tokens as number) ?? 0,
    cacheReadTokens: (t.total_cache_read_tokens as number) ?? 0,
    cacheCreationTokens: (t.total_cache_creation_tokens as number) ?? 0,
    estimatedCostUSD: (t.estimated_cost_usd as number) ?? 0,
    updatedAt: t.updated_at as string,
  }));

  return { profile, threads };
}

type PageProps = { params: Promise<{ userId: string }> };

export default async function AdminUsageUserPage({ params }: PageProps) {
  const access = await requireAdminPageAccess();
  if (access.kind === "redirect") redirect(access.redirectTo);

  const { userId } = await params;
  const { profile, threads } = await loadUserUsage(userId);

  const name = profile?.full_name ?? "Professor";
  const email = profile?.email ?? "";

  return (
    <AdminShell
      title={name}
      description={email}
      activeNav="usage"
      breadcrumbs={[
        { label: "Inicio", href: "/" },
        { label: "Admin", href: "/config" },
        { label: "Usage", href: "/usage" },
        { label: name, href: `/usage/${userId}` },
      ]}
    >
      <UsageThreadsTable threads={threads} />
    </AdminShell>
  );
}
```

- [ ] **Step 4: Verificar typecheck**

```bash
npm run typecheck
```

Expected: sem erros nos arquivos novos.

- [ ] **Step 5: Commit**

```bash
git add src/app-shell/admin/admin-shell.tsx \
        src/app/\(admin\)/usage/page.tsx \
        src/app/\(admin\)/usage/\[userId\]/page.tsx
git commit -m "feat(T04.3-UI): add admin usage pages and sidebar navigation"
```

---

## Task 9: T04.4 — Remover feature flag

**Files:**
- Modify: `src/app/api/teacher/threads/route.ts`
- Modify: `src/app/api/teacher/threads/[id]/messages/route.ts`
- Modify: `src/lib/env.ts`
- Modify: `src/lib/__tests__/env.test.ts`
- Delete: `src/features/support/consultant-backend.ts`
- Delete: `src/features/support/consultant-backend.test.ts`
- Delete: `src/features/support/thread-handlers-mastra.ts`

- [ ] **Step 1: Atualizar `src/app/api/teacher/threads/route.ts`**

Remover imports de `getConsultantBackend`, `mastraCreateThread` e `thread-handlers-mastra`. Deixar apenas o fluxo managed:

```typescript
import { withTeacherRoute } from "@/features/support/with-teacher-route";
import { apiSuccess, apiError } from "@/services/errors/api-response";
import { managedCreateThread } from "@/features/support/thread-handlers-managed";
import {
  createTeaConsultantGateway,
  createAnthropicClient,
  getAgentConfig,
} from "@/gateways/managed-agents";

export const POST = withTeacherRoute(async (ctx, req) => {
  const gateway = createTeaConsultantGateway(createAnthropicClient(), getAgentConfig());
  return managedCreateThread(ctx, req, gateway);
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

- [ ] **Step 2: Atualizar `src/app/api/teacher/threads/[id]/messages/route.ts`**

Remover imports de `getConsultantBackend`, `mastraStreamMessage`, `mastraGetMessages`. Deixar apenas o fluxo managed:

```typescript
import { withTeacherRoute } from "@/features/support/with-teacher-route";
import { managedStreamMessage, managedGetMessages } from "@/features/support/thread-handlers-managed";
import {
  createTeaConsultantGateway,
  createAnthropicClient,
  getAgentConfig,
} from "@/gateways/managed-agents";

export const maxDuration = 300;

export const POST = withTeacherRoute(async (ctx, req) => {
  const client = createAnthropicClient();
  const gateway = createTeaConsultantGateway(client, getAgentConfig());
  return managedStreamMessage(ctx, req, gateway, client);
});

export const GET = withTeacherRoute(async (ctx, req) => {
  const gateway = createTeaConsultantGateway(createAnthropicClient(), getAgentConfig());
  return managedGetMessages(ctx, req, gateway);
});
```

- [ ] **Step 3: Atualizar `src/lib/env.ts`**

Substituir o schema para tornar as vars Anthropic obrigatórias e remover `CONSULTANT_BACKEND`:

```typescript
import { z } from "zod";

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL deve ser uma URL valida"),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY e obrigatoria"),
  SUPABASE_SECRET_API_KEY: z
    .string()
    .min(1, "SUPABASE_SECRET_API_KEY e obrigatoria"),
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  MASTRA_LOG_LEVEL: z
    .enum(["debug", "info", "warn", "error", "silent"])
    .default("info"),
  ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY e obrigatoria"),
  MANAGED_AGENT_ID: z.string().min(1, "MANAGED_AGENT_ID e obrigatorio"),
  MANAGED_AGENT_ENVIRONMENT_ID: z
    .string()
    .min(1, "MANAGED_AGENT_ENVIRONMENT_ID e obrigatorio"),
  MANAGED_AGENT_MEMORY_STORE_ID: z.string().min(1).optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let _env: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (_env) return _env;

  const input = {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };

  const result = serverEnvSchema.safeParse(input);

  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors;
    console.error(
      "Variaveis de ambiente invalidas:",
      JSON.stringify(formatted, null, 2),
    );
    throw new Error("Falha na validacao de variaveis de ambiente");
  }

  _env = result.data;
  return _env;
}

export function resetEnvCache() {
  _env = null;
}
```

- [ ] **Step 4: Atualizar `src/lib/__tests__/env.test.ts`**

Substituir o `BASE_ENV` e os testes para refletir as novas vars obrigatórias:

```typescript
const BASE_ENV: Record<string, string> = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "anon-key",
  SUPABASE_SECRET_API_KEY: "service-key",
  ANTHROPIC_API_KEY: "sk-ant-abc",
  MANAGED_AGENT_ID: "agent_01abc",
  MANAGED_AGENT_ENVIRONMENT_ID: "env_01abc",
};
```

Remover os testes que testavam a lógica condicional do `superRefine` (ex.: "deve falhar quando MANAGED_AGENT_ID está presente mas ANTHROPIC_API_KEY está ausente"). Adicionar testes que confirmam que cada var obrigatória individualmente causa falha quando ausente.

- [ ] **Step 5: Deletar os 3 arquivos obsoletos**

```bash
rm src/features/support/consultant-backend.ts
rm src/features/support/consultant-backend.test.ts
rm src/features/support/thread-handlers-mastra.ts
```

- [ ] **Step 6: Rodar typecheck e testes**

```bash
npm run typecheck
npm run test -- src/lib/__tests__/env.test.ts
npm run test -- src/features/support/
```

Expected: typecheck passa, testes de env passam, testes dos thread-handlers passam.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(T04.4): remove feature flag, lock managed backend, make Anthropic env vars required"
```

---

## Task 10: T04.5 — Remover arquivos Mastra do consultor

**Files:** Deletar 5 arquivos Mastra exclusivos do consultor.

- [ ] **Step 1: Verificar que nenhum arquivo externo importa esses módulos**

```bash
grep -r "tea-consultant-agent" src/ --include="*.ts" --include="*.tsx"
grep -r "tea-consultant-prompt" src/ --include="*.ts" --include="*.tsx"
grep -r "tea-query-tool" src/ --include="*.ts" --include="*.tsx"
grep -r "from.*rag/vector-store" src/ --include="*.ts"
grep -r "from.*rag/ingest" src/ --include="*.ts"
```

Expected: 0 resultados para cada grep. Se algum retornar resultado fora dos 5 arquivos listados, corrigir o import antes de prosseguir.

- [ ] **Step 2: Deletar os arquivos**

```bash
rm src/mastra/agents/tea-consultant-agent.ts
rm src/mastra/prompts/tea-consultant-prompt.ts
rm src/mastra/rag/tea-query-tool.ts
rm src/mastra/rag/vector-store.ts
rm src/mastra/rag/ingest.ts
```

Confirmar que `src/mastra/rag/chunker.ts` foi mantido:

```bash
ls src/mastra/rag/
```

Expected: apenas `chunker.ts` e `__tests__/` presentes.

- [ ] **Step 3: Rodar typecheck e testes**

```bash
npm run typecheck
npm run test
```

Expected: ambos passam sem erros.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(T04.5): remove Mastra files exclusive to tea-consultant"
```

---

## Task 11: T04.6 — Remover dependências npm sem uso

- [ ] **Step 1: Verificar uso de cada dependência**

```bash
grep -r "@mastra/rag" src/ --include="*.ts" --include="*.tsx"
grep -r "@mastra/libsql" src/ --include="*.ts" --include="*.tsx"
grep -r "@mastra/memory" src/ --include="*.ts" --include="*.tsx"
```

Expected: 0 resultados para cada. Se alguma ainda for usada, **não remover**.

- [ ] **Step 2: Desinstalar as dependências com 0 resultados**

```bash
npm uninstall @mastra/rag
```

Se `@mastra/libsql` retornou 0 resultados:
```bash
npm uninstall @mastra/libsql
```

Se `@mastra/memory` retornou 0 resultados:
```bash
npm uninstall @mastra/memory
```

**Não remover `@mastra/core`** — usada por outros workflows.

- [ ] **Step 3: Verificar que o projeto ainda builda**

```bash
npm run build
```

Expected: build bem-sucedido sem erros.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat(T04.6): remove unused Mastra npm dependencies"
```

---

## Task 12: Verificação Final

- [ ] **Step 1: Rodar suite completa de testes**

```bash
npm run test
```

Expected: todos os testes passam.

- [ ] **Step 2: Typecheck completo**

```bash
npm run typecheck
```

Expected: 0 erros.

- [ ] **Step 3: Build de produção**

```bash
npm run build
```

Expected: build bem-sucedido.

- [ ] **Step 4: Confirmar que a migração está aplicada**

```bash
npx supabase db push
```

Expected: sem migrações pendentes.

- [ ] **Step 5: Checar que nenhuma referência ao Mastra do consultor permanece**

```bash
grep -r "consultant-backend\|tea-consultant-agent\|tea-consultant-prompt\|tea-query-tool\|getConsultantBackend\|CONSULTANT_BACKEND" src/ --include="*.ts" --include="*.tsx"
```

Expected: 0 resultados.
