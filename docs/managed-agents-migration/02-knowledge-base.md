# Epic 02 — Migracao da Knowledge Base TEA para Memory Store

**Contexto completo:** `00-contexto.md`
**Dependencias:** Epic 01 concluido (gateway + memory store provisionado)

---

## Objetivo

Migrar a base de conhecimento do Consultor TEA do vector store atual (LibSQLVector + embeddings OpenAI) para um Memory Store do Claude Managed Agents. Apos este epico, o conhecimento sobre TEA estara disponivel como recurso gerenciado na infraestrutura Anthropic, pronto para ser consumido pelas sessoes do agente.

Este epico nao altera o fluxo de conversacao do professor. Ele substitui a infraestrutura de armazenamento da knowledge base e valida a qualidade da busca.

---

## Escopo

**Cobre:**

- Adaptacao do pipeline de ingestao para gravar no Memory Store via API
- Reutilizacao do chunker existente (`src/mastra/rag/chunker.ts`) para segmentacao semantica
- Script de ingestao adaptado
- Validacao de qualidade de busca: comparativo entre vector search e full-text search
- Documentacao do processo de atualizacao da knowledge base

**Nao cobre:**

- Alteracao das rotas de API ou frontend (Epic 03)
- Remocao do vector store LibSQL (Epic 04)
- Criacao de novos documentos de conhecimento

---

## Contexto tecnico especifico

### Pipeline atual

```
Documento Markdown → chunker.ts (split por ##/###, detecta tipo) → embed() OpenAI → LibSQLVector.upsert()
```

Executado via: `npx tsx src/mastra/rag/ingest.ts <arquivo.md>`

O chunker (`src/mastra/rag/chunker.ts`) segmenta Markdown por headers H2 e H3, produzindo chunks com metadata:
- `source`: nome do arquivo
- `section`: titulo H2
- `subsection`: titulo H3
- `type`: detectado por regex (principio, regra, anti-padrao, exemplo, legislacao, geral)

O agente usa `createVectorQueryTool` que faz cosine similarity search no vetor store.

### Pipeline futuro

```
Documento Markdown → chunker.ts (mesma logica) → client.beta.memoryStores.memories.write()
```

Sem embeddings. O Memory Store faz full-text search nativo operado por Claude. O agente ganha acesso automatico a `memory_search` quando o store esta attached a session.

### Formato de armazenamento no Memory Store

Cada chunk vira uma memory individual com:
- **Path hierarquico:** `/<source>/<section>/<subsection>.md` (ex: `/Discovery-TEA/Principios Gerais/Linguagem Objetiva.md`)
- **Conteudo enriquecido:** header markdown + metadata de tipo + texto original

```markdown
# Principios Gerais
## Linguagem Objetiva

> Fonte: Discovery-TEA.md | Tipo: principio

Use frases curtas e diretas. Evite metaforas, ironias e linguagem figurada...
```

O enriquecimento com headers e metadata:
- Facilita full-text search (palavras-chave nos headers)
- Permite que o agente cite fontes (exigencia do system prompt)
- Path como ID natural permite `memories.write()` idempotente

---

## Tarefas

### T02.1 — Criar script de ingestao para Memory Store

**Arquivo a criar:** `scripts/ingest-knowledge-base.ts`

Script CLI que le documentos Markdown e grava no Memory Store provisionado no Epic 01.

**Fluxo:**

1. Ler `MANAGED_AGENT_MEMORY_STORE_ID` do env
2. Para cada arquivo .md passado como argumento:
   a. Ler conteudo do arquivo
   b. Aplicar `chunkMarkdown()` importado de `src/mastra/rag/chunker.ts`
   c. Para cada chunk, gravar memory com:
      - Path: `/<source>/<section>/<subsection || "_root">.md`
      - Conteudo: header markdown + metadata + texto (formato descrito acima)
3. Imprimir progresso e total

**Requisitos:**
- Importar `chunkMarkdown` e `DocumentChunk` de `src/mastra/rag/chunker.ts` (nao duplicar)
- Usar `client.beta.memoryStores.memories.write()` (upsert por path — idempotente)
- Sanitizar paths (remover caracteres invalidos, normalizar espacos)
- Funcionar com `npx tsx scripts/ingest-knowledge-base.ts <arquivo1.md> [arquivo2.md] ...`

**Criterios de aceite:**
- [ ] Script funciona via CLI
- [ ] Importa e reutiliza `chunkMarkdown()` existente
- [ ] Cada chunk grava como memory individual
- [ ] Path segue convencao hierarquica
- [ ] Conteudo inclui headers e metadata para busca
- [ ] Re-execucao nao duplica dados (upsert por path)
- [ ] Imprime progresso: arquivo processado, chunks encontrados, memories gravadas
- [ ] Trata erros por chunk (nao para tudo se um falhar)

