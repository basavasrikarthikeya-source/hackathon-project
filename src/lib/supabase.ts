import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "";

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Job = {
  id: string;
  user_id: string;
  prompt: string;
  image_paths: string[];
  status: "processing" | "done" | "error";
  answer: string | null;
  marked_image_path: string | null;
  created_at: string;
};
