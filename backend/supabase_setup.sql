-- ============================================================================
-- SATQUERY / DRISHTI - SUPABASE SETUP SCRIPT (LOCKED CONTRACT v1.0)
-- Run this in Supabase Dashboard -> SQL Editor
-- ============================================================================

-- ============ 1. JOBS TABLE (LOCKED CONTRACT - DO NOT MODIFY) =============

create table if not exists public.jobs (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users not null,
  prompt            text not null,
  image_paths       text[],            -- 1 = query, 2 = comparison
  status            text not null default 'processing',
                    -- processing | done | error
  answer            text,
  marked_image_path text,
  created_at        timestamptz default now()
);

alter table public.jobs enable row level security;

-- Drop existing policies if re-running
drop policy if exists "users read own jobs" on public.jobs;
drop policy if exists "users insert own jobs" on public.jobs;
drop policy if exists "users update own jobs" on public.jobs;

create policy "users read own jobs" on public.jobs
  for select using (auth.uid() = user_id);

create policy "users insert own jobs" on public.jobs
  for insert with check (auth.uid() = user_id);

create policy "users update own jobs" on public.jobs
  for update using (auth.uid() = user_id);

-- The Kaggle worker uses the service_role key, which bypasses RLS by
-- design. That is how it updates rows it did not create.

-- ============ 2. STORAGE BUCKET "images" (public read) ===================

insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

drop policy if exists "authenticated uploads to images" on storage.objects;
drop policy if exists "public reads images" on storage.objects;

create policy "authenticated uploads to images" on storage.objects
  for insert to authenticated with check (bucket_id = 'images');

create policy "public reads images" on storage.objects
  for select to public using (bucket_id = 'images');

-- ============ 3. REALTIME (push jobs UPDATE events to browsers) ==========

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'jobs'
  ) then
    execute 'alter publication supabase_realtime add table public.jobs';
  end if;
end $$;
