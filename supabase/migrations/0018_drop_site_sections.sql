-- Masani rebrand — remove the marketing CMS.
--
-- Homepage and pricing content now live as static TypeScript literals in
-- src/lib/marketing/defaults.ts instead of being admin-editable through
-- `site_sections`. Drops the table, its RLS policies, the marketing-assets
-- storage bucket, and that bucket's policies (reverse of 0009_site_sections.sql).

-- -----------------------------------------------------------------------------
-- 1. marketing-assets storage bucket
--    Drop the bucket's RLS policies here (policy DDL is allowed), but do NOT
--    delete the bucket's objects/row in SQL: Supabase blocks direct DML on the
--    storage.* tables ("Direct deletion from storage tables is not allowed.
--    Use the Storage API instead."). Empty + delete the `marketing-assets`
--    bucket via the Dashboard (Storage) or the Storage API instead — it's inert
--    dead weight once these policies are gone and the app no longer uses it.
-- -----------------------------------------------------------------------------
drop policy if exists "marketing_assets_admin_delete" on storage.objects;
drop policy if exists "marketing_assets_admin_update" on storage.objects;
drop policy if exists "marketing_assets_admin_insert" on storage.objects;
drop policy if exists "marketing_assets_public_read" on storage.objects;

-- -----------------------------------------------------------------------------
-- 2. site_sections table
-- -----------------------------------------------------------------------------
drop policy if exists site_sections_admin_write on public.site_sections;
drop policy if exists site_sections_public_read on public.site_sections;

drop index if exists site_sections_page_idx;

drop table if exists public.site_sections;
