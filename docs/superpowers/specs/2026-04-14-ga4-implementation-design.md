# GA4 Implementation Design

**Date:** 2026-04-14
**Status:** Approved

## Overview

Integrate Google Analytics 4 (GA4) into the Next.js 16 App Router webapp to track page views automatically on every route change. No custom events, no consent banner, no environment restrictions.

## Architecture

A single `GoogleAnalytics` client component loads the gtag.js script and listens for route changes using Next.js's `usePathname` hook. It is mounted once in the root layout and handles all page view tracking automatically.

## Dependencies

Install the TypeScript type definitions for gtag:

```
npm install --save-dev @types/gtag.js
```

This provides the `gtag()` global function type without requiring a manual `.d.ts` declaration.

## Components

### 1. `src/components/google-analytics.tsx`

A `'use client'` component that:

- Returns `null` early if `process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID` is undefined, preventing a broken `gtag` call.
- Renders two `<Script>` tags via `next/script` with `strategy="afterInteractive"`:
  1. The gtag.js loader (no `id` required — external scripts are deduplicated by URL):
     ```
     src="https://www.googletagmanager.com/gtag/js?id=<MEASUREMENT_ID>"
     ```
  2. The inline initialization script with `id="ga-init"` (the `id` prop is required by Next.js for inline scripts to prevent duplicate execution in development):
     ```js
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', '<MEASUREMENT_ID>', { send_page_view: false });
     ```
     `send_page_view: false` disables the automatic initial page view from the config call, so the `useEffect` below is the single source of truth for all page views.
- Uses `usePathname` to detect route changes. A `useEffect` that depends on the pathname fires on every navigation (including initial mount) and calls:
  ```js
  gtag('event', 'page_view', { page_path: pathname });
  ```
  `gtag('event', 'page_view', ...)` is used instead of `gtag('config', ID, { page_path })` because the latter re-applies the full GA4 config on each navigation, which is unnecessary overhead for a SPA doing simple page view tracking.
- Does **not** use `useSearchParams` — query string changes are intentionally not tracked.
- Does **not** need a `<Suspense>` boundary since `useSearchParams` is not used.

### 2. `src/app/layout.tsx`

Adds `<GoogleAnalytics />` inside `<body>`. The exact DOM position does not affect behavior — `next/script` with `strategy="afterInteractive"` is managed independently by Next.js.

### 3. `.env.example`

Adds:
```
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 4. `next.config.ts` — CSP Headers

The existing CSP already contains `'unsafe-inline'` in `script-src`, so no changes are needed there. The following domains must be added:

- `script-src`: add `https://www.googletagmanager.com`
- `img-src`: add `https://www.google-analytics.com https://www.googletagmanager.com`
- `connect-src`: add `https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net`

## Data Flow

```
User navigates to new route
  → usePathname() returns new path
  → useEffect fires
  → gtag('event', 'page_view', { page_path: pathname })
  → GA4 receives event
```

Initial page load is captured by the `useEffect` on mount (first render).

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 Measurement ID (format: `G-XXXXXXXXXX`). Component renders nothing if undefined. |

Must be set in `.env.local` for local development and in the deployment environment (Vercel) for production.

## Known Limitations

- **Query string changes are not tracked.** Navigation that only changes search params (e.g., `?tab=results`) will not fire a page view. This is intentional.

## Out of Scope

- Custom events (sign-up, exam creation, feedback submission, etc.)
- User properties or user ID tracking
- Consent management / cookie banner
- Environment-based conditional loading
- Search params tracking
