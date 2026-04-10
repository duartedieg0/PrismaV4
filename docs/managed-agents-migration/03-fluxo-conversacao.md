# Epic 03 — Migracao do Fluxo de Conversacao

**Contexto completo:** `00-contexto.md`
**Dependencias:** Epic 01 (gateway) e Epic 02 (knowledge base ingerida) concluidos

---

## Objetivo

Migrar o fluxo completo de conversacao do Consultor TEA — criacao de threads, envio de mensagens com streaming e leitura de historico — do runtime Mastra para sessoes do Claude Managed Agents. Apos este epico, professores conversam com o consultor TEA rodando integralmente na infraestrutura Anthropic.

O frontend nao sofre nenhuma alteracao. As API routes Next.js trocam a implementacao interna.

---

## Escopo

**Cobre:**

- Feature flag via env var para rollback seguro
- Alteracao da rota `POST /api/teacher/threads` para criar Managed Agent session
- Alteracao da rota `POST /api/teacher/threads/[id]/messages` para streaming via Managed Agents
- Alteracao da rota `GET /api/teacher/threads/[id]/messages` para ler historico de session events
- Testes de integracao das rotas migradas

**Nao cobre:**

- Alteracao de componentes React (frontend inalterado)
- Rotas de listagem (`GET /threads`) e delecao (`DELETE /threads/[id]`) — permanecem Supabase puro
- Remocao de codigo Mastra (Epic 04)
- Tracking de custos (Epic 04)

---

## Contexto tecnico especifico

### Mapeamento de fluxos

| Operacao | Hoje (Mastra) | Futuro (Managed Agents) |
|----------|--------------|------------------------|
| Criar thread | INSERT no Supabase | `sessions.create()` + INSERT com `managed_session_id` |
| Enviar mensagem | `agent.stream()` → `UIMessageStream` | `events.send()` + `events.stream()` → converter para `UIMessageStream` |
| Ler historico | `LibSQLStore.listMessages()` | `events.list()` filtrado |
| Listar threads | SELECT Supabase | **Sem mudanca** |
| Deletar thread | DELETE Supabase | **Sem mudanca** |

### Conversao de streaming (ponto critico)

O frontend usa `useChat` (AI SDK) com `DefaultChatTransport`. Espera receber `UIMessageStream`:

```
start → text-start(id) → text-delta(id, delta)* → text-end(id) → finish
```

O Managed Agent emite SSE com formato diferente:

```
session.status_running → agent.tool_use* → agent.message* → session.status_idle
```

A rota de mensagens converte em tempo real. Eventos `agent.tool_use` (quando o agente consulta memory_search) sao ignorados — transparentes para o professor.

Um `agent.message` pode conter multiplos content blocks de tipo `text`. Cada bloco vira um `text-delta`. Multiplos `agent.message` events podem chegar para uma mesma resposta (o agente pode intercalar tool_use e message).

### Geracao de titulo

A funcao `generateThreadTitle()` existente usa AI SDK `generateText()` com modelo da tabela `ai_models`. Ela funciona independente do backend do consultor e **nao precisa ser alterada**. Continua sendo chamada em background (`after()`) apos a primeira mensagem.

---

## Tarefas

### T03.1 — Implementar feature flag de backend

**Arquivos a criar/modificar:**

- `src/features/support/consultant-backend.ts` (novo)
- `src/lib/env.ts` (modificar)

**`consultant-backend.ts`:**

```typescript
export type ConsultantBackend = "mastra" | "managed";

export function getConsultantBackend(): ConsultantBackend {
  return process.env.CONSULTANT_BACKEND === "managed" ? "managed" : "mastra";
}
```

Registrar `CONSULTANT_BACKEND` como env var opcional em `env.ts` (string enum `"mastra" | "managed"`).

