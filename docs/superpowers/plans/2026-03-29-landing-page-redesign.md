# Landing Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the PrismaV4 design system from emerald/terminal aesthetic to indigo/terracotta institutional identity, and redesign all landing page sections accordingly.

**Architecture:** Bottom-up approach — update foundational tokens first, then design system components, then landing page sections. Each task produces a working, testable state. The login page and hero are updated BEFORE terminal components are deleted, to avoid broken imports.

**Important side effect:** Changing `--font-display` and `--color-brand-*` tokens is global. Internal pages (dashboard, admin, exams) will visually shift from emerald/serif to indigo/sans-serif. This is an unavoidable consequence of the token migration. The spec scopes the redesign to the landing page, but token changes are foundational and affect everything. Internal pages will still function correctly — only colors and fonts change.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4 (@theme), TypeScript 5.9, Vitest + Testing Library, Satoshi font (self-hosted via next/font/local), Lucide React icons.

**Spec:** `docs/superpowers/specs/2026-03-29-landing-page-redesign-design.md`

---

## File Map

### Files to Modify

| File | Responsibility | Tasks |
|------|---------------|-------|
| `src/app/globals.css` | Design tokens (CSS custom properties), animations, utilities | 1 |
| `src/design-system/tokens.ts` | TypeScript mirror of design tokens | 1 |
| `src/app/layout.tsx` | Font loading (Literata+Source Sans → Satoshi) | 2 |
| `src/design-system/components/button.tsx` | Button component variants/colors | 3 |
| `src/design-system/components/card.tsx` | Card component — remove terminal/glass variants | 3 |
| `src/design-system/components/badge.tsx` | Badge component — remove terminal, add accent | 3 |
| `src/design-system/components/logo.tsx` | Logo — update colors, add mono variant | 3 |
| `src/design-system/components/input.tsx` | Input/Textarea — update focus ring colors | 3 |
| `src/design-system/components/stat-card.tsx` | StatCard — update brand colors | 3 |
| `src/design-system/components/surface.tsx` | Surface — remove terminal/glass variants, add dark | 3 |
| `src/design-system/components/avatar.tsx` | Avatar — update brand colors | 3 |
| `src/features/public-experience/components/public-navbar.tsx` | Navbar redesign | 4 |
| `src/features/public-experience/components/public-hero.tsx` | Hero redesign (terminal → BrowserFrame) | 5 |
| `src/features/public-experience/components/trust-strip.tsx` | TrustStrip redesign | 6 |
| `src/features/public-experience/components/flow-section.tsx` | FlowSection redesign | 7 |
| `src/features/public-experience/components/benefits-section.tsx` | BenefitsSection redesign | 8 |
| `src/features/public-experience/components/public-faq.tsx` | Testimonials redesign | 9 |
| `src/features/public-experience/components/final-cta.tsx` | FinalCTA redesign | 10 |
| `src/features/public-experience/components/public-footer.tsx` | Footer redesign | 11 |
| `src/app/(public)/login/page.tsx` | Login page — remove terminal, update to indigo | 12 |
| `src/design-system/index.ts` | Remove TerminalBlock/TerminalLine exports | 13 |
| `src/app-shell/authenticated/teacher-shell.tsx` | Fix shadow-glow reference | 13 |
| `src/app-shell/admin/admin-shell.tsx` | Fix shadow-glow reference | 13 |
| `src/features/exams/results/components/question-result.tsx` | Fix shadow-glow reference | 13 |
| `src/test/features/public-experience/public-landing.test.tsx` | Update test assertions | 14 |
| `src/test/features/public-experience/public-home-page.test.tsx` | Update test assertions | 14 |
| `src/test/features/public-experience/public-landing.a11y.test.tsx` | Update test assertions | 14 |

### Files to Create

| File | Responsibility | Tasks |
|------|---------------|-------|
| `public/fonts/satoshi/Satoshi-Variable.woff2` | Self-hosted Satoshi font file (regular) | 2 |
| `public/fonts/satoshi/Satoshi-VariableItalic.woff2` | Self-hosted Satoshi font file (italic) | 2 |
| `src/design-system/components/browser-frame.tsx` | BrowserFrame component | 3 |

### Files to Delete

| File | Reason | Tasks |
|------|--------|-------|
| `src/design-system/components/terminal-block.tsx` | No longer used in new identity | 13 |

---

## Tasks

### Task 1: Update Design Tokens

**Files:**
- Modify: `src/app/globals.css` (full rewrite of @theme block, animations, utilities)
- Modify: `src/design-system/tokens.ts` (full rewrite)

- [ ] **Step 1: Rewrite globals.css @theme block with new indigo/terracotta palette**

Replace the entire `@theme { ... }` block in `src/app/globals.css` with:

