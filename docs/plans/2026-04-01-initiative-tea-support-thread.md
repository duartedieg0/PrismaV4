# Iniciativa: Thread de Suporte com Agente TEA

## Contexto

O PRISMA hoje opera em modelo batch: o professor sobe uma prova, o sistema adapta as questoes e entrega o resultado. Nao existe canal para o professor tirar duvidas sobre TEA, entender por que uma adaptacao foi feita de determinada forma, ou consultar boas praticas de inclusao.

Professores frequentemente nao tem formacao especifica em TEA (Schmidt et al., 2016) e precisam de suporte contextualizado para aplicar adaptacoes com seguranca pedagogica.

## Objetivo

Permitir que o professor abra uma conversa (thread) com um agente consultor especializado em TEA, alimentado por documentos de referencia cientifica e pedagogica, para tirar duvidas e receber orientacoes fundamentadas.

## Decisoes de escopo (V1)

| Decisao | Definicao |
|---|---|
| Apoios cobertos | Apenas TEA |
| Fonte de conhecimento | Discovery-TEA.md + documentos/artigos adicionais |
| Localizacao na UI | Nova secao no menu lateral da area do professor |
| Conexao com adaptacoes | Fora de escopo (professor nao pergunta sobre uma adaptacao especifica) |
| Limites de uso | Fora de escopo (sem throttling ou caps na V1) |

## Premissas tecnicas

- Mastra e o framework de agentes do projeto; todas as primitivas necessarias (threads, memory, RAG) existem no ecossistema
- `@mastra/libsql` ja esta instalado como dependencia
- O padrao de arquitetura segue `Next route -> service -> Mastra agent/workflow -> persistence`
- O sistema de runtime events existente sera estendido para rastrear interacoes do consultor

## Decisoes de infraestrutura

### Vector Store: Turso (LibSQL hospedado)

**Decisao**: Usar Turso como vector store em todos os ambientes.

**Contexto**: A aplicacao roda na Vercel (serverless). O LibSQL com `file:` local nao funciona em ambientes efemeros — o filesystem e descartado entre requests. Turso e o LibSQL hospedado na nuvem, compativel com `@mastra/libsql` sem mudanca de codigo.

| Ambiente | Configuracao | Custo |
|---|---|---|
| Local (dev/PoC) | `turso dev --db-file vector.db` em `http://127.0.0.1:8080` | Zero |
| Producao (Vercel) | `libsql://banco.turso.io` com auth token | Free tier (500 DBs, 9GB, 25M reads/mes) |

**Vantagem**: mesma interface (`LibSQLVector`) e mesma connection string parametrizada por env var em todos os ambientes. Zero divergencia entre local e producao.

**Integracao Vercel**: Turso tem integracao nativa no Vercel Marketplace (zero-config para env vars).

### Embedding: @mastra/fastembed

**Decisao**: Usar `@mastra/fastembed` para gerar embeddings localmente.

**Contexto**: Nao depende de API externa (OpenAI, etc). Roda no Node.js local. Suficiente para a PoC e possivelmente para producao. Pode ser substituido por embedding via API se a qualidade em PT-BR nao for satisfatoria.

---

## Epico 1: Knowledge Base e RAG Pipeline

### Objetivo

Construir a infraestrutura de ingestao, indexacao e recuperacao de documentos que alimentara o agente consultor. Este e o alicerce de toda a feature — sem RAG robusto, o agente alucina.

### Escopo

- Configuracao do Turso como vector store (local via `turso dev`, producao via Turso cloud)
- Pipeline de ingestao de documentos:
  - Leitura de arquivos (Markdown, PDF)
  - Chunking semantico por secao/subsecao (nao por tamanho fixo)
  - Enriquecimento de metadata (secao, subsecao, tipo: principio/regra/anti-padrao/exemplo/legislacao)
  - Embedding via modelo configuravel
  - Armazenamento no vector store
- Indexacao do Discovery-TEA.md como documento inaugural
- Pipeline reutilizavel para adicionar novos documentos (artigos, marcos legais, novos discoveries)
- `createVectorQueryTool` configurado para o agente consultor com filtros de metadata
- Testes de retrieval com perguntas representativas de professores

