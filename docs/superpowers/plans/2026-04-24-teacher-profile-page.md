# Teacher Profile Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow authenticated teachers to view and edit their profile (personal data, location, professional info) with a completion banner on the dashboard.

**Architecture:** Single page at `/profile` using Server Component for data loading + Client Component form. API route `PUT /api/profile` handles persistence. Supabase migration adds new columns to `profiles` and two join tables (`profile_subjects`, `profile_grade_levels`).

**Tech Stack:** Next.js App Router, Supabase (RLS + migrations), Tailwind CSS v4, sonner (toasts), Zod (validation)

**Spec:** `docs/superpowers/specs/2026-04-24-teacher-profile-page-design.md`

---

## File Structure

### New files
| File | Responsibility |
|------|---------------|
| `supabase/migrations/00021_teacher_profile_fields.sql` | Migration: new columns + join tables + RLS + trigger |
| `src/domains/profile/contracts.ts` | Types: `FullProfile`, `ProfileFormData`, UF list |
| `src/domains/profile/validation.ts` | Zod schema for profile form validation |
| `src/features/profile/get-full-profile.ts` | Server-side data loading (profile + subjects + grade levels) |
| `src/features/profile/save-profile.ts` | Core save logic (upsert profile + sync join tables) |
| `src/app/api/profile/route.ts` | API route `PUT /api/profile` |
| `src/features/profile/components/profile-form.tsx` | Client Component: the profile form |
| `src/features/profile/components/checkbox-group.tsx` | Reusable checkbox group for multi-select |
| `src/features/profile/components/profile-completion-banner.tsx` | Banner for dashboard |
| `src/app/(auth)/profile/page.tsx` | Server Component: profile page |
| `src/app/(auth)/profile/loading.tsx` | Skeleton loading state for profile page |
| `src/design-system/components/select.tsx` | Styled select component |

### Modified files
| File | Change |
|------|--------|
| `src/domains/auth/contracts.ts` | Add `profile_completed` to `Profile` interface |
| `src/design-system/index.ts` | Export new `Select` component |
| `src/app/(auth)/dashboard/page.tsx` | Add `ProfileCompletionBanner` |
| `src/features/auth/get-profile.ts` | Add `profile_completed` to select query |

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/00021_teacher_profile_fields.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- ============================================================
-- Migration 00021: Teacher Profile Fields
-- Adds profile detail columns and join tables for subjects/grade_levels
-- ============================================================

-- -------------------------------------------------------
-- 1. Add new columns to profiles
-- -------------------------------------------------------
alter table public.profiles
  add column phone text check (length(phone) <= 20),
  add column bio text check (length(bio) <= 500),
  add column state text check (length(state) = 2),
  add column city text check (length(city) <= 100),
  add column schools text check (length(schools) <= 500),
  add column years_experience integer check (years_experience >= 0),
  add column academic_background text check (length(academic_background) <= 200),
  add column profile_completed boolean not null default false,
  add column updated_at timestamptz not null default now();

-- -------------------------------------------------------
-- 2. Trigger to auto-update updated_at
-- -------------------------------------------------------
create or replace function public.set_profiles_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_profiles_updated_at();

-- -------------------------------------------------------
-- 3. profile_subjects join table
-- -------------------------------------------------------
create table public.profile_subjects (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  primary key (profile_id, subject_id)
);

alter table public.profile_subjects enable row level security;

create policy "Users can view own profile_subjects"
  on public.profile_subjects for select
  using (auth.uid() = profile_id);

create policy "Users can insert own profile_subjects"
  on public.profile_subjects for insert
  with check (auth.uid() = profile_id);

create policy "Users can delete own profile_subjects"
  on public.profile_subjects for delete
  using (auth.uid() = profile_id);

create policy "Admins can manage profile_subjects"
  on public.profile_subjects for all
  using (public.is_admin());

-- -------------------------------------------------------
-- 4. profile_grade_levels join table
-- -------------------------------------------------------
create table public.profile_grade_levels (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  grade_level_id uuid not null references public.grade_levels(id) on delete cascade,
  primary key (profile_id, grade_level_id)
);

alter table public.profile_grade_levels enable row level security;

create policy "Users can view own profile_grade_levels"
  on public.profile_grade_levels for select
  using (auth.uid() = profile_id);

