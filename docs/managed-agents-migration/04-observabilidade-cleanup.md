# Epic 04 — Observabilidade de Custos e Cleanup

**Contexto completo:** `00-contexto.md`
**Dependencias:** Epic 03 concluido e validado

---

## Objetivo

Finalizar a migracao adicionando rastreamento de uso/custo por sessao, visibilidade para o admin, e removendo o codigo Mastra que nao e mais necessario. Apos este epico, o runtime Mastra deixa de ser utilizado pelo consultor TEA.

---

## Escopo

**Cobre:**

- Rastreamento de tokens (input/output/cache) por thread
- Estimativa de custo por sessao
- Endpoint de uso para admin
- Remocao da feature flag
- Remocao de arquivos Mastra exclusivos do consultor
- Remocao de dependencias npm nao utilizadas
- Estrategia de migracao de threads existentes

**Nao cobre:**

- Migracao de outros workflows (extracao, analise, adaptacao) — permanecem no Mastra
- Budget caps ou throttling automatico
- Dashboard de analytics avancado

---

## Contexto tecnico especifico

### Dados de usage disponiveis

O objeto session (`sessions.retrieve()`) inclui:

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

Campos `usage.*` sao cumulativos (total da session). O evento `span.model_request_end` no stream contem `model_usage` por chamada individual.

### Calculo de custo

A API nao retorna valor monetario. Calculo com tabela de precos do Claude Sonnet 4.6:

| Tipo de token | Preco por 1M tokens (USD) |
|---------------|---------------------------|
| Input (nao cacheado) | $3.00 |
| Output | $15.00 |
| Cache read | $0.30 |
| Cache creation | $3.75 |

### Arquivos Mastra candidatos a remocao

Estes arquivos sao **exclusivos do consultor TEA** e nao usados por outros workflows:

| Arquivo | Acao |
|---------|------|
| `src/mastra/agents/tea-consultant-agent.ts` | Remover |
| `src/mastra/prompts/tea-consultant-prompt.ts` | Remover |
| `src/mastra/rag/tea-query-tool.ts` | Remover |
| `src/mastra/rag/vector-store.ts` | Remover |
| `src/mastra/rag/ingest.ts` | Remover (substituido por `scripts/ingest-knowledge-base.ts`) |
| `src/mastra/rag/chunker.ts` | **Manter** (reutilizado pelo novo script de ingestao) |

### Dependencias npm candidatas a remocao

| Dependencia | Usada por outros modulos? | Acao |
|-------------|--------------------------|------|
| `@mastra/rag` | Nao — exclusiva do consultor RAG | Remover |
| `@mastra/libsql` | Verificar com grep antes de remover | Condicional |
| `@mastra/memory` | Verificar com grep antes de remover | Condicional |
| `@mastra/core` | Sim — workflows de extracao, analise, adaptacao | **Manter** |

---

## Tarefas

### T04.1 — Adicionar colunas de usage na tabela consultant_threads

**Arquivo a criar:** `supabase/migrations/00016_thread_usage_tracking.sql`

```sql
ALTER TABLE consultant_threads
  ADD COLUMN total_input_tokens INTEGER DEFAULT 0,
  ADD COLUMN total_output_tokens INTEGER DEFAULT 0,
  ADD COLUMN total_cache_read_tokens INTEGER DEFAULT 0,
  ADD COLUMN total_cache_creation_tokens INTEGER DEFAULT 0,
  ADD COLUMN estimated_cost_usd NUMERIC(10,6) DEFAULT 0,
  ADD COLUMN last_usage_sync_at TIMESTAMPTZ;
```

**Criterios de aceite:**
- [ ] Migracao criada com numeracao sequencial
- [ ] Colunas adicionadas com defaults
- [ ] Migracao executa sem erros
- [ ] Queries existentes nao quebram

---

### T04.2 — Implementar sincronizacao de usage

**Arquivo a criar:** `src/gateways/managed-agents/usage.ts`
**Arquivo a modificar:** `src/app/api/teacher/threads/[id]/messages/route.ts`

**`usage.ts`** — Funcao que busca usage da session e atualiza no Supabase:

```typescript
export async function syncSessionUsage(
  supabase: SupabaseClient,
  threadId: string,
  sessionId: string,
): Promise<void>
```

