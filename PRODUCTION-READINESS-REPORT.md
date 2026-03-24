# PrismaV2 — Relatório de Prontidão para Produção

**Data:** 2026-03-24
**Repositório:** PrismaV2 (Adapte Minha Prova)
**Stack:** Next.js 16 + React 19 + TypeScript + Supabase + Mastra AI Runtime

---

## Resumo Executivo

O PrismaV2 possui uma base sólida: arquitetura bem organizada, 96 arquivos de teste, CI/CD funcional e documentação de release. Porém, há lacunas críticas em **segurança**, **infraestrutura** e **observabilidade** que devem ser resolvidas antes da promoção a produção.

| Área | Status | Prioridade |
|------|--------|------------|
| Arquitetura e Organização | ✅ Excelente | — |
| Cobertura de Testes | ✅ Excelente | — |
| Validação de Input (Zod) | ✅ Bom | — |
| Banco de Dados / Migrações | ✅ Bom | — |
| Segurança | ⚠️ Vulnerabilidades encontradas | CRÍTICA |
| Infraestrutura de Deploy | ❌ Incompleta | CRÍTICA |
| Observabilidade / Logging | ❌ Insuficiente | ALTA |
| Qualidade de Código | ⚠️ Melhorias necessárias | MÉDIA |

---

## 1. SEGURANÇA

### 1.1 [CRÍTICO] Vulnerabilidade de Open Redirect no OAuth Callback

**Arquivo:** `src/features/auth/callback.ts`

A função `resolveCallbackRedirect()` aceita o parâmetro `next` da URL sem validação e concatena diretamente:

```typescript
return `${options.origin}${options.next}`; // VULNERÁVEL
```

Um atacante pode criar URLs como `login/callback?code=...&next=//attacker.com` para redirecionar usuários autenticados para sites maliciosos.

**Correção:** Validar que `next` é um path relativo que começa com `/` e não contém `//`.

### 1.2 [CRÍTICO] Next.js com CVEs conhecidos

**Versão atual:** 16.1.6

Vulnerabilidades publicadas:
- HTTP request smuggling em rewrites (GHSA-ggv3-7p47-pfv8)
- Crescimento ilimitado de cache de imagem (GHSA-3x4c-7xq6-9pq8)
- DoS via buffering em postponed resume (GHSA-h27x-g6w4-24gq)
- Bypass de CSRF via null origin (GHSA-mq59-m269-xvcx)

**Correção:** Atualizar para Next.js ≥16.2.1.

### 1.3 [CRÍTICO] Ausência de Rate Limiting

Nenhum endpoint possui rate limiting. Isso expõe a aplicação a:
- Ataques de força bruta na autenticação
- Abuso do endpoint de upload de PDF (operação custosa com IA)
- Negação de serviço (DoS)

**Correção:** Implementar rate limiting via middleware (ex: `@upstash/ratelimit` ou similar).

### 1.4 [ALTO] Ausência de Security Headers

Não há configuração de headers de segurança:
- Content-Security-Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security (HSTS)

**Correção:** Adicionar headers em `next.config.ts` via `headers()`.

### 1.5 [MÉDIO] Ausência de proteção CSRF explícita

Embora o Supabase SSR possa lidar com CSRF, não há validação explícita de tokens CSRF para operações que alteram estado.

### 1.6 [MÉDIO] Path absoluto exposto em configuração

**Arquivo:** `playwright.config.ts:12`

```typescript
command: "cd /Users/iduarte/Documents/Teste/PrismaV2 && npm run start"
```

Path do filesystem local exposto no repositório.

---

## 2. INFRAESTRUTURA DE DEPLOY

### 2.1 [CRÍTICO] Ausência de Dockerfile

Não há Dockerfile no projeto. Sem containerização, o deploy fica limitado a plataformas específicas (ex: Vercel).

**Recomendação:** Criar Dockerfile multi-stage com:
- Imagem base Node.js 22
- Stage de build com cache de dependências
- Stage de runtime com usuário non-root
- Health check instruction
- `.dockerignore` adequado