create policy "Users can insert own profile_grade_levels"
  on public.profile_grade_levels for insert
  with check (auth.uid() = profile_id);

create policy "Users can delete own profile_grade_levels"
  on public.profile_grade_levels for delete
  using (auth.uid() = profile_id);

create policy "Admins can manage profile_grade_levels"
  on public.profile_grade_levels for all
  using (public.is_admin());

-- -------------------------------------------------------
-- 5. Grant permissions to authenticated and anon roles
-- -------------------------------------------------------
grant select, insert, delete on public.profile_subjects to authenticated;
grant select, insert, delete on public.profile_grade_levels to authenticated;
```

- [ ] **Step 2: Apply migration locally**

Run: `npx supabase db push` or apply via Supabase dashboard.
Expected: Migration applies without errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/00021_teacher_profile_fields.sql
git commit -m "feat(db): add teacher profile fields, join tables and RLS policies"
```

---

## Task 2: Domain Types and Validation

**Files:**
- Create: `src/domains/profile/contracts.ts`
- Create: `src/domains/profile/validation.ts`
- Modify: `src/domains/auth/contracts.ts`

- [ ] **Step 1: Create profile domain contracts**

Create `src/domains/profile/contracts.ts`:

```typescript
export const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
  "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
  "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export type BrazilianState = (typeof BRAZILIAN_STATES)[number];

export interface FullProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  phone: string | null;
  bio: string | null;
  state: string | null;
  city: string | null;
  schools: string | null;
  years_experience: number | null;
  academic_background: string | null;
  profile_completed: boolean;
}

export interface ProfileFormData {
  full_name: string;
  phone: string;
  bio: string;
  state: string;
  city: string;
  schools: string;
  years_experience: number | null;
  academic_background: string;
  subject_ids: string[];
  grade_level_ids: string[];
}

export interface SelectOption {
  id: string;
  name: string;
}
```

- [ ] **Step 2: Create profile validation schema**

Create `src/domains/profile/validation.ts`:

```typescript
import { z } from "zod";
import { BRAZILIAN_STATES } from "./contracts";

export const profileFormSchema = z.object({
  full_name: z.string().max(100, "Nome deve ter no maximo 100 caracteres").optional().default(""),
  phone: z.string().max(20, "Telefone deve ter no maximo 20 caracteres").optional().default(""),
  bio: z.string().max(500, "Bio deve ter no maximo 500 caracteres").optional().default(""),
  state: z
    .string()
    .refine((val) => val === "" || (BRAZILIAN_STATES as readonly string[]).includes(val), {
      message: "Estado invalido",
    })
    .optional()
    .default(""),
  city: z.string().max(100, "Cidade deve ter no maximo 100 caracteres").optional().default(""),
  schools: z.string().max(500, "Escolas deve ter no maximo 500 caracteres").optional().default(""),
  years_experience: z
    .number()
    .int()
    .min(0, "Anos de experiencia deve ser >= 0")
    .nullable()
    .optional()
    .default(null),
  academic_background: z
    .string()
    .max(200, "Formacao deve ter no maximo 200 caracteres")
    .optional()
    .default(""),
  subject_ids: z.array(z.string().uuid()).optional().default([]),
  grade_level_ids: z.array(z.string().uuid()).optional().default([]),
});

export type ProfileFormInput = z.infer<typeof profileFormSchema>;
```

- [ ] **Step 3: Add `profile_completed` to Profile interface**

Modify `src/domains/auth/contracts.ts` — add `profile_completed` field to the `Profile` interface:

```typescript
export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: UserRole;
  blocked: boolean;
  created_at: string;
  profile_completed: boolean;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/domains/profile/contracts.ts src/domains/profile/validation.ts src/domains/auth/contracts.ts
git commit -m "feat: add profile domain types and validation schema"
```

---

## Task 3: Select Design System Component

**Files:**
- Create: `src/design-system/components/select.tsx`
- Modify: `src/design-system/index.ts`

- [ ] **Step 1: Create Select component**

Create `src/design-system/components/select.tsx` following the same pattern as `Input`:

