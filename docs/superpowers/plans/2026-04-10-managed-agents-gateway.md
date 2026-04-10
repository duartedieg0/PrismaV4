# Epic 01 — Gateway Claude Managed Agents: Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Estabelecer o módulo gateway `src/gateways/managed-agents/` e infraestrutura de suporte (env vars, migração de banco, script de provisionamento) para que os épicos seguintes possam migrar o Consultor TEA do Mastra para a API Claude Managed Agents.

**Architecture:** Factory function `createTeaConsultantGateway(client, config)` que encapsula 3 operações (createSession, sendMessageAndStream, getSessionMessages). Gateway é stateless, sem dependência de banco. Erros mapeados para classes custom em `errors.ts`. Tipos locais em `types.ts` protegem de breaking changes do SDK em beta.

**Tech Stack:** `@anthropic-ai/sdk` (pinado), Zod (v4, já instalado), Vitest (já instalado), SQL (Supabase/PostgreSQL), `tsx` para scripts CLI.

---

## Mapa de Arquivos

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `package.json` | Modificar | Adicionar `@anthropic-ai/sdk` como dep direta pinada |
| `supabase/migrations/00015_managed_session_id.sql` | Criar | Adiciona coluna `managed_session_id TEXT` nullable em `consultant_threads` |
| `src/lib/env.ts` | Modificar | Validação condicional Zod para 4 novas env vars |
| `src/lib/__tests__/env.test.ts` | Criar | Testes dos 3 cenários de validação |
| `src/gateways/managed-agents/types.ts` | Criar | Tipos locais: `ManagedSession`, `ManagedEvent`, `SessionMessage`, `AgentConfig` |
| `src/gateways/managed-agents/errors.ts` | Criar | Classes de erro: `ManagedAgentError`, `SessionNotFoundError`, `SessionStreamError` |
| `src/gateways/managed-agents/client.ts` | Criar | `createAnthropicClient()` + `getAgentConfig()` |
| `src/gateways/managed-agents/tea-consultant.ts` | Criar | `createTeaConsultantGateway()` com as 3 operações |
| `src/gateways/managed-agents/__tests__/tea-consultant.test.ts` | Criar | Testes unitários com mock client injetado |
| `src/gateways/managed-agents/index.ts` | Criar | Re-exporta interface pública (server-only) |
| `scripts/setup-managed-agent.ts` | Criar | CLI para provisionar Agent, Environment e Memory Store |

---

## Task 1: Instalar SDK Anthropic (T01.1)

**Files:**
- Modify: `package.json`

> Antes de instalar, verifique a versão atual do SDK: `npm show @anthropic-ai/sdk version`. Pinar a versão exata (sem `^`) porque a API Managed Agents está em beta e breaking changes são esperados.

- [ ] **Step 1.1: Instalar o SDK e pinar a versão**

```bash
npm install @anthropic-ai/sdk
```

Após instalar, edite `package.json` e troque `"@anthropic-ai/sdk": "^X.Y.Z"` por `"@anthropic-ai/sdk": "X.Y.Z"` (sem `^`).

- [ ] **Step 1.2: Verificar build e typecheck**

```bash
npm run typecheck && npm run build
```

Esperado: sem erros.

- [ ] **Step 1.3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @anthropic-ai/sdk as direct pinned dependency"
```

---

## Task 2: Migração de banco (T01.4)

**Files:**
- Create: `supabase/migrations/00015_managed_session_id.sql`

> Esta coluna é nullable para coexistência: threads Mastra existentes ficam com NULL, threads novas receberão o session ID gravado pela rota (Epic 03). O índice é parcial (só onde NOT NULL) para não impactar queries existentes.

- [ ] **Step 2.1: Criar arquivo de migração**

Crie o arquivo `supabase/migrations/00015_managed_session_id.sql` com o conteúdo abaixo:

```sql
ALTER TABLE consultant_threads
  ADD COLUMN managed_session_id TEXT;

CREATE INDEX idx_consultant_threads_session
  ON consultant_threads (managed_session_id)
  WHERE managed_session_id IS NOT NULL;

COMMENT ON COLUMN consultant_threads.managed_session_id IS
  'ID da session no Claude Managed Agents API (sess_...)';
