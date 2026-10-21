"use client";

import { useState } from "react";
import { Eye, EyeOff, Plus, Save, X } from "lucide-react";
import type { SiteConfig } from "@/context/SiteConfigContext";
import { colors } from "@/lib/theme";
import { inputStyle, labelStyle } from "./shared";

interface ThemeTabProps {
  config: SiteConfig;
  draft: SiteConfig;
  setDraft: React.Dispatch<React.SetStateAction<SiteConfig>>;
  updateConfig: (partial: Partial<SiteConfig>) => void;
  handleSave: () => void;
}

export function ThemeTab({ config, draft, setDraft, updateConfig, handleSave }: ThemeTabProps) {
  const [newThemeOption, setNewThemeOption] = useState("");

  return (
            <div className="max-w-3xl flex flex-col gap-5">
              <div className="rounded-xl p-4 border" style={{ backgroundColor: colors.yellow50, borderColor: colors.amber200 }}>
                <p style={{ color: colors.amber800, fontSize: "0.8rem" }}>
                  Changes here update the theme banner on the Homepage and the Help Desk form.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <label style={{ ...labelStyle, marginBottom: 0 }}>Show Theme on Homepage</label>
                <button
                  onClick={() => {
                    const newVal = !config.themeVisible;
                    updateConfig({ themeVisible: newVal });
                    setDraft((d) => ({ ...d, themeVisible: newVal }));
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all active:scale-95"
                  style={{
                    backgroundColor: config.themeVisible ? colors.green900 : colors.gray100,
                    color: config.themeVisible ? colors.white : colors.gray500,
                  }}
                >
                  {config.themeVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                  {config.themeVisible ? "Visible" : "Hidden"}
                </button>
              </div>

              <div>
                <label style={labelStyle}>Theme Name</label>
                <input
                  style={inputStyle}
                  value={draft.themeName}
                  onChange={(e) => setDraft((d) => ({ ...d, themeName: e.target.value }))}
                  placeholder="e.g. Courage"
                />
              </div>

              <div>
                <label style={labelStyle}>Month Label</label>
                <input
                  style={inputStyle}
                  value={draft.themeMonth}
                  onChange={(e) => setDraft((d) => ({ ...d, themeMonth: e.target.value }))}
                  placeholder="e.g. June 2026"
                />
              </div>

              <div>
                <label style={labelStyle}>Theme Description</label>
                <textarea
                  rows={4}
                  style={{ ...inputStyle, resize: "vertical", lineHeight: "1.7" }}
                  value={draft.themeDescription}
                  onChange={(e) => setDraft((d) => ({ ...d, themeDescription: e.target.value }))}
                  placeholder="Describe this month's theme..."
                />
              </div>

              <div className="rounded-xl border p-4" style={{ backgroundColor: colors.gray50, borderColor: colors.gray200 }}>
                <p style={{ color: colors.gray500, fontSize: "0.75rem", marginBottom: "0.5rem" }}>Preview</p>
                <p style={{ color: colors.amber800, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>{draft.themeMonth} Theme</p>
                <p style={{ color: colors.amber900, fontWeight: 700, fontSize: "1.2rem" }}>{draft.themeName || "—"}</p>
                <p style={{ color: colors.amber800, fontSize: "0.8rem", lineHeight: "1.5", marginTop: "0.25rem" }}>{draft.themeDescription || "—"}</p>
              </div>

              <div className="rounded-xl border p-4" style={{ borderColor: colors.gray200, backgroundColor: colors.surface }}>
                <label style={labelStyle}>Theme Options (shown in the Help Desk submission form)</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {(draft.themeOptions ?? []).map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs"
                      style={{ backgroundColor: colors.badgeBg, color: colors.badgeText, border: `1px solid ${colors.badgeBorder}` }}
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (draft.themeOptions ?? []).filter((x) => x !== t);
                          setDraft((d) => ({ ...d, themeOptions: updated }));
                        }}
                        style={{ color: colors.green600, display: "flex" }}
                        title={`Remove "${t}"`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {(draft.themeOptions ?? []).length === 0 && (
                    <span style={{ color: colors.gray400, fontSize: "0.8rem" }}>No theme options yet.</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    style={inputStyle}
                    value={newThemeOption}
                    onChange={(e) => setNewThemeOption(e.target.value)}
                    placeholder="e.g. Resilience"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const value = newThemeOption.trim();
                      if (!value) return;
                      if ((draft.themeOptions ?? []).includes(value)) {
                        setNewThemeOption("");
                        return;
                      }
                      setDraft((d) => ({ ...d, themeOptions: [...(d.themeOptions ?? []), value] }));
                      setNewThemeOption("");
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm hover:opacity-90 transition-opacity shrink-0"
                    style={{ backgroundColor: colors.green900 }}
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>
              </div>

              <button
                onClick={handleSave}
                className="self-start flex items-center gap-2 px-6 py-2.5 rounded-xl text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: colors.green900 }}
              >
                <Save size={15} /> Save Theme
              </button>
            </div>
      
  );
}
