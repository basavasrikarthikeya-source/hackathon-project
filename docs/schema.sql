-- ============================================================================
-- Drishti Supabase PostgreSQL Schema with Row Level Security (RLS)
-- File: /docs/schema.sql (NOT auto-executed)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom Types
DO $$ BEGIN
  CREATE TYPE app_mode AS ENUM ('interactive', 'comparison');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE asset_slot AS ENUM ('single', 'past', 'new');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE verdict_type AS ENUM ('ANSWERED', 'UNCERTAIN', 'REFUSED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE job_status AS ENUM ('queued', 'running', 'completed', 'failed', 'terminated');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL DEFAULT auth.uid(),
  name TEXT NOT NULL,
  area_label TEXT NOT NULL DEFAULT '',
  aoi_geojson JSONB,
  focus TEXT[] NOT NULL DEFAULT '{}',
  description TEXT,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. CHATS TABLE
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL DEFAULT auth.uid(),
  title TEXT NOT NULL DEFAULT 'New Inspection',
  mode app_mode NOT NULL DEFAULT 'interactive',
  pinned BOOLEAN NOT NULL DEFAULT false,
  archived BOOLEAN NOT NULL DEFAULT false,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. ASSETS TABLE
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL DEFAULT auth.uid(),
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  kind TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  width INTEGER,
  height INTEGER,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. MESSAGE_ASSETS TABLE
CREATE TABLE IF NOT EXISTS public.message_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  slot asset_slot NOT NULL DEFAULT 'single',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. RESULTS TABLE
CREATE TABLE IF NOT EXISTS public.results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  verdict verdict_type NOT NULL,
  answer_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  evidence_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  audit_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  latency_ms INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. JOBS TABLE
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  status job_status NOT NULL DEFAULT 'queued',
  stage TEXT NOT NULL DEFAULT 'Initialising sensor alignment...',
  started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  finished_at TIMESTAMPTZ
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_projects_owner ON public.projects(owner_id, archived);
CREATE INDEX IF NOT EXISTS idx_chats_project ON public.chats(project_id, archived, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chats_owner ON public.chats(owner_id, archived);
CREATE INDEX IF NOT EXISTS idx_messages_chat ON public.messages(chat_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_assets_project ON public.assets(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_results_message ON public.results(message_id);
CREATE INDEX IF NOT EXISTS idx_jobs_chat ON public.jobs(chat_id, status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS across all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- 1. Projects Policies
CREATE POLICY "Users can view their own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = owner_id);

-- 2. Chats Policies
CREATE POLICY "Users can view their own chats"
  ON public.chats FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert chats in their own projects"
  ON public.chats FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own chats"
  ON public.chats FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own chats"
  ON public.chats FOR DELETE
  USING (auth.uid() = owner_id);

-- 3. Messages Policies
CREATE POLICY "Users can view messages in their own chats"
  ON public.messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.chats WHERE public.chats.id = public.messages.chat_id AND public.chats.owner_id = auth.uid()
  ));

CREATE POLICY "Users can insert messages in their own chats"
  ON public.messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.chats WHERE public.chats.id = public.messages.chat_id AND public.chats.owner_id = auth.uid()
  ));

-- 4. Assets Policies
CREATE POLICY "Users can view assets in their own projects"
  ON public.assets FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert assets into their projects"
  ON public.assets FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own assets"
  ON public.assets FOR DELETE
  USING (auth.uid() = owner_id);

-- 5. Message Assets Policies
CREATE POLICY "Users can manage message assets of their chats"
  ON public.message_assets FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.chats c ON c.id = m.chat_id
    WHERE m.id = public.message_assets.message_id AND c.owner_id = auth.uid()
  ));

-- 6. Results Policies
CREATE POLICY "Users can view results for their messages"
  ON public.results FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.chats c ON c.id = m.chat_id
    WHERE m.id = public.results.message_id AND c.owner_id = auth.uid()
  ));

CREATE POLICY "Service can insert results"
  ON public.results FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.chats c ON c.id = m.chat_id
    WHERE m.id = public.results.message_id AND c.owner_id = auth.uid()
  ));

-- 7. Jobs Policies
CREATE POLICY "Users can view and manage jobs in their chats"
  ON public.jobs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.chats c
    WHERE c.id = public.jobs.chat_id AND c.owner_id = auth.uid()
  ));

-- ============================================================================
-- SUPABASE REALTIME CONFIGURATION
-- ============================================================================
-- Publish jobs and results tables to Realtime for live stage progress, 
-- sidebar pulsing indicators, and real-time query answer delivery.
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs, public.results;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_object THEN null;
END $$;
