# Epic 02 — Observabilidade e Monitoramento

**Prioridade:** CRITICA
**Estimativa:** 5-7 dias de desenvolvimento
**Dependencias:** Nenhuma (pode iniciar em paralelo com Epic 01)
**Branch sugerida:** `epic/02-observability`

---

## Objetivo

Garantir que a aplicacao em producao tenha visibilidade total sobre erros, performance e comportamento. Hoje a infraestrutura de logging existe nos contratos (`src/domains/observability/contracts.ts`) e no logger (`src/services/observability/logger.ts`), mas nao e utilizada em nenhuma rota de API. Erros sao engolidos silenciosamente.

---

## Tarefas

### T02.1 — Criar Health Check Endpoints

**Severidade:** CRITICA
**Arquivos a criar:**
- `src/app/api/health/route.ts`
- `src/app/api/ready/route.ts`

**Problema:**
Nao existem endpoints HTTP para que orquestradores (K8s, load balancers, plataformas PaaS) verifiquem o estado da aplicacao. O script `readiness-check.mjs` e apenas CLI.

**Solucao:**

**Endpoint de Liveness** (`/api/health`):
Retorna 200 se o processo Node.js esta respondendo. Sem dependencias externas.

```typescript
// src/app/api/health/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? "unknown",
  });
}
```

**Endpoint de Readiness** (`/api/ready`):
Verifica conectividade com Supabase e credenciais configuradas.

```typescript
// src/app/api/ready/route.ts
import { NextResponse } from "next/server";
import { hasSupabaseCredentials } from "@/gateways/supabase/environment";
import { createClient } from "@/gateways/supabase/server";

export async function GET() {
  const checks = {
    supabaseCredentials: hasSupabaseCredentials(),
    supabaseConnection: false,
  };

  if (checks.supabaseCredentials) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.from("subjects").select("id").limit(1);
      checks.supabaseConnection = !error;
    } catch {
      checks.supabaseConnection = false;
    }
  }

  const ready = Object.values(checks).every(Boolean);

  return NextResponse.json(
    { status: ready ? "ready" : "not_ready", checks },
    { status: ready ? 200 : 503 },
  );
}
```

**Criterios de aceite:**
- [ ] `GET /api/health` retorna 200 com status e timestamp
- [ ] `GET /api/ready` retorna 200 quando Supabase esta acessivel
- [ ] `GET /api/ready` retorna 503 quando Supabase esta inacessivel
- [ ] Ambos os endpoints NAO requerem autenticacao
- [ ] Testes unitarios para ambos os endpoints

---

### T02.2 — Integrar Error Tracking (Sentry)

**Severidade:** CRITICA
**Arquivos a criar/modificar:**
- `sentry.client.config.ts` (novo)
- `sentry.server.config.ts` (novo)
- `sentry.edge.config.ts` (novo)
- `next.config.ts` (modificar — wrappear com `withSentryConfig`)
- `src/app/global-error.tsx` (novo)

**Problema:**
Nenhuma integracao com servico de error tracking. Erros em producao serao invisiveis. Catch blocks como este engolem erros sem registro:

```typescript
// src/app/api/exams/route.ts:237-243
} catch (error) {
  return NextResponse.json(
    { error: error instanceof Error ? error.message : "Erro ao criar exame." },
    { status: 500 }
  );
}
```

**Solucao:**
Instalar e configurar o Sentry SDK para Next.js:

```bash
npx @sentry/wizard@latest -i nextjs
```

Isso gera automaticamente os arquivos de configuracao. Apos setup:

1. Configurar `sentry.server.config.ts` com DSN de producao
2. Criar `src/app/global-error.tsx` para captura de erros no React
3. Wrappear `next.config.ts` com `withSentryConfig`
4. Configurar `SENTRY_DSN` como variavel de ambiente
5. Adicionar `SENTRY_DSN` ao `.env.example` e ao `readiness-check.mjs`

**Nota sobre PII:** Configurar `beforeSend` no Sentry para filtrar dados sensiveis (emails de alunos, conteudo de provas, API keys).

**Criterios de aceite:**
- [ ] Sentry SDK instalado e configurado para client, server e edge
- [ ] Erros nao tratados sao enviados automaticamente ao Sentry
- [ ] `global-error.tsx` captura erros de rendering no React
- [ ] `SENTRY_DSN` como variavel de ambiente (nao hardcoded)
- [ ] Filtro de PII configurado no `beforeSend`
- [ ] Source maps enviados ao Sentry no build

---

### T02.3 — Ativar Logging Estruturado nas API Routes

**Severidade:** ALTA
**Arquivos a modificar:**
- `src/services/observability/logger.ts` (expandir)
- Todas as rotas em `src/app/api/**/*.ts`
- `src/app/api/exams/[id]/events/route.ts` (remover `console.info`)

**Problema:**
O logger estruturado existe mas nao e usado. A infraestrutura ja define:
- `createStructuredLogEntry()` em `src/services/observability/logger.ts`
- `createRequestContext()` em `src/services/runtime/request-context.ts`
- `toLogSafeMetadata()` para metadata segura
- Categorias de evento em `src/domains/observability/contracts.ts`

Porem, nenhuma rota de API importa ou utiliza essas funcoes.

**Solucao:**

**Passo 1:** Expandir o logger com funcoes de conveniencia:

```typescript
// src/services/observability/logger.ts — adicionar

export function logInfo(message: string, context: RequestContext) {
  const entry = createStructuredLogEntry({ level: "info", message, context });
  console.log(JSON.stringify(entry));
}

export function logWarn(message: string, context: RequestContext) {
  const entry = createStructuredLogEntry({ level: "warn", message, context });
  console.warn(JSON.stringify(entry));
}

export function logError(message: string, context: RequestContext, error?: unknown) {
  const entry = createStructuredLogEntry({ level: "error", message, context });
  const errorDetail = error instanceof Error
    ? { name: error.name, message: error.message, stack: error.stack }
    : { raw: String(error) };
  console.error(JSON.stringify({ ...entry, error: errorDetail }));
}
```

