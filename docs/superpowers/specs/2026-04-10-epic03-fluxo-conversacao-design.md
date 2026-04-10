# Spec: Epic 03 — Migração do Fluxo de Conversação para Managed Agents

**Data:** 2026-04-10
**Épico:** 03 — Migração do Fluxo de Conversação
**Dependências:** Epic 01 (gateway `src/gateways/managed-agents/`) — concluído

---

## Objetivo

Migrar o fluxo completo de conversação do Consultor TEA — criação de threads, envio de mensagens com streaming e leitura de histórico — do runtime Mastra para sessões do Claude Managed Agents. O frontend não sofre nenhuma alteração.

---

## Contexto

O gateway do Epic 01 já está implementado em `src/gateways/managed-agents/` e expõe:
- `createTeaConsultantGateway(client, config)` — retorna `{ createSession, sendMessageAndStream, getSessionMessages }`
- `createAnthropicClient()` — instancia o Anthropic SDK
- `getAgentConfig()` — lê `MANAGED_AGENT_ID`, `MANAGED_AGENT_ENVIRONMENT_ID`, `MANAGED_AGENT_MEMORY_STORE_ID` de `process.env`

Não existem threads Mastra em produção — a migração é greenfield, sem necessidade de compatibilidade com dados legados.

---

## Abordagem: Handlers Extraídos por Backend (Abordagem B)

Uma camada de handlers é inserida entre as rotas Next.js e os gateways. Cada backend (Mastra, Managed) tem seu próprio arquivo de handlers. As rotas apenas despacham com base na feature flag.

Vantagens:
- Rotas ficam limpas — apenas despacho
- Cada handler é testável isoladamente (injeção do gateway como parâmetro)
- Remoção do Mastra no Epic 04 é um `git rm` em vez de cirurgia nos route files

---

## Estrutura de Arquivos

```
src/
├── gateways/managed-agents/                    ← existente (Epic 01)
│
├── features/support/
│   ├── consultant-backend.ts                   ← NOVO — feature flag
│   ├── thread-handlers-mastra.ts               ← NOVO — lógica Mastra extraída dos routes
│   └── thread-handlers-managed.ts              ← NOVO — lógica Managed
│
├── app/api/teacher/threads/
│   └── route.ts                                ← modifica POST (despacho)
│
└── app/api/teacher/threads/[id]/messages/
    └── route.ts                                ← modifica POST e GET (despacho)

supabase/migrations/
    └── 00015_consultant_threads_managed_session.sql  ← NOVO
```

---

## Tarefas

### T03.0 — Migration de banco

**Arquivo:** `supabase/migrations/00015_consultant_threads_managed_session.sql`

```sql
ALTER TABLE consultant_threads
  ADD COLUMN managed_session_id TEXT;

CREATE INDEX idx_consultant_threads_managed_session
  ON consultant_threads (managed_session_id)
  WHERE managed_session_id IS NOT NULL;
```

`managed_session_id` é nullable. Threads Mastra ficam com `NULL`. O índice parcial cobre buscas por session ID nas rotas de mensagem.

**Critérios de aceite:**
- [ ] Coluna adicionada sem quebrar queries existentes
- [ ] Índice criado

---

### T03.1 — Feature flag de backend

**Arquivo:** `src/features/support/consultant-backend.ts` (novo)

```typescript
export type ConsultantBackend = "mastra" | "managed";

export function getConsultantBackend(): ConsultantBackend {
  return process.env.CONSULTANT_BACKEND === "managed" ? "managed" : "mastra";
}
```

Registrar `CONSULTANT_BACKEND` em `src/lib/env.ts` como string opcional. Default `"mastra"` quando ausente — deploy seguro.

**Critérios de aceite:**
- [ ] Função exportada e tipada
- [ ] Env var registrada como opcional em `env.ts`
- [ ] Default é `"mastra"` quando ausente
- [ ] Testes cobrem `"managed"`, `"mastra"` e ausência

---

### T03.2 — Extrair e migrar criação de thread

**Arquivos:**
- `src/features/support/thread-handlers-mastra.ts` (novo)
- `src/features/support/thread-handlers-managed.ts` (novo)
- `src/app/api/teacher/threads/route.ts` (modifica POST)

**`thread-handlers-mastra.ts`** extrai o handler POST atual sem alteração de lógica.

**`thread-handlers-managed.ts`** — `managedCreateThread`:
1. Instancia gateway via `createTeaConsultantGateway(createAnthropicClient(), getAgentConfig())`
2. Chama `gateway.createSession()`
3. Insere em `consultant_threads` com `managed_session_id = session.id`
4. Se a criação da session falhar, não insere no Supabase
5. Retorna `{ threadId }` com status 201

**Route handler:**
```typescript
export const POST = withTeacherRoute((ctx, req) =>
  getConsultantBackend() === "managed"
    ? managedCreateThread(ctx, req)
    : mastraCreateThread(ctx, req)
);
```

**Critérios de aceite:**
- [ ] Backend `managed`: cria session + insere com `managed_session_id`
- [ ] Backend `mastra`: comportamento atual preservado
- [ ] Falha na session não cria registro órfão no Supabase
- [ ] Retorno idêntico: `{ threadId }` com 201
- [ ] Testes para ambos os backends

---

### T03.3 — Extrair e migrar envio de mensagem com streaming

**Arquivos:**
- `src/features/support/thread-handlers-mastra.ts` (adiciona `mastraStreamMessage`)
- `src/features/support/thread-handlers-managed.ts` (adiciona `managedStreamMessage`)
- `src/app/api/teacher/threads/[id]/messages/route.ts` (modifica POST)

