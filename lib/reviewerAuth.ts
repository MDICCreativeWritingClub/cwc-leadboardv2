import { staffSupabase as supabase } from "@/lib/staffSupabase";
import type { Session } from "@supabase/supabase-js";
import { roleFromEmail, type StaffRole } from "@/lib/roles";

// Reviewers/admins log in with a plain username, never an email.
// Supabase Auth still requires an email internally, so usernames
// are deterministically mapped to a fake address under this fixed
// domain (which never receives real mail). When creating an
// account in Supabase's dashboard, set its email to exactly
// "<username>@cwc.staff" -- e.g. username "sandid" -> "sandid@cwc.staff".
const STAFF_EMAIL_DOMAIN = "cwc.staff";

function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${STAFF_EMAIL_DOMAIN}`;
}

// --- Client-side login lockout ---------------------------------------
// This is a UX/friction layer, NOT the primary defense -- it's tracked in
// localStorage, so clearing site data or using a fresh incognito window
// resets it. The real, unavoidable protection against brute-forcing is
// Supabase Auth's own server-side rate limiting on sign-in attempts
// (enabled by default, applies per IP/account regardless of what the
// client does). This layer just slows down a casual attacker and gives
// clearer feedback than "incorrect password" repeated forever.
const ATTEMPTS_KEY = "cwc_login_attempts";
const LOCKOUT_UNTIL_KEY = "cwc_login_lockout_until";
const FREE_ATTEMPTS = 4; // this many wrong guesses before any lockout kicks in
const BASE_LOCKOUT_MS = 20_000; // first lockout is 20s, doubling each further failure
const MAX_LOCKOUT_MS = 5 * 60_000; // capped at 5 minutes

function getAttempts(): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(ATTEMPTS_KEY) ?? "0");
}

function setAttempts(n: number) {
  if (typeof window !== "undefined") localStorage.setItem(ATTEMPTS_KEY, String(n));
}

function getLockoutUntil(): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(LOCKOUT_UNTIL_KEY) ?? "0");
}

function setLockoutUntil(ts: number) {
  if (typeof window !== "undefined") localStorage.setItem(LOCKOUT_UNTIL_KEY, String(ts));
}

function resetLockout() {
  setAttempts(0);
  setLockoutUntil(0);
}

/** Seconds remaining before another login attempt is allowed (0 if not locked out). */
export function getLockoutSecondsRemaining(): number {
  const remaining = getLockoutUntil() - Date.now();
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

export async function getReviewerSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/** The logged-in staff member's role, derived from their email's username part. */
export async function getReviewerRole(): Promise<StaffRole | null> {
  const { data } = await supabase.auth.getSession();
  return roleFromEmail(data.session?.user.email);
}

export async function signInReviewer(
  username: string,
  password: string
): Promise<{ error: string | null }> {
  if (!username.trim() || !password) {
    return { error: "Enter a username and password." };
  }

  const lockedSeconds = getLockoutSecondsRemaining();
  if (lockedSeconds > 0) {
    return { error: `Too many failed attempts. Try again in ${lockedSeconds}s.` };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  });

  if (error) {
    const attempts = getAttempts() + 1;
    setAttempts(attempts);

    if (attempts >= FREE_ATTEMPTS) {
      const lockoutMs = Math.min(BASE_LOCKOUT_MS * 2 ** (attempts - FREE_ATTEMPTS), MAX_LOCKOUT_MS);
      setLockoutUntil(Date.now() + lockoutMs);
      return { error: `Incorrect username or password. Locked for ${Math.ceil(lockoutMs / 1000)}s after repeated failures.` };
    }

    return { error: "Incorrect username or password." };
  }

  resetLockout();
  return { error: null };
}

export async function signOutReviewer(): Promise<void> {
  await supabase.auth.signOut();
}
