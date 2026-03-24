# Phase 4 Technical Debt: Supabase Authenticated E2E Access

## Status

Resolved on 2026-03-21 after `00012_grant_table_permissions.sql`.

## Original Problem

Authenticated E2E validation was blocked by missing table-level grants in
Supabase. PostgreSQL denied access to repository-owned tables before any RLS
policy evaluation, which caused `permission denied for table profiles` and
similar failures for `subjects` and `grade_levels`.

## Revalidation Evidence

- server-side reads using `SUPABASE_SECRET_API_KEY` now read `profiles`,
  `subjects` and `grade_levels` without error;
- authenticated publishable-key reads now access the same tables without error;
- authenticated E2E for:
  - public landing redirect after login;
  - teacher dashboard;
  - extraction review;
  now execute successfully instead of skipping for missing profile access.

## What Changed

- migration [00012_grant_table_permissions.sql](/Users/iduarte/Documents/Teste/PrismaV2/supabase/migrations/00012_grant_table_permissions.sql)
  granted table-level permissions required for RLS to take effect.

## Closure Notes

- this debt is no longer an active rollout blocker;
- the historical record is preserved here because older phase reports reference
  this file;
- any remaining authenticated E2E failures must be treated as separate product
  or fixture issues, not as the original Supabase permission debt.
