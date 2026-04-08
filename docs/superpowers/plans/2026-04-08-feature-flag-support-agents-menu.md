# Feature Flag: Menu "Agentes IA de Suporte" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Controlar a exibição do item "Agentes IA de Suporte" no sidebar do professor via a variável de ambiente `FEATURE_SUPPORT_AGENTS=true` (opt-in; menu oculto por padrão).

**Architecture:** A constante `navigationItems` é movida para dentro do componente `TeacherShell` (Server Component), onde lê `process.env.FEATURE_SUPPORT_AGENTS` em runtime e inclui ou exclui o item condicionalmente. A rota `/support` não é alterada.

**Tech Stack:** Next.js App Router (Server Components), Vitest + Testing Library

---

## File Map

| Arquivo | Ação | O que muda |
|---|---|---|
| `src/app-shell/authenticated/teacher-shell.tsx` | Modificar | Move `navigationItems` para dentro do componente; adiciona leitura da flag |
| `src/test/app-shell/shells.test.tsx` | Modificar | Adiciona testes para a flag (com e sem a env var) |
| `.env.example` | Modificar | Documenta `FEATURE_SUPPORT_AGENTS` |

---

## Task 1: Testes para o comportamento da feature flag

**Files:**
- Modify: `src/test/app-shell/shells.test.tsx`

> Escrevemos os testes antes da implementação (TDD). O `TeacherShell` é um Server Component mas no ambiente de testes do Vitest é renderizado como função síncrona comum — `process.env` pode ser manipulado diretamente via `vi.stubEnv`.

- [ ] **Step 1: Adicionar os dois casos de teste no arquivo existente**

Abra `src/test/app-shell/shells.test.tsx` e, dentro do `describe("app shells", ...)`, adicione após o teste existente do teacher shell:

```tsx
it("esconde o item 'Agentes IA de Suporte' quando FEATURE_SUPPORT_AGENTS não está definida", () => {
  vi.stubEnv("FEATURE_SUPPORT_AGENTS", "");

  render(
    <TeacherShell
      title="Dashboard"
      breadcrumbs={[{ label: "Inicio", href: "/" }]}
    >
      <p>conteudo</p>
    </TeacherShell>,
  );

  expect(screen.queryByText(/agentes ia de suporte/i)).not.toBeInTheDocument();

  vi.unstubAllEnvs();
});

it("exibe o item 'Agentes IA de Suporte' quando FEATURE_SUPPORT_AGENTS=true", () => {
  vi.stubEnv("FEATURE_SUPPORT_AGENTS", "true");

  render(
    <TeacherShell
      title="Dashboard"
      breadcrumbs={[{ label: "Inicio", href: "/" }]}
    >
      <p>conteudo</p>
    </TeacherShell>,
  );

  expect(screen.getByText(/agentes ia de suporte/i)).toBeInTheDocument();

  vi.unstubAllEnvs();
});
```

Certifique-se de que `vi` está importado no topo do arquivo:
```tsx
import { describe, expect, it, vi } from "vitest";
```

- [ ] **Step 2: Rodar os testes e verificar que os dois novos falham**

```bash
npm test -- --reporter=verbose src/test/app-shell/shells.test.tsx
```

Saída esperada: os dois novos testes falham (o item aparece mesmo sem a flag, pois a implementação ainda não foi feita). O teste existente continua passando.

---

## Task 2: Implementar a feature flag no TeacherShell

**Files:**
- Modify: `src/app-shell/authenticated/teacher-shell.tsx`

- [ ] **Step 3: Mover `navigationItems` para dentro da função e adicionar a flag**

No arquivo `src/app-shell/authenticated/teacher-shell.tsx`:

1. **Remover** a constante de módulo (linhas 26–30 atualmente):
```tsx
// REMOVER ISTO:
const navigationItems = [
  { id: "dashboard" as const, label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { id: "new-exam" as const, label: "Nova Prova", href: "/exams/new", icon: FilePlus },
  { id: "support" as const, label: "Agentes IA de Suporte", href: "/support", icon: Bot },
];
```

2. **Adicionar** dentro do corpo da função `TeacherShell`, logo antes do `return`:
```tsx
const supportAgentsEnabled = process.env.FEATURE_SUPPORT_AGENTS === "true";

const navigationItems = [
  { id: "dashboard" as const, label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { id: "new-exam" as const, label: "Nova Prova", href: "/exams/new", icon: FilePlus },
  ...(supportAgentsEnabled
    ? [{ id: "support" as const, label: "Agentes IA de Suporte", href: "/support", icon: Bot }]
    : []),
];
```

- [ ] **Step 4: Rodar os testes e verificar que todos passam**

```bash
npm test -- --reporter=verbose src/test/app-shell/shells.test.tsx
```

Saída esperada: todos os 5 testes no arquivo passam (`✓ esconde o item`, `✓ exibe o item`, e os 3 existentes).

- [ ] **Step 5: Commit**

```bash
git add src/app-shell/authenticated/teacher-shell.tsx src/test/app-shell/shells.test.tsx
git commit -m "feat: feature flag FEATURE_SUPPORT_AGENTS para menu Agentes IA de Suporte"
```

---

## Task 3: Documentar a variável no .env.example

**Files:**
- Modify: `.env.example`

- [ ] **Step 6: Adicionar a seção de feature flags ao final do arquivo**

Abra `.env.example` e adicione ao final:

```
# Feature flags
# FEATURE_SUPPORT_AGENTS=true  # Exibe o menu "Agentes IA de Suporte" no painel do professor
```

- [ ] **Step 7: Commit**

```bash
git add .env.example
git commit -m "docs: documenta FEATURE_SUPPORT_AGENTS em .env.example"
```

---

## Verificação Manual

Após a implementação, verificar localmente:

1. Sem a variável (ou com valor diferente de `true`) → item "Agentes IA de Suporte" ausente no sidebar desktop e na barra mobile.
2. Com `FEATURE_SUPPORT_AGENTS=true` no `.env.local` → item presente nos dois.
3. Com a flag desativada, acessar `/support` diretamente → página carrega normalmente.
