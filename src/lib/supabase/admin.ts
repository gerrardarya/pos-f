import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Secret-key Supabase client. Bypasses RLS entirely — only use it for
 * operations that genuinely require elevated privileges (creating staff
 * auth users). Never import this into a Client Component and never expose
 * SUPABASE_SECRET_KEY to the browser.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
