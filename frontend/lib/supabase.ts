import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Workbook = {
  id: string;
  badge_name: string;
  format: "pdf" | "docx";
  file_url: string | null;
  created_at: string;
};