```css
@theme {
  /* ── Brand Colors (Indigo) ── */
  --color-brand-50: #EEF2FF;
  --color-brand-100: #E0E7FF;
  --color-brand-200: #C7D2FE;
  --color-brand-300: #A5B4FC;
  --color-brand-400: #818CF8;
  --color-brand-500: #6366F1;
  --color-brand-600: #4F46E5;
  --color-brand-700: #4338CA;
  --color-brand-800: #3730A3;
  --color-brand-900: #312E81;
  --color-brand-950: #1E1B4B;

  /* ── Accent Colors (Terracotta) ── */
  --color-accent-50: #FDF4EE;
  --color-accent-100: #FCE6D4;
  --color-accent-200: #F8C9A3;
  --color-accent-300: #F3A76D;
  --color-accent-400: #E8893D;
  --color-accent-500: #C2703E;
  --color-accent-600: #A65A30;
  --color-accent-700: #8A4626;

  /* ── Semantic Surface Colors ── */
  --color-canvas: #FAFAFA;
  --color-surface: #FFFFFF;
  --color-surface-muted: #F5F5F5;
  --color-surface-raised: #FEFEFE;
  --color-surface-overlay: rgba(255, 255, 255, 0.92);
  --color-surface-dark: #312E81;
  --color-surface-dark-soft: #3730A3;

  /* ── Semantic Text Colors ── */
  --color-text-primary: #111827;
  --color-text-secondary: #4B5563;
  --color-text-muted: #9CA3AF;
  --color-text-inverse: #F9FAFB;
  --color-text-brand: #4F46E5;

  /* ── Semantic Border Colors ── */
  --color-border-default: #E5E7EB;
  --color-border-muted: #F3F4F6;
  --color-border-strong: #D1D5DB;
  --color-border-brand: rgba(79, 70, 229, 0.2);

  /* ── State Colors ── */
  --color-success: #059669;
  --color-warning: #D97706;
  --color-danger: #DC2626;
  --color-info: #4F46E5;

  /* ── Font Families ── */
  --font-display: var(--font-satoshi), system-ui, sans-serif;
  --font-body: var(--font-satoshi), system-ui, sans-serif;
  --font-code: var(--font-mono), "Courier New", monospace;

  /* ── Shadows ── */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-soft: 0 2px 8px rgba(0, 0, 0, 0.05);
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-elevated: 0 4px 16px rgba(0, 0, 0, 0.07), 0 1px 4px rgba(0, 0, 0, 0.04);
  --shadow-modal: 0 12px 40px rgba(0, 0, 0, 0.1), 0 4px 12px rgba(0, 0, 0, 0.05);

  /* ── Border Radius ── */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.25rem;
  --radius-pill: 9999px;

  /* ── Animations ── */
  --animate-fade-in: fade-in 0.5s ease-out;
  --animate-slide-up: slide-up 0.5s ease-out;
  --animate-slide-down: slide-down 0.3s ease-out;
  --animate-scale-in: scale-in 0.2s ease-out;
}
```

- [ ] **Step 2: Remove terminal keyframes, keep only fade-in/slide-up/slide-down/scale-in**

Remove the `pulse-glow` and `terminal-blink` `@keyframes` blocks. Keep `fade-in`, `slide-up`, `slide-down`, `scale-in`.

- [ ] **Step 3: Remove terminal/glass utilities, keep container utilities**

Remove `@utility text-glow`, `@utility bg-glass`, `@utility bg-glass-dark`. Keep all `@utility container-*` blocks unchanged.

- [ ] **Step 4: Update ::selection colors**

Change `::selection` to use new brand colors:
```css
::selection {
  background: var(--color-brand-200);
  color: var(--color-brand-900);
}
```

- [ ] **Step 5: Update :focus-visible**

```css
:focus-visible {
  outline: 2px solid var(--color-brand-500);
  outline-offset: 2px;
}
```

- [ ] **Step 6: Rewrite tokens.ts to match new globals.css**

Replace entire content of `src/design-system/tokens.ts` with:

```typescript
/**
 * Prisma Design Tokens
 *
 * Single source of truth for design decisions.
 * These mirror the CSS custom properties defined in globals.css
 * and are used when TypeScript access to token values is needed.
 */

export const colors = {
  brand: {
    50: "#EEF2FF",
    100: "#E0E7FF",
    200: "#C7D2FE",
    300: "#A5B4FC",
    400: "#818CF8",
    500: "#6366F1",
    600: "#4F46E5",
    700: "#4338CA",
    800: "#3730A3",
    900: "#312E81",
    950: "#1E1B4B",
  },
  accent: {
    50: "#FDF4EE",
    100: "#FCE6D4",
    200: "#F8C9A3",
    300: "#F3A76D",
    400: "#E8893D",
    500: "#C2703E",
    600: "#A65A30",
    700: "#8A4626",
  },
  surface: {
    canvas: "#FAFAFA",
    default: "#FFFFFF",
    muted: "#F5F5F5",
    raised: "#FEFEFE",
    dark: "#312E81",
    darkSoft: "#3730A3",
  },
  text: {
    primary: "#111827",
    secondary: "#4B5563",
    muted: "#9CA3AF",
    inverse: "#F9FAFB",
    brand: "#4F46E5",
  },
  border: {
    default: "#E5E7EB",
    muted: "#F3F4F6",
    strong: "#D1D5DB",
    brand: "rgba(79, 70, 229, 0.2)",
  },
  state: {
    success: "#059669",
    warning: "#D97706",
    danger: "#DC2626",
    info: "#4F46E5",
  },
} as const;

export const typography = {
  family: {
    display: "var(--font-display)",
    body: "var(--font-body)",
    code: "var(--font-code)",
  },
  size: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
    "5xl": "3rem",
    "6xl": "3.75rem",
  },
} as const;

export const layout = {
  container: {
    narrow: "64rem",
    page: "80rem",
    wide: "90rem",
  },
  radius: {
    sm: "0.375rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
    "2xl": "1.25rem",
    pill: "9999px",
  },
} as const;
```

- [ ] **Step 7: Run typecheck to verify tokens.ts compiles**

Run: `npx tsc --noEmit`
Expected: No errors related to tokens.ts. Other pre-existing errors may appear — ignore those.

- [ ] **Step 8: Commit**

```bash
git add src/app/globals.css src/design-system/tokens.ts
git commit -m "refactor: migrate design tokens to indigo/terracotta palette"
```

---

### Task 2: Setup Satoshi Font

**Files:**
- Create: `public/fonts/satoshi/Satoshi-Variable.woff2`
- Create: `public/fonts/satoshi/Satoshi-VariableItalic.woff2`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Download Satoshi font files**

