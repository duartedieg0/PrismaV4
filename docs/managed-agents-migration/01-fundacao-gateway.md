# Epic 01 — Fundacao e Gateway Anthropic

**Contexto completo:** `00-contexto.md`
**Dependencias:** Nenhuma (pode iniciar imediatamente)

---

## Objetivo

Estabelecer a camada de integracao com a API Claude Managed Agents e provisionar os recursos necessarios (Agent, Environment, Memory Store) para que os epicos seguintes possam migrar o Consultor TEA. Este epico nao altera nenhum comportamento visivel ao usuario.

---

## Escopo

**Cobre:**

- Instalacao do SDK `@anthropic-ai/sdk`
- Criacao do modulo gateway `src/gateways/managed-agents/`
- Scripts de provisionamento (agent, environment, memory store)
- Migracao de banco para adicionar `managed_session_id` na tabela `consultant_threads`
- Validacao de env vars no startup (`src/lib/env.ts`)
- Testes unitarios do gateway

**Nao cobre:**

- Migracao da knowledge base (Epic 02)
- Alteracao de rotas de API ou frontend (Epic 03)
- Remocao de codigo Mastra (Epic 04)

---

## Tarefas

### T01.1 — Instalar SDK Anthropic

**Arquivo:** `package.json`

```bash
npm install @anthropic-ai/sdk
```

**Criterios de aceite:**
- [ ] `@anthropic-ai/sdk` presente no `package.json` como dependencia
- [ ] `npm run build` passa sem erros
- [ ] `npm run typecheck` passa sem erros

---

### T01.2 — Criar modulo gateway Managed Agents

**Arquivos a criar:**

```
src/gateways/managed-agents/
  client.ts         — instancia do SDK + config de IDs
  tea-consultant.ts — operacoes especificas do consultor TEA
```

**`client.ts`** — Cliente centralizado:

Deve exportar:
- `anthropicClient` — instancia de `Anthropic` (usa `ANTHROPIC_API_KEY` do env automaticamente)
- `MANAGED_AGENT_CONFIG` — objeto com `agentId`, `environmentId`, `memoryStoreId` lidos de env vars

**`tea-consultant.ts`** — Tres operacoes core:

1. **`createConsultantSession(title?: string): Promise<Session>`**
   - Chama `client.beta.sessions.create()` com agent ID, environment ID e memory store attached como resource `read_only`
   - O `prompt` do resource deve instruir: "Base de conhecimento sobre TEA e adaptacao de avaliacoes. Consulte SEMPRE antes de responder perguntas do professor."
   - Retorna o objeto session

2. **`sendMessageAndStream(sessionId: string, userMessage: string): Promise<AsyncIterable<Event>>`**
   - Abre stream com `client.beta.sessions.events.stream(sessionId)`
   - Envia `user.message` event com `client.beta.sessions.events.send()`
   - Retorna o async iterable do stream

3. **`getSessionMessages(sessionId: string): Promise<Array<{ id, role, content, createdAt }>>`**
   - Lista eventos com `client.beta.sessions.events.list(sessionId)`
   - Filtra por `user.message` e `agent.message`
   - Extrai texto dos content blocks
   - Retorna no formato que o frontend espera: `{ id, role: "user"|"assistant", content, createdAt }`

**Requisitos:**
- Tipar retornos sem uso de `any`
- Erros da API mapeados para tipos do dominio (nao expor detalhes do SDK para as rotas)
- Server-side only (nao deve ser importado no client)

**Criterios de aceite:**
- [ ] `client.ts` criado com exportacao do client e config
- [ ] `tea-consultant.ts` criado com as 3 funcoes
- [ ] Funcoes tipadas sem uso de `any`
- [ ] Erros mapeados (ex: session nao encontrada → erro de dominio)
- [ ] Testes unitarios com mocks do SDK para cada funcao
- [ ] Build e typecheck passam

---

### T01.3 — Script de provisionamento de recursos

**Arquivo a criar:** `scripts/setup-managed-agent.ts`

Script CLI executavel com `npx tsx scripts/setup-managed-agent.ts` que provisiona:

1. **Agent:**
   - Nome: `"TEA Consultant"`
   - Model: `"claude-sonnet-4-6"`
   - System prompt: o conteudo de `TEA_CONSULTANT_INSTRUCTIONS` (ver secao 2.3 do contexto), com uma adaptacao: substituir "Use a ferramenta de busca disponivel" por "Consulte a base de conhecimento (memory store) antes de responder"
   - Tools: `agent_toolset_20260401` — desabilitar tudo exceto o necessario. O agente precisa apenas das memory tools (automaticas) e opcionalmente `web_search` para complementar. Configurar com `default_config: { enabled: false }` e habilitar seletivamente se necessario. Obs: as memory tools (`memory_search`, `memory_read`, `memory_list`) sao automaticamente habilitadas quando um memory store esta attached, nao precisam ser listadas no toolset.