```

- [ ] **Step 2.2: Aplicar a migração**

```bash
npx supabase db push
```

Esperado: migração aplicada sem erros. Se estiver em ambiente local, `npx supabase start` primeiro.

- [ ] **Step 2.3: Verificar que queries existentes continuam funcionando**

Abra o Supabase Studio ou execute:
```sql
SELECT id, agent_slug, title, managed_session_id FROM consultant_threads LIMIT 1;
```

Esperado: query retorna sem erro; `managed_session_id` aparece como NULL para threads existentes.

- [ ] **Step 2.4: Commit**

```bash
git add supabase/migrations/00015_managed_session_id.sql
git commit -m "feat: add managed_session_id column to consultant_threads"
```

---

## Task 3: Validação de env vars no startup (T01.5)

**Files:**
- Modify: `src/lib/env.ts`
- Create: `src/lib/__tests__/env.test.ts`

> O padrão do arquivo atual: `z.object({...}).safeParse(process.env)`. Para a validação condicional ("se A existe, B e C devem existir"), usar `.superRefine()` encadeado no schema. `resetEnvCache()` já existe — use-o nos testes para limpar o cache entre casos.

- [ ] **Step 3.1: Escrever os testes de validação**

Crie `src/lib/__tests__/env.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getServerEnv, resetEnvCache } from "../env";

// Env vars base que sempre devem estar presentes
const BASE_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "anon-key",
  SUPABASE_SECRET_API_KEY: "service-key",
};

const MANAGED_ENV = {
  MANAGED_AGENT_ID: "agent_01abc",
  ANTHROPIC_API_KEY: "sk-ant-abc",
  MANAGED_AGENT_ENVIRONMENT_ID: "env_01abc",
  MANAGED_AGENT_MEMORY_STORE_ID: "memstore_01abc",
};

describe("getServerEnv", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    resetEnvCache();
  });

  afterEach(() => {
    // Restaurar process.env
    Object.keys(process.env).forEach((key) => delete process.env[key]);
    Object.assign(process.env, originalEnv);
    resetEnvCache();
  });

  it("deve passar quando vars do Managed Agents estão todas ausentes (Mastra continua)", () => {
    Object.assign(process.env, BASE_ENV);

    expect(() => getServerEnv()).not.toThrow();
  });

  it("deve passar quando todas as vars do Managed Agents estão presentes", () => {
    Object.assign(process.env, BASE_ENV, MANAGED_ENV);

    expect(() => getServerEnv()).not.toThrow();
    const env = getServerEnv();
    expect(env.MANAGED_AGENT_ID).toBe("agent_01abc");
    expect(env.ANTHROPIC_API_KEY).toBe("sk-ant-abc");
  });

  it("deve falhar com mensagem clara quando MANAGED_AGENT_ID presente mas ANTHROPIC_API_KEY ausente", () => {
    Object.assign(process.env, BASE_ENV, {
      MANAGED_AGENT_ID: "agent_01abc",
      MANAGED_AGENT_ENVIRONMENT_ID: "env_01abc",
      MANAGED_AGENT_MEMORY_STORE_ID: "memstore_01abc",
      // ANTHROPIC_API_KEY ausente intencionalmente
    });

    expect(() => getServerEnv()).toThrow("Falha na validacao de variaveis de ambiente");
  });

  it("deve falhar quando MANAGED_AGENT_ID presente mas MANAGED_AGENT_ENVIRONMENT_ID ausente", () => {
    Object.assign(process.env, BASE_ENV, {
      MANAGED_AGENT_ID: "agent_01abc",
      ANTHROPIC_API_KEY: "sk-ant-abc",
      MANAGED_AGENT_MEMORY_STORE_ID: "memstore_01abc",
      // MANAGED_AGENT_ENVIRONMENT_ID ausente intencionalmente
    });

    expect(() => getServerEnv()).toThrow("Falha na validacao de variaveis de ambiente");
  });
});
```

- [ ] **Step 3.2: Rodar os testes para confirmar que falham**

```bash
npm test -- src/lib/__tests__/env.test.ts
```

Esperado: todos os testes falhando (os getServerEnv calls que deveriam passar vão passar, mas os tipos novos não existem ainda).

- [ ] **Step 3.3: Implementar a validação condicional em env.ts**

Modifique `src/lib/env.ts`. Troque o `serverEnvSchema` atual por:

```typescript
import { z } from "zod";

