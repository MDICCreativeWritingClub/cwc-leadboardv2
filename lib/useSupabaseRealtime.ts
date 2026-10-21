import { useEffect } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface RealtimeOptions {
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  filter?: string;
}

/**
 * Subscribes to Postgres changes on `table` for the lifetime of the calling
 * component and tears the channel down on unmount.
 *
 * This channel-create / subscribe / removeChannel sequence was previously
 * duplicated verbatim in every context provider (SubmissionsContext,
 * SiteConfigContext, VoteContext). Centralizing it here means a fix to the
 * subscription lifecycle only needs to happen once.
 */
export function useSupabaseRealtime(
  channelName: string,
  table: string,
  onChange: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void,
  options: RealtimeOptions = {}
): void {
  useEffect(() => {
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: options.event ?? "*",
          schema: "public",
          table,
          ...(options.filter ? { filter: options.filter } : {}),
        },
        onChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // Subscription identity is defined by channel/table/filter; onChange is
    // intentionally excluded so callers don't need to memoize their callback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, table, options.event, options.filter]);
}
