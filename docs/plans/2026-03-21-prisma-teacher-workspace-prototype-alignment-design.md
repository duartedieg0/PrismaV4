# Prisma Teacher Workspace Prototype Alignment Design

## Goal

Recalibrar todo o eixo autenticado do professor no `PrismaV2` para uma aproximação forte do protótipo de dashboard, usando o dashboard como tela-mestre e propagando a mesma experiência para criação, revisão, processamento e resultado.

## Problem

Hoje o `TeacherShell` e as páginas do professor ainda operam com uma linguagem visual genérica:

- o shell parece um header de aplicação, não um workspace lateral consistente;
- o dashboard ainda não reproduz a composição do protótipo com fidelidade suficiente;
- as outras telas do professor não compartilham a mesma sensação de ambiente operacional.

O resultado é um produto que funciona, mas não entrega a consistência visual e a precisão espacial do protótipo.

## Chosen Approach

Seguir com uma recalibração ampla do eixo autenticado do professor:

- transformar o `TeacherShell` em um workspace com sidebar fixa clara;
- aproximar fortemente o dashboard do protótipo em composição e densidade;
- fazer `nova prova`, `extração`, `processamento` e `resultado` herdarem a mesma gramática visual.

Nada de backend, contratos, rotas ou fluxos será alterado. Toda a intervenção fica restrita à camada visual.

## Scope

### In scope

- `src/app-shell/authenticated/teacher-shell.tsx`
- `src/app/(auth)/dashboard/page.tsx`
- `src/features/exams/dashboard/components/*`
- `src/app/(auth)/exams/new/page.tsx`
- `src/app/(auth)/exams/[id]/extraction/page.tsx`
- `src/app/(auth)/exams/[id]/processing/page.tsx`
- `src/app/(auth)/exams/[id]/result/page.tsx`
- componentes centrais das superfícies do professor que precisarem refletir a nova linguagem

### Out of scope

- backend e Supabase
- admin shell
- landing pública
- mudança de fluxos ou passos de produto

## Visual Direction

### Workspace

- sidebar fixa clara com marca, navegação e área inferior;
- conteúdo principal com fundo claro, muito respiro e headline forte;
- CTA principal âmbar nas telas principais;
- cards brancos com sombras curtas e bordas laterais por status.

### Dashboard

- título grande e direto;
- faixa de métricas compacta abaixo do cabeçalho;
- grade de provas com alta fidelidade ao protótipo;
- menos ornamentação e menos arredondamento.

### Other teacher screens

- mesma sidebar e área principal;
- cabeçalhos com título forte + ação principal quando fizer sentido;
- superfícies consistentes com o dashboard;
- estados de processamento/revisão/resultado com acabamento do mesmo workspace.

## Risks

- o novo shell alterar demais a semântica e quebrar testes;
- exagerar na densidade e perder conforto visual;
- deixar mobile inconsistente ao perseguir fidelidade desktop;
- criar divergência entre dashboard e telas seguintes.

## Mitigations

- preservar navegação, links e landmarks;
- manter responsividade por grids fluidos;
- concentrar a identidade em shell, cabeçalhos e superfícies compartilhadas;
- validar com `lint`, `typecheck`, `build`, `test`, `test:a11y` e `test:e2e`.