---

### T02.2 — Executar ingestao dos documentos existentes

**Acao operacional** — execucao do script, nao codigo novo.

1. Identificar todos os documentos Markdown que compoem a knowledge base TEA (provavelmente em diretorio local ou bucket, nao versionados no repo)
2. Executar: `npx tsx scripts/ingest-knowledge-base.ts <docs...>`
3. Verificar resultado:
   ```typescript
   const memories = await client.beta.memoryStores.memories.list(storeId, { path_prefix: "/" });
   ```
4. Documentar: quais documentos, quantos chunks, data da ingestao

**Criterios de aceite:**
- [ ] Todos os documentos da knowledge base TEA ingeridos
- [ ] `memories.list()` retorna entries para cada chunk
- [ ] Nenhum erro critico durante ingestao
- [ ] Registro documentado de quais arquivos e quantos chunks

---

### T02.3 — Validacao de qualidade de busca

**Arquivo a criar:** `scripts/validate-knowledge-search.ts`

Script que compara resultados de busca entre o vector store atual e o Memory Store para um conjunto de queries representativas.

**Conjunto de queries de teste:**

| # | Query | Tipo esperado |
|---|-------|--------------|
| 1 | "Como adaptar questoes de multipla escolha para alunos com TEA?" | principio |
| 2 | "O que a legislacao brasileira diz sobre avaliacao inclusiva?" | legislacao |
| 3 | "Quais erros evitar ao adaptar provas?" | anti-padrao |
| 4 | "Como usar linguagem objetiva em enunciados?" | regra |
| 5 | "Exemplo de adaptacao de questao de matematica" | exemplo |
| 6 | "O que e rebaixamento cognitivo?" | anti-padrao |
| 7 | "Decreto 10.502 educacao especial" | legislacao |
| 8 | "Clareza visual em avaliacoes" | principio |
| 9 | "Quando usar apoio visual em questoes?" | regra |
| 10 | "Como adaptar questoes dissertativas?" | principio |

**Execucao por query:**

1. **Memory Store:** Criar session temporaria com memory store attached, enviar query, observar quais memories o agent consulta (via `agent.tool_use` events para `memory_search`)
2. **Vector Store (atual):** Executar `createVectorQueryTool` com a mesma query

**Output:** Tabela comparativa com:
- Query
- Top resultados do vector search (section/subsection)
- Resultados consultados pelo Memory Store
- Veredicto: equivalente / melhor / pior / nao encontrado

**Criterios de aceite:**
- [ ] Script executavel via CLI
- [ ] Pelo menos 10 queries testadas
- [ ] Resultados impressos em formato tabular
- [ ] Taxa de relevancia do Memory Store >= 80% (8/10 queries com resultados adequados)
- [ ] Divergencias documentadas com avaliacao de impacto
- [ ] Decisao go/no-go registrada no output

---

### T02.4 — Documentar processo de atualizacao da knowledge base

**Arquivo a criar:** `docs/managed-agents/knowledge-base-update.md`

Guia operacional para manutencao da knowledge base:

1. **Formato do documento:** Markdown, headers H2 para secoes, H3 para subsecoes
2. **Como adicionar:** Executar script de ingestao com novo(s) arquivo(s)
3. **Como atualizar:** Re-executar script (upsert por path sobrescreve)
4. **Como remover documento:** Listar memories com `path_prefix` do documento, deletar cada uma
5. **Como remover memory individual:** `memories.delete()` por ID
6. **Limites:** 100KB por memory, 8 stores por session, full-text search (nao vetorial)
7. **Verificacao:** Como listar e inspecionar memories via API ou CLI

**Criterios de aceite:**
- [ ] Guia criado com instrucoes passo a passo
- [ ] Inclui exemplos de comandos
- [ ] Cobre adicao, atualizacao e remocao
- [ ] Menciona limites e restricoes

---

## Ordem de Execucao

```
T02.1 (3-4h) → T02.2 (1h) → T02.3 (2-3h) → T02.4 (1h)
```

Sequencial — cada tarefa depende da anterior.

---

## Riscos

| Risco | Mitigacao |
|-------|-----------|
| Full-text search inferior ao vector search | T02.3 valida antes de prosseguir; enriquecer conteudo com sinonimos se necessario |
| Documentos fonte nao versionados | Documentar localizacao e incluir no processo |
| Chunks grandes excedem 100KB | Chunker segmenta por headers; chunks tipicamente < 5KB |
| Memory Store instavel (research preview) | Manter vector store operacional ate Epic 04 |
