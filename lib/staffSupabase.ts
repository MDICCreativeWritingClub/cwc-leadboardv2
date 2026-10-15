import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabaseConfig";

/**
 * Auth + write client for the Review/Control Panel staff login. Isolated
 * under its own localStorage key so it never shares a session with the
 * public reader client (lib/userSupabase.ts) -- a staff member and a
 * public account can be logged in side by side with zero overlap.
 *
 * Every staff-privileged write (approving a submission, moderating a
 * comment, awarding recognition, uploading a notice image, editing site
 * config) must go through THIS client, not the read-only `supabase`
 * client, or RLS will see the request as anonymous and reject it.
 */
export const staffSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storageKey: "cwc-staff-auth",
    persistSession: true,
    autoRefreshToken: true,
  },
});