**Criterios de aceite:**
- [ ] Funcao exportada e tipada
- [ ] Env var registrada como opcional
- [ ] Default e `"mastra"` quando ausente
- [ ] Testes cobrem ambos os valores e ausencia

---

### T03.2 — Migrar criacao de thread (POST /api/teacher/threads)

**Arquivo a modificar:** `src/app/api/teacher/threads/route.ts`

**Apenas o handler POST muda.** O handler GET (listagem) nao precisa de alteracao.

**Logica com feature flag:**

Quando `getConsultantBackend() === "managed"`:
1. Chamar `createConsultantSession()` do gateway (Epic 01)
2. Inserir em `consultant_threads` com `managed_session_id = session.id`
3. Se a criacao da session falhar, nao inserir no Supabase

Quando `getConsultantBackend() === "mastra"`:
1. Comportamento identico ao atual (INSERT sem managed_session_id)

O retorno e o mesmo em ambos os casos: `{ threadId }` status 201.

**Criterios de aceite:**
- [ ] Backend `managed`: cria session + insere com `managed_session_id`
- [ ] Backend `mastra`: insere sem `managed_session_id` (atual)
- [ ] Retorno identico: `{ threadId }` com 201
- [ ] Falha na session nao cria registro orfao no Supabase
- [ ] Testes para ambos os backends

---

### T03.3 — Migrar envio de mensagem com streaming (POST /api/teacher/threads/[id]/messages)

**Arquivo a modificar:** `src/app/api/teacher/threads/[id]/messages/route.ts`

**Apenas o handler POST muda.** Esta e a tarefa mais complexa.

**Fluxo quando backend = managed:**

1. Validar input (mesmo schema `useChatSchema`, limite 2000 chars) — **sem mudanca**
2. Buscar thread no Supabase incluindo `managed_session_id`
3. Se `managed_session_id` ausente: retornar erro (thread nao migrada)
4. Chamar `sendMessageAndStream(managed_session_id, userContent)` do gateway
5. Converter stream Managed Agent → `UIMessageStream`:

```typescript
const stream = createUIMessageStream({
  execute: async ({ writer }) => {
    writer.write({ type: "start" });
    writer.write({ type: "text-start", id: "text-0" });

    let fullResponse = "";

    for await (const event of managedStream) {
      if (event.type === "agent.message") {
        for (const block of event.content) {
          if (block.type === "text") {
            writer.write({ type: "text-delta", id: "text-0", delta: block.text });
            fullResponse += block.text;
          }
        }
      }
      if (event.type === "session.status_idle") break;
    }

    writer.write({ type: "text-end", id: "text-0" });
    writer.write({ type: "finish" });
  },
});
```

6. Em background (`after()`):
   - Gerar titulo se primeira mensagem (via `generateThreadTitle()` existente — nao muda)
   - Atualizar `updated_at`
7. Retornar `createUIMessageStreamResponse({ stream })`

**Fluxo quando backend = mastra:**
1. Comportamento identico ao atual (nenhuma mudanca no codigo existente)

**Pontos de atencao:**
- `maxDuration` pode ser aumentado (Managed Agents pode levar mais tempo por causa do memory_search). Sugestao: 300 segundos.
- Se o stream falhar mid-stream (session termina com erro), emitir mensagem de erro no UIMessageStream antes de `finish`.
- A busca do `managed_session_id` requer incluir o campo no SELECT da query existente.

**Criterios de aceite:**
- [ ] Validacao de input identica (schema, 2000 chars)
- [ ] Backend `managed`: streaming funcional via Managed Agents
- [ ] Backend `mastra`: comportamento atual preservado
- [ ] Frontend recebe UIMessageStream que `useChat` consome
- [ ] Eventos `agent.tool_use` nao aparecem no stream do professor
- [ ] Texto completo acumulado para geracao de titulo
- [ ] Titulo gerado na primeira mensagem
- [ ] `updated_at` atualizado
- [ ] Erro mid-stream tratado (nao crash, nao tela branca)
- [ ] `maxDuration` adequado
- [ ] Testes com mock do stream (eventos simulados)

