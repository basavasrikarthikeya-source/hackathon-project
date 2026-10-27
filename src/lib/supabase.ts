import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Job type — mirrors public.jobs in backend/supabase_setup.sql (locked v1.0)
// ---------------------------------------------------------------------------
export interface Job {
  id: string;
  user_id: string;
  prompt: string;
  image_paths: string[];
  status: "processing" | "done" | "error";
  answer: string | null;
  marked_image_path: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Supabase client singleton
// Provides sensible fallbacks so next build / prerendering succeeds even without .env.local
// ---------------------------------------------------------------------------
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://itpfveokpvzcbmoogcui.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_pYs48YgZPAi5-vo3ELH4Cw_4ZfvhOkV";

export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey
);
