# GA4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Google Analytics 4 page view tracking to the Next.js 16 App Router webapp via a single client component mounted in the root layout.

**Architecture:** A `GoogleAnalytics` client component co-located with the root layout loads the gtag.js script via `next/script` and fires a `page_view` event on every route change using `usePathname`. The component renders nothing if the measurement ID env var is absent.

**Tech Stack:** Next.js 16 App Router, `next/script`, `@types/gtag.js`, Vitest + React Testing Library

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/app/google-analytics.tsx` | Client component: loads gtag scripts, tracks page views |
| Create | `src/test/app/google-analytics.test.tsx` | Unit test: null guard when env var is missing |
| Modify | `src/app/layout.tsx` | Mount `<GoogleAnalytics />` inside `<body>` |
| Modify | `next.config.ts` | Add GA4 domains to CSP headers |
| Modify | `.env.example` | Document `NEXT_PUBLIC_GA_MEASUREMENT_ID` |

---

## Task 1: Install TypeScript types + document env var

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Install `@types/gtag.js`**

```bash
npm install --save-dev @types/gtag.js
```

Expected output: package added to `devDependencies` in `package.json`.

- [ ] **Step 2: Add env var to `.env.example`**

Open `.env.example` and append after the last line:

```
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "chore: install @types/gtag.js and document GA4 env var"
```

---

## Task 2: Create the GoogleAnalytics component (TDD)

**Files:**
- Create: `src/app/google-analytics.tsx`
- Create: `src/test/app/google-analytics.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/test/app/google-analytics.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// Mock next/script — it does not render in the test environment
vi.mock("next/script", () => ({
  default: ({
    id,
    src,
    children,
  }: {
    id?: string;
    src?: string;
    children?: React.ReactNode;
  }) => <script id={id} src={src}>{children}</script>,
}));

// Mock next/navigation — usePathname is not available in tests
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("GoogleAnalytics", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules(); // clears module cache so dynamic imports re-evaluate env vars
  });

  it("renders nothing when NEXT_PUBLIC_GA_MEASUREMENT_ID is empty", async () => {
    // stubEnv sets the var to an empty string ""; the component guards with !measurementId
    // which treats "" as falsy — same effect as undefined for this guard
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "");
    const { GoogleAnalytics } = await import("@/app/google-analytics");
    const { container } = render(<GoogleAnalytics />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/test/app/google-analytics.test.tsx
```

Expected: FAIL — `Cannot find module '@/app/google-analytics'`

- [ ] **Step 3: Create the component**

Create `src/app/google-analytics.tsx`:

```tsx
"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const pathname = usePathname();

  useEffect(() => {
    if (!measurementId) return;
    gtag("event", "page_view", { page_path: pathname });
  }, [pathname, measurementId]);

  if (!measurementId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', { send_page_view: false });
        `}
      </Script>
    </>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- src/test/app/google-analytics.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/google-analytics.tsx src/test/app/google-analytics.test.tsx
git commit -m "feat: add GoogleAnalytics component for GA4 page view tracking"
```

---

## Task 3: Mount GoogleAnalytics in the root layout

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Import and mount the component**

Make two precise edits to `src/app/layout.tsx`:

**Edit 1** — add the import after the existing `@/app/providers` import:

```
// Before (line 4):
import { Providers } from "@/app/providers";

// After:
import { Providers } from "@/app/providers";
import { GoogleAnalytics } from "@/app/google-analytics";
```

**Edit 2** — add `<GoogleAnalytics />` inside `<body>`, after `<Providers>`:

```
// Before:
      <body>
        <Providers>{children}</Providers>
      </body>

// After:
      <body>
        <Providers>{children}</Providers>
        <GoogleAnalytics />
      </body>
```

Do NOT rewrite the entire file — make only these two targeted edits. All font definitions, metadata, and other imports remain unchanged.

- [ ] **Step 2: Run the full test suite to ensure nothing broke**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: mount GoogleAnalytics in root layout"
```

---

## Task 4: Update CSP headers in next.config.ts

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Add GA4 domains to CSP**

In `next.config.ts`, update the `Content-Security-Policy` value. The current CSP lines that need changing:

**Before:**
```ts
"script-src 'self' 'unsafe-inline' 'unsafe-eval'",
"img-src 'self' data: blob:",
"connect-src 'self' https://*.supabase.co https://api.openai.com",
```

**After:**
```ts
"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com",
"img-src 'self' data: blob: https://www.google-analytics.com https://www.googletagmanager.com",
"connect-src 'self' https://*.supabase.co https://api.openai.com https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net",
```

- [ ] **Step 2: Commit**

```bash
git add next.config.ts
git commit -m "chore: update CSP headers to allow GA4 domains"
```

---

## Task 5: Manual verification

- [ ] **Step 1: Add the real Measurement ID to your local env**

In `.env.local`, add:
```
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```
Replace `G-XXXXXXXXXX` with the actual GA4 Measurement ID from Google Analytics → Admin → Data Streams.

- [ ] **Step 2: Start the dev server and open browser DevTools**

```bash
npm run dev
```

Open `http://localhost:3000` in Chrome. Open DevTools → Network tab → filter by `google-analytics` or `googletagmanager`.

- [ ] **Step 3: Verify the gtag script loads**

You should see a request to `https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX` with status 200.

- [ ] **Step 4: Verify page views fire on navigation**

Navigate between pages (e.g., login → dashboard). In the Network tab, you should see `collect` requests to `https://www.google-analytics.com/g/collect` each time you navigate.

- [ ] **Step 5: Verify null guard (optional)**

Remove `NEXT_PUBLIC_GA_MEASUREMENT_ID` from `.env.local`, restart the dev server. Check that no gtag requests appear in the Network tab.