---

### T03.4 — Migrar leitura de historico (GET /api/teacher/threads/[id]/messages)

**Arquivo a modificar:** `src/app/api/teacher/threads/[id]/messages/route.ts`

**Apenas o handler GET muda.**

**Fluxo quando backend = managed:**

1. Buscar thread com `managed_session_id`
2. Chamar `getSessionMessages(managed_session_id)` do gateway
3. Retornar `{ data: { messages } }` no mesmo formato

**Formato de retorno (identico ao atual):**

```json
{
  "data": {
    "messages": [
      { "id": "evt_01...", "role": "user", "content": "Como adaptar...", "createdAt": "2026-04-10T..." },
      { "id": "evt_02...", "role": "assistant", "content": "Para adaptar...", "createdAt": "2026-04-10T..." }
    ]
  }
}
```

**Fluxo quando backend = mastra:**
1. Comportamento identico ao atual (LibSQLStore)

**Criterios de aceite:**
- [ ] Backend `managed`: historico lido da API de sessions
- [ ] Backend `mastra`: comportamento atual
- [ ] Formato identico: `{ data: { messages: [...] } }`
- [ ] Somente `user` e `assistant` (tool_use filtrado)
- [ ] Ordem cronologica
- [ ] Array vazio se sem mensagens ou erro
- [ ] Testes para ambos os backends

---

### T03.5 — Teste de integracao do fluxo completo

**Arquivo a criar:** `src/test/features/support/managed-consultant-flow.test.ts`

Teste que valida o fluxo completo com mocks do SDK Anthropic e Supabase.

**Cenarios:**

1. **Criar thread (managed)** → verifica session criada, `managed_session_id` salvo
2. **Enviar primeira mensagem** → verifica UIMessageStream, geracao de titulo
3. **Enviar segunda mensagem** → verifica session reutilizada, titulo nao regenerado
4. **Ler historico** → verifica formato correto, tool_use ausente
5. **Erro na session** → verifica tratamento graceful
6. **Feature flag mastra** → verifica que nenhuma chamada ao SDK Anthropic e feita

**Mocks necessarios:**
- `anthropicClient.beta.sessions.create()` → session fake com ID
- `anthropicClient.beta.sessions.events.stream()` → async iterable com: `agent.tool_use` (memory_search) → `agent.message` (texto) → `session.status_idle`
- `anthropicClient.beta.sessions.events.send()` → noop
- `anthropicClient.beta.sessions.events.list()` → lista de eventos `user.message` + `agent.message`
- Supabase: mocks das queries (insert, select, update)

**Criterios de aceite:**
- [ ] 6 cenarios implementados
- [ ] Formato do UIMessageStream verificado
- [ ] tool_use nao vaza para output
- [ ] Titulo gerado apenas na primeira mensagem
- [ ] `managed_session_id` persistido
- [ ] Feature flag respeitada
- [ ] Testes passam em CI

---

## Ordem de Execucao

```
T03.1 (1h) → T03.2 (2h) → T03.4 (2h) → T03.3 (4-5h) → T03.5 (3h)
```

T03.2 e T03.4 sao mais simples e preparam o terreno. T03.3 e o nucleo (streaming). T03.5 valida tudo.

---

## Riscos

| Risco | Mitigacao |
|-------|-----------|
| Cold start na primeira mensagem | UX ja tem "Digitando..."; documentar latencia esperada |
| Formato de eventos muda na beta | Gateway encapsula parsing |
| `agent.message` em multiplos eventos | Loop `for await` + acumulador ja trata |
| Feature flag adiciona complexidade | Early return pattern; branches claros |
| Professor recarrega durante streaming | GET historico retorna so mensagens completas |
| `generateThreadTitle()` depende de modelo Mastra | Tabela `ai_models` continua funcional |