**Fluxo:**
1. Chamar `sessions.retrieve(sessionId)` para obter `usage`
2. Calcular `estimated_cost_usd`:
   ```
   cost = (input_tokens / 1M) * 3.00
        + (output_tokens / 1M) * 15.00
        + (cache_read / 1M) * 0.30
        + (cache_creation / 1M) * 3.75
   ```
3. Atualizar `consultant_threads` com totais e `last_usage_sync_at = now()`

**Tabela de precos:** Definir como constante nomeada no modulo. Comentar que precos podem mudar.

**Integracao na rota:** Chamar `syncSessionUsage()` dentro do bloco `after()` existente da rota POST messages (junto com geracao de titulo). Erros de sync nao afetam o fluxo principal (log e ignora).

**Criterios de aceite:**
- [ ] Funcao busca dados da API e persiste no Supabase
- [ ] Calculo de custo correto para os 4 tipos de token
- [ ] Execucao em background (`after()`)
- [ ] Erros nao afetam fluxo principal
- [ ] Testes unitarios: calculo com valores conhecidos, mock do SDK

---

### T04.3 — Endpoint de usage para admin

**Arquivo a criar:** `src/app/api/admin/usage/route.ts`

**GET `/api/admin/usage`** — Retorna agregados de uso.

**Resposta:**
```json
{
  "data": {
    "totals": {
      "sessions": 142,
      "inputTokens": 1250000,
      "outputTokens": 890000,
      "cacheReadTokens": 4500000,
      "cacheCreationTokens": 200000,
      "estimatedCostUSD": 18.45
    },
    "recentThreads": [
      {
        "threadId": "uuid",
        "teacherName": "Maria Silva",
        "title": "Adaptacao de questoes dissertativas",
        "inputTokens": 5000,
        "outputTokens": 3200,
        "estimatedCostUSD": 0.063,
        "updatedAt": "2026-04-10T..."
      }
    ]
  }
}
```

**Query SQL:**
- `totals`: `SELECT COUNT(*), SUM(total_input_tokens), ... FROM consultant_threads WHERE managed_session_id IS NOT NULL`
- `recentThreads`: JOIN `consultant_threads` com `profiles` (para nome do professor), WHERE `managed_session_id IS NOT NULL`, ORDER BY `updated_at DESC`, LIMIT 50

Protegido por `withAdminRoute` (middleware existente em `src/app/api/admin/with-admin-route.ts`).

**Criterios de aceite:**
- [ ] Protegido por autenticacao admin
- [ ] Retorna totais agregados
- [ ] Retorna lista de threads recentes com custo individual
- [ ] Formato segue padrao `apiSuccess()`
- [ ] Testes com mock do Supabase

---

### T04.4 — Remover feature flag e fixar backend managed

**Arquivos a modificar:**
- `src/app/api/teacher/threads/route.ts`
- `src/app/api/teacher/threads/[id]/messages/route.ts`
- `src/lib/env.ts`

**Arquivo a remover:**
- `src/features/support/consultant-backend.ts`

**Pre-condicao:** Feature flag `CONSULTANT_BACKEND=managed` validada em ambiente de teste/producao por periodo suficiente (sugestao: minimo 1 semana sem erros no Sentry).

**Acoes:**
1. Remover imports e chamadas a `getConsultantBackend()` das rotas
2. Remover branches condicionais do Mastra — manter apenas fluxo Managed Agents
3. Remover arquivo `consultant-backend.ts`
4. Remover `CONSULTANT_BACKEND` do schema Zod em `env.ts`
5. Tornar env vars Anthropic (`ANTHROPIC_API_KEY`, `MANAGED_AGENT_ID`, `MANAGED_AGENT_ENVIRONMENT_ID`, `MANAGED_AGENT_MEMORY_STORE_ID`) obrigatorias no schema

**Criterios de aceite:**
- [ ] Nenhuma referencia a `getConsultantBackend()` no codebase
- [ ] Rotas usam exclusivamente gateway Managed Agents
- [ ] Env vars Anthropic obrigatorias
- [ ] Startup falha se ausentes
- [ ] Build, typecheck e testes passam

---

### T04.5 — Remover arquivos Mastra do consultor

**Arquivos a remover:**
- `src/mastra/agents/tea-consultant-agent.ts`
- `src/mastra/prompts/tea-consultant-prompt.ts`
- `src/mastra/rag/tea-query-tool.ts`
- `src/mastra/rag/vector-store.ts`
- `src/mastra/rag/ingest.ts`

