"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { staffSupabase as supabase } from "@/lib/staffSupabase"
import { useSupabaseRealtime } from "@/lib/useSupabaseRealtime";
import {
  articles,
  currentTheme as defaultTheme,
  defaultThemeOptions,
  type StaffMember,
} from "@/data/articles";

export interface WomEntry {
  id: string;
  name: string;
  grade: string;
  bio: string;
  articleId: string;
}

export interface ArchiveEntry {
  month: string;
  year: number;
  monthLabel: string;
  topWriters: { rank: number; name: string; grade: string; totalVotes: number }[];
  topWritings: { rank: number; title: string; author: string; votes: number; articleId: string }[];
}

export interface NoticeButton {
  id: string;
  label: string;
  url: string;
  style: "primary" | "secondary" | "outline";
}

export interface Notice {
  id: string;
  heading: string;
  headingSize: "sm" | "md" | "lg";
  body: string;
  imageUrl: string; // optional background/banner image, recommended 1600x900 (16:9)
  isPermanent: boolean;
  startDate: string; // ISO date (YYYY-MM-DD), optional — notice stays hidden until this date if set
  expiryDate: string; // ISO date (YYYY-MM-DD), ignored when isPermanent is true
  buttons: NoticeButton[];
  openDetailPage: boolean;
  detailContent: string; // extra info shown on /notice/[id], only used when openDetailPage
  createdAt: string;
}

export interface SiteConfig {
  themeName: string;
  themeDescription: string;
  themeMonth: string;
  themeOptions: string[];
  themeVisible: boolean;
  womName: string;
  womGrade: string;
  womBio: string;
  womArticleId: string;
  womVisible: boolean;
  womEntries: WomEntry[];
  editorChoiceIds: string[];
  editorChoiceVisible: boolean;
  removedArticleIds: string[];
  teamMembers: StaffMember[];
  removedTeamMemberIds: string[];
  archives: ArchiveEntry[];
  notices: Notice[];
}

const defaults: SiteConfig = {
  themeName: defaultTheme.name,
  themeDescription: defaultTheme.description,
  themeMonth: defaultTheme.month,
  themeOptions: defaultThemeOptions,
  themeVisible: true,
  womName: "",
  womGrade: "",
  womBio: "",
  womArticleId: "",
  womVisible: false,
  womEntries: [],
  editorChoiceIds: articles.filter((a) => a.isEditorChoice).map((a) => a.id),
  editorChoiceVisible: true,
  removedArticleIds: [],
  teamMembers: [],
  removedTeamMemberIds: [],
  archives: [],
  notices: [],
};

interface SiteConfigContextType {
  config: SiteConfig;
  updateConfig: (partial: Partial<SiteConfig>) => void;
  resetConfig: () => void;
  loading: boolean;
}

const SiteConfigContext = createContext<SiteConfigContextType | null>(null);

export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SiteConfig>(defaults);
  const [loading, setLoading] = useState(true);

  // Load from Supabase on mount
  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from("site_config")
          .select("value")
          .eq("key", "config")
          .single();

        if (error || !data) {
          // Row doesn't exist yet — insert defaults
          await supabase.from("site_config").upsert({ key: "config", value: defaults });
          setConfig(defaults);
        } else {
          setConfig({ ...defaults, ...data.value });
        }
      } catch {
        setConfig(defaults);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Subscribe to real-time changes so admin updates reflect instantly for all visitors
  useSupabaseRealtime(
    "site_config_changes",
    "site_config",
    (payload) => {
      const newRow = payload.new as Record<string, unknown>;
      const newValue = newRow.value as Partial<SiteConfig>;
      setConfig((prev) => ({ ...prev, ...newValue }));
    },
    { event: "UPDATE", filter: "key=eq.config" }
  );

  const updateConfig = useCallback((partial: Partial<SiteConfig>) => {
    setConfig((prev) => {
      const updated = { ...prev, ...partial };
      // persist to Supabase
      supabase
        .from("site_config")
        .upsert({ key: "config", value: updated })
        .then(({ error }) => { if (error) console.error("Config save error:", error); });
      return updated;
    });
  }, []);

  const resetConfig = useCallback(async (): Promise<void> => {
    setConfig(defaults);
    await supabase.from("site_config").upsert({ key: "config", value: defaults });
  }, []);

  return (
    <SiteConfigContext.Provider value={{ config, updateConfig, resetConfig, loading }}>
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig() {
  const ctx = useContext(SiteConfigContext);
  if (!ctx) throw new Error("useSiteConfig must be used inside SiteConfigProvider");
  return ctx;
}