```typescript
import { cn } from "@/lib/utils";

type SelectProps = Readonly<{
  label?: string;
  hint?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}> &
  Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children">;

export function Select({ label, hint, error, options, placeholder, className, id, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={selectId} className="text-sm font-medium text-text-primary">
          {label}
        </label>
      ) : null}
      <select
        id={selectId}
        className={cn(
          "h-10 w-full rounded-xl border bg-white px-3.5 text-sm text-text-primary",
          "transition-colors duration-200",
          "focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500",
          error ? "border-danger" : "border-border-default hover:border-border-strong",
          className,
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
        {...props}
      >
        {placeholder ? (
          <option value="">{placeholder}</option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <p id={`${selectId}-error`} className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${selectId}-hint`} className="text-xs text-text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Export Select from design system index**

Add to `src/design-system/index.ts`:

```typescript
export { Select } from "./components/select";
```

- [ ] **Step 3: Commit**

```bash
git add src/design-system/components/select.tsx src/design-system/index.ts
git commit -m "feat(ds): add Select component to design system"
```

---

## Task 4: Server-Side Data Loading

**Files:**
- Create: `src/features/profile/get-full-profile.ts`
- Modify: `src/features/auth/get-profile.ts`

- [ ] **Step 1: Create getFullProfile function**

Create `src/features/profile/get-full-profile.ts`:

```typescript
import type { FullProfile, SelectOption } from "@/domains/profile/contracts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseLike = { from: (...args: any[]) => any };

type GetFullProfileResult = {
  profile: FullProfile;
  subjects: SelectOption[];
  gradeLevels: SelectOption[];
  selectedSubjectIds: string[];
  selectedGradeLevelIds: string[];
};

export async function getFullProfile(
  supabase: SupabaseLike,
  userId: string,
): Promise<GetFullProfileResult | null> {
  const [profileResult, subjectsResult, gradeLevelsResult, profileSubjectsResult, profileGradeLevelsResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id, full_name, email, avatar_url, phone, bio, state, city, schools, years_experience, academic_background, profile_completed",
        )
        .eq("id", userId)
        .single(),
      supabase.from("subjects").select("id, name").eq("enabled", true).order("name"),
      supabase.from("grade_levels").select("id, name").eq("enabled", true).order("name"),
      supabase.from("profile_subjects").select("subject_id").eq("profile_id", userId),
      supabase.from("profile_grade_levels").select("grade_level_id").eq("profile_id", userId),
    ]);

  if (!profileResult.data) {
    return null;
  }

  return {
    profile: profileResult.data as FullProfile,
    subjects: (subjectsResult.data ?? []) as SelectOption[],
    gradeLevels: (gradeLevelsResult.data ?? []) as SelectOption[],
    selectedSubjectIds: (profileSubjectsResult.data ?? []).map(
      (row: { subject_id: string }) => row.subject_id,
    ),
    selectedGradeLevelIds: (profileGradeLevelsResult.data ?? []).map(
      (row: { grade_level_id: string }) => row.grade_level_id,
    ),
  };
}
```

- [ ] **Step 2: Add `profile_completed` to getProfileOrRedirect select**

Modify `src/features/auth/get-profile.ts` — update the select string in **both** queries (the main query in `readProfileWithFallback` around line 24, AND the service-role fallback query around line 44) from:
```
"id, full_name, email, role, blocked"
```
to:
```
"id, full_name, email, role, blocked, profile_completed"
```

Also update the `ProfileRecord` type:

```typescript
type ProfileRecord = {
  id: string;
  full_name?: string | null;
  email: string | null;
  role: "teacher" | "admin";
  blocked: boolean;
  profile_completed: boolean;
};
```

- [ ] **Step 3: Commit**

```bash
git add src/features/profile/get-full-profile.ts src/features/auth/get-profile.ts
git commit -m "feat: add full profile data loading and profile_completed to auth"
```

---

## Task 5: Save Profile Logic + API Route

**Files:**
- Create: `src/features/profile/save-profile.ts`
- Create: `src/app/api/profile/route.ts`

- [ ] **Step 1: Create save profile service**

Create `src/features/profile/save-profile.ts`:

