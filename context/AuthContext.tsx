"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { userSupabase } from "@/lib/userSupabase";
import { staffSupabase } from "@/lib/staffSupabase";
import { roleFromEmail, ROLE_LABEL, type StaffRole } from "@/lib/roles";

/**
 * The single "who can act as a user right now" identity, derived from two
 * completely independent Supabase Auth sessions -- see lib/userSupabase.ts
 * / lib/staffSupabase.ts. There is no public login/signup anymore: every
 * visitor silently gets an anonymous Supabase Auth session (no email, no
 * password, nothing to type) the first time this loads, purely so
 * votes/comments/submissions have a real auth.uid() for RLS and dedup.
 * Staff still sign in for real on /review or /control.
 *
 * Staff takes priority when both happen to be active, since a staff
 * session is a deliberate, meaningful login and the anonymous public
 * session is just plumbing every browser has in the background.
 */
export type ActiveIdentity =
  | {
      kind: "public";
      client: SupabaseClient;
      userId: string;
    }
  | {
      kind: "staff";
      client: SupabaseClient;
      userId: string;
      staffRole: StaffRole | null;
      /** Staff accounts aren't tied to a real person's name (see
       *  lib/roles.ts) -- their role label doubles as the display name
       *  shown wherever a name would otherwise go, e.g. "Editor" in the
       *  Navbar. */
      displayName: string;
    };

interface AuthContextType {
  identity: ActiveIdentity | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [publicIdentity, setPublicIdentity] = useState<ActiveIdentity | null>(null);
  const [staffIdentity, setStaffIdentity] = useState<ActiveIdentity | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadPublicIdentity() {
    const { data } = await userSupabase.auth.getSession();
    let session = data.session;

    if (!session) {
      // First visit (or the anonymous session expired/was cleared) --
      // silently create one. No UI, no prompt; the person never sees this.
      const { data: signInData, error } = await userSupabase.auth.signInAnonymously();
      if (error) {
        setPublicIdentity(null);
        return;
      }
      session = signInData.session;
    }

    if (!session) {
      setPublicIdentity(null);
      return;
    }

    setPublicIdentity({
      kind: "public",
      client: userSupabase,
      userId: session.user.id,
    });
  }

  async function loadStaffIdentity() {
    const { data } = await staffSupabase.auth.getSession();
    const session = data.session;
    if (!session) {
      setStaffIdentity(null);
      return;
    }
    const staffRole = roleFromEmail(session.user.email);
    setStaffIdentity({
      kind: "staff",
      client: staffSupabase,
      userId: session.user.id,
      staffRole,
      displayName: staffRole ? ROLE_LABEL[staffRole] : "Staff",
    });
  }

  useEffect(() => {
    Promise.all([loadPublicIdentity(), loadStaffIdentity()]).finally(() => setLoading(false));

    const { data: publicSub } = userSupabase.auth.onAuthStateChange(() => {
      loadPublicIdentity();
    });
    const { data: staffSub } = staffSupabase.auth.onAuthStateChange(() => {
      loadStaffIdentity();
    });

    return () => {
      publicSub.subscription.unsubscribe();
      staffSub.subscription.unsubscribe();
    };
  }, []);

  const identity = staffIdentity ?? publicIdentity;

  return (
    <AuthContext.Provider value={{ identity, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