**Arquivo a manter:** `src/mastra/rag/chunker.ts`

**Pre-verificacao obrigatoria:**

Antes de remover cada arquivo, verificar que nenhum outro modulo o importa:

```bash
grep -r "tea-consultant-agent" src/ --include="*.ts" --include="*.tsx"
grep -r "tea-consultant-prompt" src/ --include="*.ts" --include="*.tsx"
grep -r "tea-query-tool" src/ --include="*.ts" --include="*.tsx"
grep -r "from.*rag/vector-store" src/ --include="*.ts"
grep -r "from.*rag/ingest" src/ --include="*.ts"
```

Se algum resultado apontar para arquivo fora do escopo de remocao, ajustar o import antes de deletar.

**Criterios de aceite:**
- [ ] Grep confirma 0 imports externos antes de cada remocao
- [ ] 5 arquivos removidos
- [ ] `chunker.ts` mantido
- [ ] `npm run typecheck` passa
- [ ] `npm run test` passa
- [ ] Build passa

---

### T04.6 — Remover dependencias npm exclusivas

**Arquivo a modificar:** `package.json`

**Pre-verificacao obrigatoria:**

```bash
grep -r "@mastra/rag" src/ --include="*.ts" --include="*.tsx"
grep -r "@mastra/libsql" src/ --include="*.ts" --include="*.tsx"
grep -r "@mastra/memory" src/ --include="*.ts" --include="*.tsx"
```

Remover apenas dependencias com 0 resultados no grep. **Nao remover `@mastra/core`** (usada por outros workflows).

```bash
npm uninstall @mastra/rag          # se 0 resultados
npm uninstall @mastra/libsql       # se 0 resultados
npm uninstall @mastra/memory       # se 0 resultados
```

**Criterios de aceite:**
- [ ] Grep confirma ausencia de imports
- [ ] Dependencias removidas do `package.json`
- [ ] `npm install` sem erros
- [ ] Build, typecheck e testes passam

---

### T04.7 — Script de migracao de threads existentes

**Arquivo a criar:** `scripts/migrate-existing-threads.ts`

Script para migrar threads ativas criadas no Mastra que nao tem `managed_session_id`.

**Fluxo:**

1. Buscar threads: `SELECT id FROM consultant_threads WHERE managed_session_id IS NULL`
2. Para cada thread:
   a. Criar session no Managed Agent via `createConsultantSession()`
   b. Atualizar: `UPDATE consultant_threads SET managed_session_id = $sessionId WHERE id = $threadId`
3. Imprimir progresso: quantas migradas, quantas ignoradas, erros

**Decisao sobre historico de mensagens:**

Replay completo de mensagens antigas e caro e pode nao valer a pena. **Recomendacao:** Criar session limpa. Se o professor retomar uma conversa migrada, ela comeca "fresca" mas com acesso a mesma knowledge base.

**Alternativa conservadora:** Nao migrar threads antigas. Elas ficam com `managed_session_id = NULL` e falham gracefully se o professor tentar enviar mensagem (retornar erro amigavel sugerindo criar nova conversa).

**Criterios de aceite:**
- [ ] Script identifica threads sem `managed_session_id`
- [ ] Cria sessions e atualiza mapeamento
- [ ] Idempotente (re-executar nao duplica)
- [ ] Log de progresso
- [ ] Trata erros por thread (nao para tudo)
- [ ] Limitacao documentada: historico pre-migracao nao preservado

---

## Ordem de Execucao

```
Fase 1 (imediata):
  T04.1 (30 min) → T04.2 (3h) → T04.3 (2h) → T04.7 (2h)

Fase 2 (apos validacao em producao):
  T04.4 (1-2h) → T04.5 (30 min) → T04.6 (30 min)
```

Fase 2 so inicia apos periodo de validacao com feature flag `managed` ativa.

---

## Riscos

| Risco | Mitigacao |
|-------|-----------|
| Precos do Claude mudam | Tabela de precos como constante nomeada; facil de atualizar |
| Remocao de dependencia quebra outro workflow | Grep obrigatorio antes de remover |
| Professor perde historico de thread migrada | Documentar limitacao; sugerir nova conversa |
| Remover flag antes de validacao | Criterio: 1 semana com 0 erros Sentry |
