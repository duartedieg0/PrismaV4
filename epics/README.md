# PrismaV2 — Epicos de Prontidao para Producao

Documentos gerados a partir do [Relatorio de Prontidao](../PRODUCTION-READINESS-REPORT.md) em 2026-03-24.
Cada epico e independente e pode ser implementado por squads diferentes em paralelo.

---

## Visao Geral

| # | Epico | Prioridade | Estimativa | Tarefas | Status |
|---|-------|------------|------------|---------|--------|
| 01 | [Seguranca e Hardening](./01-seguranca-hardening.md) | CRITICA | 5-8 dias | 6 | Pendente |
| 02 | [Observabilidade e Monitoramento](./02-observabilidade-monitoramento.md) | CRITICA | 5-7 dias | 5 | Pendente |
| 03 | [Infraestrutura e Deploy](./03-infraestrutura-deploy.md) | ALTA | 4-6 dias | 5 | Pendente |
| 04 | [Padronizacao de API e Codigo](./04-padronizacao-api-codigo.md) | MEDIA | 4-5 dias | 4 | Pendente |
| 05 | [Performance e Escalabilidade](./05-performance-escalabilidade.md) | MEDIA | 5-8 dias | 4 | Pendente |

**Total: 24 tarefas | Estimativa global: 23-34 dias de desenvolvimento**

---

## Grafo de Dependencias

```
Epic 01 (Seguranca)  ──────────────────────────┐
                                                 ├──→ Deploy em Producao
Epic 02 (Observabilidade) ─────────────────────┘
       │                                          │
       └──→ Epic 05 (Performance) ─── metricas ──┘

Epic 03 (Infraestrutura) ──── pode iniciar em paralelo

Epic 04 (Padronizacao)   ──── pode iniciar em paralelo
```

**Bloqueadores de producao:** Epics 01 e 02 devem ser concluidos antes do primeiro deploy.
**Paralelo:** Epics 01, 02, 03 e 04 podem ser executados simultaneamente por squads diferentes.
**Sequencial:** Epic 05 se beneficia das metricas do Epic 02.

---

## Ordem de Execucao Recomendada

### Onda 1 — Bloqueadores (semanas 1-2)
- **Epic 01** — Seguranca e Hardening
- **Epic 02** — Observabilidade e Monitoramento

### Onda 2 — Infraestrutura (semanas 2-3)
- **Epic 03** — Infraestrutura e Deploy
- **Epic 04** — Padronizacao de API e Codigo

### Onda 3 — Otimizacao (semanas 3-4)
- **Epic 05** — Performance e Escalabilidade

---

## Cobertura de Tarefas por Item do Relatorio

| Item do Relatorio | Epic | Tarefa |
|-------------------|------|--------|
| Open redirect no callback | 01 | T01.1 |
| Next.js com CVEs | 01 | T01.2 |
| Rate limiting | 01 | T01.3 |
| Security headers | 01 | T01.4 |
| Security scanning no CI | 01 | T01.5 |
| Path absoluto no Playwright | 01 | T01.6 |
| Health check endpoints | 02 | T02.1 |
| Error tracking (Sentry) | 02 | T02.2 |
| Logging estruturado | 02 | T02.3 |
| Mastra logger | 02 | T02.4 |
| Metricas e tracing | 02 | T02.5 |
| Dockerfile | 03 | T03.1 |
| Validacao de env vars | 03 | T03.2 |
| Backup strategy | 03 | T03.3 |
| CI/CD com deploy | 03 | T03.4 |
| Job queue | 03 | T03.5 |
| Formato de erro padrao | 04 | T04.1 |
| Middleware CRUD admin | 04 | T04.2 |
| Type casts inseguros | 04 | T04.3 |
| Queries otimizadas | 04 | T04.4 |
| Caching strategy | 05 | T05.1 |
| Connection pooling | 05 | T05.2 |
| Otimizacao PDF | 05 | T05.3 |
| Load testing | 05 | T05.4 |
