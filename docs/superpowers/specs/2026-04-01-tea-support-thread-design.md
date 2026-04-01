# Spec: Thread de Suporte com Agente Consultor TEA — V1

> Referência: `docs/plans/2026-04-01-PRD-tea-support-thread.md`

---

## Resumo

Nova funcionalidade que permite ao professor conversar com um agente consultor especializado em TEA, alimentado por RAG sobre documentos pedagógicos. Acessível via seção "Agentes IA de Suporte" no sidebar do professor.

---

## Decisões de design

| Decisão | Escolha | Justificativa |
|---------|---------|---------------|
| Escopo | V1 completa (5 épicos), sem PoC como gate | Agilidade — validação acontece durante desenvolvimento |
| Embedding | OpenAI `text-embedding-3-small` via API em todos os ambientes | Qualidade PT-BR, consistência dev/prod, custo marginal |
| Storage | Hybrid — Supabase para thread metadata, Mastra/LibSQL para mensagens | Flexibilidade de listagem via SQL + RLS, sem reimplementar message history |
| Onboarding | Mensagem de boas-vindas do agente na primeira thread | UX natural de chat, sem telas extras |
| Título da thread | Auto-gerado pelo agente após primeira interação | Sem atrito para o professor |
| Working memory | Fora da V1 — threads independentes | Simplicidade, sem risco de contexto desatualizado |
| Arquitetura | Hybrid (Mastra-First com metadata no Supabase) | Melhor dos dois mundos — primitivas Mastra + queries SQL |

---

## Seção 1: Knowledge Base & RAG

### Vector Store

`LibSQLVector` do Mastra, apontando para Turso. Connection string parametrizada por env var:
- Local: `turso dev --db-file vector.db` em `http://127.0.0.1:8080`
- Produção: `libsql://banco.turso.io` com auth token

### Embedding

OpenAI `text-embedding-3-small` via `@ai-sdk/openai` (já instalado no projeto). Modelo configurável via env var.

### Pipeline de ingestão

Script CLI em `src/mastra/rag/ingest.ts`, executável via script no `package.json`:

1. Lê documentos Markdown (futuramente PDF)
2. Chunking semântico por seção/subseção (headers `##`/`###` como delimitadores)
3. Cada chunk recebe metadata:
   - `source`: documento de origem
   - `section`: seção do documento
   - `subsection`: subseção
   - `type`: princípio | regra | anti-padrão | exemplo | legislação
4. Gera embedding via OpenAI API
5. Armazena no vector store (Turso/LibSQL)

Pipeline reutilizável para adicionar novos documentos.

### Query Tool

`createVectorQueryTool` do Mastra, configurado com filtros de metadata. O agente consultor recebe este tool e o usa automaticamente antes de responder.

### Documento inaugural

`Discovery-TEA.md` indexado com chunking semântico.

---

## Seção 2: Agente Consultor TEA

### Agente Mastra

Novo agente `tea-consultant-agent`, registrado no runtime (`src/mastra/agents/`).

### System prompt

Identidade de assistente pedagógico, não clínico:
- Responde com base nos documentos da knowledge base (RAG)
- Cita fonte/seção quando a informação vem de um documento
- Diz "não encontrei essa informação na base" quando sem cobertura
- Não dá diagnóstico clínico, não pede dados identificáveis de alunos
- Tom profissional e acessível, em PT-BR
- Na primeira mensagem de uma thread, se apresenta com boas-vindas e exemplos de perguntas sugeridas

### Modelo LLM

Configurável via tabela `ai_models` (padrão existente do projeto). Pode usar modelo menor/mais barato que o de adaptação.

### Memory

`@mastra/memory` com `lastMessages` (últimas 20 mensagens da thread). Sem working memory na V1.

### Tools do agente

- `vectorQueryTool` — busca na knowledge base
- `registerRuntimeEventTool` — registra eventos de observabilidade

### Geração de título

Após a primeira resposta, o agente gera um título curto para a thread. O título é salvo na tabela `consultant_threads` do Supabase.

### Guardrails

- Instrução no prompt para não inventar legislação/pesquisa
- Não solicitar PII de alunos
- Escopo delimitado: adaptação de avaliações para TEA, não suporte técnico do PRISMA

---

## Seção 3: API de Threads e Mensagens

### Tabela Supabase — `consultant_threads`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `uuid` (PK) | ID da thread (mesmo usado como `threadId` no Mastra) |
| `teacher_id` | `uuid` (FK → profiles) | Professor dono da thread |
| `agent_slug` | `text` | Identificador do agente (ex: `tea-consultant`) |
| `title` | `text` (nullable) | Título auto-gerado, null até primeira resposta |
| `created_at` | `timestamptz` | Criação |
| `updated_at` | `timestamptz` | Última interação |

RLS: professor só vê/deleta suas próprias threads.

### Endpoints

| Método | Rota | Ação |
|--------|------|------|
| `POST` | `/api/teacher/threads` | Cria thread no Supabase + no Mastra. Retorna `threadId` |
| `GET` | `/api/teacher/threads` | Lista threads do professor (paginada, ordenada por `updated_at` desc). Filtra por `agent_slug` |
| `GET` | `/api/teacher/threads/[id]` | Retorna metadata + histórico de mensagens (via Mastra Memory) |
| `POST` | `/api/teacher/threads/[id]/messages` | Envia mensagem, retorna resposta do agente via streaming |
| `DELETE` | `/api/teacher/threads/[id]` | Deleta thread no Supabase + no Mastra |

