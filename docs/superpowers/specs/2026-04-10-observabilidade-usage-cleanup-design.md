# Design: Observabilidade de Custos e Cleanup do Consultor TEA

**Data:** 2026-04-10
**Epic:** 04 — Observabilidade de Custos e Cleanup
**Dependência:** Epic 03 concluído e validado. Período de validação da feature flag já encerrado.

---

## Contexto

O Consultor TEA foi migrado do runtime Mastra para Claude Managed Agents (Epics 01–03). Este epic finaliza a migração adicionando rastreamento de uso/custo por sessão, visibilidade para o admin, e removendo o código Mastra que não é mais necessário.

O período de validação com `CONSULTANT_BACKEND=managed` em produção (mínimo 1 semana sem erros) já foi concluído, portanto as duas fases de execução podem ocorrer juntas na mesma branch.

T04.7 (migração de threads existentes) está **fora do escopo** — não existem threads antigas no sistema.

---

## Escopo

**Cobre:**
- Rastreamento de tokens (input/output/cache) por thread
- Estimativa de custo por sessão
- Endpoints admin de usage (lista de usuários + drill-down por usuário)
- UI admin de Usage (página de usuários + página de threads por usuário)
- Remoção da feature flag e fixação do backend managed
- Remoção de 5 arquivos Mastra exclusivos do consultor
- Remoção de dependências npm sem uso

**Não cobre:**
- Migração de outros workflows (extração, análise, adaptação) — permanecem no Mastra
- Budget caps ou throttling automático
- Dashboard de analytics avançado
- Migração de threads existentes (não há)

---

## Seção 1 — Arquitetura Geral

Dois grupos de trabalho executados na mesma branch:

**Grupo 1 — Observabilidade**
1. Migração SQL com colunas de usage em `consultant_threads`
2. Módulo `syncSessionUsage()` chamado em background após cada mensagem
3. Dois endpoints admin: lista de usuários agregada + threads por usuário
4. Duas páginas admin: `/usage` e `/usage/[userId]`
5. Item "Usage" na sidebar do `AdminShell`

**Grupo 2 — Cleanup**
1. Remoção da feature flag `getConsultantBackend()` e arquivo `consultant-backend.ts`
2. Env vars Anthropic tornadas obrigatórias
3. Remoção de 5 arquivos Mastra exclusivos do consultor
4. Remoção de dependências npm sem uso

---

## Seção 2 — Banco de Dados e Sincronização de Usage

### Migração SQL

**Arquivo:** `supabase/migrations/00016_thread_usage_tracking.sql`

```sql
ALTER TABLE consultant_threads
  ADD COLUMN total_input_tokens INTEGER DEFAULT 0,
  ADD COLUMN total_output_tokens INTEGER DEFAULT 0,
  ADD COLUMN total_cache_read_tokens INTEGER DEFAULT 0,
  ADD COLUMN total_cache_creation_tokens INTEGER DEFAULT 0,
  ADD COLUMN estimated_cost_usd NUMERIC(10,6) DEFAULT 0,
  ADD COLUMN last_usage_sync_at TIMESTAMPTZ;
```

### Módulo de Sincronização

**Arquivo:** `src/gateways/managed-agents/usage.ts`

Exporta:
- `CLAUDE_PRICING` — constante nomeada com preços por 1M tokens (comentada que pode mudar):
  - Input (não cacheado): $3.00
  - Output: $15.00
  - Cache read: $0.30
  - Cache creation: $3.75
- `syncSessionUsage(supabase, threadId, sessionId): Promise<void>` — busca `sessions.retrieve(sessionId)`, calcula custo, faz upsert nas colunas da thread

**Fórmula de custo:**
```
cost = (input_tokens / 1M) * 3.00
     + (output_tokens / 1M) * 15.00
     + (cache_read / 1M) * 0.30
     + (cache_creation / 1M) * 3.75
```

### Integração na Rota

**Arquivo:** `src/app/api/teacher/threads/[id]/messages/route.ts`

Dentro do bloco `after()` existente, `syncSessionUsage()` é chamado em paralelo com `generateThreadTitle()`. Erro de sync é logado e ignorado — não afeta o stream principal.

### Testes

Unitários em `src/gateways/managed-agents/__tests__/usage.test.ts`:
- Cálculo de custo com valores conhecidos para os 4 tipos de token
- Mock do SDK Anthropic (`sessions.retrieve`)
- Verificação de upsert no Supabase mockado
- Erros de sync não propagam exceção

---

## Seção 3 — API Admin

Ambos os endpoints protegidos por `withAdminRoute`.

### `GET /api/admin/usage`

**Arquivo:** `src/app/api/admin/usage/route.ts`

Retorna totais globais + lista de usuários com agregados.

**Resposta:**
```json
{
  "data": {
    "totals": {
      "sessions": 142,
      "estimatedCostUSD": 18.45
    },
    "users": [
      {
        "userId": "uuid",
        "name": "Maria Silva",
        "email": "maria@escola.br",
        "threadCount": 12,
        "estimatedCostUSD": 3.21,
        "lastActivityAt": "2026-04-10T..."
      }
    ]
  }
}
```

