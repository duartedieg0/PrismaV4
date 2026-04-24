# Design: Pagina de Perfil do Professor

**Data:** 2026-04-24
**Status:** Aprovado

## Resumo

Pagina de perfil para professores autenticados preencherem informacoes pessoais, de localizacao e atuacao profissional. O preenchimento e semi-obrigatorio: o professor pode pular, mas um banner de lembrete aparece no dashboard ate que os campos principais (telefone, cidade, estado) sejam preenchidos.

## Decisoes de Design

- **Abordagem:** Pagina unica com 3 secoes (cards empilhados)
- **Escolas:** Campo de texto livre
- **Materias:** Multi-select da tabela `subjects` existente (filtrado por `enabled = true`)
- **Niveis de ensino:** Multi-select da tabela `grade_levels` existente (filtrado por `enabled = true`)
- **Estado:** Select com 27 UFs
- **Cidade:** Campo de texto livre
- **Obrigatoriedade:** Semi-obrigatoria (banner no dashboard)
- **Campos principais para completude:** telefone, cidade, estado
- **Acesso:** Menu lateral (link "Perfil" ja existente) + dropdown do avatar no header

---

## 1. Banco de Dados

### 1.1 Migracao da tabela `profiles`

Novos campos adicionados a tabela `profiles` existente:

| Campo | Tipo | Constraint | Descricao |
|-------|------|------------|-----------|
| `phone` | `text` | `CHECK(length(phone) <= 20)` | Telefone/WhatsApp |
| `bio` | `text` | `CHECK(length(bio) <= 500)` | Texto livre sobre o professor |
| `state` | `text` | `CHECK(length(state) = 2)` | UF (2 caracteres) |
| `city` | `text` | `CHECK(length(city) <= 100)` | Cidade (texto livre) |
| `schools` | `text` | `CHECK(length(schools) <= 500)` | Escolas onde atua (texto livre) |
| `years_experience` | `integer` | `CHECK(years_experience >= 0)` | Anos de experiencia |
| `academic_background` | `text` | `CHECK(length(academic_background) <= 200)` | Formacao academica |
| `profile_completed` | `boolean` | `DEFAULT false` | Controla o banner de lembrete |
| `updated_at` | `timestamptz` | `DEFAULT now()` | Ultima atualizacao do perfil |

Trigger para atualizar `updated_at` automaticamente no UPDATE.

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

Ambas as tabelas de relacionamento devem ter RLS habilitado (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).

Policies para `profile_subjects` e `profile_grade_levels`:
- **SELECT:** `auth.uid() = profile_id` (professor le as proprias) + `is_admin()` (admin le todas)
- **INSERT:** `auth.uid() = profile_id` (professor insere as proprias)
- **DELETE:** `auth.uid() = profile_id` (professor deleta as proprias, necessario para sincronizacao)

Policies existentes em `profiles`: verificar se a policy de UPDATE cobre os novos campos (campos adicionados via ALTER TABLE sao cobertos automaticamente).

---

## 2. UI da Pagina de Perfil

### 2.1 Rota e layout

- Rota: `/profile` dentro do grupo `(auth)` - requer autenticacao
- Usa o mesmo layout autenticado do dashboard (`TeacherShell`)
- O link "Perfil" ja existe no footer da sidebar do `TeacherShell` — nao e necessario modificar `activeNav`

### 2.2 Estrutura do formulario

A pagina tem um `PageHeader` com titulo "Meu Perfil" e breadcrumb (`[{ label: "Inicio", href: "/dashboard" }, { label: "Meu Perfil" }]`), seguido de 3 Cards empilhados verticalmente:

**Card 1 - Dados Pessoais**
- Avatar (exibicao apenas, vem do Google)
- Nome completo (input, pre-preenchido do Google)
- Telefone/WhatsApp (input com mascara formato `(11) 99999-9999`)
- Bio (textarea, max 500 chars, placeholder: "Conte um pouco sobre voce e sua atuacao...")

