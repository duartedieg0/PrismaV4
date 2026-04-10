# Spec: Epic 01 — Fundação e Gateway Claude Managed Agents

**Data:** 2026-04-10
**Escopo:** `src/gateways/managed-agents/`, `src/lib/env.ts`, `supabase/migrations/`, `scripts/`
**Dependências:** Nenhuma (pode iniciar imediatamente)
**Épicos seguintes:** Epic 02 (Knowledge Base), Epic 03 (Migração de Rotas), Epic 04 (Remoção Mastra)

---

## Objetivo

Estabelecer a camada de integração com a API Claude Managed Agents e provisionar os recursos necessários (Agent, Environment, Memory Store) para que os épicos seguintes possam migrar o Consultor TEA. Este épico não altera nenhum comportamento visível ao usuário.

---

## Arquitetura

### Estrutura do módulo

```
src/gateways/managed-agents/
  client.ts          — factory do SDK + leitura de config do env
  tea-consultant.ts  — createTeaConsultantGateway() com as 3 operações
  errors.ts          — classes de erro do domínio
  types.ts           — tipos locais independentes do SDK
  index.ts           — re-exporta interface pública (server-only)
```

### Fluxo de dependências

```
env.ts (Zod validation)
  ↓
client.ts → createAnthropicClient() + getAgentConfig()
  ↓
tea-consultant.ts → createTeaConsultantGateway(client, config)
  ↓ retorna TeaConsultantGateway
{ createSession, sendMessageAndStream, getSessionMessages }
  ↓ usado por (Epic 03)
src/app/api/teacher/threads/[id]/messages/route.ts
```

### Decisões de design

| Decisão | Escolha | Motivo |
|---|---|---|
| Estrutura do módulo | Factory function `createTeaConsultantGateway()` | Consistente com padrão do projeto (`createTeaConsultantAgent`, `createMastraModel`); facilita mocks nos testes sem `jest.mock()` de módulo |
| Transformação SSE → UIMessageStream | Na rota (Epic 03) | Gateway fica clean; responsabilidade de protocolo pertence à camada de entrega |
| Erros | Classes custom em `errors.ts` | Segue padrão existente de `ModelResolutionError extends Error` |
| Persistência de `managed_session_id` | Na rota (Epic 03) | Gateway é stateless; sem dependência do Supabase |
| Tipos do SDK | Tipos locais em `types.ts` | API em beta — isola mudanças de breaking changes do SDK |
| Validação de env vars em runtime | Confia na validação de startup (env.ts) | Se `MANAGED_AGENT_ID` está presente, Zod garante as demais no startup |

---

## Interfaces

### `types.ts`

```typescript
export interface ManagedSession {
  id: string
  agentId: string
  createdAt: string
}

export interface ManagedEvent {
  type: string
  [key: string]: unknown
}

export interface SessionMessage {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: string
}

export interface AgentConfig {
  agentId: string
  environmentId: string
  memoryStoreId: string
}
```

### `errors.ts`

```typescript
export class ManagedAgentError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message)
    this.name = "ManagedAgentError"
  }
}

export class SessionNotFoundError extends ManagedAgentError {
  constructor(sessionId: string) {
    super(`Sessão não encontrada: ${sessionId}`, "SESSION_NOT_FOUND")
    this.name = "SessionNotFoundError"
  }
}

export class SessionStreamError extends ManagedAgentError {
  constructor(message: string) {
    super(message, "SESSION_STREAM_ERROR")
    this.name = "SessionStreamError"
  }
}
```

### `client.ts`

```typescript
// Exporta funções (não singletons) para facilitar testes e re-instanciação
export function createAnthropicClient(): Anthropic
export function getAgentConfig(): AgentConfig
```

### `tea-consultant.ts`