### Riscos especificos

| Risco | Impacto | Mitigacao |
|---|---|---|
| Chunking ingenuo perde relacoes hierarquicas do documento | Respostas fragmentadas ou sem contexto | Chunking por secao semantica; metadata rica; overlap entre chunks |
| Modelo de embedding nao captura bem portugues pedagogico | Retrieval impreciso | Testar com perguntas reais em PT-BR; avaliar modelos multilinguais |
| Turso free tier insuficiente em escala | Custo inesperado | Monitorar uso; plano pago a partir de ~$5/mes se necessario |

### Entregaveis

- [ ] Vector store configurado e acessivel pelo runtime Mastra
- [ ] Pipeline de ingestao funcional (input: documento -> output: chunks indexados)
- [ ] Discovery-TEA.md indexado com metadata por secao
- [ ] Query tool testado com pelo menos 10 perguntas representativas
- [ ] Documentacao do processo de adicionar novos documentos

### Dependencias

- Nenhuma dependencia de outros epicos (pode comecar primeiro)

---

## Epico 2: Agente Consultor TEA

### Objetivo

Criar um novo agente Mastra dedicado a consultoria pedagogica sobre TEA, com memory para manter contexto da conversa e acesso ao knowledge base via RAG.

### Escopo

- Novo agente Mastra: `tea-consultant-agent`
- System prompt orientado a consultoria (nao a reescrita de questoes):
  - Identidade: assistente pedagogico baseado em evidencias sobre TEA
  - Comportamento: responde com base nos documentos da knowledge base
  - Guardrail: cita a fonte/secao quando possivel; diz "nao encontrei essa informacao na base" quando sem cobertura
  - Tom: profissional, acessivel, nao clinico
  - Restricao: nao da diagnostico, nao substitui especialista, nao pede dados identificaveis de alunos
- Configuracao de `@mastra/memory`:
  - `lastMessages`: historico recente da thread (ex: ultimas 20 mensagens)
  - `workingMemory`: preferencias do professor que persistem entre threads (ex: ano letivo, disciplina, perfil de turma)
- Integracao com `createVectorQueryTool` do Epico 1
- Registro no runtime Mastra (`src/mastra/runtime.ts`)
- Modelo configuravel (pode usar modelo diferente/menor que o de adaptacao)

### Design do system prompt

```
Voce e um assistente pedagogico especializado em adaptacao de avaliacoes 
para estudantes com Transtorno do Espectro Autista (TEA).

Seu papel:
- Responder duvidas de professores sobre como adaptar provas para TEA
- Explicar principios de adaptacao com base em evidencias cientificas
- Orientar sobre o que fazer e o que evitar ao adaptar questoes
- Esclarecer aspectos da legislacao brasileira de educacao inclusiva

Suas regras:
- Sempre consulte a base de conhecimento antes de responder
- Cite a fonte ou secao quando a informacao vier de um documento especifico
- Se nao encontrar a informacao na base, diga claramente
- Nao de diagnosticos clinicos nem substitua profissionais de saude
- Nao peca nome, CPF ou dados identificaveis de alunos
- Mantenha tom profissional e acessivel
- Responda em portugues brasileiro
```

### Riscos especificos

| Risco | Impacto | Mitigacao |
|---|---|---|
| Alucinacao em orientacoes pedagogicas | Professor aplica conselho incorreto | RAG com citacao obrigatoria; instrucao explicita de "nao sei" |
| Professor confunde consultor com especialista clinico | Expectativa desalinhada | Onboarding claro; system prompt delimita papel |
| Working memory acumula informacao desatualizada | Respostas com contexto errado | Mecanismo de reset; expirar working memory periodicamente |

### Entregaveis

- [ ] Agente `tea-consultant-agent` criado e registrado no runtime
- [ ] Memory configurada com message history + working memory
- [ ] RAG tool integrado ao agente
- [ ] System prompt revisado com equipe pedagogica
- [ ] Guardrails de output validados (citacao, "nao sei", anti-PII)