### 2.2 [CRÍTICO] Ausência de Health Check Endpoints

Não existem endpoints HTTP para monitoramento:
- `/api/health` — liveness (a aplicação está rodando?)
- `/api/ready` — readiness (banco conectado, dependências acessíveis?)

O script `readiness-check.mjs` é apenas CLI — não serve para orquestradores como K8s ou load balancers.

### 2.3 [CRÍTICO] Ausência de Estratégia de Backup

- Nenhum procedimento de backup/restore documentado
- Nenhuma estratégia de snapshot do banco
- Nenhum RTO/RPO definido

### 2.4 [ALTO] CI/CD sem step de deploy

**Arquivo:** `.github/workflows/ci.yml`

O pipeline executa lint, typecheck, build e testes, mas não há:
- Deploy automatizado para staging/produção
- Security scanning (SAST, dependency audit)
- Upload de artefatos de build
- Coverage reporting

### 2.5 [ALTO] Ausência de Job Queue para tarefas assíncronas

Os workflows de IA (extração, análise, adaptação) são processamentos longos que podem exceder timeouts de plataformas serverless. Não há job queue (Bull, BullMQ, etc.) para processamento em background.

### 2.6 [MÉDIO] Variáveis de ambiente sem validação em runtime

**Arquivo:** `src/gateways/supabase/environment.ts`

Apenas valida presença (`Boolean()`), não formato ou conectividade. A aplicação pode iniciar com credenciais inválidas e falhar silenciosamente.

**Recomendação:** Validar todas as variáveis com Zod no startup e falhar fast.

### 2.7 [MÉDIO] Ausência de estratégia de caching

- Sem CDN caching headers
- Sem cache-control strategies
- Sem camada de cache em memória ou Redis
- Sem ISR (Incremental Static Regeneration) configurado

---

## 3. OBSERVABILIDADE E LOGGING

### 3.1 [ALTO] Infraestrutura de logging existente mas não utilizada

O projeto define contratos de observabilidade e um logger estruturado em:
- `src/domains/observability/contracts.ts`
- `src/services/observability/logger.ts`
- `src/services/runtime/request-context.ts`

Porém, **nenhuma API route utiliza o logger estruturado**. Erros de banco são engolidos sem logging:

```typescript
// src/app/api/exams/route.ts:237-243
} catch (error) {
  return NextResponse.json(
    { error: error instanceof Error ? error.message : "Erro ao criar exame." },
    { status: 500 }
  );
}
```

### 3.2 [ALTO] console.info em produção

**Arquivo:** `src/app/api/exams/[id]/events/route.ts:65`

```typescript
console.info(JSON.stringify({ category: "result_event", ...event }));
```

Uso de `console.info` em vez do logger estruturado.

### 3.3 [ALTO] Mastra logger desabilitado

**Arquivo:** `src/mastra/runtime.ts`

O logger do runtime Mastra está configurado como `false`, descartando todos os logs de workflows de IA.

### 3.4 [ALTO] Ausência de serviço de error tracking

Nenhuma integração com Sentry, Datadog, Rollbar ou similar. Erros em produção serão invisíveis.

### 3.5 [MÉDIO] Ausência de métricas e tracing

- Sem export de métricas (Prometheus, Datadog)
- Sem distributed tracing (OpenTelemetry)
- Sem APM (Application Performance Monitoring)

---

## 4. QUALIDADE DE CÓDIGO

### 4.1 [MÉDIO] Type casts inseguros

Múltiplos usos de `as never` e `as unknown` que contornam o sistema de tipos:

| Arquivo | Linha | Cast |
|---------|-------|------|
| `src/app/api/admin/supports/route.ts` | 24 | `item as never` |
| `src/app/api/admin/agents/[id]/feedbacks/route.ts` | 66-70 | `as unknown` (múltiplos) |
| `src/features/admin/shared/admin-guard.ts` | 9, 59 | `supabase as never` |

