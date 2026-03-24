# Epic 04 — Padronizacao de API e Qualidade de Codigo

**Prioridade:** MEDIA
**Estimativa:** 4-5 dias de desenvolvimento
**Dependencias:** Nenhuma tecnica, mas recomenda-se concluir Epics 01 e 02 antes
**Branch sugerida:** `epic/04-api-standardization`

---

## Objetivo

Padronizar as respostas de API, eliminar duplicacao de codigo nas rotas de admin e remover type casts inseguros. Este epico melhora a manutenibilidade e a experiencia do consumidor da API.

---

## Tarefas

### T04.1 — Padronizar Formato de Resposta de Erro das APIs

**Severidade:** MEDIA
**Arquivos a criar/modificar:**
- `src/services/errors/api-response.ts` (novo)
- Todas as rotas em `src/app/api/**/*.ts`

**Problema:**
As respostas de erro sao inconsistentes entre rotas:

```typescript
// Formato 1: string
{ error: "Exame não encontrado." }

// Formato 2: objeto (Zod flatten)
{ error: { name: ["Campo obrigatório"] } }

// Formato 3: mensagem generica
{ error: "Erro interno." }
```

Isso dificulta o tratamento de erros no frontend, que precisa lidar com multiplos formatos.

**Solucao:**
Criar envelope de resposta padronizado:

```typescript
// src/services/errors/api-response.ts

type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "INTERNAL_ERROR";

type ApiErrorResponse = {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: Record<string, string[]>;  // Zod field errors
  };
};

type ApiSuccessResponse<T> = {
  data: T;
};

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  details?: Record<string, string[]>,
) {
  return NextResponse.json(
    { error: { code, message, details } } satisfies ApiErrorResponse,
    { status },
  );
}

export function apiValidationError(zodError: z.ZodError) {
  return apiError(
    "VALIDATION_ERROR",
    "Dados inválidos.",
    400,
    zodError.flatten().fieldErrors as Record<string, string[]>,
  );
}

export function apiNotFound(message = "Recurso não encontrado.") {
  return apiError("NOT_FOUND", message, 404);
}

export function apiUnauthorized(message = "Não autenticado.") {
  return apiError("UNAUTHORIZED", message, 401);
}

export function apiForbidden(message = "Acesso negado.") {
  return apiError("FORBIDDEN", message, 403);
}

export function apiInternalError(message = "Erro interno.") {
  return apiError("INTERNAL_ERROR", message, 500);
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data } satisfies ApiSuccessResponse<T>, { status });
}
```

**Exemplo de migracao de rota:**

```typescript
// ANTES
if (!user) {
  return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
}

// DEPOIS
if (!user) {
  return apiUnauthorized();
}
```

```typescript
// ANTES (validacao Zod)
if (!parsed.success) {
  return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
}

// DEPOIS
if (!parsed.success) {
  return apiValidationError(parsed.error);
}
```

**Criterios de aceite:**
- [ ] Todas as respostas de erro seguem o formato `{ error: { code, message, details? } }`
- [ ] Todas as respostas de sucesso seguem o formato `{ data: T }`
- [ ] Helper functions criadas para cada tipo de erro
- [ ] Frontend atualizado para consumir novo formato (se necessario)
- [ ] Testes unitarios para todas as helper functions
- [ ] Zero `NextResponse.json({ error: string })` remanescente nas rotas

---

### T04.2 — Extrair Middleware para Padrao CRUD Admin

**Severidade:** MEDIA
**Arquivos a criar/modificar:**
- `src/app/api/admin/with-admin-route.ts` (novo)
- Todas as rotas em `src/app/api/admin/**/*.ts`

**Problema:**
O padrao abaixo se repete em 25+ rotas de admin:

```typescript
export async function GET() {
  // 1. Verificar acesso admin (repete em TODA rota)
  const access = await requireAdminRouteAccess();
  if (access.kind === "error") {
    return access.response;
  }

  // 2. Criar client Supabase (repete em TODA rota)
  const supabase = access.supabase;

  // 3. Query no banco (estrutura identica, tabela diferente)
  const { data, error } = await supabase
    .from("TABLE_NAME")
    .select("*")
    .order("name");

  // 4. Tratar erro (identico)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 5. Mapear e retornar (identico, mapper diferente)
  return NextResponse.json(data.map(mapperFn));
}
```

Esse padrao aparece em: `agents/route.ts`, `models/route.ts`, `subjects/route.ts`, `supports/route.ts`, `grade-levels/route.ts`, e em rotas aninhadas com `[id]`.

**Solucao:**
Criar wrapper reutilizavel:

```typescript
// src/app/api/admin/with-admin-route.ts
import { requireAdminRouteAccess } from "@/features/admin/shared/admin-guard";
import { logError } from "@/services/observability/logger";
import { createRequestContext } from "@/services/runtime/request-context";
import { apiInternalError } from "@/services/errors/api-response";
import type { SupabaseClient } from "@supabase/supabase-js";

type AdminRouteHandler = (
  supabase: SupabaseClient,
  request: Request,
) => Promise<Response>;

export function withAdminRoute(handler: AdminRouteHandler) {
  return async (request: Request) => {
    const access = await requireAdminRouteAccess();
    if (access.kind === "error") {
      return access.response;
    }

    try {
      return await handler(access.supabase, request);
    } catch (error) {
      const ctx = createRequestContext();
      logError("Erro em rota admin", ctx, error);
      return apiInternalError();
    }
  };
}
```

**Exemplo de rota migrada:**