2. **Environment:**
   - Nome: `"tea-consultant-env"`
   - Config: cloud, networking unrestricted

3. **Memory Store:**
   - Nome: `"TEA Knowledge Base"`
   - Description: `"Base de conhecimento sobre TEA (Transtorno do Espectro Autista), adaptacao de avaliacoes, legislacao brasileira de educacao inclusiva e boas praticas pedagogicas. O agente deve consultar esta base SEMPRE antes de responder perguntas."`

O script deve imprimir os IDs no formato copiavel para `.env`:

```
MANAGED_AGENT_ID=agent_01...
MANAGED_AGENT_ENVIRONMENT_ID=env_01...
MANAGED_AGENT_MEMORY_STORE_ID=memstore_01...
```

**Criterios de aceite:**
- [ ] Script cria Agent com system prompt correto
- [ ] Script cria Environment cloud
- [ ] Script cria Memory Store com descricao adequada
- [ ] IDs impressos no formato `.env`
- [ ] System prompt ajustado para referenciar memory store
- [ ] Funciona com `npx tsx scripts/setup-managed-agent.ts`

---

### T01.4 — Migracao de banco: coluna managed_session_id

**Arquivo a criar:** `supabase/migrations/00015_managed_session_id.sql`

```sql
ALTER TABLE consultant_threads
  ADD COLUMN managed_session_id TEXT;

CREATE INDEX idx_consultant_threads_session
  ON consultant_threads (managed_session_id)
  WHERE managed_session_id IS NOT NULL;

COMMENT ON COLUMN consultant_threads.managed_session_id IS
  'ID da session no Claude Managed Agents API (sess_...)';
```

A coluna e nullable para coexistencia: threads Mastra existentes tem NULL, threads Managed novas tem o session ID.

**Criterios de aceite:**
- [ ] Migracao criada como arquivo `00015_managed_session_id.sql`
- [ ] Coluna `managed_session_id` adicionada como `TEXT` nullable
- [ ] Indice parcial criado (WHERE NOT NULL)
- [ ] Migracao executa sem erros
- [ ] SELECT existentes nao quebram (coluna nova nao aparece em queries com campos explicitos)

---

### T01.5 — Registrar env vars no validador de startup

**Arquivo a modificar:** `src/lib/env.ts`

Adicionar as novas variaveis ao schema de validacao Zod. As variaveis devem ser **condicionalmente obrigatorias**: quando `MANAGED_AGENT_ID` esta presente, `ANTHROPIC_API_KEY`, `MANAGED_AGENT_ENVIRONMENT_ID` e `MANAGED_AGENT_MEMORY_STORE_ID` tambem devem estar.

Quando todas estao ausentes, o sistema continua funcionando com Mastra (sem alteracao de comportamento).

**Variaveis:**
- `ANTHROPIC_API_KEY` — string, obrigatoria se MANAGED_AGENT_ID presente
- `MANAGED_AGENT_ID` — string, opcional
- `MANAGED_AGENT_ENVIRONMENT_ID` — string, obrigatoria se MANAGED_AGENT_ID presente
- `MANAGED_AGENT_MEMORY_STORE_ID` — string, obrigatoria se MANAGED_AGENT_ID presente

**Criterios de aceite:**
- [ ] Variaveis adicionadas ao schema Zod
- [ ] Startup nao falha quando todas ausentes
- [ ] Startup falha com mensagem clara se `MANAGED_AGENT_ID` presente mas `ANTHROPIC_API_KEY` ausente
- [ ] Testes existentes continuam passando
- [ ] Novos testes cobrem: todas ausentes (ok), todas presentes (ok), parciais (erro)

---

## Ordem de Execucao Recomendada

```
T01.1 (10 min) → T01.4 (30 min) → T01.2 (3-4h) → T01.5 (1h) → T01.3 (2h)
```

---

## Riscos

| Risco | Mitigacao |
|-------|-----------|
| API Managed Agents em beta pode mudar | Toda interacao encapsulada no gateway (2 arquivos) |
| SDK adiciona peso ao bundle do frontend | Verificar que e server-side only |
| Memory Store research preview nao habilitado | Solicitar acesso antes; T01.3 falhara claramente |
| Env vars do Managed Agent vazam para client | Nao usar prefixo `NEXT_PUBLIC_` |
