import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabaseConfig";

/**
 * Write client for every visitor's silent, account-less identity. There is
 * no login/signup UI anymore -- see context/AuthContext.tsx, which calls
 * `auth.signInAnonymously()` on first visit so votes/comments/submissions
 * still have a real (if anonymous) auth.uid() for RLS/dedup, without ever
 * asking anyone to create an account. Isolated under its own localStorage
 * key -- see lib/staffSupabase.ts for why this matters.
 */
export const userSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storageKey: "cwc-user-auth",
    persistSession: true,
    autoRefreshToken: true,
  },
});
