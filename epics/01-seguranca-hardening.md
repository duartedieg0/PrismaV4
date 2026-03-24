# Epic 01 — Seguranca e Hardening

**Prioridade:** CRITICA
**Estimativa:** 5-8 dias de desenvolvimento
**Dependencias:** Nenhuma (pode iniciar imediatamente)
**Branch sugerida:** `epic/01-security-hardening`

---

## Objetivo

Eliminar todas as vulnerabilidades de seguranca conhecidas e estabelecer uma baseline de protecao adequada para producao. Este epico e bloqueador — nenhum deploy em producao deve ocorrer antes da conclusao.

---

## Tarefas

### T01.1 — Corrigir Open Redirect no OAuth Callback

**Severidade:** CRITICA
**Arquivo:** `src/features/auth/callback.ts`

**Problema:**
A funcao `resolveCallbackRedirect()` aceita o parametro `next` da query string sem validacao e concatena diretamente na URL de redirecionamento:

```typescript
// ANTES (vulneravel) — linha 26
return `${options.origin}${options.next}`;
```

Um atacante pode criar URLs como `login/callback?code=...&next=//attacker.com` para redirecionar usuarios autenticados para sites maliciosos (phishing).

O mesmo parametro `next` e obtido sem sanitizacao em `exchangeCodeAndResolveRedirect()` (linha 32):

```typescript
const next = searchParams.get("next") ?? "/dashboard";
```

**Solucao:**
Criar funcao de sanitizacao que garanta que `next` e um path relativo seguro:

```typescript
function sanitizeRedirectPath(path: string): string {
  // Rejeitar qualquer coisa que nao comece com / ou que contenha //
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("://")) {
    return "/dashboard";
  }
  return path;
}
```

Aplicar em `exchangeCodeAndResolveRedirect()` antes de usar o valor:

```typescript
const next = sanitizeRedirectPath(searchParams.get("next") ?? "/dashboard");
```

**Criterios de aceite:**
- [ ] `next=//attacker.com` redireciona para `/dashboard`
- [ ] `next=https://evil.com` redireciona para `/dashboard`
- [ ] `next=/dashboard` funciona normalmente
- [ ] `next=/exams/123/result` funciona normalmente
- [ ] Teste unitario cobrindo os cenarios acima
- [ ] Teste E2E validando callback com parametros maliciosos

---

### T01.2 — Atualizar Next.js para versao segura

**Severidade:** CRITICA
**Arquivo:** `package.json`

**Problema:**
Next.js 16.1.6 possui CVEs publicados:

| CVE | Descricao | Severidade |
|-----|-----------|------------|
| GHSA-ggv3-7p47-pfv8 | HTTP request smuggling em rewrites | Alta |
| GHSA-3x4c-7xq6-9pq8 | Crescimento ilimitado de cache de imagem | Media |
| GHSA-h27x-g6w4-24gq | DoS via postponed resume buffering | Media |
| GHSA-mq59-m269-xvcx | Bypass de CSRF via null origin | Alta |

**Solucao:**

```bash
npm install next@latest
npm install eslint-config-next@latest
```

**Criterios de aceite:**
- [ ] Next.js >= 16.2.1 instalado
- [ ] `npm audit` sem vulnerabilidades criticas ou altas
- [ ] `npm run build` passa sem erros
- [ ] `npm run test` passa sem regressoes
- [ ] `npm run test:e2e` passa sem regressoes

---

### T01.3 — Implementar Rate Limiting

**Severidade:** CRITICA
**Arquivos a criar/modificar:**
- `src/lib/rate-limit.ts` (novo)
- `src/proxy.ts` (modificar)
- Rotas de API afetadas

**Problema:**
Nenhum endpoint possui rate limiting. Endpoints vulneraveis:
- `/api/exams` (POST) — upload de PDF + processamento IA (custo alto)
- `/login/callback` — autenticacao
- `/api/admin/*` — operacoes administrativas
- `/api/exams/[id]/answers` — dispara processamento IA

**Solucao:**
Implementar rate limiting baseado em IP no middleware (`src/proxy.ts`). Opcoes recomendadas:

**Opcao A — In-memory (MVP para producao inicial):**
Usar `Map` com sliding window. Simples, sem dependencia externa, mas nao funciona com multiplas instancias.