**Passo 2:** Substituir todos os `console.info`/`console.log` em rotas de API pelo logger estruturado.

**Passo 3:** Adicionar logging em todos os catch blocks que hoje engolem erros:

```typescript
// ANTES
} catch (error) {
  return NextResponse.json({ error: "..." }, { status: 500 });
}

// DEPOIS
} catch (error) {
  logError("Falha ao criar exame", ctx, error);
  return NextResponse.json({ error: "..." }, { status: 500 });
}
```

**Arquivo especifico a corrigir — `src/app/api/exams/[id]/events/route.ts:65`:**

```typescript
// ANTES
console.info(JSON.stringify({ category: "result_event", ...event }));

// DEPOIS
logInfo("Evento de resultado registrado", createRequestContext({ examId }));
```

**Criterios de aceite:**
- [ ] Zero `console.log`/`console.info`/`console.error` diretamente em rotas de API
- [ ] Todos os catch blocks logam o erro com contexto estruturado
- [ ] Logs incluem `correlationId`, `examId`, `level`, `message` como campos JSON
- [ ] `toLogSafeMetadata` garante que nenhum dado sensivel e logado
- [ ] Testes unitarios para as funcoes de logging

---

### T02.4 — Habilitar Mastra Logger

**Severidade:** ALTA
**Arquivo:** `src/mastra/runtime.ts`

**Problema:**
O logger do runtime Mastra esta desabilitado (linha 25):

```typescript
export function createPrismaMastraRuntime(input: { ... }) {
  return new Mastra({
    workflows: { ... },
    logger: false,  // <-- Todos os logs de IA descartados
  });
}
```

Os workflows de IA (extracao de PDF, analise BNCC/Bloom, adaptacao) sao as operacoes mais criticas e caras da aplicacao. Sem logging, falhas nesses workflows sao invisiveis.

**Solucao:**
Habilitar logging com nivel configuravel:

```typescript
import { createLogger } from "@mastra/core";

export function createPrismaMastraRuntime(input: { ... }) {
  return new Mastra({
    workflows: { ... },
    logger: createLogger({
      name: "prisma-mastra",
      level: process.env.MASTRA_LOG_LEVEL ?? "info",
    }),
  });
}
```

**Criterios de aceite:**
- [ ] Mastra logger habilitado com nivel `info` em producao
- [ ] Nivel de log configuravel via variavel de ambiente `MASTRA_LOG_LEVEL`
- [ ] Logs de workflow visiveis ao executar extracao/adaptacao
- [ ] Nao loga conteudo de prompts (pode conter dados de alunos)

---

### T02.5 — Implementar Metricas e Distributed Tracing

**Severidade:** MEDIA
**Arquivos a criar:**
- `src/lib/metrics.ts` (novo)
- `src/lib/tracing.ts` (novo — se usar OpenTelemetry)

**Problema:**
Sem metricas nem tracing, nao e possivel:
- Medir latencia de endpoints
- Identificar gargalos de performance
- Rastrear requests end-to-end (middleware → API → Supabase → Mastra → OpenAI)
- Criar dashboards e alertas

**Solucao:**

**Fase A — Metricas basicas (MVP):**
Instrumentar endpoints com metricas customizadas que podem ser coletadas por qualquer backend (Datadog, CloudWatch, Prometheus):

```typescript
// src/lib/metrics.ts
export function recordApiLatency(endpoint: string, method: string, status: number, durationMs: number) {
  console.log(JSON.stringify({
    metric: "api.latency",
    endpoint,
    method,
    status,
    durationMs,
    timestamp: Date.now(),
  }));
}
```

**Fase B — OpenTelemetry (recomendado a medio prazo):**
Integrar `@vercel/otel` ou `@opentelemetry/sdk-node` para tracing distribuido automatico.

**Metricas sugeridas:**

| Metrica | Tipo | Descricao |
|---------|------|-----------|
| `api.latency` | Histogram | Tempo de resposta por endpoint |
| `api.error_rate` | Counter | Erros por endpoint e status code |
| `exam.processing_time` | Histogram | Tempo total de processamento de prova |
| `ai.token_usage` | Counter | Tokens consumidos por modelo |
| `auth.login_attempts` | Counter | Tentativas de login (sucesso/falha) |

**Criterios de aceite:**
- [ ] Metricas de latencia emitidas para todos os endpoints
- [ ] Metricas de erro emitidas para falhas 4xx e 5xx
- [ ] Metricas de processamento de prova (tempo, tokens)
- [ ] Formato compativel com backend de metricas escolhido
- [ ] Documentacao de como visualizar metricas

---

## Ordem de Execucao Recomendada

```
T02.1 (3h) → T02.4 (1h) → T02.3 (1-2 dias) → T02.2 (1 dia) → T02.5 (2-3 dias)
```

Health checks e Mastra logger sao rapidos. Logging estruturado tem mais arquivos para modificar. Sentry e metricas podem ser feitos em paralelo.

---

## Riscos

| Risco | Mitigacao |
|-------|-----------|
| Sentry captura dados sensiveis (PII) | Configurar `beforeSend` com filtro de PII |
| Volume de logs alto em producao | Usar nivel `warn` para Mastra e `info` para API |
| Metricas adicionam overhead | Metricas sao fire-and-forget, sem impacto em latencia |
| Custo do Sentry em producao | Configurar sample rate (ex: 10% de transacoes) |