```typescript
import type { ProfileFormInput } from "@/domains/profile/validation";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseLike = { from: (...args: any[]) => any };

export async function saveProfile(
  supabase: SupabaseLike,
  userId: string,
  input: ProfileFormInput,
) {
  const profileCompleted = Boolean(
    input.phone?.trim() && input.city?.trim() && input.state?.trim(),
  );

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: input.full_name || null,
      phone: input.phone || null,
      bio: input.bio || null,
      state: input.state || null,
      city: input.city || null,
      schools: input.schools || null,
      years_experience: input.years_experience,
      academic_background: input.academic_background || null,
      profile_completed: profileCompleted,
    })
    .eq("id", userId);

  if (profileError) {
    throw new Error(profileError.message);
  }

  // Sync profile_subjects: delete all, then re-insert
  // Note: Supabase JS client does not support transactions. If insert fails
  // after delete, the user loses associations. This is acceptable for profile
  // data — the user can simply re-save. A Supabase RPC function wrapping this
  // in a SQL transaction can be added later if needed.
  await supabase.from("profile_subjects").delete().eq("profile_id", userId);

  if (input.subject_ids.length > 0) {
    const { error: subjectsError } = await supabase.from("profile_subjects").insert(
      input.subject_ids.map((subjectId) => ({
        profile_id: userId,
        subject_id: subjectId,
      })),
    );

    if (subjectsError) {
      throw new Error(subjectsError.message);
    }
  }

  // Sync profile_grade_levels: delete all, then re-insert (same caveat as above)
  await supabase.from("profile_grade_levels").delete().eq("profile_id", userId);

  if (input.grade_level_ids.length > 0) {
    const { error: gradeLevelsError } = await supabase.from("profile_grade_levels").insert(
      input.grade_level_ids.map((gradeLevelId) => ({
        profile_id: userId,
        grade_level_id: gradeLevelId,
      })),
    );

    if (gradeLevelsError) {
      throw new Error(gradeLevelsError.message);
    }
  }

  return { profileCompleted };
}
```

- [ ] **Step 2: Create API route**

Create `src/app/api/profile/route.ts`:

```typescript
import { createClient } from "@/gateways/supabase/server";
import { profileFormSchema } from "@/domains/profile/validation";
import { saveProfile } from "@/features/profile/save-profile";
import {
  apiSuccess,
  apiValidationError,
  apiUnauthorized,
  apiInternalError,
} from "@/services/errors/api-response";

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return apiUnauthorized();
  }

  const parsed = profileFormSchema.safeParse(await request.json());

  if (!parsed.success) {
    return apiValidationError(parsed.error);
  }

  try {
    const result = await saveProfile(supabase, user.id, parsed.data);
    return apiSuccess({ profileCompleted: result.profileCompleted });
  } catch (error) {
    return apiInternalError(
      error instanceof Error ? error.message : "Erro ao salvar perfil.",
    );
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/profile/save-profile.ts src/app/api/profile/route.ts
git commit -m "feat: add save profile service and PUT /api/profile route"
```

---

## Task 6: CheckboxGroup Component

**Files:**
- Create: `src/features/profile/components/checkbox-group.tsx`

- [ ] **Step 1: Create CheckboxGroup component**

Create `src/features/profile/components/checkbox-group.tsx`:

```typescript
"use client";

import { cn } from "@/lib/utils";

type CheckboxGroupProps = Readonly<{
  label: string;
  options: { id: string; name: string }[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  emptyMessage?: string;
}>;

export function CheckboxGroup({
  label,
  options,
  selectedIds,
  onChange,
  disabled = false,
  emptyMessage = "Nenhuma opcao disponivel",
}: CheckboxGroupProps) {
  function handleToggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="text-sm font-medium text-text-primary">{label}</legend>
      {options.length === 0 ? (
        <p className="text-sm text-text-muted">{emptyMessage}</p>
      ) : (
        <div className="mt-1 flex flex-wrap gap-2">
          {options.map((option) => {
            const isSelected = selectedIds.includes(option.id);
            return (
              <label
                key={option.id}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors duration-200",
                  isSelected
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-border-default bg-white text-text-secondary hover:border-border-strong",
                  disabled && "cursor-not-allowed opacity-50",
                )}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={disabled}
                  onChange={() => handleToggle(option.id)}
                  className="sr-only"
                />
                {option.name}
              </label>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/profile/components/checkbox-group.tsx
git commit -m "feat: add CheckboxGroup component for profile multi-select"
```