**`managedStreamMessage`:**
1. Valida input (mesmo schema `useChatSchema`, limite 2000 chars) — sem mudança
2. Busca thread no Supabase incluindo `managed_session_id`
3. Chama `gateway.sendMessageAndStream(sessionId, userContent)`
4. Converte `AsyncIterable<ManagedEvent>` → `UIMessageStream`:

```typescript
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
      writer.write({ type: "text-delta", id: "text-0", delta: "\n\n*Erro ao processar resposta.*" });
    }

    writer.write({ type: "text-end", id: "text-0" });
    writer.write({ type: "finish" });
  },
});
```

5. Em background (`after()`):
   - Se primeira mensagem (thread sem título): chama `generateThreadTitle(model, userContent, fullResponse)`
   - Atualiza `updated_at`
6. Retorna `createUIMessageStreamResponse({ stream })`

`maxDuration` sobe de 60 para 300 segundos (Managed Agents pode levar mais por causa do memory_search).

**Decisões de design:**
- `agent.tool_use` é ignorado — o professor não vê o memory_search
- Múltiplos `agent.message` são acumulados no mesmo `text-0` — resposta única contínua
- Erro mid-stream emite mensagem inline em vez de deixar o stream pendurado

**Critérios de aceite:**
- [ ] Validação de input idêntica (schema, 2000 chars)
- [ ] Backend `managed`: streaming funcional via Managed Agents
- [ ] Backend `mastra`: comportamento atual preservado
- [ ] Frontend recebe UIMessageStream que `useChat` consome
- [ ] Eventos `agent.tool_use` não aparecem no stream do professor
- [ ] Texto acumulado para geração de título
- [ ] Título gerado apenas na primeira mensagem
- [ ] `updated_at` atualizado
- [ ] Erro mid-stream tratado (não crash, não tela branca)
- [ ] `maxDuration = 300`
- [ ] Testes com mock do stream (eventos simulados)

---

### T03.4 — Extrair e migrar leitura de histórico

**Arquivos:**
- `src/features/support/thread-handlers-mastra.ts` (adiciona `mastraGetMessages`)
- `src/features/support/thread-handlers-managed.ts` (adiciona `managedGetMessages`)
- `src/app/api/teacher/threads/[id]/messages/route.ts` (modifica GET)

**`managedGetMessages`:**
1. Busca thread com `managed_session_id`
2. Chama `gateway.getSessionMessages(sessionId)`
3. Retorna `{ data: { messages } }` no mesmo formato atual

```json
{
  "data": {
    "messages": [
      { "id": "evt_01...", "role": "user", "content": "...", "createdAt": "..." },
      { "id": "evt_02...", "role": "assistant", "content": "...", "createdAt": "..." }
    ]
  }
}
```

**Critérios de aceite:**
- [ ] Backend `managed`: histórico lido via gateway
- [ ] Backend `mastra`: comportamento atual preservado
- [ ] Formato idêntico: `{ data: { messages: [...] } }`
- [ ] Apenas `user` e `assistant` (tool_use já filtrado pelo gateway)
- [ ] Ordem cronológica
- [ ] Array vazio se sem mensagens ou erro
- [ ] Testes para ambos os backends

---

### T03.5 — Testes de integração do fluxo completo

**Arquivo:** `src/gateways/managed-agents/__tests__/tea-consultant-flow.test.ts`

Os handlers recebem o gateway como parâmetro — sem mock de módulo, apenas injeção de dependência.

**Cenários:**

| # | Cenário | Verifica |
|---|---------|----------|
| 1 | Criar thread (managed) | `createSession` chamado, `managed_session_id` salvo |
| 2 | Primeira mensagem | UIMessageStream correto, `generateThreadTitle` chamado |
| 3 | Segunda mensagem | Session reutilizada, `generateThreadTitle` não chamado |
| 4 | Ler histórico | Formato correto, `agent.tool_use` ausente |
| 5 | Erro mid-stream | Stream termina com mensagem de erro, não crash |
| 6 | Feature flag `mastra` | Zero chamadas ao gateway Managed |

**Mocks:**
- `gateway.createSession()` → session fake
- `gateway.sendMessageAndStream()` → async iterable: `agent.tool_use` → `agent.message` → `session.status_idle`
- `gateway.getSessionMessages()` → array de `SessionMessage`
- Supabase: queries de select, insert e update

**Critérios de aceite:**
- [ ] 6 cenários implementados
- [ ] Formato do UIMessageStream verificado
- [ ] `tool_use` não vaza para output
- [ ] Título gerado apenas na primeira mensagem
- [ ] `managed_session_id` persistido
- [ ] Feature flag respeitada
- [ ] Testes passam em CI

---

## Ordem de Execução

```
T03.0 (migration) → T03.1 (flag) → T03.2 (thread) → T03.4 (histórico) → T03.3 (streaming) → T03.5 (testes)
```

T03.0 e T03.1 desbloqueiam tudo. T03.2 e T03.4 são mais simples e preparam o terreno. T03.3 é o núcleo (streaming). T03.5 valida tudo.

---

## Riscos

| Risco | Mitigação |
|-------|-----------|
| Cold start na primeira mensagem | UX já tem "Digitando..."; documentar latência esperada |
| Formato de eventos muda na beta | Gateway encapsula o parsing — routes não mudam |
| `agent.message` em múltiplos eventos | Loop `for await` + acumulador já trata |
| Erro mid-stream deixa tela branca | Mensagem de erro inline no stream |
| Professor recarrega durante streaming | GET histórico retorna só mensagens completas |