```typescript
export interface TeaConsultantGateway {
  createSession(title?: string): Promise<ManagedSession>
  sendMessageAndStream(sessionId: string, message: string): Promise<AsyncIterable<ManagedEvent>>
  getSessionMessages(sessionId: string): Promise<SessionMessage[]>
}

export function createTeaConsultantGateway(
  client: Anthropic,
  config: AgentConfig,
): TeaConsultantGateway
```

**Comportamento de `createSession`:**
- Chama `client.beta.sessions.create()` com `agentId`, `environmentId`, memory store attached como `read_only`
- O `prompt` do resource instrui: "Base de conhecimento sobre TEA e adaptação de avaliações. Consulte SEMPRE antes de responder perguntas do professor."
- Retorna `ManagedSession`
- Erros da API → `ManagedAgentError`

**Comportamento de `sendMessageAndStream`:**
- Abre stream com `client.beta.sessions.events.stream(sessionId)`
- Envia `user.message` event com `client.beta.sessions.events.send()`
- Retorna o `AsyncIterable<ManagedEvent>` bruto — **sem transformação para UIMessageStream** (responsabilidade do Epic 03)
- Sessão inexistente → `SessionNotFoundError`
- Falha no stream → `SessionStreamError`

**Comportamento de `getSessionMessages`:**
- Lista eventos com `client.beta.sessions.events.list(sessionId)`
- Filtra apenas `user.message` e `agent.message`
- Extrai texto dos content blocks
- Retorna `SessionMessage[]` no formato `{ id, role: "user"|"assistant", content, createdAt }`

### `index.ts`

```typescript
// server-only
export { createTeaConsultantGateway } from "./tea-consultant"
export { createAnthropicClient, getAgentConfig } from "./client"
export { ManagedAgentError, SessionNotFoundError, SessionStreamError } from "./errors"
export type { TeaConsultantGateway, ManagedSession, ManagedEvent, SessionMessage, AgentConfig } from "./types"
```

---

## Tarefas

### T01.1 — Instalar SDK Anthropic

```bash
npm install @anthropic-ai/sdk
```

Instalar como dependência direta (pinada) mesmo que já exista como transitiva via `@mastra/core`. Dado que a API Managed Agents está em beta, usar versão específica — verificar a última estável no momento da implementação e pinar (ex: `"@anthropic-ai/sdk": "0.x.y"` sem `^`).

**Critérios:**
- `@anthropic-ai/sdk` presente no `package.json` como dependência direta com versão pinada
- `npm run build` e `npm run typecheck` passam

---

### T01.2 — Criar módulo gateway

**Arquivos a criar:** `src/gateways/managed-agents/errors.ts`, `types.ts`, `client.ts`, `tea-consultant.ts`, `index.ts`

**Critérios:**
- `createTeaConsultantGateway(client, config)` implementado com as 3 funções
- Tipos locais em `types.ts` — sem uso de `any`
- Erros mapeados para as classes de `errors.ts`
- `index.ts` com comentário `// server-only` no topo
- Testes unitários com mocks injetados (sem `jest.mock()` de módulo) para cada função
- Build e typecheck passam

---

### T01.3 — Script de provisionamento

**Arquivo:** `scripts/setup-managed-agent.ts`

Executável com `npx tsx scripts/setup-managed-agent.ts`. Provisiona em sequência:

1. **Agent** — nome `"TEA Consultant"`, model `claude-sonnet-4-6`, system prompt baseado em `TEA_CONSULTANT_INSTRUCTIONS` com "Use a ferramenta de busca disponível" substituído por "Consulte a base de conhecimento (memory store) antes de responder"; tools `agent_toolset_20260401` com `default_config: { enabled: false }`
2. **Environment** — nome `"tea-consultant-env"`, cloud, networking unrestricted
3. **Memory Store** — nome `"TEA Knowledge Base"`, descrição sobre TEA, adaptação, legislação e boas práticas