const serverEnvSchema = z
  .object({
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
    // Managed Agents — opcionais individualmente, mas condicionalmente obrigatórias como grupo
    ANTHROPIC_API_KEY: z.string().optional(),
    MANAGED_AGENT_ID: z.string().optional(),
    MANAGED_AGENT_ENVIRONMENT_ID: z.string().optional(),
    MANAGED_AGENT_MEMORY_STORE_ID: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.MANAGED_AGENT_ID) return;

    const required: [keyof typeof data, string | undefined][] = [
      ["ANTHROPIC_API_KEY", data.ANTHROPIC_API_KEY],
      ["MANAGED_AGENT_ENVIRONMENT_ID", data.MANAGED_AGENT_ENVIRONMENT_ID],
      ["MANAGED_AGENT_MEMORY_STORE_ID", data.MANAGED_AGENT_MEMORY_STORE_ID],
    ];

    for (const [key, value] of required) {
      if (!value) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${key} e obrigatoria quando MANAGED_AGENT_ID esta presente`,
          path: [key],
        });
      }
    }
  });
```

O restante do arquivo (`ServerEnv`, `_env`, `getServerEnv`, `resetEnvCache`) permanece idêntico.

- [ ] **Step 3.4: Rodar os testes e confirmar que passam**

```bash
npm test -- src/lib/__tests__/env.test.ts
```

Esperado: 4 testes passando.

- [ ] **Step 3.5: Garantir que os testes existentes continuam passando**

```bash
npm test
```

Esperado: sem regressões.

- [ ] **Step 3.6: Commit**

```bash
git add src/lib/env.ts src/lib/__tests__/env.test.ts
git commit -m "feat: conditional validation for Managed Agents env vars"
```

---

## Task 4: Tipos e erros do gateway (base do T01.2)

**Files:**
- Create: `src/gateways/managed-agents/types.ts`
- Create: `src/gateways/managed-agents/errors.ts`

> Sem testes diretos para estes dois arquivos — os testes do gateway em Task 5 cobrem os erros indiretamente. `errors.ts` segue o mesmo padrão de `ModelResolutionError` em `src/mastra/providers/model-registry.ts`.

- [ ] **Step 4.1: Criar types.ts**

Crie `src/gateways/managed-agents/types.ts`:

```typescript
export interface ManagedSession {
  id: string;
  agentId: string;
  createdAt: string;
}

export interface ManagedEvent {
  type: string;
  [key: string]: unknown;
}

export interface SessionMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface AgentConfig {
  agentId: string;
  environmentId: string;
  memoryStoreId: string;
}
```

- [ ] **Step 4.2: Criar errors.ts**

Crie `src/gateways/managed-agents/errors.ts`:

```typescript
export class ManagedAgentError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "ManagedAgentError";
  }
}

export class SessionNotFoundError extends ManagedAgentError {
  constructor(sessionId: string) {
    super(`Sessão não encontrada: ${sessionId}`, "SESSION_NOT_FOUND");
    this.name = "SessionNotFoundError";
  }
}

export class SessionStreamError extends ManagedAgentError {
  constructor(message: string) {
    super(message, "SESSION_STREAM_ERROR");
    this.name = "SessionStreamError";
  }
}
```

- [ ] **Step 4.3: Typecheck**

```bash
npm run typecheck
```

Esperado: sem erros.

- [ ] **Step 4.4: Commit**

```bash
git add src/gateways/managed-agents/types.ts src/gateways/managed-agents/errors.ts
git commit -m "feat: add types and error classes for managed-agents gateway"
```

---

## Task 5: Client factory (parte do T01.2)

**Files:**
- Create: `src/gateways/managed-agents/client.ts`

> `createAnthropicClient()` cria uma instância do SDK — o SDK usa `ANTHROPIC_API_KEY` automaticamente de `process.env`. `getAgentConfig()` lê as outras 3 vars diretamente de `process.env` com non-null assertion (env.ts garante que existem quando `MANAGED_AGENT_ID` está presente).

- [ ] **Step 5.1: Criar client.ts**

Crie `src/gateways/managed-agents/client.ts`:

```typescript
import Anthropic from "@anthropic-ai/sdk";
import type { AgentConfig } from "./types";

/**
 * Cria uma instância do Anthropic SDK.
 * O SDK lê ANTHROPIC_API_KEY automaticamente de process.env.
 */
export function createAnthropicClient(): Anthropic {
  return new Anthropic();
}

/**
 * Lê os IDs dos recursos provisionados de process.env.
 * Seguro chamar apenas após a validação de startup (env.ts) confirmar que
 * MANAGED_AGENT_ID está presente — o que garante as demais vars.
 */
export function getAgentConfig(): AgentConfig {
  return {
    agentId: process.env.MANAGED_AGENT_ID!,
    environmentId: process.env.MANAGED_AGENT_ENVIRONMENT_ID!,
    memoryStoreId: process.env.MANAGED_AGENT_MEMORY_STORE_ID!,
  };
}
```

- [ ] **Step 5.2: Typecheck**

```bash
npm run typecheck
```

Esperado: sem erros.

- [ ] **Step 5.3: Commit**

```bash
git add src/gateways/managed-agents/client.ts
git commit -m "feat: add Anthropic client factory for managed-agents gateway"
```

---

## Task 6: Gateway tea-consultant com TDD (principal do T01.2)

**Files:**
- Create: `src/gateways/managed-agents/__tests__/tea-consultant.test.ts`
- Create: `src/gateways/managed-agents/tea-consultant.ts`

> A factory pattern (recebe `client` e `config` como parâmetros) elimina a necessidade de `vi.mock()` de módulo. Os testes criam um `mockClient` com `vi.fn()` e injetam diretamente. Antes de implementar, leia os tipos do SDK: `node_modules/@anthropic-ai/sdk/resources/beta/` para confirmar os nomes de método exatos (`sessions.create`, `sessions.events.stream`, etc.) — ajuste o código se diferir.

- [ ] **Step 6.1: Escrever os testes do gateway**

Crie `src/gateways/managed-agents/__tests__/tea-consultant.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import { createTeaConsultantGateway } from "../tea-consultant";
import { SessionNotFoundError, SessionStreamError, ManagedAgentError } from "../errors";
import type { AgentConfig } from "../types";

// Mock do client Anthropic — injetado via factory, sem vi.mock()
const mockSessionCreate = vi.fn();
const mockEventsSend = vi.fn();
const mockEventsStream = vi.fn();
const mockEventsList = vi.fn();

const mockClient = {
  beta: {
    sessions: {
      create: mockSessionCreate,
      events: {
        send: mockEventsSend,
        stream: mockEventsStream,
        list: mockEventsList,
      },
    },
  },
} as unknown as Anthropic;

const mockConfig: AgentConfig = {
  agentId: "agent_01test",
  environmentId: "env_01test",
  memoryStoreId: "memstore_01test",
};

describe("createTeaConsultantGateway", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createSession", () => {
    it("deve criar sessão com agentId, environmentId e memory store corretos", async () => {
      mockSessionCreate.mockResolvedValue({
        id: "sess_01abc",
        agent_id: "agent_01test",
        created_at: "2026-04-10T00:00:00Z",
      });

      const gateway = createTeaConsultantGateway(mockClient, mockConfig);
      const session = await gateway.createSession("Minha conversa");

      expect(mockSessionCreate).toHaveBeenCalledOnce();
      const callArg = mockSessionCreate.mock.calls[0][0];
      expect(callArg.agent_id).toBe("agent_01test");
      expect(callArg.environment_id).toBe("env_01test");
      // Memory store deve estar no array de resources
      const memResource = callArg.resources?.find(
        (r: { type: string }) => r.type === "memory_store",
      );
      expect(memResource).toBeDefined();
      expect(memResource.memory_store_id).toBe("memstore_01test");
      expect(memResource.mode).toBe("read_only");
    });

    it("deve retornar ManagedSession com id, agentId e createdAt", async () => {
      mockSessionCreate.mockResolvedValue({
        id: "sess_01abc",
        agent_id: "agent_01test",
        created_at: "2026-04-10T00:00:00Z",
      });

      const gateway = createTeaConsultantGateway(mockClient, mockConfig);
      const session = await gateway.createSession();

      expect(session.id).toBe("sess_01abc");
      expect(session.agentId).toBe("agent_01test");
      expect(session.createdAt).toBe("2026-04-10T00:00:00Z");
    });

    it("deve lançar ManagedAgentError quando SDK falha", async () => {
      mockSessionCreate.mockRejectedValue(new Error("API error"));

      const gateway = createTeaConsultantGateway(mockClient, mockConfig);

      await expect(gateway.createSession()).rejects.toBeInstanceOf(ManagedAgentError);
    });
  });

  describe("sendMessageAndStream", () => {
    it("deve abrir stream e enviar mensagem do usuário", async () => {
      const mockStream = (async function* () {
        yield { type: "agent.message", content: "resposta" };
      })();
      mockEventsStream.mockResolvedValue(mockStream);
      mockEventsSend.mockResolvedValue(undefined);

      const gateway = createTeaConsultantGateway(mockClient, mockConfig);
      const stream = await gateway.sendMessageAndStream("sess_01abc", "Olá");

      expect(mockEventsStream).toHaveBeenCalledWith("sess_01abc");
      expect(mockEventsSend).toHaveBeenCalledWith(
        "sess_01abc",
        expect.objectContaining({ type: "user.message" }),
      );
      // Stream deve ser iterável
      expect(stream[Symbol.asyncIterator]).toBeDefined();
    });

    it("deve lançar SessionNotFoundError quando sessão não existe (404)", async () => {
      const notFoundError = Object.assign(new Error("Not found"), { status: 404 });
      mockEventsStream.mockRejectedValue(notFoundError);

      const gateway = createTeaConsultantGateway(mockClient, mockConfig);

      await expect(
        gateway.sendMessageAndStream("sess_inexistente", "Olá"),
      ).rejects.toBeInstanceOf(SessionNotFoundError);
    });

    it("deve lançar SessionStreamError para outros erros de stream", async () => {
      mockEventsStream.mockRejectedValue(new Error("Connection reset"));

      const gateway = createTeaConsultantGateway(mockClient, mockConfig);

      await expect(
        gateway.sendMessageAndStream("sess_01abc", "Olá"),
      ).rejects.toBeInstanceOf(SessionStreamError);
    });
  });

  describe("getSessionMessages", () => {
    it("deve retornar apenas mensagens user e assistant", async () => {
      mockEventsList.mockResolvedValue({
        data: [
          {
            id: "evt_1",
            type: "user.message",
            content: [{ type: "text", text: "Pergunta do professor" }],
            created_at: "2026-04-10T10:00:00Z",
          },
          {
            id: "evt_2",
            type: "session.started", // deve ser filtrado
            created_at: "2026-04-10T09:59:00Z",
          },
          {
            id: "evt_3",
            type: "agent.message",
            content: [{ type: "text", text: "Resposta do assistente" }],
            created_at: "2026-04-10T10:00:05Z",
          },
        ],
      });

      const gateway = createTeaConsultantGateway(mockClient, mockConfig);
      const messages = await gateway.getSessionMessages("sess_01abc");

      expect(messages).toHaveLength(2);
      expect(messages[0]).toEqual({
        id: "evt_1",
        role: "user",
        content: "Pergunta do professor",
        createdAt: "2026-04-10T10:00:00Z",
      });
      expect(messages[1]).toEqual({
        id: "evt_3",
        role: "assistant",
        content: "Resposta do assistente",
        createdAt: "2026-04-10T10:00:05Z",
      });
    });

    it("deve retornar array vazio quando não há mensagens", async () => {
      mockEventsList.mockResolvedValue({ data: [] });

      const gateway = createTeaConsultantGateway(mockClient, mockConfig);
      const messages = await gateway.getSessionMessages("sess_01abc");

      expect(messages).toEqual([]);
    });

    it("deve concatenar múltiplos blocos de texto em um único content", async () => {
      mockEventsList.mockResolvedValue({
        data: [
          {
            id: "evt_1",
            type: "agent.message",
            content: [
              { type: "text", text: "Parte 1. " },
              { type: "text", text: "Parte 2." },
            ],
            created_at: "2026-04-10T10:00:00Z",
          },
        ],
      });

      const gateway = createTeaConsultantGateway(mockClient, mockConfig);
      const messages = await gateway.getSessionMessages("sess_01abc");

      expect(messages[0].content).toBe("Parte 1. Parte 2.");
    });
  });
});
```

- [ ] **Step 6.2: Rodar os testes para confirmar que falham**

```bash
npm test -- src/gateways/managed-agents/__tests__/tea-consultant.test.ts
```

Esperado: falha com "Cannot find module '../tea-consultant'".

- [ ] **Step 6.3: Implementar tea-consultant.ts**

Crie `src/gateways/managed-agents/tea-consultant.ts`:

> **Atenção:** A API Managed Agents está em beta. Se os nomes de método no SDK diferem do abaixo (ex: `sessions.create` vs `beta.sessions.create`), ajuste conforme os tipos em `node_modules/@anthropic-ai/sdk`. O padrão da Anthropic para beta APIs é acessado via `client.beta.*`.

```typescript
import type Anthropic from "@anthropic-ai/sdk";
import { ManagedAgentError, SessionNotFoundError, SessionStreamError } from "./errors";
import type { AgentConfig, ManagedEvent, ManagedSession, SessionMessage } from "./types";

export interface TeaConsultantGateway {
  createSession(title?: string): Promise<ManagedSession>;
  sendMessageAndStream(
    sessionId: string,
    message: string,
  ): Promise<AsyncIterable<ManagedEvent>>;
  getSessionMessages(sessionId: string): Promise<SessionMessage[]>;
}

function extractTextContent(
  content: Array<{ type: string; text?: string }> | undefined,
): string {
  if (!content) return "";
  return content
    .filter((block) => block.type === "text" && block.text)
    .map((block) => block.text!)
    .join("");
}

export function createTeaConsultantGateway(
  client: Anthropic,
  config: AgentConfig,
): TeaConsultantGateway {
  return {
    async createSession(_title?: string): Promise<ManagedSession> {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const session = await (client.beta.sessions as any).create({
          agent_id: config.agentId,
          environment_id: config.environmentId,
          resources: [
            {
              type: "memory_store",
              memory_store_id: config.memoryStoreId,
              mode: "read_only",
              prompt:
                "Base de conhecimento sobre TEA e adaptação de avaliações. Consulte SEMPRE antes de responder perguntas do professor.",
            },
          ],
        });

        return {
          id: session.id as string,
          agentId: session.agent_id as string,
          createdAt: session.created_at as string,
        };
      } catch (error) {
        throw new ManagedAgentError(
          `Falha ao criar sessão: ${String(error)}`,
          "SESSION_CREATE_ERROR",
        );
      }
    },

    async sendMessageAndStream(
      sessionId: string,
      message: string,
    ): Promise<AsyncIterable<ManagedEvent>> {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const events = client.beta.sessions.events as any;

        // Abrir stream antes de enviar a mensagem
        const stream = await events.stream(sessionId);

        // Enviar a mensagem do usuário
        await events.send(sessionId, {
          type: "user.message",
          content: [{ type: "text", text: message }],
        });

        return stream as AsyncIterable<ManagedEvent>;
      } catch (error) {
        const status = (error as { status?: number }).status;
        if (status === 404) {
          throw new SessionNotFoundError(sessionId);
        }
        throw new SessionStreamError(String(error));
      }
    },

    async getSessionMessages(sessionId: string): Promise<SessionMessage[]> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (client.beta.sessions.events as any).list(sessionId);

      const events: Array<{
        id: string;
        type: string;
        content?: Array<{ type: string; text?: string }>;
        created_at: string;
      }> = result.data ?? result;

      return events
        .filter((e) => e.type === "user.message" || e.type === "agent.message")
        .map((e) => ({
          id: e.id,
          role: e.type === "user.message" ? ("user" as const) : ("assistant" as const),
          content: extractTextContent(e.content),
          createdAt: e.created_at,
        }));
    },
  };
}
```

- [ ] **Step 6.4: Rodar os testes e confirmar que passam**

```bash
npm test -- src/gateways/managed-agents/__tests__/tea-consultant.test.ts
```

Esperado: todos os testes passando.

- [ ] **Step 6.5: Rodar todos os testes para verificar regressões**

```bash
npm test
```

Esperado: sem regressões.

- [ ] **Step 6.6: Commit**

```bash
git add src/gateways/managed-agents/tea-consultant.ts src/gateways/managed-agents/__tests__/tea-consultant.test.ts
git commit -m "feat: implement createTeaConsultantGateway with TDD"
```

---

## Task 7: Index — interface pública do módulo (T01.2 finalização)

**Files:**
- Create: `src/gateways/managed-agents/index.ts`

- [ ] **Step 7.1: Criar index.ts**

Crie `src/gateways/managed-agents/index.ts`:

```typescript
// server-only — não importar em componentes client ou arquivos com "use client"
export { createTeaConsultantGateway } from "./tea-consultant";
export { createAnthropicClient, getAgentConfig } from "./client";
export {
  ManagedAgentError,
  SessionNotFoundError,
  SessionStreamError,
} from "./errors";
export type {
  TeaConsultantGateway,
  ManagedSession,
  ManagedEvent,
  SessionMessage,
  AgentConfig,
} from "./types";
```

- [ ] **Step 7.2: Typecheck e build**

```bash
npm run typecheck && npm run build
```

Esperado: sem erros.

- [ ] **Step 7.3: Commit**

```bash
git add src/gateways/managed-agents/index.ts
git commit -m "feat: export public interface for managed-agents gateway"
```

---

## Task 8: Script de provisionamento (T01.3)

**Files:**
- Create: `scripts/setup-managed-agent.ts`

> **Pré-requisito:** `ANTHROPIC_API_KEY` deve estar em `.env.local` antes de rodar este script. O script **não é idempotente** — executá-lo duas vezes cria recursos duplicados. Se precisar re-executar, delete os recursos anteriores via Anthropic Console ou API.
>
> O sistema prompt importa `TEA_CONSULTANT_INSTRUCTIONS` de `src/mastra/prompts/tea-consultant-prompt.ts` e substitui a referência à ferramenta de busca pela instrução de consultar o memory store.
>
> **Atenção:** Os nomes dos métodos de criação de Agent/Environment/Memory Store no SDK beta podem diferir. Antes de rodar, inspecione `node_modules/@anthropic-ai/sdk/resources/beta/` para confirmar os endpoints corretos.

- [ ] **Step 8.1: Criar o script**

Crie `scripts/setup-managed-agent.ts`:

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { TEA_CONSULTANT_INSTRUCTIONS } from "../src/mastra/prompts/tea-consultant-prompt";

const client = new Anthropic();

// Adaptar o system prompt: substituir referência à ferramenta de busca pela instrução de memory store
const ORIGINAL_TOOL_INSTRUCTION = "Use a ferramenta de busca disponível.";
if (!TEA_CONSULTANT_INSTRUCTIONS.includes(ORIGINAL_TOOL_INSTRUCTION)) {
  console.error(
    "ERRO: A string de substituição do system prompt não foi encontrada.",
    "Verifique o conteúdo de TEA_CONSULTANT_INSTRUCTIONS antes de prosseguir.",
  );
  process.exit(1);
}
const MANAGED_AGENT_SYSTEM_PROMPT = TEA_CONSULTANT_INSTRUCTIONS.replace(
  ORIGINAL_TOOL_INSTRUCTION,
  "Consulte a base de conhecimento (memory store) antes de responder.",
);

async function main() {
  console.warn(
    "⚠️  AVISO: Este script não é idempotente. Executá-lo novamente cria recursos duplicados.",
  );
  console.warn(
    "   Se precisar re-executar, delete os recursos anteriores via Anthropic Console.\n",
  );

  // 1. Criar o Agent
  console.log("Criando Agent TEA Consultant...");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const agent = await (client.beta as any).agents.create({
    name: "TEA Consultant",
    model: "claude-sonnet-4-6",
    instructions: MANAGED_AGENT_SYSTEM_PROMPT,
    tools: {
      toolset: "agent_toolset_20260401",
      default_config: { enabled: false },
    },
  });
  console.log("✓ Agent criado:", agent.id);

  // 2. Criar o Environment
  console.log("Criando Environment tea-consultant-env...");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const environment = await (client.beta as any).environments.create({
    name: "tea-consultant-env",
    type: "cloud",
    networking: "unrestricted",
  });
  console.log("✓ Environment criado:", environment.id);

  // 3. Criar o Memory Store
  console.log("Criando Memory Store TEA Knowledge Base...");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const memoryStore = await (client.beta as any).memory.stores.create({
    name: "TEA Knowledge Base",
    description:
      "Base de conhecimento sobre TEA (Transtorno do Espectro Autista), adaptação de avaliações, legislação brasileira de educação inclusiva e boas práticas pedagógicas. O agente deve consultar esta base SEMPRE antes de responder perguntas.",
  });
  console.log("✓ Memory Store criado:", memoryStore.id);

  // Imprimir IDs no formato .env
  console.log("\n--- Copie para seu .env.local ---");
  console.log(`MANAGED_AGENT_ID=${agent.id}`);
  console.log(`MANAGED_AGENT_ENVIRONMENT_ID=${environment.id}`);
  console.log(`MANAGED_AGENT_MEMORY_STORE_ID=${memoryStore.id}`);
  console.log("---------------------------------\n");
}

main().catch((error) => {
  console.error("Erro ao provisionar recursos:", error);
  process.exit(1);
});
```

- [ ] **Step 8.2: Verificar typecheck do script**

```bash
npm run typecheck
```

Esperado: sem erros.

- [ ] **Step 8.3: Testar em dry-run (opcional, se quiser validar antes de provisionar)**

Inspecione `node_modules/@anthropic-ai/sdk/resources/beta/` e confirme que os métodos usados no script existem na versão pinada do SDK. Ajuste nomes de método se necessário.

- [ ] **Step 8.4: Rodar o script (quando pronto para provisionar)**

```bash
# Certifique-se que ANTHROPIC_API_KEY está em .env.local
npx tsx scripts/setup-managed-agent.ts
```

Esperado: 3 recursos criados, IDs impressos no formato `.env`.

- [ ] **Step 8.5: Copiar os IDs para .env.local**

```
MANAGED_AGENT_ID=agent_01...
MANAGED_AGENT_ENVIRONMENT_ID=env_01...
MANAGED_AGENT_MEMORY_STORE_ID=memstore_01...
```

- [ ] **Step 8.6: Commit**

```bash
git add scripts/setup-managed-agent.ts
git commit -m "feat: add provisioning script for Managed Agents resources"
```

---

## Verificação Final

- [ ] **Todos os testes passando**

```bash
npm test
```

Esperado: sem falhas.

- [ ] **Build de produção limpo**

```bash
npm run build
```

Esperado: sem erros, sem warnings de `any` críticos.

- [ ] **Typecheck limpo**

```bash
npm run typecheck
```

Esperado: sem erros.

- [ ] **Confirmar que comportamento existente não mudou**

O Consultor TEA deve continuar funcionando via Mastra enquanto as novas env vars não estiverem presentes. Teste abrindo o chat na UI e verificando que ainda funciona normalmente.

---

## Notas para os Épicos Seguintes

- **Epic 02** usará `getAgentConfig().memoryStoreId` para ingerir o conhecimento TEA no Memory Store criado por T01.3.
- **Epic 03** usará `createTeaConsultantGateway()` nas rotas, transformando o `AsyncIterable<ManagedEvent>` retornado por `sendMessageAndStream` para o formato `UIMessageStream` que o `useChat` consome. Também será responsável por gravar `managed_session_id` na tabela `consultant_threads`.
- **Epic 04** poderá remover `@mastra/*` das dependências e apagar `src/mastra/agents/tea-consultant-agent.ts` e `src/mastra/rag/` após Epic 03 estar estável.
