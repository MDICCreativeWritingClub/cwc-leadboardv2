"use client";

import { useRef, useState } from "react";
import { Megaphone, Plus, Trash2, Pencil, X, GripVertical, ExternalLink, Clock, Infinity as InfinityIcon, Image as ImageIcon, Upload, Loader2 } from "lucide-react";
import { colors } from "@/lib/theme";
import { inputStyle, labelStyle } from "./shared";
import type { SiteConfig, Notice, NoticeButton } from "@/context/SiteConfigContext";
import { emptyNotice, newButtonId, isNoticeActive, isNewNotice } from "@/lib/notices";
import { uploadNoticeImage } from "@/lib/imageUpload";

interface NoticesTabProps {
  config: SiteConfig;
  updateConfig: (partial: Partial<SiteConfig>) => void;
  setSaved: (saved: boolean) => void;
}

function Switch({ checked, onChange, onLabel, offLabel }: { checked: boolean; onChange: (v: boolean) => void; onLabel: string; offLabel: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2.5 px-1 py-1 rounded-full transition-all active:scale-95"
      style={{ backgroundColor: checked ? colors.badgeBgStrong : colors.gray100 }}
    >
      <span
        className="relative w-10 h-5.5 rounded-full transition-colors shrink-0"
        style={{ backgroundColor: checked ? colors.green600 : colors.gray300, height: "1.35rem", width: "2.4rem" }}
      >
        <span
          className="absolute top-0.5 rounded-full bg-white dark:bg-[var(--token-white)] shadow transition-all"
          style={{
            width: "1.1rem",
            height: "1.1rem",
            left: checked ? "calc(100% - 1.25rem)" : "0.15rem",
            transition: "left 0.2s ease",
          }}
        />
      </span>
      <span style={{ fontSize: "0.8rem", fontWeight: 500, color: checked ? colors.badgeText : colors.gray600 }}>
        {checked ? onLabel : offLabel}
      </span>
    </button>
  );
}

const headingSizes: { key: Notice["headingSize"]; label: string; preview: string }[] = [
  { key: "sm", label: "Small", preview: "1rem" },
  { key: "md", label: "Medium", preview: "1.25rem" },
  { key: "lg", label: "Large", preview: "1.6rem" },
];

const buttonStyles: { key: NoticeButton["style"]; label: string }[] = [
  { key: "primary", label: "Primary" },
  { key: "secondary", label: "Secondary" },
  { key: "outline", label: "Outline" },
];