Saída no formato copiável para `.env`:
```
MANAGED_AGENT_ID=agent_01...
MANAGED_AGENT_ENVIRONMENT_ID=env_01...
MANAGED_AGENT_MEMORY_STORE_ID=memstore_01...
```

**Idempotência:** o script não é idempotente — executá-lo duas vezes cria recursos duplicados na API Anthropic. Para re-execução, os recursos anteriores devem ser deletados manualmente ou os IDs devem ser passados via env vars para reutilização. Documentar esse comportamento no output do script com um aviso.

**Critérios:**
- Três recursos provisionados em ordem
- IDs impressos no formato `.env`
- Script imprime aviso sobre comportamento não-idempotente
- Funciona com `npx tsx scripts/setup-managed-agent.ts`

---

### T01.4 — Migração de banco

**Arquivo:** `supabase/migrations/00015_managed_session_id.sql`

```sql
ALTER TABLE consultant_threads
  ADD COLUMN managed_session_id TEXT;

CREATE INDEX idx_consultant_threads_session
  ON consultant_threads (managed_session_id)
  WHERE managed_session_id IS NOT NULL;

COMMENT ON COLUMN consultant_threads.managed_session_id IS
  'ID da session no Claude Managed Agents API (sess_...)';
```

Coluna nullable para coexistência: threads Mastra existentes têm NULL, threads novas têm o session ID (gravado pela rota no Epic 03).

**Critérios:**
- Coluna `managed_session_id TEXT` nullable adicionada
- Índice parcial criado
- Migração executa sem erros
- SELECTs existentes não quebram

---

### T01.5 — Registrar env vars no validador de startup

**Arquivo:** `src/lib/env.ts`

Adicionar ao schema Zod com validação condicional: quando `MANAGED_AGENT_ID` está presente, `ANTHROPIC_API_KEY`, `MANAGED_AGENT_ENVIRONMENT_ID` e `MANAGED_AGENT_MEMORY_STORE_ID` também devem estar.

Variáveis:
- `ANTHROPIC_API_KEY` — string, obrigatória se `MANAGED_AGENT_ID` presente
- `MANAGED_AGENT_ID` — string, opcional
- `MANAGED_AGENT_ENVIRONMENT_ID` — string, obrigatória se `MANAGED_AGENT_ID` presente
- `MANAGED_AGENT_MEMORY_STORE_ID` — string, obrigatória se `MANAGED_AGENT_ID` presente

**Critérios:**
- Startup não falha quando todas ausentes (Mastra continua funcionando)
- Startup falha com mensagem clara se `MANAGED_AGENT_ID` presente mas `ANTHROPIC_API_KEY` ausente
- Testes: todas ausentes (ok), todas presentes (ok), parciais (erro)

---

## Ordem de execução

```
T01.1 (10 min) → T01.4 (30 min) → T01.5 (1h) → T01.2 (3-4h) → T01.3 (2h)
```

**Mudança em relação ao spec original:** T01.5 antes de T01.2 — `getAgentConfig()` lê as vars que o Zod valida; faz sentido ter a validação pronta antes de implementar o gateway.

---

## Riscos

| Risco | Mitigação |
|---|---|
| API Managed Agents em beta pode mudar | Factory pattern isola mudanças em 2 arquivos; tipos locais em `types.ts` protegem do SDK |
| Tipos do SDK incompletos/instáveis | `types.ts` define contratos locais; SDK é detalhe de implementação |
| Memory Store em research preview não habilitado | T01.3 falhará claramente; sem impacto nas demais tarefas |
| Env vars do Managed Agent vazarem para client | `index.ts` com `// server-only`; sem prefixo `NEXT_PUBLIC_` |

---

## O que este épico NÃO cobre

- Migração da knowledge base para o Memory Store (Epic 02)
- Transformação de eventos brutos → `UIMessageStream` para o `useChat` (Epic 03)
- Persistência de `managed_session_id` na tabela `consultant_threads` (Epic 03)
- Remoção do código Mastra (Epic 04)