**Opcao B — Upstash Redis (recomendado para escala):**
Usar `@upstash/ratelimit` com Redis serverless. Funciona com multiplas instancias.

**Limites sugeridos:**

| Grupo de Endpoints | Limite | Janela |
|--------------------|--------|--------|
| Auth (login, callback) | 10 requests | 1 minuto |
| Upload de prova (POST /api/exams) | 5 requests | 5 minutos |
| API admin (CRUD) | 30 requests | 1 minuto |
| API leitura geral | 60 requests | 1 minuto |
| Demais endpoints | 100 requests | 1 minuto |

**Criterios de aceite:**
- [ ] Middleware de rate limiting ativo no `proxy.ts`
- [ ] Retorna HTTP 429 com header `Retry-After` quando limite excedido
- [ ] Limites diferenciados por grupo de endpoint
- [ ] Teste unitario do mecanismo de rate limiting
- [ ] Teste E2E validando que 429 e retornado apos exceder limite

---

### T01.4 — Adicionar Security Headers

**Severidade:** ALTA
**Arquivo:** `next.config.ts`

**Problema:**
Nenhum header de seguranca esta configurado. O `next.config.ts` atual (22 linhas) nao define `headers()`.

**Solucao:**
Adicionar funcao `headers()` ao `nextConfig`:

```typescript
const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self'",
              "connect-src 'self' https://*.supabase.co",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
  // ... webpack e turbopack existentes
};
```

**Nota:** O CSP precisa ser ajustado conforme dominios externos usados (OpenAI API, Supabase Storage, etc.). Iniciar com politica restritiva e relaxar conforme necessario.

**Criterios de aceite:**
- [ ] Todos os headers presentes na resposta HTTP (verificar com `curl -I`)
- [ ] Aplicacao funcional com CSP ativo (sem bloqueios de recursos legitimos)
- [ ] HSTS com `max-age` de pelo menos 1 ano
- [ ] `X-Frame-Options: DENY` para prevenir clickjacking
- [ ] Teste E2E verificando que headers estao presentes

---

### T01.5 — Adicionar Security Scanning no CI

**Severidade:** MEDIA
**Arquivo:** `.github/workflows/ci.yml`

**Problema:**
O pipeline CI nao executa nenhuma verificacao de seguranca.

**Solucao:**
Adicionar steps ao workflow:

```yaml
      - name: Security audit
        run: npm audit --audit-level=high

      - name: Check for known vulnerabilities
        run: npx audit-ci --high
```

Opcionalmente, adicionar SAST com CodeQL:

```yaml
  security:
    runs-on: ubuntu-latest
    permissions:
      security-events: write
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v3
        with:
          languages: javascript-typescript
      - uses: github/codeql-action/analyze@v3
```

**Criterios de aceite:**
- [ ] `npm audit` executado em toda PR
- [ ] Build falha se houver vulnerabilidade alta ou critica
- [ ] Opcional: CodeQL ativo para analise estatica

---

### T01.6 — Remover Path Absoluto do Playwright Config

**Severidade:** MEDIA
**Arquivo:** `playwright.config.ts`

**Problema:**
Path absoluto do filesystem local exposto na linha 12:

```typescript
command: "cd /Users/iduarte/Documents/Teste/PrismaV2 && npm run start",
```

**Solucao:**

```typescript
command: "npm run start",
```

O Playwright ja executa no diretorio do projeto, nao precisa de `cd`.

**Criterios de aceite:**
- [ ] Path absoluto removido
- [ ] `npm run test:e2e` continua funcionando

---

## Ordem de Execucao Recomendada

```
T01.6 (5 min) → T01.2 (1h) → T01.4 (2h) → T01.1 (3h) → T01.5 (2h) → T01.3 (1-2 dias)
```

Comecar pelas correcoes rapidas e terminar com rate limiting (maior esforco).

---

## Riscos

| Risco | Mitigacao |
|-------|-----------|
| Update do Next.js quebra compatibilidade | Rodar suite completa de testes antes de merge |
| CSP bloqueia recursos legitimos | Testar em staging com CSP em report-only primeiro |
| Rate limiting bloqueia usuarios legitimos | Comecar com limites generosos e ajustar com metricas |
