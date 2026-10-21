"use client";

import { useState } from "react";
import { Eye, EyeOff, Plus, Star, Trash2 } from "lucide-react";
import type { Article } from "@/data/articles";
import type { SiteConfig } from "@/context/SiteConfigContext";
import { colors } from "@/lib/theme";
import { inputStyle, labelStyle } from "./shared";
import { staffSupabase as supabase } from "@/lib/staffSupabase";

interface ChoiceTabProps {
  config: SiteConfig;
  setDraft: React.Dispatch<React.SetStateAction<SiteConfig>>;
  updateConfig: (partial: Partial<SiteConfig>) => void;
  allPublished: Article[];
}

export function ChoiceTab({ config, setDraft, updateConfig, allPublished }: ChoiceTabProps) {
  const [newEditorChoiceId, setNewEditorChoiceId] = useState("");

  return (
            <div className="max-w-3xl flex flex-col gap-5">
              <div className="rounded-xl p-4 border" style={{ backgroundColor: colors.yellow50, borderColor: colors.amber200 }}>
                <p style={{ color: colors.amber800, fontSize: "0.8rem" }}>
                  All pieces added here will appear as Editor&apos;s Choice on the homepage — no limit on how many.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <label style={{ ...labelStyle, marginBottom: 0 }}>Show Editor's Choice on Homepage</label>
                <button
                  onClick={() => {
                    const newVal = !config.editorChoiceVisible;
                    updateConfig({ editorChoiceVisible: newVal });
                    setDraft((d) => ({ ...d, editorChoiceVisible: newVal }));
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all active:scale-95"
                  style={{
                    backgroundColor: config.editorChoiceVisible ? colors.green900 : colors.gray100,
                    color: config.editorChoiceVisible ? colors.white : colors.gray500,
                  }}
                >
                  {config.editorChoiceVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                  {config.editorChoiceVisible ? "Visible" : "Hidden"}
                </button>
              </div>

              <div>
                <label style={labelStyle}>Add Featured Writing (Editor&apos;s Choice)</label>
                <div className="flex gap-2">
                  <select
                    style={{ ...inputStyle, color: colors.gray900 }}
                    value={newEditorChoiceId}
                    onChange={(e) => setNewEditorChoiceId(e.target.value)}
                  >
                    <option value="">Select a piece…</option>
                    {allPublished
                      .filter((a) => !(config.editorChoiceIds ?? []).includes(a.id))
                      .map((a) => (
                        <option key={a.id} value={a.id}>{a.title} — {a.author}</option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!newEditorChoiceId) return;
                      const updated = [...(config.editorChoiceIds ?? []), newEditorChoiceId];
                      updateConfig({ editorChoiceIds: updated });
                      setDraft((d) => ({ ...d, editorChoiceIds: updated }));

                      // Log a permanent win record — only possible for real
                      // submissions (which carry a student_code); static
                      // seed articles have no code to attribute a win to.
                      const picked = allPublished.find((a) => a.id === newEditorChoiceId);
                      const { data: sub } = await supabase
                        .from("submissions")
                        .select("student_code")
                        .eq("id", newEditorChoiceId)
                        .maybeSingle();

                      if (sub?.student_code && picked) {
                        await supabase.from("recognitions").insert({
                          student_code: sub.student_code,
                          name: picked.author,
                          category: "editors_choice",
                          article_id: newEditorChoiceId,
                        });
                      }

                      setNewEditorChoiceId("");
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm hover:opacity-90 transition-opacity shrink-0"
                    style={{ backgroundColor: colors.green900 }}
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {(config.editorChoiceIds ?? []).length === 0 && (
                  <p style={{ color: colors.gray400, fontSize: "0.8rem" }}>No pieces selected yet.</p>
                )}
                {(config.editorChoiceIds ?? []).map((id) => {
                  const selected = allPublished.find((a) => a.id === id);
                  if (!selected) return null;
                  return (
                    <div key={id} className="rounded-xl border overflow-hidden" style={{ borderColor: colors.green200 }}>
                      <div className="px-5 py-2 flex items-center justify-between gap-2" style={{ backgroundColor: colors.badgeBgStrong }}>
                        <div className="flex items-center gap-2">
                          <Star size={13} style={{ color: colors.badgeText }} fill={colors.badgeText} />
                          <span style={{ color: colors.badgeText, fontSize: "0.75rem", fontWeight: 500 }}>Editor&apos;s Choice</span>
                        </div>
                        <button
                          onClick={() => {
                            const updated = (config.editorChoiceIds ?? []).filter((x) => x !== id);
                            updateConfig({ editorChoiceIds: updated });
                            setDraft((d) => ({ ...d, editorChoiceIds: updated }));
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: colors.red50, color: colors.red600, border: `1px solid ${colors.red200}` }}
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>
                      <div className="p-5 bg-white dark:bg-[var(--token-white)]">
                        <span
                          className="inline-block px-2.5 py-0.5 rounded-full text-xs mb-2"
                          style={{ backgroundColor: colors.badgeBg, color: colors.badgeText, border: `1px solid ${colors.badgeBorder}` }}
                        >
                          {selected.category}
                        </span>
                        <p style={{ color: colors.heading, fontWeight: 700, fontSize: "1rem", marginBottom: "0.4rem" }}>{selected.title}</p>
                        <p style={{ color: colors.gray500, fontSize: "0.8rem", lineHeight: "1.6" }}>{selected.excerpt}</p>
                        <p style={{ color: colors.heading, fontSize: "0.8rem", fontWeight: 500, marginTop: "0.75rem" }}>{selected.author}</p>
                        <p style={{ color: colors.gray400, fontSize: "0.75rem" }}>{selected.grade}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
      
  );
}