### Dependencias

- Epico 1 (Knowledge Base) — precisa do vector store e query tool prontos

---

## Epico 3: API de Threads e Mensagens

### Objetivo

Expor endpoints para o frontend gerenciar threads e trocar mensagens com o agente consultor.

### Escopo

- Modelo de dados:
  - `consultant_threads`: id, teacher_id (profile_id), agent_type, title, created_at, updated_at
  - Mensagens gerenciadas pelo `@mastra/memory` (nao duplicar no schema do app)
- Endpoints:
  - `POST /api/teacher/threads` — cria nova thread, retorna threadId
  - `GET /api/teacher/threads` — lista threads do professor (paginada, ordenada por updated_at)
  - `GET /api/teacher/threads/[id]` — retorna thread com historico de mensagens
  - `POST /api/teacher/threads/[id]/messages` — envia mensagem, retorna resposta do agente
  - `DELETE /api/teacher/threads/[id]` — encerra/arquiva thread
- Streaming da resposta do agente (SSE ou ReadableStream) para UX fluida
- Integracao com auth existente (professor autenticado via Supabase)
- Runtime event para cada interacao: `consultant_message_sent`, `consultant_response_completed`
- Validacao de input (mensagem nao vazia, tamanho maximo)

### Decisoes de design

| Decisao | Escolha | Justificativa |
|---|---|---|
| Onde ficam as mensagens | No storage do `@mastra/memory` (LibSQL) | Evita duplicacao; Mastra ja gerencia historico |
| Metadata da thread | Tabela propria no Supabase (`consultant_threads`) | Precisa de FK para profile, queries de listagem, titulo |
| Streaming | SSE via `agent.stream()` | UX de chat precisa de resposta incremental |
| Autorizacao | Professor so acessa suas proprias threads | RLS no Supabase + validacao no endpoint |

### Riscos especificos

| Risco | Impacto | Mitigacao |
|---|---|---|
| Dois storages (Supabase para metadata, LibSQL para mensagens) | Complexidade de sync | Thread e criada atomicamente em ambos; delete cascadeia |
| Streaming falha no meio da resposta | UX quebrada | Retry client-side; mensagem parcial salva como rascunho |
| Professor perde thread por erro de sessao | Frustracao | Threads persistem no servidor; frontend recarrega ao reconectar |

### Entregaveis

- [ ] Modelo `consultant_threads` no schema Supabase (migracao)
- [ ] Endpoints CRUD de threads implementados e protegidos por auth
- [ ] Endpoint de mensagem com streaming funcional
- [ ] Runtime events integrados ao sistema de observabilidade existente
- [ ] Testes de integracao para cada endpoint

### Dependencias

- Epico 2 (Agente Consultor) — precisa do agente configurado para gerar respostas

---

## Epico 4: Interface do Professor (Frontend)

### Objetivo

Nova secao na area do professor com interface de chat para interagir com o agente consultor TEA.

### Escopo

- Nova opcao no sidebar: "Suporte TEA" (ou nome a definir com produto)
- Tela de listagem de threads:
  - Lista de conversas anteriores com titulo e data
  - Botao "Nova conversa"
  - Estado vazio com explicacao do que o consultor faz
- Interface de chat:
  - Area de mensagens com scroll (professor a direita, agente a esquerda)
  - Input de texto com submit (Enter + botao)
  - Indicador de "digitando..." durante streaming
  - Renderizacao de Markdown na resposta do agente (listas, negrito, citacoes)
  - Scroll automatico para ultima mensagem
- Onboarding (primeira visita):
  - Explicacao breve do que o agente pode e nao pode fazer
  - Exemplos de perguntas sugeridas
- Responsividade mobile

### Fora de escopo (V1)

- Avaliacao de resposta (like/dislike)
- Exportar conversa
- Busca dentro de threads
- Sugestoes de perguntas durante a conversa

### Riscos especificos