Download the Satoshi variable font `.woff2` files from Fontshare (https://www.fontshare.com/fonts/satoshi). Place them in `public/fonts/satoshi/`:
- `Satoshi-Variable.woff2` (weights 300-900)
- `Satoshi-VariableItalic.woff2` (italic weights 300-900)

If downloading via CLI is not possible, create the directory and add a placeholder README noting the font source. The actual `.woff2` files must be obtained from Fontshare.

```bash
mkdir -p public/fonts/satoshi
```

- [ ] **Step 2: Update layout.tsx to use Satoshi via next/font/local**

Replace the full content of `src/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
import { IBM_Plex_Mono } from "next/font/google";
import { Providers } from "@/app/providers";
import "@/app/globals.css";

const satoshi = localFont({
  src: [
    {
      path: "../../public/fonts/satoshi/Satoshi-Variable.woff2",
      style: "normal",
    },
    {
      path: "../../public/fonts/satoshi/Satoshi-VariableItalic.woff2",
      style: "italic",
    },
  ],
  variable: "--font-satoshi",
  display: "swap",
});

const interfaceMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Adapte Minha Prova",
  description:
    "Adapte avaliações para estudantes com necessidades educacionais específicas em minutos.",
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="pt-BR"
      className={`${satoshi.variable} ${interfaceMono.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify the app builds without font errors**

Run: `npx next build 2>&1 | head -30`
Expected: Build starts without "font not found" errors. If font files are missing, the build will warn — that is expected until the actual .woff2 files are placed.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx public/fonts/satoshi/
git commit -m "feat: replace Literata + Source Sans 3 with self-hosted Satoshi font"
```

---

### Task 3: Update Design System Components

**Files:**
- Modify: `src/design-system/components/button.tsx`
- Modify: `src/design-system/components/card.tsx`
- Modify: `src/design-system/components/badge.tsx`
- Modify: `src/design-system/components/logo.tsx`
- Modify: `src/design-system/components/input.tsx`
- Modify: `src/design-system/components/stat-card.tsx`
- Modify: `src/design-system/components/surface.tsx`
- Modify: `src/design-system/components/avatar.tsx`

- [ ] **Step 1: Update Button variants**

In `src/design-system/components/button.tsx`, replace the `variantClasses` object:

```typescript
const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 shadow-soft hover:shadow-elevated active:bg-brand-800 border-transparent",
  secondary:
    "bg-brand-50 text-brand-600 hover:bg-brand-100 border-brand-200 active:bg-brand-200",
  outline:
    "bg-transparent text-brand-600 hover:bg-brand-50 border-brand-200 active:bg-brand-100",
  ghost:
    "bg-transparent text-text-secondary hover:bg-brand-50 hover:text-brand-600 border-transparent active:bg-brand-100",
  danger:
    "bg-danger text-white hover:bg-red-700 border-transparent shadow-soft active:bg-red-800",
  accent:
    "bg-accent-500 text-white hover:bg-accent-400 border-transparent shadow-soft active:bg-accent-600",
};
```

- [ ] **Step 2: Update Card — remove terminal/glass variants**

In `src/design-system/components/card.tsx`:

Change the type:
```typescript
type CardVariant = "default" | "muted" | "outlined";
```

Replace `variantClasses`:
```typescript
const variantClasses: Record<CardVariant, string> = {
  default: "bg-surface border-border-default shadow-card",
  muted: "bg-surface-muted border-border-muted",
  outlined: "bg-transparent border-border-strong",
};
```

- [ ] **Step 3: Update Badge — remove terminal, add accent**

In `src/design-system/components/badge.tsx`:

Change the type:
```typescript
type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "outline" | "accent";
```

Replace `variantClasses`:
```typescript
const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-brand-100 text-brand-800 border-brand-200",
  success: "bg-emerald-100 text-emerald-800 border-emerald-200",
  warning: "bg-amber-100 text-amber-800 border-amber-200",
  danger: "bg-red-100 text-red-800 border-red-200",
  info: "bg-brand-100 text-brand-700 border-brand-200",
  outline: "bg-transparent text-text-secondary border-border-strong",
  accent: "bg-accent-50 text-accent-700 border-accent-200",
};
```

- [ ] **Step 4: Update Logo — indigo colors + mono variant**

Replace the full content of `src/design-system/components/logo.tsx`:

```tsx
import { cn } from "@/lib/utils";

type LogoProps = Readonly<{
  size?: "sm" | "md" | "lg";
  variant?: "full" | "mark" | "text" | "mono";
  className?: string;
}>;

const sizeConfig = {
  sm: { mark: "w-7 h-7 text-xs", text: "text-lg", tagline: "text-[0.6rem]" },
  md: { mark: "w-9 h-9 text-sm", text: "text-xl", tagline: "text-[0.65rem]" },
  lg: { mark: "w-11 h-11 text-base", text: "text-2xl", tagline: "text-xs" },
};

function PrismaMark({ className, mono = false }: { className?: string; mono?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-bold",
        mono ? "bg-white text-brand-900" : "bg-brand-600 text-white",
        className,
      )}
      aria-hidden="true"
    >
      A
    </span>
  );
}

