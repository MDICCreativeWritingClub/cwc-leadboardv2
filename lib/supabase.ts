import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabaseConfig";

/**
 * General-purpose READ client for public data (articles, votes, comments,
 * site config). Never carries an auth session -- logins live on the two
 * isolated clients below, so this one has nothing to persist.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});