| Risco | Impacto | Mitigacao |
|---|---|---|
| Professor espera resposta instantanea | Percepcao de lentidao | Streaming resolve; indicador de progresso claro |
| Respostas longas do agente congestionam a tela | UX ruim | Limitar tamanho no system prompt; collapsar respostas longas |
| Chat nao e familiar para professores menos digitais | Baixa adocao | Onboarding; perguntas sugeridas; design simples |

### Entregaveis

- [ ] Item "Suporte TEA" no sidebar do professor
- [ ] Tela de listagem de threads
- [ ] Interface de chat com streaming
- [ ] Onboarding de primeira visita
- [ ] Responsivo para mobile
- [ ] Testes de componente para fluxos criticos

### Dependencias

- Epico 3 (API) — precisa dos endpoints para listar threads e enviar mensagens

---

## Epico 5: Observabilidade e Seguranca

### Objetivo

Garantir que as interacoes com o consultor sejam rastreaveies, seguras e que problemas sejam detectaveis.

### Escopo

- Extensao do sistema de runtime events para a nova stage `consultant`:
  - `consultant_thread_created`
  - `consultant_message_sent`
  - `consultant_response_completed`
  - `consultant_response_failed`
- Metricas minimas:
  - Threads criadas por periodo
  - Mensagens por thread (media)
  - Tempo de resposta do agente (p50, p95)
  - Taxa de erro
- Guardrails de privacidade:
  - System prompt anti-PII (ja no Epico 2)
  - Log de interacoes nao inclui conteudo das mensagens em texto plano (apenas metadata)
  - Politica de retencao definida (ex: threads expiram apos 90 dias)
- Alertas para falhas recorrentes do agente

### Entregaveis

- [ ] Runtime events para stage `consultant` implementados
- [ ] Dashboard ou queries para metricas de uso
- [ ] Politica de retencao definida e documentada
- [ ] Logs de interacao seguem padrao de privacidade

### Dependencias

- Epico 3 (API) — precisa dos endpoints gerando eventos

---

## Sequenciamento recomendado

```
Epico 1: Knowledge Base & RAG ──────────┐
                                         ├──> Epico 2: Agente Consultor ──> Epico 3: API ──> Epico 4: Frontend
                                         │
                                         └──> Epico 5: Observabilidade (paralelo a partir do Epico 3)
```

**Caminho critico**: Epico 1 -> Epico 2 -> Epico 3 -> Epico 4

O Epico 1 pode comecar imediatamente e e o de maior risco tecnico (qualidade do RAG define a qualidade da feature inteira).

O Epico 5 pode ser desenvolvido em paralelo a partir do momento que o Epico 3 define os eventos.

---

## Riscos transversais

| Risco | Probabilidade | Impacto | Mitigacao |
|---|---|---|---|
| Qualidade das respostas insuficiente para uso pedagogico | Media | Alto | Testes com professores reais antes do lancamento; iteracao no system prompt |
| Mastra memory/RAG tem limitacoes nao documentadas | Baixa | Alto | PoC tecnica no Epico 1 antes de comprometer a arquitetura |
| Professor usa o chat como canal de suporte tecnico (bugs, senha) | Media | Baixo | System prompt delimita escopo; onboarding explica o proposito |
| Escalada de escopo para outros apoios antes de validar TEA | Media | Medio | V1 firme em TEA; arquitetura preparada para multi-agente, mas nao implementada |

---

## Criterios de sucesso (V1)

- Professor consegue abrir uma thread e receber resposta fundamentada em menos de 10 segundos
- Respostas citam fonte/secao do documento quando aplicavel
- Agente responde "nao encontrei essa informacao" em vez de inventar quando a pergunta foge da base
- Pelo menos 5 professores validam a utilidade em teste controlado
- Zero vazamento de dados identificaveis de alunos nas threads

---

## Proximos passos

1. **PoC tecnica (Epico 1)**: Configurar vector store + indexar Discovery-TEA.md + testar retrieval com 10 perguntas
2. **Revisao com equipe pedagogica**: Validar system prompt e exemplos de interacao
3. **Prototipo de UI**: Wireframe da secao de suporte no sidebar
4. **Priorizacao no roadmap**: Definir sprint/fase de inicio