export function Logo({ size = "md", variant = "full", className }: LogoProps) {
  const config = sizeConfig[size];
  const isMono = variant === "mono";

  if (variant === "mark") {
    return <PrismaMark className={cn(config.mark, className)} />;
  }

  if (variant === "text") {
    return (
      <span className={cn("font-bold tracking-tight text-text-primary", config.text, className)}>
        Adapte <span className="text-brand-600">Minha Prova</span>
      </span>
    );
  }

  if (isMono) {
    return (
      <div className={cn("flex items-center gap-2.5", className)}>
        <PrismaMark className={config.mark} mono />
        <div className="flex flex-col">
          <span className={cn("font-bold tracking-tight leading-none text-white", config.text)}>
            Adapte <span className="text-brand-200">Minha Prova</span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <PrismaMark className={config.mark} />
      <div className="flex flex-col">
        <span className={cn("font-bold tracking-tight leading-none text-text-primary", config.text)}>
          Adapte <span className="text-brand-600">Minha Prova</span>
        </span>
        <span className={cn("font-medium tracking-widest uppercase text-text-muted", config.tagline)}>
          Plataforma educacional com IA
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Update Input/Textarea focus ring to indigo**

In `src/design-system/components/input.tsx`, the focus classes already use `focus:ring-brand-500/30 focus:border-brand-500` — since brand is now indigo, no code change is needed. The CSS tokens do the work. Verify by visual inspection.

- [ ] **Step 6: Update StatCard colors**

In `src/design-system/components/stat-card.tsx`, the existing classes already reference `brand-500` and `brand-600` semantic tokens. Since the tokens are now indigo, no code change is needed. Verify by visual inspection.

- [ ] **Step 7: Update Surface — remove terminal/glass, add dark**

Replace the full content of `src/design-system/components/surface.tsx`:

```tsx
import { cn } from "@/lib/utils";

type SurfaceVariant = "default" | "muted" | "raised" | "dark";

type NamedPadding = "none" | "sm" | "md" | "lg";

type SurfaceProps = Readonly<{
  variant?: SurfaceVariant;
  padding?: NamedPadding | (string & {});
  tone?: "default" | "muted" | "hero";
  className?: string;
  children: React.ReactNode;
}>;

const variantClasses: Record<SurfaceVariant, string> = {
  default: "bg-surface border-border-default shadow-card",
  muted: "bg-surface-muted border-border-muted",
  raised: "bg-surface-raised border-border-default shadow-elevated",
  dark: "bg-surface-dark border-brand-800 text-text-inverse",
};

const paddingMap: Record<NamedPadding, string> = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

function isNamedPadding(p: string): p is NamedPadding {
  return p in paddingMap;
}

export function Surface({
  variant = "default",
  padding = "md",
  tone,
  className,
  children,
}: SurfaceProps) {
  const resolvedVariant = tone === "hero" ? "raised" : tone === "muted" ? "muted" : variant;
  const paddingClass = isNamedPadding(padding) ? paddingMap[padding] : undefined;
  const paddingStyle = isNamedPadding(padding) ? undefined : { padding };

  return (
    <section
      className={cn(
        "rounded-2xl border",
        variantClasses[resolvedVariant],
        paddingClass,
        className,
      )}
      style={paddingStyle}
    >
      {children}
    </section>
  );
}
```

- [ ] **Step 8: Update Avatar colors**

In `src/design-system/components/avatar.tsx`, replace the brand color classes in the main div:

Change `bg-brand-100 font-semibold text-brand-700` to `bg-brand-50 font-semibold text-brand-600`.

- [ ] **Step 9: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No new type errors from these changes.

- [ ] **Step 10: Commit**

```bash
git add src/design-system/components/button.tsx src/design-system/components/card.tsx src/design-system/components/badge.tsx src/design-system/components/logo.tsx src/design-system/components/input.tsx src/design-system/components/stat-card.tsx src/design-system/components/surface.tsx src/design-system/components/avatar.tsx
git commit -m "refactor: update design system components to indigo/terracotta identity"
```

---

### Task 4: Create BrowserFrame Component

**Files:**
- Create: `src/design-system/components/browser-frame.tsx`
- Modify: `src/design-system/index.ts` (add export)

- [ ] **Step 1: Create browser-frame.tsx**

Create `src/design-system/components/browser-frame.tsx`:

```tsx
import { cn } from "@/lib/utils";

type BrowserFrameProps = Readonly<{
  url?: string;
  className?: string;
  children: React.ReactNode;
}>;

export function BrowserFrame({ url = "adapteminhaprova.com.br", className, children }: BrowserFrameProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border-default bg-surface shadow-elevated",
        className,
      )}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-border-default bg-surface-muted px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-400" aria-hidden="true" />
          <span className="h-3 w-3 rounded-full bg-amber-400" aria-hidden="true" />
          <span className="h-3 w-3 rounded-full bg-green-400" aria-hidden="true" />
        </div>
        <div className="ml-2 flex-1 rounded-md bg-white px-3 py-1">
          <span className="text-xs text-text-muted">{url}</span>
        </div>
      </div>
      {/* Content */}
      <div className="bg-white">
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Export BrowserFrame from index.ts**

In `src/design-system/index.ts`, add after the Avatar export:

```typescript
export { BrowserFrame } from "./components/browser-frame";
```

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/design-system/components/browser-frame.tsx src/design-system/index.ts
git commit -m "feat: add BrowserFrame component for product mockups"
```

---

### Task 5: Redesign PublicNavbar

**Files:**
- Modify: `src/features/public-experience/components/public-navbar.tsx`

- [ ] **Step 1: Rewrite PublicNavbar**

Replace the full content of `src/features/public-experience/components/public-navbar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { Logo } from "@/design-system/components/logo";
import { Button } from "@/design-system/components/button";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

const navLinks = [
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Recursos", href: "#recursos" },
  { label: "Depoimentos", href: "#depoimentos" },
];

export function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 0);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-border-default bg-white transition-shadow",
        scrolled && "shadow-xs",
      )}
    >
      <nav className="container-page flex h-16 items-center justify-between" aria-label="Navegação principal">
        <Link href="/" className="shrink-0">
          <Logo size="sm" variant="full" />
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-text-secondary transition-colors duration-150 hover:text-brand-600"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login">
            <Button variant="ghost" size="sm">Entrar</Button>
          </Link>
          <Link href="/login">
            <Button variant="primary" size="sm" className="rounded-full">Comece agora</Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-brand-600 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open ? (
        <div className="border-t border-border-default bg-white px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-xl px-3 py-2 text-sm font-medium text-text-secondary hover:bg-brand-50 hover:text-brand-600"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <Link href="/login">
                <Button variant="ghost" size="md" fullWidth>Entrar</Button>
              </Link>
              <Link href="/login">
                <Button variant="primary" size="md" fullWidth className="rounded-full">Comece agora</Button>
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/public-experience/components/public-navbar.tsx
git commit -m "refactor: redesign PublicNavbar with indigo institutional style"
```

---

### Task 6: Redesign PublicHero

**Files:**
- Modify: `src/features/public-experience/components/public-hero.tsx`

- [ ] **Step 1: Rewrite PublicHero**

Replace the full content of `src/features/public-experience/components/public-hero.tsx`:

```tsx
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/design-system/components/button";
import { BrowserFrame } from "@/design-system/components/browser-frame";

export function PublicHero() {
  return (
    <section className="bg-canvas">
      <div className="container-page grid gap-16 py-12 lg:grid-cols-2 lg:items-center lg:py-20">
        {/* Left: Copy */}
        <div className="flex flex-col gap-6">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-text-primary sm:text-4xl lg:text-5xl">
            Adapte avaliações em minutos, não horas.
          </h1>
          <p className="max-w-[540px] text-lg leading-relaxed text-text-secondary">
            O Adapte Minha Prova usa inteligência artificial para adaptar provas e avaliações
            para estudantes com necessidades educacionais específicas — mantendo o rigor
            pedagógico que você exige.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/login">
              <Button variant="primary" size="lg" className="rounded-full px-8">
                Comece agora
              </Button>
            </Link>
            <a href="#como-funciona">
              <Button variant="outline" size="lg">
                Ver como funciona
              </Button>
            </a>
          </div>
        </div>

        {/* Right: Product mockup */}
        <div className="flex justify-center lg:justify-end">
          <BrowserFrame className="w-full max-w-lg animate-fade-in [transform:perspective(1200px)_rotateY(-2deg)]">
            <Image
              src="/images/product-screenshot.png"
              alt="Tela do Adapte Minha Prova mostrando o resultado de uma adaptação"
              width={800}
              height={500}
              className="w-full"
              priority
            />
          </BrowserFrame>
        </div>
      </div>
    </section>
  );
}
```

Note: A real screenshot image must be placed at `public/images/product-screenshot.png`. Until then, you can use a placeholder div inside BrowserFrame:

```tsx
<div className="flex h-64 items-center justify-center bg-surface-muted text-text-muted text-sm">
  Screenshot do produto (placeholder)
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/features/public-experience/components/public-hero.tsx
git commit -m "refactor: redesign PublicHero with BrowserFrame mockup and light background"
```

---

### Task 7: Redesign TrustStrip

**Files:**
- Modify: `src/features/public-experience/components/trust-strip.tsx`

- [ ] **Step 1: Rewrite TrustStrip**

Replace the full content of `src/features/public-experience/components/trust-strip.tsx`:

```tsx
const stats = [
  { value: "+2.500", label: "Professores ativos" },
  { value: "15.000+", label: "Provas adaptadas" },
  { value: "85%", label: "Tempo economizado" },
];

export function TrustStrip() {
  return (
    <section className="bg-surface-muted py-10">
      <div className="container-page flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-0">
        {stats.map((stat, i) => (
          <div key={stat.label} className="flex flex-col items-center gap-1 sm:flex-1">
            {i > 0 && (
              <div className="hidden h-12 w-px bg-border-default sm:block absolute" />
            )}
            <span className="text-4xl font-bold tracking-tight text-brand-600">
              {stat.value}
            </span>
            <span className="text-sm text-text-secondary">{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
```

Note: The separator approach above uses absolute positioning which requires relative parent. A cleaner approach with proper separators:

```tsx
const stats = [
  { value: "+2.500", label: "Professores ativos" },
  { value: "15.000+", label: "Provas adaptadas" },
  { value: "85%", label: "Tempo economizado" },
];

export function TrustStrip() {
  return (
    <section className="bg-surface-muted py-10">
      <div className="container-page">
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-center sm:divide-x sm:divide-border-default sm:gap-0">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1 sm:px-12">
              <span className="text-4xl font-bold tracking-tight text-brand-600">
                {stat.value}
              </span>
              <span className="text-sm text-text-secondary">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

Use this second version (with `divide-x`).

- [ ] **Step 2: Commit**

```bash
git add src/features/public-experience/components/trust-strip.tsx
git commit -m "refactor: redesign TrustStrip with clean stat numbers and dividers"
```

---

### Task 8: Redesign FlowSection

**Files:**
- Modify: `src/features/public-experience/components/flow-section.tsx`

- [ ] **Step 1: Rewrite FlowSection**

Replace the full content of `src/features/public-experience/components/flow-section.tsx`:

```tsx
import { Upload, Cpu, ClipboardCheck } from "lucide-react";

const steps = [
  {
    number: "1",
    icon: Upload,
    title: "Envie sua prova",
    description:
      "Faça upload do PDF da avaliação e selecione as necessidades educacionais dos seus alunos.",
  },
  {
    number: "2",
    icon: Cpu,
    title: "IA adapta as questões",
    description:
      "A inteligência artificial analisa cada questão e gera versões adaptadas preservando os objetivos pedagógicos.",
  },
  {
    number: "3",
    icon: ClipboardCheck,
    title: "Revise e copie",
    description:
      "Revise as adaptações sugeridas, ajuste conforme necessário e exporte o resultado.",
  },
];

export function FlowSection() {
  return (
    <section id="como-funciona" className="bg-white py-20">
      <div className="container-page">
        <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-text-primary">
          Como funciona
        </h2>

        <div className="relative grid gap-8 md:grid-cols-3">
          {/* Dashed connector line (desktop only) */}
          <div
            className="absolute left-[calc(16.67%+20px)] right-[calc(16.67%+20px)] top-5 hidden h-px border-t border-dashed border-border-default md:block"
            aria-hidden="true"
          />

          {steps.map((step) => (
            <div key={step.number} className="flex flex-col items-center text-center">
              {/* Number circle */}
              <div className="relative z-10 mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                {step.number}
              </div>

              {/* Card */}
              <div className="rounded-xl border border-border-default bg-white p-6 shadow-xs">
                <step.icon className="mx-auto mb-3 h-6 w-6 text-brand-500" />
                <h3 className="mb-2 text-lg font-semibold text-text-primary">{step.title}</h3>
                <p className="text-sm leading-relaxed text-text-secondary">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/public-experience/components/flow-section.tsx
git commit -m "refactor: redesign FlowSection with numbered steps and connector line"
```

---

### Task 9: Redesign BenefitsSection

**Files:**
- Modify: `src/features/public-experience/components/benefits-section.tsx`

- [ ] **Step 1: Rewrite BenefitsSection**

Replace the full content of `src/features/public-experience/components/benefits-section.tsx`:

```tsx
import { Timer, ShieldCheck, Layers, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Timer,
    title: "Economia de tempo",
    description: "Reduza de horas para minutos o tempo gasto adaptando avaliações. Mais tempo para o que importa: ensinar.",
    highlight: true,
  },
  {
    icon: ShieldCheck,
    title: "Rigor pedagógico",
    description: "As adaptações mantêm os objetivos de aprendizagem, competências e habilidades da avaliação original.",
    highlight: false,
  },
  {
    icon: Layers,
    title: "Múltiplas necessidades",
    description: "TDAH, Dislexia, TEA, Deficiência Visual e mais — gere adaptações específicas para cada necessidade.",
    highlight: false,
  },
  {
    icon: UserCheck,
    title: "Revisão humana",
    description: "A IA sugere, mas a decisão final é sempre sua. Revise, ajuste e aprove cada adaptação antes de usar.",
    highlight: false,
  },
];

export function BenefitsSection() {
  return (
    <section id="recursos" className="bg-surface-muted py-20">
      <div className="container-page">
        <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-text-primary">
          Por que escolher o Prisma
        </h2>

        <div className="grid gap-6 sm:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className={cn(
                "rounded-xl border border-border-default bg-white p-8 shadow-soft transition-shadow duration-200 hover:shadow-card",
                feature.highlight && "border-l-[3px] border-l-accent-500",
              )}
            >
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-50">
                  <feature.icon className="h-7 w-7 text-brand-600" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-base font-semibold text-text-primary">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-text-secondary">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/public-experience/components/benefits-section.tsx
git commit -m "refactor: redesign BenefitsSection with terracotta accent on primary card"
```

---

### Task 10: Redesign Testimonials (PublicFaq)

**Files:**
- Modify: `src/features/public-experience/components/public-faq.tsx`

- [ ] **Step 1: Rewrite PublicFaq as Testimonials**

Replace the full content of `src/features/public-experience/components/public-faq.tsx`:

```tsx
const testimonials = [
  {
    name: "Maria Silva",
    role: "Professora de Matemática",
    school: "Escola Municipal São Paulo",
    quote: "Antes eu gastava um fim de semana inteiro adaptando provas. Com o Prisma, faço em 20 minutos e com mais qualidade.",
  },
  {
    name: "Carlos Oliveira",
    role: "Coordenador Pedagógico",
    school: "Colégio Estadual Rio de Janeiro",
    quote: "A plataforma entende as necessidades de cada aluno. As adaptações para TDAH são especialmente bem feitas.",
  },
  {
    name: "Ana Santos",
    role: "Professora de Português",
    school: "Instituto Federal de Minas Gerais",
    quote: "O melhor é que eu mantenho o controle. A IA sugere, mas eu decido. Isso me dá confiança para usar no dia a dia.",
  },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function PublicFaq() {
  return (
    <section id="depoimentos" className="bg-white py-20">
      <div className="container-page">
        <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-text-primary">
          O que dizem os professores
        </h2>

        {/* Desktop: grid, Mobile: horizontal scroll */}
        <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="min-w-[280px] shrink-0 snap-center rounded-xl border border-border-default bg-white p-7 shadow-xs md:min-w-0"
            >
              <div className="flex flex-col gap-4">
                {/* Decorative quote */}
                <span className="text-4xl font-extrabold leading-none text-brand-100" aria-hidden="true">
                  &ldquo;
                </span>

                <p className="text-sm italic leading-[1.7] text-text-secondary">
                  &ldquo;{t.quote}&rdquo;
                </p>

                {/* Separator */}
                <div className="my-2 h-px bg-border-muted" />

                {/* Attribution */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-600">
                    {getInitials(t.name)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-text-primary">{t.name}</span>
                    <span className="text-xs text-text-muted">{t.role} · {t.school}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/public-experience/components/public-faq.tsx
git commit -m "refactor: redesign Testimonials section with scroll snap mobile carousel"
```

---

### Task 11: Redesign FinalCTA

**Files:**
- Modify: `src/features/public-experience/components/final-cta.tsx`

- [ ] **Step 1: Rewrite FinalCta**

Replace the full content of `src/features/public-experience/components/final-cta.tsx`:

```tsx
import Link from "next/link";
import { Button } from "@/design-system/components/button";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-surface-dark py-16 lg:py-24">
      {/* Subtle radial gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, rgba(55, 48, 163, 0.5) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="container-narrow relative flex flex-col items-center gap-6 text-center">
        <h2 className="text-2xl font-extrabold tracking-tight text-text-inverse sm:text-3xl lg:text-4xl">
          Comece a adaptar suas avaliações hoje
        </h2>
        <p className="max-w-lg text-lg text-brand-200">
          Entre com sua conta e transforme sua rotina de adaptação sem abrir mão da revisão humana.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link href="/login">
            <Button variant="accent" size="lg" className="rounded-full px-8">
              Começar agora
            </Button>
          </Link>
          <Link href="/login">
            <Button
              variant="ghost"
              size="lg"
              className="rounded-full border border-brand-200/30 text-brand-200 hover:bg-white/[0.08] hover:text-white"
            >
              Falar com a equipe
            </Button>
          </Link>
        </div>
        <p className="text-sm text-brand-400/60">
          Sem cartão de crédito · Gratuito para testar · Cancele quando quiser
        </p>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/public-experience/components/final-cta.tsx
git commit -m "refactor: redesign FinalCTA with indigo dark background and terracotta CTA"
```

---

### Task 12: Redesign PublicFooter

**Files:**
- Modify: `src/features/public-experience/components/public-footer.tsx`

- [ ] **Step 1: Rewrite PublicFooter**

Replace the full content of `src/features/public-experience/components/public-footer.tsx`:

```tsx
import Link from "next/link";
import { Logo } from "@/design-system/components/logo";

const footerLinks = {
  Produto: [
    { label: "Plataforma", href: "#" },
    { label: "Como funciona", href: "#como-funciona" },
    { label: "Recursos", href: "#recursos" },
    { label: "Preços", href: "#" },
  ],
  Suporte: [
    { label: "Central de ajuda", href: "#" },
    { label: "Contato", href: "#" },
    { label: "Status", href: "#" },
  ],
  Legal: [
    { label: "Privacidade", href: "#" },
    { label: "Termos de uso", href: "#" },
    { label: "Cookies", href: "#" },
  ],
};

export function PublicFooter() {
  return (
    <footer className="bg-brand-950">
      <div className="container-page py-12">
        <div className="grid gap-10 lg:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-4 lg:col-span-1">
            <Logo size="sm" variant="mono" />
            <p className="max-w-xs text-sm leading-relaxed text-brand-300">
              Plataforma educacional com IA para adaptar avaliações e promover inclusão na sala de aula.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section} className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.05em] text-brand-200">
                {section}
              </h3>
              <ul className="flex flex-col gap-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-brand-300 transition-colors duration-150 hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-brand-800 pt-6 text-center">
          <p className="text-xs text-brand-400/60">
            © {new Date().getFullYear()} Adapte Minha Prova. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/public-experience/components/public-footer.tsx
git commit -m "refactor: redesign PublicFooter with dark indigo background and mono logo"
```

---

### Task 13: Update Login Page (Remove Terminal)

**Files:**
- Modify: `src/app/(public)/login/page.tsx`

- [ ] **Step 1: Update login page left panel from terminal to indigo branding**

In `src/app/(public)/login/page.tsx`, remove the imports of `TerminalBlock` and `TerminalLine`. Remove the terminal mockup from the left panel. Replace the terminal aesthetic with a clean indigo-branded panel that uses the new design system.

Key changes:
- Replace `bg-surface-terminal` with `bg-surface-dark`
- Remove the dot grid background pattern
- Remove `TerminalBlock` and `TerminalLine` usage
- Remove `animate-pulse-glow` and `text-glow` classes
- Replace `font-display` with regular font classes
- Update text colors from `text-slate-*` to `text-brand-*`
- Replace `text-brand-400 text-glow` with `text-brand-200`
- Update the `Logo` variant to use `"mark"` without `animate-pulse-glow`
- Update link colors from `text-brand-600` to keep consistency

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No import errors for TerminalBlock/TerminalLine.

- [ ] **Step 3: Commit**

```bash
git add src/app/(public)/login/page.tsx
git commit -m "refactor: update login page from terminal to indigo branding"
```

---

### Task 14: Remove Terminal Components and Fix References

**Files:**
- Delete: `src/design-system/components/terminal-block.tsx`
- Modify: `src/design-system/index.ts` (remove TerminalBlock/TerminalLine export)
- Modify: `src/app-shell/authenticated/teacher-shell.tsx` (fix shadow-glow → shadow-soft)
- Modify: `src/app-shell/admin/admin-shell.tsx` (fix shadow-glow → shadow-soft)
- Modify: `src/features/exams/results/components/question-result.tsx` (fix shadow-glow → shadow-soft)

Note: This task runs AFTER Tasks 6 and 13 (Hero and Login rewrites) to avoid broken imports.

- [ ] **Step 1: Remove TerminalBlock export from index.ts**

In `src/design-system/index.ts`, delete the line:
```typescript
export { TerminalBlock, TerminalLine } from "./components/terminal-block";
```

- [ ] **Step 2: Delete terminal-block.tsx**

```bash
rm src/design-system/components/terminal-block.tsx
```

- [ ] **Step 3: Fix shadow-glow references in teacher-shell.tsx**

In `src/app-shell/authenticated/teacher-shell.tsx`, replace `shadow-glow` with `shadow-soft` on the line that uses it (line 67).

- [ ] **Step 4: Fix shadow-glow references in admin-shell.tsx**

In `src/app-shell/admin/admin-shell.tsx`, replace `shadow-glow` with `shadow-soft` on the line that uses it (line 91).

- [ ] **Step 5: Fix shadow-glow references in question-result.tsx**

In `src/features/exams/results/components/question-result.tsx`, replace `shadow-glow` with `shadow-soft` on the line that uses it (line 33).

- [ ] **Step 6: Run typecheck to verify no broken imports**

Run: `npx tsc --noEmit`
Expected: No errors. All previous consumers of TerminalBlock (hero, login) have been rewritten in Tasks 6 and 13.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: remove terminal components and fix shadow-glow references"
```

---

### Task 15: Update Tests

**Files:**
- Modify: `src/test/features/public-experience/public-landing.test.tsx`
- Modify: `src/test/features/public-experience/public-home-page.test.tsx`
- Modify: `src/test/features/public-experience/public-landing.a11y.test.tsx`

- [ ] **Step 1: Update public-landing.test.tsx**

Key test changes needed:
- `"Comece grátis"` → `"Comece agora"` (hero CTA text changed)
- `"Três passos para adaptar"` → `"Como funciona"` (FlowSection heading simplified)
- `"Feito para quem ensina"` → `"Por que escolher o Prisma"` (BenefitsSection heading changed)
- Keep assertions for headings, content structure, and footer
- Remove `"Entrar com Google"` link assertion from a11y test if it's now just "Entrar"
- Remove `"Plataforma educacional com IA"` badge assertion if badge was removed from hero
- Remove `"perguntas frequentes"` region assertion from a11y test (section is now testimonials, not FAQ)

Update `src/test/features/public-experience/public-landing.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BenefitsSection } from "@/features/public-experience/components/benefits-section";
import { FinalCta } from "@/features/public-experience/components/final-cta";
import { FlowSection } from "@/features/public-experience/components/flow-section";
import { PublicFaq } from "@/features/public-experience/components/public-faq";
import { PublicFooter } from "@/features/public-experience/components/public-footer";
import { PublicHero } from "@/features/public-experience/components/public-hero";
import { TrustStrip } from "@/features/public-experience/components/trust-strip";

function renderPublicLanding() {
  render(
    <>
      <PublicHero />
      <TrustStrip />
      <FlowSection />
      <BenefitsSection />
      <PublicFaq />
      <FinalCta />
      <PublicFooter />
    </>,
  );
}

describe("public landing composition", () => {
  it("exposes the login CTA in the hero and keeps the public content readable", () => {
    renderPublicLanding();

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/adapte avaliações em/i)).toBeInTheDocument();
    expect(screen.getAllByText(/comece agora/i).length).toBeGreaterThan(0);
  });

  it("renders the flow in three explicit steps", () => {
    renderPublicLanding();

    expect(screen.getByText(/como funciona/i)).toBeInTheDocument();
    expect(screen.getByText(/envie sua prova/i)).toBeInTheDocument();
    expect(screen.getByText(/ia adapta as questões/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /revise e copie/i })).toBeInTheDocument();
  });

  it("keeps the benefits legible and the testimonials accessible", () => {
    renderPublicLanding();

    expect(screen.getByRole("heading", { name: /economia de tempo/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /rigor pedagógico/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /múltiplas necessidades/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /revisão humana/i })).toBeInTheDocument();
    expect(screen.getByText(/o que dizem os professores/i)).toBeInTheDocument();
  });

  it("closes with an institutional footer and a valid heading order", () => {
    renderPublicLanding();

    expect(screen.getByText(/todos os direitos reservados/i)).toBeInTheDocument();
    expect(screen.getByText(/comece a adaptar/i)).toBeInTheDocument();

    const headings = screen.getAllByRole("heading");
    expect(headings.length).toBeGreaterThan(3);
    expect(headings[0].tagName).toBe("H1");
  });
});
```

- [ ] **Step 2: Update public-home-page.test.tsx**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PublicHomePage from "@/app/(public)/page";

describe("public home page", () => {
  it("renders the rebuilt public landing for anonymous users", () => {
    render(<PublicHomePage />);

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/adapte avaliações/i)).toBeInTheDocument();
    expect(screen.getAllByText(/comece agora/i).length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 3: Update public-landing.a11y.test.tsx**

The a11y test references `"Entrar com Google"` link and `"perguntas frequentes"` region — both no longer exist. Update:

```tsx
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { BenefitsSection } from "@/features/public-experience/components/benefits-section";
import { FinalCta } from "@/features/public-experience/components/final-cta";
import { FlowSection } from "@/features/public-experience/components/flow-section";
import { PublicFaq } from "@/features/public-experience/components/public-faq";
import { PublicFooter } from "@/features/public-experience/components/public-footer";
import { PublicHero } from "@/features/public-experience/components/public-hero";
import { TrustStrip } from "@/features/public-experience/components/trust-strip";

function renderPublicLanding() {
  return render(
    <>
      <PublicHero />
      <TrustStrip />
      <FlowSection />
      <BenefitsSection />
      <PublicFaq />
      <FinalCta />
      <PublicFooter />
    </>,
  );
}

describe("public landing accessibility", () => {
  it("keeps the composed public experience accessible", async () => {
    const { container } = renderPublicLanding();

    expect((await axe(container)).violations).toHaveLength(0);
  });
});
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/test/features/public-experience/`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/test/features/public-experience/
git commit -m "test: update landing page tests for redesigned sections"
```

---

### Task 16: Full Build and Quality Gate

- [ ] **Step 1: Run lint**

Run: `npx next lint`
Expected: No new errors.

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No new errors.

- [ ] **Step 3: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 4: Run build**

Run: `npx next build`
Expected: Build succeeds.

- [ ] **Step 5: Fix any issues found, commit fixes**

If any quality gate fails, fix the issues and commit:

```bash
git add -A
git commit -m "fix: resolve quality gate issues from landing page redesign"
```