### Streaming

`agent.stream()` do Mastra, retornado como `ReadableStream` no route handler do Next.js.

### Fluxo de criação

1. `POST /threads` → cria registro no Supabase (título null) + cria thread no Mastra com `resourceId = teacher_id`
2. Professor envia primeira mensagem → agente responde com boas-vindas + resposta
3. Agente gera título → atualiza `consultant_threads.title` no Supabase

### Fluxo de delete

1. `DELETE /threads/[id]` → verifica ownership via RLS → deleta no Supabase → deleta thread/mensagens no Mastra

### Runtime events

`consultant_thread_created`, `consultant_message_sent`, `consultant_response_completed`, `consultant_response_failed`

---

## Seção 4: Interface do Professor (Frontend)

### Navegação

Novo item "Agentes IA de Suporte" no sidebar do professor.

### Tela de agentes (`/support`)

- Grid/lista de cards dos agentes disponíveis para conversa
- V1: apenas o card "Agente Consultor TEA"
- Cada card: nome do agente, descrição breve, ícone/ilustração
- Arquitetura preparada para novos agentes sem mudar o layout

### Tela de listagem de threads (`/support/[agentSlug]`)

- Header com nome do agente + botão voltar
- Lista de threads com título, data da última interação
- Botão "Nova conversa"
- Estado vazio incentivando criar a primeira conversa
- Cada thread com botão de deletar com confirmação

### Interface de chat (`/support/[agentSlug]/[threadId]`)

- Header com título da thread + botão voltar para listagem
- Área de mensagens com scroll: professor à direita, agente à esquerda
- Renderização Markdown nas respostas (listas, negrito, citações)
- Indicador de "digitando..." durante streaming
- Auto-scroll para última mensagem
- Input de texto com submit via Enter + botão de envio
- Input desabilitado enquanto o agente está respondendo

### Onboarding

Integrado na primeira mensagem do agente — sem tela separada, sem modal.

### Responsividade

Mobile-first. Navegação em stack: agentes → threads → chat.

### Stack de componentes

Tailwind CSS 4 + tokens do projeto. Markdown rendering via `react-markdown` ou similar.

---

## Seção 5: Observabilidade e Segurança

### Runtime events

Extensão do sistema existente, nova stage `consultant`:

| Evento | Quando |
|--------|--------|
| `consultant_thread_created` | Thread criada |
| `consultant_message_sent` | Professor envia mensagem |
| `consultant_response_completed` | Agente termina resposta |
| `consultant_response_failed` | Erro na resposta do agente |

Metadata nos eventos: `threadId`, `agentSlug`, `teacherId`, `model`, `promptVersion`.

### Métricas mínimas

Consultáveis via queries no Supabase/logs:
- Threads criadas por período
- Mensagens por thread (média)
- Tempo de resposta do agente (p50, p95)
- Taxa de erro

### Privacidade

- System prompt anti-PII (agente não pede dados identificáveis)
- Logs de eventos registram apenas metadata, não conteúdo das mensagens
- Política de retenção: threads sem interação há 90 dias marcadas para expiração (limpeza automática pode ficar para V2, política documentada na V1)

### Tratamento de erros

- Falha no streaming: frontend exibe mensagem de erro com opção de reenviar
- Falha no RAG: agente responde sem contexto (degrada gracefully) e registra evento `consultant_response_failed`

---

## Fora de escopo (V1)

| Item | Motivo |
|------|--------|
| Suporte a outros apoios (TDAH, dislexia, DI) | V1 valida com TEA; arquitetura preparada |
| Working memory entre threads | Simplicidade; cada thread é independente |
| Perguntas sobre adaptações específicas | Requer integração com resultado de adaptação |
| Limites de uso (throttling, caps) | Prematuro sem dados de uso real |
| Avaliação de resposta (like/dislike) | Feedback para V2 |
| Exportar conversa | Nice-to-have |
| Busca dentro de threads | Volume baixo na V1 |
| Sugestões de perguntas durante a conversa | UX para V2 |
| Limpeza automática de threads expiradas | Política definida, implementação V2 |

---

## Sequenciamento

```
Épico 1: Knowledge Base & RAG ──────────┐
                                         ├──> Épico 2: Agente Consultor ──> Épico 3: API ──> Épico 4: Frontend
                                         │
                                         └──> Épico 5: Observabilidade (paralelo a partir do Épico 3)
```

Caminho crítico: Épico 1 → Épico 2 → Épico 3 → Épico 4

---

## Critérios de sucesso (V1)

- Professor consegue abrir uma thread e receber resposta fundamentada em menos de 10 segundos
- Respostas citam fonte/seção do documento quando aplicável
- Agente responde "não encontrei essa informação" em vez de inventar
- Interface responsiva funciona em mobile
- Zero vazamento de dados identificáveis de alunos nas threads
- Navegação "Agentes IA de Suporte" preparada para múltiplos agentes