---

## Task 7: Profile Form Client Component

**Files:**
- Create: `src/features/profile/components/profile-form.tsx`

- [ ] **Step 1: Create profile form component**

Create `src/features/profile/components/profile-form.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/design-system/components/button";
import { Input, Textarea } from "@/design-system/components/input";
import { Select } from "@/design-system/components/select";
import { Card, CardHeader, CardTitle, CardDescription } from "@/design-system/components/card";
import { Avatar } from "@/design-system/components/avatar";
import { BRAZILIAN_STATES } from "@/domains/profile/contracts";
import type { FullProfile, SelectOption } from "@/domains/profile/contracts";
import { CheckboxGroup } from "./checkbox-group";

type ProfileFormProps = Readonly<{
  profile: FullProfile;
  subjects: SelectOption[];
  gradeLevels: SelectOption[];
  selectedSubjectIds: string[];
  selectedGradeLevelIds: string[];
}>;

const stateOptions = BRAZILIAN_STATES.map((uf) => ({ value: uf, label: uf }));

export function ProfileForm({
  profile,
  subjects,
  gradeLevels,
  selectedSubjectIds: initialSubjectIds,
  selectedGradeLevelIds: initialGradeLevelIds,
}: ProfileFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [state, setState] = useState(profile.state ?? "");
  const [city, setCity] = useState(profile.city ?? "");
  const [schools, setSchools] = useState(profile.schools ?? "");
  const [yearsExperience, setYearsExperience] = useState(
    profile.years_experience?.toString() ?? "",
  );
  const [academicBackground, setAcademicBackground] = useState(
    profile.academic_background ?? "",
  );
  const [subjectIds, setSubjectIds] = useState<string[]>(initialSubjectIds);
  const [gradeLevelIds, setGradeLevelIds] = useState<string[]>(initialGradeLevelIds);

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone: phone.replace(/\D/g, ""),
          bio: bio.trim(),
          state,
          city: city.trim(),
          schools: schools.trim(),
          years_experience: yearsExperience ? parseInt(yearsExperience, 10) : null,
          academic_background: academicBackground.trim(),
          subject_ids: subjectIds,
          grade_level_ids: gradeLevelIds,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error?.message ?? "Erro ao salvar perfil.");
      }

      toast.success("Perfil salvo com sucesso!");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar perfil.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Card 1: Dados Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle>Dados Pessoais</CardTitle>
          <CardDescription>Informacoes basicas do seu perfil</CardDescription>
        </CardHeader>
        <div className="mt-5 flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <Avatar
              name={profile.full_name ?? "Professor"}
              src={profile.avatar_url ?? undefined}
              size="lg"
            />
            <div className="flex flex-col">
              <p className="text-sm font-medium text-text-primary">
                {profile.full_name ?? "Professor"}
              </p>
              <p className="text-xs text-text-muted">{profile.email}</p>
            </div>
          </div>

          <Input
            label="Nome completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            maxLength={100}
            disabled={isSubmitting}
          />

          <Input
            label="Telefone / WhatsApp"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            placeholder="(11) 99999-9999"
            disabled={isSubmitting}
          />

          <Textarea
            label="Bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={500}
            placeholder="Conte um pouco sobre voce e sua atuacao..."
            disabled={isSubmitting}
            hint={`${bio.length}/500`}
          />
        </div>
      </Card>

      {/* Card 2: Localizacao */}
      <Card>
        <CardHeader>
          <CardTitle>Localizacao</CardTitle>
          <CardDescription>Onde voce atua</CardDescription>
        </CardHeader>
        <div className="mt-5 flex flex-col gap-5">
          <Select
            label="Estado"
            value={state}
            onChange={(e) => setState(e.target.value)}
            options={stateOptions}
            placeholder="Selecione um estado"
            disabled={isSubmitting}
          />

          <Input
            label="Cidade"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            maxLength={100}
            placeholder="Digite sua cidade"
            disabled={isSubmitting}
          />
        </div>
      </Card>

      {/* Card 3: Atuacao Profissional */}
      <Card>
        <CardHeader>
          <CardTitle>Atuacao Profissional</CardTitle>
          <CardDescription>Detalhes sobre sua carreira e atuacao</CardDescription>
        </CardHeader>
        <div className="mt-5 flex flex-col gap-5">
          <Textarea
            label="Escolas onde atua"
            value={schools}
            onChange={(e) => setSchools(e.target.value)}
            maxLength={500}
            placeholder="Informe as escolas onde voce leciona"
            disabled={isSubmitting}
          />

          <CheckboxGroup
            label="Materias que leciona"
            options={subjects}
            selectedIds={subjectIds}
            onChange={setSubjectIds}
            disabled={isSubmitting}
          />

          <CheckboxGroup
            label="Niveis de ensino"
            options={gradeLevels}
            selectedIds={gradeLevelIds}
            onChange={setGradeLevelIds}
            disabled={isSubmitting}
          />

          <Input
            label="Anos de experiencia"
            type="number"
            min={0}
            value={yearsExperience}
            onChange={(e) => setYearsExperience(e.target.value)}
            placeholder="Ex: 5"
            disabled={isSubmitting}
          />

          <Input
            label="Formacao academica"
            value={academicBackground}
            onChange={(e) => setAcademicBackground(e.target.value)}
            maxLength={200}
            placeholder="Ex: Licenciatura em Matematica"
            disabled={isSubmitting}
          />
        </div>
      </Card>

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" variant="primary" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar perfil"}
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/profile/components/profile-form.tsx
git commit -m "feat: add ProfileForm client component"
```