**Card 2 - Localizacao**
- Estado (select nativo `<select>` com as 27 UFs)
- Cidade (input texto livre, max 100 chars)

**Card 3 - Atuacao Profissional**
- Escolas onde atua (textarea, max 500 chars, texto livre)
- Materias que leciona (grupo de checkboxes, carregado de `subjects` onde `enabled = true`)
- Niveis de ensino (grupo de checkboxes, carregado de `grade_levels` onde `enabled = true`)
- Anos de experiencia (input numerico, min 0)
- Formacao academica (input texto, max 200 chars)

### 2.3 Botao de acao

Botao "Salvar perfil" no final da pagina. Feedback com toast via `sonner` (sucesso/erro).

### 2.4 Estados da pagina

- **Loading:** Skeleton cards enquanto Server Component busca dados
- **Erro no save:** Toast de erro via `sonner` com mensagem descritiva
- **Listas vazias:** Se `subjects` ou `grade_levels` estiverem vazios, exibir texto "Nenhuma opcao disponivel" no lugar dos checkboxes
- **Sucesso:** Toast de sucesso "Perfil salvo com sucesso"

---

## 3. Navegacao e Acesso

### 3.1 Pontos de acesso

1. **Sidebar** - link "Perfil" ja existente no footer do `TeacherShell` (apontar para `/profile`)
2. **Header** - ao clicar no avatar/nome no canto superior, abre dropdown com opcoes "Meu Perfil" e "Sair". Novo componente `UserDropdown` necessario.

### 3.2 Banner no dashboard

Componente `ProfileCompletionBanner` no topo do dashboard quando `profile_completed === false`:

> "Complete seu perfil para uma experiencia personalizada" — com link para `/profile`

O banner some quando o professor salva o perfil com telefone, cidade e estado preenchidos.

---

## 4. Fluxo Completo

1. Professor faz login via Google -> e redirecionado ao dashboard
2. Se `profile_completed === false`, ve o banner de lembrete no topo
3. Clica no link do banner, no menu lateral, ou no avatar -> vai para `/profile`
4. Preenche os campos e clica "Salvar perfil"
5. API route `PUT /api/profile` valida e salva na tabela `profiles` + sincroniza tabelas de relacionamento (delete all + re-insert)
6. Se telefone, cidade e estado estao preenchidos -> `profile_completed = true`
7. Toast de sucesso, banner desaparece do dashboard

---

## 5. Tratamento de Dados

### 5.1 API Route

- **`PUT /api/profile`** - recebe JSON com todos os campos do perfil + arrays de IDs de subjects e grade_levels
- Segue o padrao existente do projeto (ex: `POST /api/exams`)
- Usa o Supabase client server-side para upsert no `profiles` e sincronizar `profile_subjects` e `profile_grade_levels`

### 5.2 Carregamento

- Server Component busca em paralelo: dados do perfil, subjects (enabled), grade_levels (enabled), profile_subjects e profile_grade_levels do professor
- Passa dados ao Client Component do formulario
- Nova funcao `getFullProfile()` separada de `getProfileOrRedirect()` (que busca apenas campos basicos para auth)

### 5.3 Validacao

- Frontend: limites de caracteres nos inputs, formato de telefone, UF valida
- Backend (API route): mesmas validacoes + sanitizacao antes de salvar
- Database: CHECK constraints como ultima linha de defesa

---

## 6. Componentes

### Componentes existentes reutilizados
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`
- `Button` (variante primary)
- `Input`, `Textarea`
- `PageHeader` com `Breadcrumbs`
- `Avatar`

### Componentes novos necessarios
- `Select` - componente de select dropdown estilizado (para UF)
- `CheckboxGroup` - grupo de checkboxes para selecao multipla (materias e niveis)
- `UserDropdown` - dropdown do avatar no header com links (Meu Perfil, Sair)
- `ProfileCompletionBanner` - banner de lembrete para o dashboard
