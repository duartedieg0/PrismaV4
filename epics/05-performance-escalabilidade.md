# Epic 05 — Performance e Escalabilidade

**Prioridade:** MEDIA
**Estimativa:** 5-8 dias de desenvolvimento
**Dependencias:** Epic 02 (observabilidade) recomendado para medir impacto das otimizacoes
**Branch sugerida:** `epic/05-performance`

---

## Objetivo

Otimizar a performance da aplicacao para suportar carga de producao e estabelecer estrategias de caching que reduzam latencia e custo de infraestrutura. Este epico e importante mas nao bloqueador — pode ser executado apos o primeiro deploy em producao.

---

## Tarefas

### T05.1 — Implementar Estrategia de Caching

**Severidade:** MEDIA
**Arquivos a criar/modificar:**
- `next.config.ts` (adicionar headers de cache)
- Rotas de API com dados que raramente mudam
- Paginas estaticas (landing, login)

**Problema:**
Nao existe estrategia de caching em nenhum nivel:
- Sem HTTP cache-control headers
- Sem CDN caching
- Sem ISR (Incremental Static Regeneration)
- Sem cache em memoria para dados de referencia

Dados como disciplinas, anos/series e agentes mudam raramente mas sao consultados em toda criacao de prova.

**Solucao:**

**Nivel 1 — Cache-Control Headers para Assets Estaticos:**

```typescript
// next.config.ts — adicionar ao headers()
{
  source: "/:all*(svg|jpg|jpeg|png|gif|ico|webp|woff2)",
  headers: [
    {
      key: "Cache-Control",
      value: "public, max-age=31536000, immutable",
    },
  ],
},
```

**Nivel 2 — Revalidacao de Dados de Referencia:**
Para dados que mudam raramente (disciplinas, anos/series), usar `fetch` com `next.revalidate`:

```typescript
// Em server components que listam disciplinas/series
const subjects = await fetch("/api/admin/subjects", {
  next: { revalidate: 3600 }, // Revalida a cada 1 hora
});
```

Ou usar `unstable_cache` do Next.js para cache de funcoes server-side:

```typescript
import { unstable_cache } from "next/cache";

const getCachedSubjects = unstable_cache(
  async () => {
    const supabase = await createClient();
    const { data } = await supabase.from("subjects").select("*").order("name");
    return data ?? [];
  },
  ["subjects-list"],
  { revalidate: 3600 },
);
```

**Nivel 3 — ISR para Paginas Publicas:**

```typescript
// src/app/(public)/page.tsx (landing page)
export const revalidate = 3600; // Regenera a cada 1 hora
```

**Dados candidatos a cache (por TTL):**

| Dado | TTL Sugerido | Justificativa |
|------|-------------|---------------|
| Disciplinas | 1 hora | Muda raramente (admin configura) |
| Anos/Series | 1 hora | Muda raramente |
| Agentes de IA | 5 minutos | Muda com evolucao de agentes |
| Apoios educacionais | 15 minutos | Muda com frequencia moderada |
| Landing page | 1 hora | Conteudo estatico |
| Dashboard do professor | 0 (sem cache) | Dados em tempo real |
| Resultado de prova | 5 minutos | Muda durante processamento |

**Criterios de aceite:**
- [ ] Assets estaticos com `Cache-Control: immutable`
- [ ] Dados de referencia cacheados com TTL apropriado
- [ ] Landing page com ISR (revalidate a cada 1h)
- [ ] Cache invalidado quando admin modifica dados de referencia
- [ ] Nenhum cache em dados sensiveis ou em tempo real (dashboard, resultados em processamento)
- [ ] Metricas de cache hit/miss (depende de T02.5)

---

### T05.2 — Implementar Connection Pooling para Supabase

**Severidade:** MEDIA
**Arquivos a modificar:**
- `src/gateways/supabase/server.ts`
- `src/gateways/supabase/service-role.ts`

**Problema:**
Cada request cria uma nova instancia do cliente Supabase. Em alta concorrencia, isso pode esgotar conexoes do PostgreSQL.

**Solucao:**
Supabase oferece connection pooling via Supavisor (porta 6543 em vez de 5432). Configurar:

1. No dashboard do Supabase, habilitar Supavisor
2. Usar a URL de pooling para o client server-side
3. Manter client singleton por request (ja implementado via cookie-based)

Para aplicacoes Next.js, o Supabase SSR ja gerencia isso adequadamente. Verificar se a URL usada aponta para o pooler:

```
# URL direta (sem pooling)
postgresql://user:pass@db.xxx.supabase.co:5432/postgres

# URL com pooling (recomendada)
postgresql://user:pass@db.xxx.supabase.co:6543/postgres?pgbouncer=true
```