---

## Task 8: Profile Page (Server Component)

**Files:**
- Create: `src/app/(auth)/profile/page.tsx`

- [ ] **Step 1: Create profile page**

Create `src/app/(auth)/profile/page.tsx`:

```typescript
import { redirect } from "next/navigation";
import { TeacherShell } from "@/app-shell/authenticated/teacher-shell";
import { createClient } from "@/gateways/supabase/server";
import { getFullProfile } from "@/features/profile/get-full-profile";
import { ProfileForm } from "@/features/profile/components/profile-form";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const data = await getFullProfile(supabase, user.id);

  if (!data) {
    redirect("/login?error=missing_profile");
  }

  return (
    <TeacherShell
      title="Meu Perfil"
      description="Atualize suas informacoes pessoais e profissionais."
      breadcrumbs={[
        { label: "Inicio", href: "/dashboard" },
        { label: "Meu Perfil", href: "/profile" },
      ]}
    >
      <ProfileForm
        profile={data.profile}
        subjects={data.subjects}
        gradeLevels={data.gradeLevels}
        selectedSubjectIds={data.selectedSubjectIds}
        selectedGradeLevelIds={data.selectedGradeLevelIds}
      />
    </TeacherShell>
  );
}
```

- [ ] **Step 2: Create loading skeleton**

Create `src/app/(auth)/profile/loading.tsx`:

```typescript
import { TeacherShell } from "@/app-shell/authenticated/teacher-shell";
import { Card } from "@/design-system/components/card";
import { Skeleton } from "@/design-system/components/skeleton";

export default function ProfileLoading() {
  return (
    <TeacherShell
      title="Meu Perfil"
      description="Atualize suas informacoes pessoais e profissionais."
      breadcrumbs={[
        { label: "Inicio", href: "/dashboard" },
        { label: "Meu Perfil", href: "/profile" },
      ]}
    >
      <div className="flex flex-col gap-6">
        <Card>
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex flex-col gap-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </Card>
        <Card>
          <div className="flex flex-col gap-5">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>
        <Card>
          <div className="flex flex-col gap-5">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>
      </div>
    </TeacherShell>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(auth)/profile/page.tsx src/app/(auth)/profile/loading.tsx
git commit -m "feat: add profile page server component with loading skeleton"
```

---

## Task 9: Profile Completion Banner on Dashboard

**Files:**
- Create: `src/features/profile/components/profile-completion-banner.tsx`
- Modify: `src/app/(auth)/dashboard/page.tsx`

- [ ] **Step 1: Create ProfileCompletionBanner component**

Create `src/features/profile/components/profile-completion-banner.tsx`:

```typescript
import Link from "next/link";

export function ProfileCompletionBanner() {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-brand-200 bg-brand-50 px-5 py-3">
      <p className="text-sm font-medium text-brand-800">
        Complete seu perfil para uma experiencia personalizada.
      </p>
      <Link
        href="/profile"
        className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
      >
        Completar perfil →
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Add banner to dashboard page**

Modify `src/app/(auth)/dashboard/page.tsx` — add the banner inside the `<TeacherShell>`, before the existing content grid:

Import at the top:
```typescript
import { ProfileCompletionBanner } from "@/features/profile/components/profile-completion-banner";
```

Inside the component, after `profileResult` check, check `profile_completed`:

```typescript
const showProfileBanner = !profileResult.profile.profile_completed;
```

Then in the JSX, before the `<div className="grid gap-6">`:

```tsx
{showProfileBanner ? <ProfileCompletionBanner /> : null}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/profile/components/profile-completion-banner.tsx src/app/(auth)/dashboard/page.tsx
git commit -m "feat: add profile completion banner to dashboard"
```

---

## Task 10: UserDropdown in Header

**Files:**
- Modify: `src/app-shell/authenticated/teacher-shell.tsx`

- [ ] **Step 1: Add UserDropdown to TeacherShell**

This task adds a simple avatar button in the mobile top bar and desktop header area that links to `/profile`. For a full dropdown with click-outside behavior, we keep it minimal: a link-based approach rather than a complex dropdown to avoid over-engineering.

Modify `src/app-shell/authenticated/teacher-shell.tsx`:

Add a `user` prop to `TeacherShellProps`:

```typescript
type TeacherShellProps = Readonly<{
  // ... existing props
  user?: { name: string; avatarUrl?: string };
}>;
```

In the mobile top bar (`lg:hidden` div), add after the nav icons:

```tsx
{user ? (
  <Link href="/profile" aria-label="Meu Perfil">
    <Avatar name={user.name} src={user.avatarUrl} size="sm" />
  </Link>
) : null}
```

Import Avatar at the top:
```typescript
import { Avatar } from "@/design-system/components/avatar";
```

**Note:** The desktop sidebar already has the "Perfil" link in the footer section. For the desktop header, the `PageHeader` serves as the main header content. Adding an avatar to the top-right of the main content area can be done in a future iteration when a full dropdown menu is needed.

- [ ] **Step 2: Pass user prop from pages that use TeacherShell**

Update `src/app/(auth)/dashboard/page.tsx` and `src/app/(auth)/profile/page.tsx` to pass the `user` prop:

```tsx
<TeacherShell
  // ... existing props
  user={{
    name: profileResult.profile.full_name ?? "Professor",
    avatarUrl: undefined, // avatar_url not in ProfileRecord yet
  }}
>
```

For the profile page:
```tsx
<TeacherShell
  // ... existing props
  user={{
    name: data.profile.full_name ?? "Professor",
    avatarUrl: data.profile.avatar_url ?? undefined,
  }}
>
```

- [ ] **Step 3: Commit**

```bash
git add src/app-shell/authenticated/teacher-shell.tsx src/app/(auth)/dashboard/page.tsx src/app/(auth)/profile/page.tsx
git commit -m "feat: add user avatar to mobile header with link to profile"
```

---

## Task 11: Manual Smoke Test

- [ ] **Step 1: Start dev server**

Run: `npm run dev`

- [ ] **Step 2: Test profile page**

1. Log in as a teacher
2. Verify the "Complete seu perfil" banner appears on the dashboard
3. Click the banner link — should navigate to `/profile`
4. Verify all 3 cards render with correct fields
5. Fill in phone, city, and state
6. Add subjects and grade levels via checkboxes
7. Click "Salvar perfil"
8. Verify toast "Perfil salvo com sucesso!" appears
9. Navigate back to dashboard — banner should be gone
10. Navigate to `/profile` again — data should be persisted

- [ ] **Step 3: Test sidebar and mobile**

1. Click "Perfil" in the sidebar footer — should navigate to `/profile`
2. Resize to mobile — verify avatar appears in top bar
3. Click avatar — should navigate to `/profile`

- [ ] **Step 4: Test edge cases**

1. Submit with no fields filled — should save without errors (all optional)
2. Try years_experience with negative number — input `min=0` should prevent
3. Verify bio character counter updates as you type
