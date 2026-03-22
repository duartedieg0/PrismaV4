# Supabase Migrations Baseline

PrismaV2 now vendors the canonical Supabase baseline from the current Prisma
system directly inside this repository.

The imported baseline covers:
- schema
- RLS policies
- triggers and indexes
- storage policies
- additive legacy migrations already present in production parity
- a local compatibility migration for backfilling legacy `auth.users` rows into `profiles`
- `supabase/seed.sql` for initial local data

From this point forward, every new database change in PrismaV2 must be additive
and committed from this folder so the repository remains the source of truth.