```typescript
// ANTES — src/app/api/admin/agents/route.ts (57 linhas)
export async function GET() {
  const access = await requireAdminRouteAccess();
  if (access.kind === "error") { return access.response; }
  const supabase = access.supabase;
  const { data, error } = await supabase.from("agents").select("*").order("name");
  if (error) { return NextResponse.json({ error: error.message }, { status: 500 }); }
  return NextResponse.json(data.map(toAdminAgentView));
}

// DEPOIS (20 linhas)
export const GET = withAdminRoute(async (supabase) => {
  const { data, error } = await supabase.from("agents").select("*").order("name");
  if (error) { return apiInternalError(error.message); }
  return apiSuccess(data.map(toAdminAgentView));
});
```

**Criterios de aceite:**
- [ ] `withAdminRoute` wrapper criado e testado
- [ ] Todas as rotas admin migradas para usar o wrapper
- [ ] Zero `requireAdminRouteAccess()` duplicado em handlers individuais
- [ ] Error handling centralizado no wrapper (com logging)
- [ ] Testes existentes continuam passando sem alteracao
- [ ] Reducao de ~40% nas linhas de codigo das rotas admin

---

### T04.3 — Remover Type Casts Inseguros

**Severidade:** MEDIA
**Arquivos a modificar:**

| Arquivo | Problema |
|---------|----------|
| `src/app/api/admin/supports/route.ts:24` | `item as never` |
| `src/app/api/admin/agents/[id]/feedbacks/route.ts:66-70` | `as unknown` multiplos |
| `src/features/admin/shared/admin-guard.ts:9,59` | `supabase as never` |
| `src/features/access-control/assert-access.ts:44,59` | `createServerClient() as any` |
| `src/features/auth/callback.ts:70` | `supabase as any` |

**Problema:**
Type casts como `as never`, `as unknown` e `as any` contornam o sistema de tipos do TypeScript, ocultando bugs que seriam detectados em compilacao.

**Solucao por arquivo:**

**`admin-guard.ts` e `assert-access.ts`:** O cast `as any`/`as never` provavelmente existe porque o tipo retornado por `createServerClient()` nao corresponde ao tipo esperado pela funcao consumidora. Solucao:
- Ajustar os tipos de retorno do gateway Supabase
- Ou criar uma interface intermediaria que ambos satisfacam

**`supports/route.ts`:** O `item as never` provavelmente e necessario porque o tipo inferido pelo Supabase nao corresponde ao tipo esperado pela funcao `toAdminSupportView`. Solucao:
- Definir tipo explicito para o resultado da query
- Ou ajustar `toAdminSupportView` para aceitar o tipo correto

**`feedbacks/route.ts`:** Os `as unknown` provavelmente existem para tratar campos JSONB do banco. Solucao:
- Usar Zod para validar o shape dos campos JSONB em runtime
- Substituir `as unknown` por parse seguro

**Criterios de aceite:**
- [ ] Zero `as never` no codebase (exceto em testes)
- [ ] Zero `as any` no codebase (exceto em testes)
- [ ] `as unknown` apenas quando seguido de validacao (Zod parse)
- [ ] `npm run typecheck` passa sem erros
- [ ] Testes existentes continuam passando

---

### T04.4 — Otimizar Queries no Endpoint de Status

**Severidade:** BAIXA
**Arquivo:** `src/app/api/exams/[id]/status/route.ts`

**Problema:**
O endpoint faz 3 queries sequenciais ao banco (linhas 35-57):

```typescript
// Query 1: buscar IDs das questoes
const { data: questions } = await supabase
  .from("questions").select("id").eq("exam_id", examId);

// Query 2: contar total de adaptacoes
const { count: total } = await supabase
  .from("adaptations").select("*", { count: "exact", head: true })
  .in("question_id", questionIds);

// Query 3: contar adaptacoes concluidas
const { count: completed } = await supabase
  .from("adaptations").select("*", { count: "exact", head: true })
  .in("question_id", questionIds).eq("status", "completed");
```

**Solucao:**
Consolidar em 2 queries paralelas (as queries 2 e 3 sao independentes entre si):

```typescript
const { data: questions } = await supabase
  .from("questions").select("id").eq("exam_id", examId);

const questionIds = (questions ?? []).map((q) => q.id);

if (questionIds.length === 0) {
  return NextResponse.json({
    status: exam.status,
    errorMessage: exam.error_message,
    progress: { total: 0, completed: 0, questionsCount: 0 },
  });
}

// Queries em paralelo
const [totalResult, completedResult] = await Promise.all([
  supabase
    .from("adaptations").select("*", { count: "exact", head: true })
    .in("question_id", questionIds),
  supabase
    .from("adaptations").select("*", { count: "exact", head: true })
    .in("question_id", questionIds).eq("status", "completed"),
]);
```

**Criterios de aceite:**
- [ ] Queries 2 e 3 executam em paralelo com `Promise.all`
- [ ] Early return quando nao ha questoes (evita queries desnecessarias)
- [ ] Resposta identica a atual (sem breaking change)
- [ ] Teste unitario cobrindo cenarios com/sem questoes

---

## Ordem de Execucao Recomendada

```
T04.1 (1-2 dias) → T04.2 (1-2 dias) → T04.3 (4h) → T04.4 (1h)
```

T04.1 (padronizacao de erro) deve vir primeiro porque T04.2 (wrapper admin) vai usar os helpers de erro. T04.3 e T04.4 sao independentes e menores.

---

## Riscos

| Risco | Mitigacao |
|-------|-----------|
| Mudanca no formato de resposta quebra frontend | Migrar frontend e API juntos; ou versionar API |
| Refactor do wrapper admin introduz regressoes | Suite de testes existente (96 arquivos) como rede de seguranca |
| Remocao de type casts revela erros de tipo ocultos | Tratar cada erro como bug real que estava escondido |
