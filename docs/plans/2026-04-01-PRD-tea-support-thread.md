# PRD: Thread de Suporte com Agente Consultor TEA

> Documento de referencia para desenvolvimento SDD (Spec-Driven Development).
> Iniciativa detalhada em: `docs/plans/2026-04-01-initiative-tea-support-thread.md`

---

## 1. Problema

Professores da educacao basica brasileira frequentemente nao possuem formacao especifica sobre Transtorno do Espectro Autista (Schmidt et al., 2016). O PRISMA ja adapta questoes de prova para TEA via agente de IA, mas o professor nao tem onde tirar duvidas sobre:

- **Por que** certas adaptacoes sao feitas de determinada forma
- **Como** aplicar principios de acessibilidade ao elaborar questoes
- **O que** a legislacao brasileira garante para estudantes com TEA
- **Quais** armadilhas evitar ao adaptar avaliacoes (infantilizacao, rebaixamento cognitivo, etc.)

Hoje o conhecimento esta concentrado no documento Discovery-TEA.md e no prompt do agente de adaptacao — nenhum dos dois e acessivel ao professor.

---

## 2. Solucao proposta

Um agente consultor conversacional, acessivel via interface de chat na area do professor, alimentado por uma base de conhecimento (RAG) construida a partir de documentos cientificos e pedagogicos sobre TEA.

O professor abre uma thread, faz perguntas em linguagem natural, e recebe respostas fundamentadas com citacao de fontes.

---

## 3. Personas

### Professor(a) — usuario primario

- Leciona em escola regular da educacao basica (fundamental ou medio)
- Tem alunos com TEA em sala e precisa adaptar avaliacoes
- Nao tem formacao especifica em educacao especial
- Familiaridade variavel com tecnologia (de basica a intermediaria)
- Ja usa o PRISMA para adaptar provas

### Administrador(a) — usuario secundario

- Gerencia agentes e apoios no painel admin do PRISMA
- Responsavel por adicionar novos documentos a base de conhecimento
- Monitora qualidade e uso do consultor

---

## 4. User Stories

### US-01: Iniciar conversa com o consultor

**Como** professor, **quero** abrir uma nova conversa com o agente de suporte TEA **para** tirar uma duvida especifica sobre adaptacao de avaliacoes.

**Criterios de aceite:**
- Professor acessa "Suporte TEA" no menu lateral
- Clica em "Nova conversa"
- Thread e criada e professor pode digitar a primeira mensagem
- Thread aparece na listagem com titulo e data

### US-02: Receber resposta fundamentada

**Como** professor, **quero** receber respostas baseadas em evidencias cientificas e legislacao **para** ter seguranca de que a orientacao e confiavel.

**Criterios de aceite:**
- Agente responde com base nos documentos da knowledge base
- Resposta cita a fonte ou secao quando a informacao vem de um documento
- Resposta e exibida com formatacao Markdown (listas, negrito, citacoes)
- Streaming: resposta aparece incrementalmente (indicador de "digitando...")

### US-03: Continuar conversa existente

**Como** professor, **quero** retomar uma conversa anterior **para** aprofundar uma duvida ou fazer perguntas relacionadas sem perder o contexto.

**Criterios de aceite:**
- Listagem mostra todas as threads do professor, ordenadas por data
- Ao abrir uma thread, o historico completo e carregado
- Agente considera as mensagens anteriores da thread ao responder

### US-04: Receber resposta honesta quando o agente nao sabe

**Como** professor, **quero** que o agente me diga quando nao tem informacao suficiente **para** nao receber orientacao inventada.

**Criterios de aceite:**
- Quando a pergunta foge da base de conhecimento, o agente responde que nao encontrou a informacao
- Agente nao inventa legislacao, pesquisas ou orientacoes sem fundamento
- Agente pode sugerir que o professor consulte um especialista quando apropriado

### US-05: Entender o que o consultor pode fazer (onboarding)

**Como** professor usando o consultor pela primeira vez, **quero** entender o que ele faz e o que nao faz **para** ter expectativas corretas.

**Criterios de aceite:**
- Na primeira visita, professor ve uma explicacao breve do proposito do consultor
- Exemplos de perguntas sugeridas sao exibidos
- Fica claro que o agente nao e um especialista clinico

