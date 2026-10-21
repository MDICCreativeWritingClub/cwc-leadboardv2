"use client";

import { useCallback, useEffect, useState } from "react";
import { staffSupabase } from "@/lib/staffSupabase";

/**
 * Ids of the writings the signed-in staff member has already scored. Used to
 * keep the advance and publish buttons disabled until the judge has scored.
 * Refreshes when the window regains focus, so coming back from the edit page
 * picks up scores that were just saved.
 */
export function useMyScoredIds(enabled: boolean) {
  const [scored, setScored] = useState<Set<string>>(() => new Set());
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    const { data: sessionData } = await staffSupabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) {
      setScored(new Set());
      setReady(true);
      return;
    }
    const { data, error } = await staffSupabase.from("article_scores").select("article_id").eq("judge_id", userId);
    if (!error) setScored(new Set((data ?? []).map((r) => r.article_id as string)));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void load();
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [enabled, load]);

  return { scored, ready };
}