### 4.2 [MÉDIO] Duplicação de padrões em API routes

O padrão abaixo se repete em 25+ rotas de admin:

```typescript
const access = await requireAdminRouteAccess();
if (access.kind === "error") {
  return access.response;
}
```

E o padrão CRUD (select → validate → respond) se repete em 10+ rotas com estrutura quase idêntica.

**Recomendação:** Extrair middleware ou wrapper reutilizável.

### 4.3 [MÉDIO] Respostas de API inconsistentes

- Erros de validação retornam `{ error: object }` (Zod flatten)
- Erros de banco retornam `{ error: string }`
- Sem códigos de erro padronizados
- Sem envelope de resposta consistente

**Recomendação:** Padronizar formato de resposta de erro com código e mensagem.

### 4.4 [BAIXO] Queries de banco não otimizadas

**Arquivo:** `src/app/api/exams/[id]/status/route.ts:35-58`

3 queries sequenciais (questions, total adaptations, completed adaptations) que poderiam ser consolidadas em 1-2 queries.

---

## 5. PONTOS FORTES

Itens que já estão bem implementados e prontos para produção:

- **Arquitetura**: Separação clara entre `domains/`, `features/`, `gateways/`, `services/`, `mastra/`
- **Testes**: 96 arquivos de teste (unit, integration, a11y, e2e com Playwright)
- **Validação de input**: Zod em todos os endpoints de API
- **SQL Injection**: Zero risco — todas as queries via Supabase SDK parametrizado
- **XSS**: Nenhum `dangerouslySetInnerHTML` ou `eval()` encontrado
- **Banco de dados**: 12 migrações bem estruturadas, RLS policies, audit logging
- **Mascaramento de secrets**: API keys mascaradas na UI (`mask-secret.ts`)
- **Design System**: Componentes acessíveis com testes de a11y (jest-axe)
- **Documentação de release**: Checklists, playbooks de rollout e rollback
- **CI/CD**: Pipeline funcional com lint, typecheck, build, unit tests, a11y tests e E2E

---

## 6. PLANO DE AÇÃO POR FASE

### Fase 1 — Bloqueadores de Produção (Obrigatório)

| # | Item | Esforço |
|---|------|---------|
| 1 | Corrigir open redirect em `callback.ts` | Pequeno |
| 2 | Atualizar Next.js para ≥16.2.1 | Pequeno |
| 3 | Implementar rate limiting nos endpoints de API | Médio |
| 4 | Criar endpoints `/api/health` e `/api/ready` | Pequeno |
| 5 | Adicionar security headers em `next.config.ts` | Pequeno |
| 6 | Integrar error tracking (Sentry ou similar) | Médio |
| 7 | Documentar estratégia de backup/restore | Pequeno |

### Fase 2 — Fortemente Recomendado

| # | Item | Esforço |
|---|------|---------|
| 8 | Ativar logging estruturado nas API routes | Médio |
| 9 | Validar variáveis de ambiente com Zod no startup | Pequeno |
| 10 | Criar Dockerfile multi-stage | Médio |
| 11 | Adicionar security scanning no CI (npm audit, SAST) | Pequeno |
| 12 | Habilitar Mastra logger em produção | Pequeno |
| 13 | Padronizar formato de erro das APIs | Médio |

### Fase 3 — Melhorias de Qualidade

| # | Item | Esforço |
|---|------|---------|
| 14 | Extrair middleware para padrão CRUD admin | Médio |
| 15 | Remover type casts inseguros (`as never`, `as unknown`) | Pequeno |
| 16 | Otimizar queries no endpoint de status | Pequeno |
| 17 | Implementar job queue para workflows de IA | Grande |
| 18 | Adicionar métricas e distributed tracing | Grande |
| 19 | Configurar caching strategy (CDN, ISR) | Médio |

---

*Relatório gerado por revisão automatizada do código-fonte, configurações, migrações e infraestrutura do repositório PrismaV2.*