### US-06: Encerrar/arquivar conversa

**Como** professor, **quero** poder encerrar uma conversa que nao preciso mais **para** manter minha lista organizada.

**Criterios de aceite:**
- Professor pode deletar/arquivar uma thread
- Thread removida nao aparece mais na listagem
- Acao requer confirmacao

---

## 5. Requisitos funcionais

### RF-01: Knowledge Base (RAG)

| ID | Requisito |
|---|---|
| RF-01.1 | Sistema deve indexar documentos Markdown e PDF em um vector store |
| RF-01.2 | Chunking deve ser semantico (por secao/subsecao), nao por tamanho fixo |
| RF-01.3 | Cada chunk deve conter metadata: documento de origem, secao, subsecao, tipo (principio, regra, anti-padrao, exemplo, legislacao) |
| RF-01.4 | Pipeline de ingestao deve ser reutilizavel para adicionar novos documentos |
| RF-01.5 | Discovery-TEA.md deve ser o documento inaugural indexado |

### RF-02: Agente consultor

| ID | Requisito |
|---|---|
| RF-02.1 | Agente deve manter contexto da conversa via message history (ultimas N mensagens) |
| RF-02.2 | Agente deve consultar a knowledge base (RAG) antes de responder |
| RF-02.3 | Agente deve citar fonte/secao quando a informacao vem de um documento |
| RF-02.4 | Agente deve declarar explicitamente quando nao encontra informacao na base |
| RF-02.5 | Agente nao deve fornecer diagnosticos clinicos |
| RF-02.6 | Agente nao deve solicitar dados identificaveis de alunos (nome, CPF, etc.) |
| RF-02.7 | Agente deve responder em portugues brasileiro |

### RF-03: Threads e mensagens

| ID | Requisito |
|---|---|
| RF-03.1 | Professor pode criar nova thread |
| RF-03.2 | Professor pode listar suas threads (paginadas, ordenadas por data) |
| RF-03.3 | Professor pode abrir uma thread e ver o historico completo |
| RF-03.4 | Professor pode enviar mensagem e receber resposta via streaming |
| RF-03.5 | Professor pode deletar/arquivar uma thread |
| RF-03.6 | Professor so acessa suas proprias threads (isolamento por usuario) |

### RF-04: Interface

| ID | Requisito |
|---|---|
| RF-04.1 | Nova opcao "Suporte TEA" no menu lateral da area do professor |
| RF-04.2 | Tela de listagem de threads com titulo, data e botao "Nova conversa" |
| RF-04.3 | Interface de chat com streaming, indicador de digitacao e Markdown rendering |
| RF-04.4 | Onboarding na primeira visita com explicacao e perguntas sugeridas |
| RF-04.5 | Interface responsiva para mobile |

---

## 6. Requisitos nao-funcionais

| ID | Requisito | Meta |
|---|---|---|
| RNF-01 | Tempo de resposta do agente (primeira token) | < 3 segundos |
| RNF-02 | Tempo de resposta completa | < 15 segundos |
| RNF-03 | Disponibilidade | Mesma da aplicacao (Vercel) |
| RNF-04 | Privacidade | Zero dados identificaveis de alunos nas threads |
| RNF-05 | Observabilidade | Eventos rastreados para cada interacao |
| RNF-06 | Compatibilidade | Chrome, Safari, Firefox; iOS e Android (responsive) |

---

## 7. Stack tecnica

| Componente | Tecnologia | Justificativa |
|---|---|---|
| Framework de agentes | Mastra (`@mastra/core`) | Ja utilizado no projeto; suporta threads, memory e RAG |
| Vector store | Turso (LibSQL hospedado) | Compativel com Vercel serverless; `turso dev` para local |
| Embedding | `@mastra/fastembed` | Roda localmente; sem dependencia de API externa |
| Memory | `@mastra/memory` | Message history + working memory nativos do Mastra |
| Storage | `@mastra/libsql` | Ja instalado no projeto |
| Streaming | `agent.stream()` + SSE | Resposta incremental nativa do Mastra |
| Auth | Supabase Auth (existente) | Professor ja autenticado no sistema |
| Frontend | Next.js + React (existente) | Stack atual do projeto |

