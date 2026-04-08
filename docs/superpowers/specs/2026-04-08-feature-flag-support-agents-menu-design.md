# Feature Flag: Menu "Agentes IA de Suporte"

**Data:** 2026-04-08
**Status:** Aprovado

## Objetivo

Controlar a exibição do item de menu "Agentes IA de Suporte" no `TeacherShell` via variável de ambiente, sem afetar a rota `/support` (que permanece acessível independentemente).

## Variável de Ambiente

| Variável                 | Valor para ativar | Comportamento padrão (não definida) |
|--------------------------|-------------------|--------------------------------------|
| `FEATURE_SUPPORT_AGENTS` | `true`            | Menu **oculto**                      |

A flag é opt-in: o menu só aparece quando a variável está explicitamente definida como `'true'`. Qualquer outro valor ou ausência da variável resulta em menu oculto.

## Escopo

- **Leitura:** servidor apenas (`process.env.FEATURE_SUPPORT_AGENTS`). Não requer prefixo `NEXT_PUBLIC_`.
- **Rota `/support`:** não afetada — permanece acessível diretamente.
- **Admin shell:** não afetado.

## Mudanças

### `src/app-shell/authenticated/teacher-shell.tsx`

O array `navigationItems` é atualmente uma constante de módulo (fora do componente). Para aplicar a flag, ele deve ser construído **dentro do corpo do componente** `TeacherShell`, que já é um Server Component (sem `"use client"`).

```ts
// Dentro da função TeacherShell:
const supportAgentsEnabled = process.env.FEATURE_SUPPORT_AGENTS === "true";

const navigationItems = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
  { id: "new-exam", label: "Nova Prova", href: "/exams/new", icon: FilePlus },
  ...(supportAgentsEnabled
    ? [{ id: "support", label: "Agentes IA de Suporte", href: "/support", icon: Bot }]
    : []),
];
```

A leitura de `process.env` dentro de Server Components é avaliada em tempo de build/request, sem custo adicional em runtime.

### `.env.example`

Adicionar linha documentando a flag:

```
# Feature flags
# FEATURE_SUPPORT_AGENTS=true  # Exibe o menu "Agentes IA de Suporte" no painel do professor
```

## O que não muda

- A rota `/support` e seus sub-routes (`/support/[agentSlug]/[threadId]`) continuam funcionando normalmente.
- O type `activeNav` no `TeacherShellProps` mantém `"support"` como valor válido (sem impacto ao esconder o menu, pois a página continua existindo).
- Nenhuma validação Zod adicionada — a flag é opcional por design.

## Testes

Verificação manual suficiente para o escopo:
1. Sem a variável definida → item "Agentes IA de Suporte" ausente em desktop e mobile.
2. Com `FEATURE_SUPPORT_AGENTS=true` → item presente em desktop e mobile.
3. Com a flag desativada, acessar `/support` diretamente → página carrega normalmente.