**Query:** JOIN `consultant_threads` com `profiles`, GROUP BY `teacher_id`, WHERE `managed_session_id IS NOT NULL`, ORDER BY `estimated_cost_usd DESC`.

### `GET /api/admin/usage/[userId]`

**Arquivo:** `src/app/api/admin/usage/[userId]/route.ts`

Retorna dados do usuário + lista de threads com detalhes individuais.

**Resposta:**
```json
{
  "data": {
    "user": {
      "name": "Maria Silva",
      "email": "maria@escola.br"
    },
    "threads": [
      {
        "threadId": "uuid",
        "title": "Adaptação de questões dissertativas",
        "inputTokens": 5000,
        "outputTokens": 3200,
        "cacheReadTokens": 20000,
        "cacheCreationTokens": 2000,
        "estimatedCostUSD": 0.063,
        "updatedAt": "2026-04-10T..."
      }
    ]
  }
}
```

**Query:** `consultant_threads` WHERE `teacher_id = userId AND managed_session_id IS NOT NULL`, ORDER BY `updated_at DESC`.

---

## Seção 4 — UI Admin

### Navegação

**Arquivo:** `src/app-shell/admin/admin-shell.tsx`

- Adicionar `"usage"` ao tipo `AdminNavId`
- Adicionar item ao array `navigationItems`: label "Usage", `href="/usage"`, ícone `BarChart3` (Lucide)

### Página `/usage`

**Arquivo:** `src/app/(admin)/usage/page.tsx`

Server component. Carrega dados do endpoint `GET /api/admin/usage`. Renderiza `AdminShell` com `activeNav="usage"`.

Conteúdo:
- Dois cards de resumo no topo: **Total de sessões** e **Custo estimado total (USD)**
- `UsageUsersTable` — tabela com colunas: Usuário, E-mail, Threads, Custo estimado. Cada linha é clicável e navega para `/usage/[userId]`

### Página `/usage/[userId]`

**Arquivo:** `src/app/(admin)/usage/[userId]/page.tsx`

Server component. Carrega dados do endpoint `GET /api/admin/usage/[userId]`. Renderiza `AdminShell` com `activeNav="usage"`.

Conteúdo:
- Cabeçalho com nome e e-mail do usuário (breadcrumb de volta para `/usage`)
- `UsageThreadsTable` — tabela com colunas: Título, Input tokens, Output tokens, Cache read, Cache creation, Custo estimado, Última atividade

### Componentes

Localização: `src/features/admin/usage/components/`

- `usage-users-table.tsx` — tabela de usuários (client component, seguindo padrão de `users-table.tsx`)
- `usage-threads-table.tsx` — tabela de threads (client component)

Contratos de tipo em `src/features/admin/usage/contracts.ts`.

---

## Seção 5 — Cleanup

### T04.4 — Remover Feature Flag

**Arquivos a modificar:**
- `src/app/api/teacher/threads/route.ts` — remover import de `getConsultantBackend()` e branch Mastra; manter apenas fluxo managed
- `src/app/api/teacher/threads/[id]/messages/route.ts` — idem
- `src/lib/env.ts` — remover variável `CONSULTANT_BACKEND`; tornar `ANTHROPIC_API_KEY`, `MANAGED_AGENT_ID`, `MANAGED_AGENT_ENVIRONMENT_ID`, `MANAGED_AGENT_MEMORY_STORE_ID` obrigatórias no schema Zod

**Arquivo a remover:**
- `src/features/support/consultant-backend.ts`

### T04.5 — Remover Arquivos Mastra do Consultor

Pre-verificação obrigatória com grep antes de cada remoção. Arquivos a remover:
- `src/mastra/agents/tea-consultant-agent.ts`
- `src/mastra/prompts/tea-consultant-prompt.ts`
- `src/mastra/rag/tea-query-tool.ts`
- `src/mastra/rag/vector-store.ts`
- `src/mastra/rag/ingest.ts`

**Manter:** `src/mastra/rag/chunker.ts` (reutilizado pelo script de ingestão)

### T04.6 — Remover Dependências npm

Pre-verificação obrigatória com grep. Remover somente se 0 usos encontrados:
- `@mastra/rag` — remover
- `@mastra/libsql` — condicional (verificar grep)
- `@mastra/memory` — condicional (verificar grep)
- `@mastra/core` — **manter** (usada por outros workflows)

### Ordem de Execução do Cleanup

T04.4 → T04.5 → T04.6

Ao final: `npm run typecheck`, `npm run test` e `npm run build` devem passar.

---

## Ordem de Execução Completa

```
T04.1 (migração SQL)
  → T04.2 (syncSessionUsage + integração na rota)
  → T04.3 (endpoints admin)
  → T04.3-UI (páginas admin + navegação)
  → T04.4 (remover feature flag)
  → T04.5 (remover arquivos Mastra)
  → T04.6 (remover dependências npm)
```

---

## Riscos

| Risco | Mitigação |
|-------|-----------|
| Preços do Claude mudam | `CLAUDE_PRICING` como constante nomeada; fácil de atualizar |
| Remoção de dependência quebra outro workflow | Grep obrigatório antes de remover |
| Remover flag antes de validação | Período já encerrado — pré-condição satisfeita |