**Criterios de aceite:**
- [ ] Verificar qual URL esta sendo usada (direta vs pooler)
- [ ] Configurar pooler no Supabase se nao estiver ativo
- [ ] Documentar configuracao de conexao
- [ ] Testar sob carga com multiplas requests simultaneas

---

### T05.3 — Otimizar Upload e Processamento de PDFs

**Severidade:** MEDIA
**Arquivos a modificar:**
- `src/features/exams/create/` (fluxo de upload)
- `src/services/ai/run-extraction.ts`

**Problema:**
O upload de PDF e o processamento de IA acontecem na mesma request. Para PDFs grandes ou com muitas questoes, isso pode causar:
- Timeout da request HTTP
- Experiencia ruim para o usuario (espera longa sem feedback)
- Consumo excessivo de memoria

**Solucao:**

**Passo 1 — Limites claros de tamanho:**
Validar tamanho do PDF antes do upload (ja existe limite de 25MB, verificar se e suficiente).

**Passo 2 — Feedback de progresso:**
O endpoint de status (`/api/exams/[id]/status`) ja existe. Garantir que o frontend faca polling com intervalo adequado (3-5 segundos) durante processamento.

**Passo 3 — Processamento streaming (avancado):**
Para provas com muitas questoes, processar adaptacoes em streaming:
- Adaptar uma questao de cada vez
- Atualizar progresso a cada questao concluida
- Permitir que o usuario veja resultados parciais

**Criterios de aceite:**
- [ ] Upload de PDF de 25MB completa sem timeout
- [ ] Frontend mostra progresso real durante processamento
- [ ] Questoes adaptadas aparecem conforme sao concluidas (nao espera todas)
- [ ] Erro em uma questao nao bloqueia as demais

---

### T05.4 — Load Testing e Capacity Planning

**Severidade:** MEDIA
**Arquivos a criar:**
- `scripts/load-test.mjs` ou `k6/` (novo)
- `docs/release/capacity-planning.md` (novo)

**Problema:**
Nao existem testes de carga nem documentacao de limites de capacidade. Sem isso, nao ha como saber quantos usuarios/provas simultaneas a aplicacao suporta.

**Solucao:**

**Passo 1 — Criar cenarios de teste de carga:**

Usar k6, Artillery ou autocannon:

```javascript
// Cenarios sugeridos
const scenarios = {
  // 1. Login simultaneo de 50 professores
  concurrent_logins: { vus: 50, duration: "2m" },

  // 2. 10 uploads de PDF simultaneos
  concurrent_uploads: { vus: 10, duration: "5m" },

  // 3. 100 consultas ao dashboard simultaneas
  dashboard_reads: { vus: 100, duration: "5m" },

  // 4. 20 processamentos de prova simultaneos
  concurrent_processing: { vus: 20, duration: "10m" },
};
```

**Passo 2 — Documentar resultados:**

| Cenario | Usuarios | p50 | p95 | p99 | Erros |
|---------|----------|-----|-----|-----|-------|
| Dashboard | 100 | ? | ? | ? | ? |
| Upload PDF | 10 | ? | ? | ? | ? |
| Processamento | 20 | ? | ? | ? | ? |

**Passo 3 — Definir limites e alertas:**
- Latencia p95 do dashboard < 500ms
- Latencia p95 de upload < 5s
- Taxa de erro < 1%
- Alertas quando latencia exceder threshold

**Criterios de aceite:**
- [ ] Script de load test executavel
- [ ] Resultados documentados para 3+ cenarios
- [ ] Gargalos identificados e documentados
- [ ] Limites de capacidade definidos (max usuarios simultaneos)
- [ ] Recomendacoes de escala documentadas (quando escalar, como escalar)

---

## Ordem de Execucao Recomendada

```
T05.1 (2-3 dias) → T05.2 (3h) → T05.3 (1-2 dias) → T05.4 (2-3 dias)
```

Caching tem maior impacto imediato. Connection pooling e rapido. Load testing deve ser o ultimo pois valida todas as melhorias anteriores.

---

## Riscos

| Risco | Mitigacao |
|-------|-----------|
| Cache serve dados desatualizados | TTLs conservadores + invalidacao em operacoes de escrita |
| ISR incompativel com dados por usuario | Apenas para paginas publicas, nunca para dados autenticados |
| Load test causa custos inesperados (IA) | Usar mocks para chamadas OpenAI nos testes de carga |
| Connection pooling causa connection leak | Monitorar conexoes ativas no dashboard Supabase |
