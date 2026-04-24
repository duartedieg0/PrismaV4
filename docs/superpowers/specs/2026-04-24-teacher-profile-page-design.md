# Design: Pagina de Perfil do Professor

**Data:** 2026-04-24
**Status:** Aprovado

## Resumo

Pagina de perfil para professores autenticados preencherem informacoes pessoais, de localizacao e atuacao profissional. O preenchimento e semi-obrigatorio: o professor pode pular, mas um banner de lembrete aparece no dashboard ate que os campos principais (telefone, cidade, estado) sejam preenchidos.

## Decisoes de Design

- **Abordagem:** Pagina unica com 3 secoes (cards empilhados)
- **Escolas:** Campo de texto livre
- **Materias:** Multi-select da tabela `subjects` existente
- **Niveis de ensino:** Multi-select da tabela `grade_levels` existente
- **Estado:** Select com 27 UFs
- **Cidade:** Campo de texto livre
- **Obrigatoriedade:** Semi-obrigatoria (banner no dashboard)
- **Campos principais para completude:** telefone, cidade, estado
- **Acesso:** Menu lateral + dropdown do avatar no header

---

## 1. Banco de Dados

### 1.1 Migracao da tabela `profiles`

Novos campos adicionados a tabela `profiles` existente:

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `phone` | `text` | nao | Telefone/WhatsApp |
| `bio` | `text` | nao | Texto livre sobre o professor |
| `state` | `text` | nao | UF (2 caracteres) |
| `city` | `text` | nao | Cidade (texto livre) |
| `schools` | `text` | nao | Escolas onde atua (texto livre) |
| `years_experience` | `integer` | nao | Anos de experiencia |
| `academic_background` | `text` | nao | Formacao academica |
| `profile_completed` | `boolean` | nao | Default `false` - controla o banner de lembrete |

### 1.2 Tabelas de relacionamento (many-to-many)

**`profile_subjects`**
- `profile_id` (uuid, FK -> profiles.id, ON DELETE CASCADE)
- `subject_id` (uuid, FK -> subjects.id, ON DELETE CASCADE)
- Primary key: (`profile_id`, `subject_id`)

**`profile_grade_levels`**
- `profile_id` (uuid, FK -> profiles.id, ON DELETE CASCADE)
- `grade_level_id` (uuid, FK -> grade_levels.id, ON DELETE CASCADE)
- Primary key: (`profile_id`, `grade_level_id`)

### 1.3 RLS (Row Level Security)

- `profiles`: professor so le/atualiza o proprio perfil (policy ja existente, verificar se cobre os novos campos)
- `profile_subjects`: professor so le/escreve as proprias associacoes (`auth.uid() = profile_id`)
- `profile_grade_levels`: professor so le/escreve as proprias associacoes (`auth.uid() = profile_id`)
- Admins podem ler tudo (via funcao `is_admin()` existente)

---

## 2. UI da Pagina de Perfil

### 2.1 Rota e layout

- Rota: `/profile` dentro do grupo `(auth)` - requer autenticacao
- Usa o mesmo layout autenticado do dashboard (sidebar + header)

### 2.2 Estrutura do formulario

A pagina tem um `PageHeader` com titulo "Meu Perfil" e breadcrumb (Dashboard > Meu Perfil), seguido de 3 Cards empilhados verticalmente:

**Card 1 - Dados Pessoais**
- Avatar (exibicao apenas, vem do Google)
- Nome completo (input, pre-preenchido do Google)
- Telefone/WhatsApp (input com mascara)
- Bio (textarea, placeholder: "Conte um pouco sobre voce e sua atuacao...")

**Card 2 - Localizacao**
- Estado (select com as 27 UFs)
- Cidade (input texto livre)

**Card 3 - Atuacao Profissional**
- Escolas onde atua (textarea, texto livre)
- Materias que leciona (multi-select com checkboxes, carregado de `subjects`)
- Niveis de ensino (multi-select com checkboxes, carregado de `grade_levels`)
- Anos de experiencia (input numerico)
- Formacao academica (input texto)

### 2.3 Botao de acao

Botao "Salvar perfil" fixo no final da pagina. Feedback com toast de sucesso/erro.

---

## 3. Navegacao e Acesso

### 3.1 Pontos de acesso

1. **Sidebar** - novo item "Meu Perfil" no menu lateral (icone de usuario), abaixo do Dashboard
2. **Header** - ao clicar no avatar/nome no canto superior, abre dropdown com opcao "Meu Perfil" (e "Sair")

### 3.2 Banner no dashboard

Banner discreto no topo do dashboard quando `profile_completed === false`:

> "Complete seu perfil para uma experiencia personalizada" - com link para `/profile`

O banner some quando o professor salva o perfil com telefone, cidade e estado preenchidos.

---

## 4. Fluxo Completo

1. Professor faz login via Google -> e redirecionado ao dashboard
2. Se `profile_completed === false`, ve o banner de lembrete no topo
3. Clica no link do banner, no menu lateral, ou no avatar -> vai para `/profile`
4. Preenche os campos e clica "Salvar perfil"
5. Server action valida e salva na tabela `profiles` + tabelas de relacionamento
6. Se telefone, cidade e estado estao preenchidos -> `profile_completed = true`
7. Toast de sucesso, banner desaparece do dashboard

---

## 5. Tratamento de Dados

- **Server Action** para salvar - uma unica action que faz upsert no `profiles` e sincroniza `profile_subjects` e `profile_grade_levels`
- **Carregamento** - Server Component busca dados do perfil, materias e niveis de ensino em paralelo e passa ao Client Component do formulario
- **Validacao** - campos de texto com limite de caracteres, `years_experience` >= 0, `state` deve ser UF valida quando preenchido

---

## 6. Componentes do Design System Utilizados

Componentes existentes que serao reutilizados:
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`
- `Button` (variante primary)
- `Input`, `Textarea`
- `PageHeader` com `Breadcrumbs`
- `Avatar`
- `Badge` (para o banner)

Componentes novos necessarios:
- `Select` - componente de select dropdown (para UF)
- `MultiSelect` / `CheckboxGroup` - para selecao de materias e niveis de ensino
