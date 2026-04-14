# GA4 Implementation Design

**Date:** 2026-04-14
**Status:** Approved

## Overview

Integrate Google Analytics 4 (GA4) into the Next.js 16 App Router webapp to track page views automatically on every route change. No custom events, no consent banner, no environment restrictions.

## Architecture

A single `GoogleAnalytics` client component loads the gtag.js script and listens for route changes using Next.js's `usePathname` hook. It is mounted once in the root layout and handles all page view tracking automatically.

## Components

### 1. `src/components/google-analytics.tsx`

A `'use client'` component that:

- Renders two `<Script>` tags via `next/script` with `strategy="afterInteractive"`:
  1. The gtag.js loader: `https://www.googletagmanager.com/gtag/js?id=<MEASUREMENT_ID>`
  2. The inline initialization script that calls `gtag('config', MEASUREMENT_ID)`
- Uses `usePathname` to detect route changes and calls `gtag('event', 'page_view', { page_path })` on each navigation
- Reads the Measurement ID from `process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID`

### 2. `src/app/layout.tsx`

Adds `<GoogleAnalytics />` inside `<body>`, after the existing `<Providers>` and content. No other changes to the layout.

### 3. `.env.example`

Adds the variable:
```
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 4. `next.config.ts` — CSP Headers

Updates the `Content-Security-Policy` header to allow GA4 domains:

- `script-src`: add `https://www.googletagmanager.com`
- `img-src`: add `https://www.google-analytics.com`
- `connect-src`: add `https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net`

## Data Flow

```
User navigates to new route
  → usePathname() returns new path
  → useEffect fires
  → gtag('event', 'page_view', { page_path: newPath })
  → GA4 receives event
```

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 Measurement ID (format: `G-XXXXXXXXXX`) |

The variable must be set in `.env.local` for local development and in the deployment environment (e.g., Vercel) for production.

## Out of Scope

- Custom events (sign-up, exam creation, feedback submission, etc.)
- User properties or user ID tracking
- Consent management / cookie banner
- Environment-based conditional loading
