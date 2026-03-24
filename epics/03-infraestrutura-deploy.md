# Epic 03 — Infraestrutura e Deploy (Vercel)

**Prioridade:** ALTA
**Estimativa:** 1.5 dias de desenvolvimento
**Dependencias:** Epic 02 (observabilidade) deve estar concluido
**Branch sugerida:** `epic/03-infrastructure`
**Plataforma de deploy:** Vercel (exclusivo)

---

## Objetivo

Preparar a aplicacao para deploy confiavel na Vercel: validacao de ambiente no startup, processamento assincrono de workflows de IA via `after()`, e cobertura de testes no CI.

---

## Decisoes de Escopo (Vercel)

| Tarefa Original | Decisao | Motivo |
|----------------|---------|--------|
| T03.1 Dockerfile | **REMOVIDA** | Vercel gerencia build, runtime, CDN e SSL nativamente |
| T03.2 Validacao env vars | **MANTIDA** | Fail-fast no startup evita erros silenciosos |
| T03.3 Backup/DR | **MANTIDA** | Dados vivem no Supabase, nao na Vercel |
| T03.4 CI/CD deploy | **SIMPLIFICADA** | Vercel auto-deploya de GitHub; apenas coverage falta |
| T03.5 Job queue | **REESCRITA** | `after()` do Next.js resolve o timeout serverless |

---

## Tarefas

### T03.2 — Validar Variaveis de Ambiente com Zod no Startup

**Severidade:** ALTA
**Arquivos a criar/modificar:**
- `src/lib/env.ts` (novo)
- `instrumentation.ts` (novo)
- `src/gateways/supabase/environment.ts` (modificar)

**Problema:**
`hasSupabaseCredentials()` apenas verifica presenca com `Boolean()`. A aplicacao pode iniciar na Vercel com URL malformada ou chave trocada entre environments e falhar silenciosamente em runtime.

**Solucao:**
Schema Zod validado via `instrumentation.ts` (hook nativo do Next.js, executado pela Vercel no cold start).

**Criterios de aceite:**
- [ ] Aplicacao falha no startup se variaveis obrigatorias estao ausentes
- [ ] Aplicacao falha se SUPABASE_URL nao e uma URL valida
- [ ] Erro mostra quais variaveis estao faltando/invalidas
- [ ] Variaveis opcionais (SENTRY_DSN, MASTRA_LOG_LEVEL) tem defaults
- [ ] Testes unitarios cobrindo cenarios de validacao

---

### T03.3 — Documentar Backup e Disaster Recovery

**Severidade:** ALTA — documentacao, sem codigo

A Vercel e stateless — rollback de deploy e instantaneo. Porem, dados no Supabase (PostgreSQL + Storage) sao irreversiveis sem estrategia de backup.

Documento deve cobrir:
- Backups automaticos do Supabase (Pro: diarios, PITR)
- Export manual de tabelas de configuracao (agents, models, supports)
- RTO/RPO definidos
- Rollback da Vercel (instant via dashboard ou `vercel rollback`)
- Runbook de restore do Supabase

---

### T03.4 — Adicionar Coverage Reporting ao CI

**Severidade:** MEDIA
**Arquivo:** `.github/workflows/ci.yml`

**Problema:**
O CI roda testes mas nao gera relatorio de cobertura.

**Nota:** Deploy automatizado nao e necessario — a Vercel faz auto-deploy ao conectar o repositorio GitHub:
- Push na `main` → deploy de producao
- Push em branch/PR → preview deploy com URL unica
- Rollback → instantaneo pelo dashboard

**Solucao:**
Substituir `npm run test` por `npm run test:coverage` e fazer upload do artefato.

---

### T03.5 — Desacoplar Workflows de IA com `after()` + `maxDuration`

**Severidade:** CRITICA
**Arquivos a modificar:**
- `src/app/api/exams/route.ts`
- `src/app/api/exams/[id]/answers/route.ts`

**Problema:**
As Serverless Functions da Vercel tem timeout de 10s (Hobby) / 60s (Pro). Os workflows de IA executam sincronamente:

- `POST /api/exams` → `await createExam()` que internamente faz `await runExtraction()` (LLM)
- `POST /api/exams/[id]/answers` → `await runAnalysisAndAdaptation()` (LLM por questao)

Para provas com 10+ questoes, isso pode levar 30-120s — estourando o timeout.

**Solucao:**
Usar `after()` do Next.js 16 (exportado de `next/server`). Esta API agenda trabalho para ser executado **apos** a resposta HTTP ser enviada ao cliente, mas ainda dentro do mesmo Serverless Function invocation (a Vercel mantem a funcao viva ate o `after` completar).

```typescript
import { after } from "next/server";

// Configurar timeout maximo para Vercel Pro
export const maxDuration = 300;

export async function POST(request: Request) {
  // ... validacao, criacao do exam no banco ...

  after(async () => {
    // Workflow de IA roda APOS a resposta ser enviada
    await runExtraction(...);
  });

  return NextResponse.json({ examId }, { status: 202 });
}
```

**Vantagens:**
- Response retorna imediatamente (202 Accepted)
- Workflow de IA roda em background dentro do mesmo invocation
- Frontend ja faz polling via `/api/exams/[id]/status`
- Sem infraestrutura adicional (Redis, queues, Inngest)

**Criterios de aceite:**
- [ ] `maxDuration = 300` nas rotas de IA
- [ ] Response retorna 202 antes do LLM processar
- [ ] Workflow de IA executa via `after()` sem bloquear a resposta
- [ ] Status do exame atualizado para "error" se falhar
- [ ] Testes existentes continuam passando

---

## Ordem de Execucao Recomendada

```
T03.2 (3h) → T03.4 (30min) → T03.5 (4h)
```

T03.3 e documentacao e pode ser feita em paralelo.

---

## Riscos

| Risco | Mitigacao |
|-------|-----------|
| Validacao de env impede startup em dev sem .env | Validar apenas em `NODE_ENV=production` |
| `after()` silencia erros do workflow | Catch interno atualiza exam para status "error" |
| `maxDuration=300` insuficiente para provas grandes | Monitorar e considerar Inngest se necessario |
| Vercel plano Hobby limita timeout a 10s | Requer plano Pro para producao |