### Ambientes

| Ambiente | Vector Store | LLM |
|---|---|---|
| Local | `turso dev --db-file vector.db` (`http://127.0.0.1:8080`) | OpenAI API (mesmo de hoje) |
| Producao | `libsql://banco.turso.io` + auth token | OpenAI API (mesmo de hoje) |

Configuracao via environment variables — zero mudanca de codigo entre ambientes.

---

## 8. Fora de escopo (V1)

| Item | Motivo |
|---|---|
| Suporte a outros apoios (TDAH, dislexia, DI) | V1 valida o modelo com TEA; arquitetura preparada para expansao |
| Perguntas sobre adaptacoes especificas ("por que a questao 3 ficou assim?") | Requer integracao com resultado de adaptacao; complexidade alta |
| Limites de uso (throttling, caps) | Prematura sem dados de uso real |
| Avaliacao de resposta (like/dislike) | Escopo de feedback para V2 |
| Exportar conversa | Nice-to-have, nao essencial |
| Busca dentro de threads | Volume baixo na V1 |
| Sugestoes de perguntas durante a conversa | Melhoria de UX para V2 |

---

## 9. Riscos e mitigacoes

| # | Risco | Prob. | Impacto | Mitigacao |
|---|---|---|---|---|
| R1 | Agente alucina orientacoes pedagogicas | Media | Alto | RAG com citacao obrigatoria; instrucao de "nao sei"; testes com professores reais |
| R2 | Qualidade do retrieval insuficiente em PT-BR | Media | Alto | PoC tecnica antes de comprometer; testar com 10+ perguntas reais; avaliar modelos de embedding |
| R3 | Professor confunde consultor com especialista clinico | Media | Medio | Onboarding claro; system prompt delimita papel; disclaimer visivel |
| R4 | Professor usa chat como suporte tecnico (bugs, senha) | Media | Baixo | System prompt delimita escopo; onboarding explica proposito |
| R5 | Chunking perde relacoes hierarquicas do Discovery-TEA.md | Media | Medio | Chunking semantico por secao; metadata rica; overlap entre chunks |
| R6 | Custo de LLM por interacao escala inesperadamente | Baixa | Medio | Modelo menor para consultor; monitorar custo por thread |

---

## 10. Epicos e sequenciamento

```
Epico 1: Knowledge Base & RAG ──────────┐
                                         ├──> Epico 2: Agente Consultor ──> Epico 3: API ──> Epico 4: Frontend
                                         │
                                         └──> Epico 5: Observabilidade (paralelo a partir do Epico 3)
```

| Epico | Descricao | Dependencia |
|---|---|---|
| 1. Knowledge Base & RAG | Vector store (Turso) + pipeline de ingestao + embedding + query tool | Nenhuma |
| 2. Agente Consultor TEA | Novo agente Mastra com memory + RAG + guardrails | Epico 1 |
| 3. API de Threads | CRUD de threads + streaming de mensagens + auth | Epico 2 |
| 4. Interface do Professor | Sidebar + listagem + chat + onboarding | Epico 3 |
| 5. Observabilidade e Seguranca | Runtime events + metricas + privacidade | Epico 3 (paralelo) |

Detalhamento completo de cada epico: `docs/plans/2026-04-01-initiative-tea-support-thread.md`

---

## 11. Criterios de sucesso

| Criterio | Metrica |
|---|---|
| Resposta fundamentada | Respostas citam fonte/secao quando aplicavel |
| Honestidade | Agente diz "nao sei" quando pergunta foge da base |
| Performance | Primeira token em < 3s; resposta completa em < 15s |
| Privacidade | Zero dados identificaveis de alunos nas threads |
| Validacao | Pelo menos 5 professores validam utilidade em teste controlado |

---

## 12. Proximo passo imediato

**PoC tecnica (Epico 1):**
1. Instalar `@mastra/fastembed`
2. Configurar `turso dev` local
3. Indexar Discovery-TEA.md com chunking semantico
4. Testar retrieval com 10 perguntas representativas de professores
5. Avaliar qualidade das respostas antes de avancar para os demais epicos

Esta PoC derisca o principal risco tecnico da feature (R2: qualidade do retrieval) com investimento minimo.
