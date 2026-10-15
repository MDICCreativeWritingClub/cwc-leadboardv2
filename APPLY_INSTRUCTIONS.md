# Setup (no-login version)

Visitors get a silent Supabase anonymous session; only staff sign in.

## Supabase (project `forum`, dpwedikuzwzsxwpvsexr)
1. Run `sql/new_project_migration.sql`, then `sql/remove_public_login.sql`
   (the second redefines `is_verified_user()` so anonymous sessions count).
2. Auth -> Sign In / Providers -> enable **Anonymous Sign-Ins**.
   Without this, voting, commenting and submitting silently fail.
3. Create the 4 staff accounts and the `notice-images` storage bucket.
4. `award_history` table + RLS: `sql/award_history.sql`.
5. Only the 4 `@cwc.staff` accounts exist; there is no reader profile table.

## Not used anymore
`sql/cast_vote_v3_reader_auth.sql` is an obsolete earlier iteration.
No login page, no `userAuth.ts`, no email confirmation.