function NoticeForm({
  initial,
  onCancel,
  onSave,
}: {
  initial: Notice;
  onCancel: () => void;
  onSave: (notice: Notice) => void;
}) {
  const [form, setForm] = useState<Notice>({ ...emptyNotice(), ...initial });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again later
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      const url = await uploadNoticeImage(file);
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function updateButton(id: string, partial: Partial<NoticeButton>) {
    setForm((f) => ({ ...f, buttons: f.buttons.map((b) => (b.id === id ? { ...b, ...partial } : b)) }));
  }

  function addButton() {
    if (form.buttons.length >= 3) return;
    setForm((f) => ({ ...f, buttons: [...f.buttons, { id: newButtonId(), label: "", url: "", style: "primary" }] }));
  }

  function removeButton(id: string) {
    setForm((f) => ({ ...f, buttons: f.buttons.filter((b) => b.id !== id) }));
  }

  const canSave = form.heading.trim().length > 0;

  return (
    <div className="rounded-2xl border p-6" style={{ borderColor: colors.badgeBorder, backgroundColor: colors.badgeBg }}>
      <div className="flex items-center justify-between mb-5">
        <h3 style={{ color: colors.heading, fontWeight: 700, fontSize: "1.05rem" }}>
          {initial.heading ? "Edit Notice" : "New Notice"}
        </h3>
        <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-white dark:bg-[var(--token-white)] transition-all active:scale-90">
          <X size={16} style={{ color: colors.gray500 }} />
        </button>
      </div>

      <div className="flex flex-col gap-5">
        {/* Heading + size */}
        <div>
          <label style={labelStyle}>Heading</label>
          <input
            type="text"
            value={form.heading}
            onChange={(e) => setForm((f) => ({ ...f, heading: e.target.value }))}
            placeholder="e.g. Submissions close this Friday"
            style={inputStyle}
          />
          <div className="flex gap-2 mt-2.5">
            {headingSizes.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setForm((f) => ({ ...f, headingSize: s.key }))}
                className="px-3 py-1.5 rounded-lg text-xs transition-all active:scale-95"
                style={{
                  backgroundColor: form.headingSize === s.key ? colors.green900 : colors.surface,
                  color: form.headingSize === s.key ? colors.white : colors.gray600,
                  border: `1px solid ${form.headingSize === s.key ? colors.green900 : colors.gray200}`,
                  fontSize: s.preview,
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div>
          <label style={labelStyle}>Short description (shown on the homepage banner)</label>
          <textarea
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            rows={2}
            placeholder="A brief teaser — one or two sentences."
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

        {/* Image */}
        <div>
          <label style={labelStyle}>Banner image (optional)</label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFilePicked}
            className="hidden"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all active:scale-95 disabled:opacity-60"
              style={{ borderColor: colors.gray300, color: colors.heading, backgroundColor: colors.surface }}
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploading ? "Uploading…" : "Upload from your computer"}
            </button>
            <span style={{ color: colors.gray400, fontSize: "0.78rem" }}>or paste a URL below</span>
          </div>
          {uploadError && (
            <p className="mt-1.5" style={{ color: colors.red600, fontSize: "0.78rem" }}>{uploadError}</p>
          )}

          <input
            type="text"
            value={form.imageUrl}
            onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
            placeholder="https://..."
            style={{ ...inputStyle, marginTop: "0.6rem" }}
          />
          <p className="flex items-center gap-1.5 mt-1.5" style={{ color: colors.gray400, fontSize: "0.75rem" }}>
            <ImageIcon size={12} /> Uploaded photos are automatically resized and compressed. Leave blank to use the default rotating photos.
          </p>
          {form.imageUrl && (
            <div className="mt-3 rounded-xl overflow-hidden" style={{ border: `1px solid ${colors.gray200}`, maxWidth: "20rem" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.imageUrl}
                alt=""
                className="w-full aspect-video object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          )}
        </div>

        {/* Permanent / temporary */}
        <div>
          <label style={labelStyle}>Duration</label>
          <div className="flex items-center gap-3 flex-wrap">
            <Switch
              checked={form.isPermanent}
              onChange={(v) => setForm((f) => ({ ...f, isPermanent: v }))}
              onLabel="Permanent"
              offLabel="Temporary"
            />
            {!form.isPermanent && (
              <>
                <div className="flex items-center gap-2">
                  <Clock size={14} style={{ color: colors.gray400 }} />
                  <span style={{ color: colors.gray400, fontSize: "0.75rem" }}>From</span>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                    style={{ ...inputStyle, width: "auto" }}
                    placeholder="Immediately"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ color: colors.gray400, fontSize: "0.75rem" }}>Until</span>
                  <input
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
                    style={{ ...inputStyle, width: "auto" }}
                  />
                </div>
              </>
            )}
            {form.isPermanent && (
              <span className="flex items-center gap-1.5" style={{ color: colors.gray400, fontSize: "0.78rem" }}>
                <InfinityIcon size={14} /> Stays up until manually removed
              </span>
            )}
          </div>
          {!form.isPermanent && (
            <p style={{ color: colors.gray400, fontSize: "0.72rem", marginTop: "0.4rem" }}>
              Leave &quot;From&quot; blank to go live immediately. Leave &quot;Until&quot; blank to stay up indefinitely once started.
            </p>
          )}
        </div>

        {/* Buttons */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label style={{ ...labelStyle, marginBottom: 0 }}>Buttons ({form.buttons.length}/3)</label>
            {form.buttons.length < 3 && (
              <button
                type="button"
                onClick={addButton}
                className="flex items-center gap-1 text-xs font-medium hover:opacity-80 transition-all active:scale-95"
                style={{ color: colors.badgeText }}
              >
                <Plus size={13} /> Add button
              </button>
            )}
          </div>
          <div className="flex flex-col gap-2.5">
            {form.buttons.map((btn) => (
              <div key={btn.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-[var(--token-white)]" style={{ border: `1px solid ${colors.gray200}` }}>
                <GripVertical size={14} style={{ color: colors.gray300 }} className="shrink-0" />
                <input
                  type="text"
                  value={btn.label}
                  onChange={(e) => updateButton(btn.id, { label: e.target.value })}
                  placeholder="Label"
                  style={{ ...inputStyle, padding: "0.4rem 0.6rem", flex: "0 0 30%" }}
                />
                <input
                  type="text"
                  value={btn.url}
                  onChange={(e) => updateButton(btn.id, { url: e.target.value })}
                  placeholder="/hub or https://..."
                  style={{ ...inputStyle, padding: "0.4rem 0.6rem", flex: 1 }}
                />
                <select
                  value={btn.style}
                  onChange={(e) => updateButton(btn.id, { style: e.target.value as NoticeButton["style"] })}
                  style={{ ...inputStyle, padding: "0.4rem 0.5rem", width: "auto" }}
                >
                  {buttonStyles.map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeButton(btn.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 transition-all active:scale-90 shrink-0"
                >
                  <Trash2 size={14} style={{ color: colors.red600 }} />
                </button>
              </div>
            ))}
            {form.buttons.length === 0 && (
              <p style={{ color: colors.gray400, fontSize: "0.78rem" }}>No buttons yet — visitors will just see the heading and text.</p>
            )}
          </div>
        </div>

        {/* Detail page toggle */}
        <div>
          <label style={labelStyle}>Full notice page</label>
          <Switch
            checked={form.openDetailPage}
            onChange={(v) => setForm((f) => ({ ...f, openDetailPage: v }))}
            onLabel="Clicking the notice opens a full page"
            offLabel="Notice only appears on the homepage banner"
          />
          {form.openDetailPage && (
            <div className="mt-3">
              <label style={labelStyle}>Extra details (shown on the full notice page)</label>
              <textarea
                value={form.detailContent}
                onChange={(e) => setForm((f) => ({ ...f, detailContent: e.target.value }))}
                rows={5}
                placeholder="Full notice text. Separate paragraphs with a blank line."
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-6">
        <button
          onClick={() => canSave && onSave(form)}
          disabled={!canSave}
          className="px-5 py-2.5 rounded-full text-white text-sm font-medium hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
          style={{ backgroundColor: colors.green900 }}
        >
          Save Notice
        </button>
        <button
          onClick={onCancel}
          className="px-5 py-2.5 rounded-full text-sm border hover:bg-white dark:bg-[var(--token-white)] transition-all active:scale-95"
          style={{ borderColor: colors.gray300, color: colors.gray600 }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function NoticesTab({ config, updateConfig, setSaved }: NoticesTabProps) {
  const notices = config.notices ?? [];
  const [editing, setEditing] = useState<Notice | null>(null);
  const [creating, setCreating] = useState(false);

  function persist(next: Notice[]) {
    updateConfig({ notices: next });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleSave(notice: Notice) {
    const exists = notices.some((n) => n.id === notice.id);
    const next = exists ? notices.map((n) => (n.id === notice.id ? notice : n)) : [notice, ...notices];
    persist(next);
    setEditing(null);
    setCreating(false);
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this notice? This cannot be undone.")) return;
    persist(notices.filter((n) => n.id !== id));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Megaphone size={16} style={{ color: colors.green600 }} />
            <h2 style={{ color: colors.heading, fontWeight: 700, fontSize: "1.1rem" }}>Notice Board</h2>
          </div>
          <p style={{ color: colors.gray500, fontSize: "0.82rem" }}>
            These notices rotate through the homepage hero banner. Temporary notices disappear automatically after their expiry date.
          </p>
        </div>
        {!creating && !editing && (
          <button
            onClick={() => { setCreating(true); setEditing(emptyNotice()); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-sm font-medium hover:opacity-90 transition-all active:scale-95 shrink-0"
            style={{ backgroundColor: colors.green900 }}
          >
            <Plus size={15} /> New Notice
          </button>
        )}
      </div>

      {editing && (
        <NoticeForm
          initial={editing}
          onCancel={() => { setEditing(null); setCreating(false); }}
          onSave={handleSave}
        />
      )}

      {!editing && notices.length === 0 && (
        <div className="rounded-2xl border border-dashed p-10 text-center" style={{ borderColor: colors.gray300 }}>
          <Megaphone size={22} style={{ color: colors.gray300, margin: "0 auto 0.75rem" }} />
          <p style={{ color: colors.gray400, fontSize: "0.85rem" }}>No notices yet. Add one to feature it on the homepage.</p>
        </div>
      )}

      {!editing && notices.length > 0 && (
        <div className="flex flex-col gap-3">
          {notices.map((notice) => {
            const active = isNoticeActive(notice);
            const isScheduled = !active && !notice.isPermanent && notice.startDate && new Date(notice.startDate + "T00:00:00").getTime() > Date.now();
            const isNew = isNewNotice(notice);
            const statusLabel = isScheduled
              ? "Scheduled"
              : active
              ? notice.isPermanent
                ? "Permanent"
                : "Active"
              : "Expired";
            return (
              <div
                key={notice.id}
                className="flex items-start gap-4 p-4 rounded-xl border transition-all hover:-translate-y-0.5 hover:shadow-sm"
                style={{ borderColor: colors.gray200, backgroundColor: active ? colors.surface : colors.gray50, opacity: active ? 1 : 0.6 }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: active ? colors.badgeBgStrong : colors.gray100, color: active ? colors.badgeText : colors.gray400 }}
                >
                  <Megaphone size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p style={{ color: colors.heading, fontWeight: 600, fontSize: "0.92rem" }} className="truncate">
                      {notice.heading || "Untitled notice"}
                    </p>
                    {isNew && (
                      <span
                        className="px-2 py-0.5 rounded-full text-xs shrink-0 font-medium"
                        style={{ backgroundColor: colors.yellow400, color: colors.green900 }}
                      >
                        New
                      </span>
                    )}
                    <span
                      className="px-2 py-0.5 rounded-full text-xs shrink-0"
                      style={{
                        backgroundColor: isScheduled ? colors.yellow100 : active ? colors.badgeBgStrong : colors.gray100,
                        color: isScheduled ? colors.amber700 : active ? colors.badgeText : colors.gray500,
                      }}
                    >
                      {statusLabel}
                    </span>
                    {notice.openDetailPage && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: colors.gray400 }}>
                        <ExternalLink size={11} /> full page
                      </span>
                    )}
                  </div>
                  {notice.body && (
                    <p style={{ color: colors.gray500, fontSize: "0.8rem", marginTop: "0.2rem" }} className="truncate">
                      {notice.body}
                    </p>
                  )}
                  {!notice.isPermanent && (notice.startDate || notice.expiryDate) && (
                    <p style={{ color: colors.gray400, fontSize: "0.72rem", marginTop: "0.25rem" }}>
                      {notice.startDate && `Starts ${new Date(notice.startDate + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}
                      {notice.startDate && notice.expiryDate && " · "}
                      {notice.expiryDate && `Expires ${new Date(notice.expiryDate + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => { setEditing(notice); setCreating(false); }}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[var(--token-gray100)] transition-all active:scale-90"
                  >
                    <Pencil size={14} style={{ color: colors.gray500 }} />
                  </button>
                  <button
                    onClick={() => handleDelete(notice.id)}
                    className="p-2 rounded-lg hover:bg-red-50 transition-all active:scale-90"
                  >
                    <Trash2 size={14} style={{ color: colors.red600 }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
