"use client";

import { colors } from "@/lib/theme";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle, AlertCircle, HelpCircle } from "lucide-react";
import { useSubmissions } from "@/context/SubmissionsContext";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { RichTextEditor } from "@/components/RichTextEditor";
import { stripFormatMarks } from "@/lib/richText";

const DAILY_SUBMISSION_LIMIT = 2;

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const categoryOptions = [
  "Articles",
  "Argumentative / Descriptive Essays",
  "Blogs",
  "Fiction / Short Stories",
  "Poetry",
  "Memoir / Personal Narrative",
  "Magazine / Features",
  "Biographies",
  "Reviews",
];

// Must match the submissions_phone_format check constraint in the database.
const PHONE_PATTERN = /^\d{11}$/;

interface FormState {
  name: string;
  studentCode: string;
  grade: string;
  phone: string;
  category: string;
  theme: string;
  title: string;
  content: string;
  agreed: boolean;
}

const empty: FormState = {
  name: "", studentCode: "", grade: "", phone: "", category: "",
  theme: "", title: "", content: "", agreed: false,
};

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <label style={{ color: colors.heading, fontSize: "0.875rem", fontWeight: 500 }}>
          {label} {required && <span style={{ color: colors.red600 }}>*</span>}
        </label>
        {hint && (
          <span title={hint} style={{ cursor: "help" }}>
            <HelpCircle size={13} style={{ color: colors.gray400 }} />
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.6rem 1rem",
  borderRadius: "0.75rem",
  border: `1px solid ${colors.green200}`,
  fontSize: "0.875rem",
  outline: "none",
  backgroundColor: colors.surface,
  color: colors.gray900,
  transition: "border-color 0.15s, box-shadow 0.15s",
};

function useFieldFocus() {
  return {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      e.target.style.borderColor = colors.green600;
      e.target.style.boxShadow = "0 0 0 2px rgba(22,163,74,0.1)";
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      e.target.style.borderColor = colors.green200;
      e.target.style.boxShadow = "none";
    },
  };
}

export function SubmitPage() {
  const { submissions, addSubmission } = useSubmissions();
  const { config } = useSiteConfig();
  const [form, setForm] = useState<FormState>(empty);

  const plainContent = stripFormatMarks(form.content);
  const wordCount = plainContent.trim() ? plainContent.trim().split(/\s+/).length : 0;
  const charCount = plainContent.length;
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const focus = useFieldFocus();

  const todaySubmissionCount = useMemo(() => {
    const code = form.studentCode.trim().toLowerCase();
    if (!code) return 0;
    const now = new Date();
    return submissions.filter(
      (s) =>
        s.studentCode.trim().toLowerCase() === code &&
        isSameDay(new Date(s.submittedAt), now)
    ).length;
  }, [submissions, form.studentCode]);

  const limitReached = todaySubmissionCount >= DAILY_SUBMISSION_LIMIT;

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const t = e.target;
    const value = t instanceof HTMLInputElement && t.type === "checkbox" ? t.checked : t.value;
    setForm((f) => ({ ...f, [t.name]: value }));
  }

  function handleStudentCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 9);
    setForm((f) => ({ ...f, studentCode: digitsOnly }));
  }


  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 11);
    setForm((f) => ({ ...f, phone: digitsOnly }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!/^\d{1,9}$/.test(form.studentCode)) {
      setSubmitError("Student code must contain only numbers (up to 9 digits).");
      return;
    }

    if (!PHONE_PATTERN.test(form.phone)) {
      setSubmitError("Phone number must be exactly 11 digits.");
      return;
    }

    if (!form.category) {
      setSubmitError("Please select a category.");
      return;
    }

    if (!form.theme) {
      setSubmitError("Please select a theme.");
      return;
    }

    if (!plainContent.trim()) {
      setSubmitError("Please write or paste your piece before submitting.");
      return;
    }


    if (limitReached) {
      setSubmitError(
        `You've reached the limit of ${DAILY_SUBMISSION_LIMIT} submissions per day. Please try again tomorrow.`
      );
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      await addSubmission({
        name: form.name,
        studentCode: form.studentCode,
        grade: form.grade,
        phone: form.phone,
        category: form.category,
        theme: form.theme,
        title: form.title,
        content: form.content,
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-5 pt-32 pb-20 text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ backgroundColor: colors.badgeBgStrong }}
        >
          <CheckCircle size={32} style={{ color: colors.green600 }} />
        </div>
        <h1 style={{ color: colors.heading, fontWeight: 700, fontSize: "1.5rem", marginBottom: "0.5rem" }}>
          Submission Received!
        </h1>
        <p style={{ color: colors.gray500, lineHeight: "1.7", marginBottom: "1.5rem" }}>
          Thank you, <strong>{form.name}</strong>. Your piece{" "}
          <em>&quot;{form.title}&quot;</em> has been submitted and will be reviewed by our
          editorial team. We&apos;ll be in touch.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { setSubmitted(false); setForm(empty); }}
            className="px-5 py-2 rounded-full text-sm border hover:bg-green-50 transition-colors"
            style={{ borderColor: colors.green200, color: colors.badgeText }}
          >
            Submit another
          </button>
          <Link
            href="/"
            className="px-5 py-2 rounded-full text-white text-sm hover:opacity-90 transition-opacity"
            style={{ backgroundColor: colors.green900 }}
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-5 pt-24 pb-20">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <HelpCircle size={20} style={{ color: colors.green600 }} />
          <h1 style={{ color: colors.heading, fontWeight: 700, fontSize: "1.75rem" }}>The Help Desk</h1>
        </div>
        <p style={{ color: colors.gray500, fontSize: "0.875rem" }}>
          Submit your work for editorial review. Open to all students from Grades 7–12 at Manarat
          International School &amp; College.
        </p>
      </div>

      <div className="rounded-xl p-4 mb-5 border" style={{ backgroundColor: colors.badgeBg, borderColor: colors.badgeBorder }}>
        <p style={{ color: colors.heading, fontSize: "0.8rem" }}>
          <strong>This month&apos;s theme:</strong>{" "}
          <span style={{ color: colors.green600 }}>{config.themeName}</span> — or submit for Open
          Theme anytime.
        </p>
      </div>

      <div
        className="flex gap-3 items-start p-4 rounded-xl mb-7 border"
        style={{ backgroundColor: colors.yellow50, borderColor: colors.yellow300 }}
      >
        <AlertCircle size={16} style={{ color: colors.yellow600, flexShrink: 0, marginTop: "2px" }} />
        <p style={{ color: colors.amber900Deep, fontSize: "0.8rem", lineHeight: "1.6" }}>
          <strong>Note:</strong> Submissions containing AI-generated content will not be accepted.
          All work must be entirely original and written by the student.
        </p>
      </div>

      {form.studentCode.trim() && !limitReached && todaySubmissionCount > 0 && (
        <div className="rounded-xl px-4 py-3 mb-2 text-sm" style={{ backgroundColor: colors.badgeBg, color: colors.badgeText }}>
          You&apos;ve submitted {todaySubmissionCount}/{DAILY_SUBMISSION_LIMIT} pieces today.
        </div>
      )}

      {limitReached && (
        <div className="rounded-xl px-4 py-3 mb-2 text-sm" style={{ backgroundColor: colors.red100, color: colors.red700 }}>
          You&apos;ve reached the daily limit of {DAILY_SUBMISSION_LIMIT} submissions for this
          student code. Please come back tomorrow to submit more.
        </div>
      )}

      {submitError && (
        <div className="rounded-xl px-4 py-3 mb-2 text-sm" style={{ backgroundColor: colors.red100, color: colors.red700 }}>
          {submitError}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Full Name" required>
            <input
              required name="name" value={form.name} onChange={handleChange}
              placeholder="Your full name"
              style={inputStyle} {...focus}
            />
          </Field>
          <Field label="Student Code" hint="Your school-issued student ID — numbers only, up to 9 digits" required>
            <input
              required name="studentCode" value={form.studentCode} onChange={handleStudentCodeChange}
              placeholder="e.g. 202400342"
              inputMode="numeric"
              pattern="\d{1,9}"
              maxLength={9}
              title="Numbers only, up to 9 digits"
              style={inputStyle} {...focus}
            />
          </Field>
        </div>

        <Field label="Phone Number" hint="11 digits, numbers only. Only the editorial team can see this." required>
          <input
            required name="phone" value={form.phone} onChange={handlePhoneChange}
            placeholder="e.g. 01712345678"
            inputMode="numeric" autoComplete="tel-national"
            pattern="\d{11}" maxLength={11}
            title="Exactly 11 digits, numbers only"
            style={inputStyle} {...focus}
          />
        </Field>

        <Field label="Grade &amp; Section" required>
          <input
            required name="grade" value={form.grade} onChange={handleChange}
            placeholder="e.g. Grade 10 — AS-B"
            style={inputStyle} {...focus}
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Category" required>
            <select
              required name="category" value={form.category} onChange={handleChange}
              style={{ ...inputStyle, color: form.category ? colors.gray900 : colors.gray400 }}
              {...focus}
            >
              <option value="">Select a category</option>
              {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Monthly Theme" required>
            <select
              required name="theme" value={form.theme} onChange={handleChange}
              style={{ ...inputStyle, color: form.theme ? colors.gray900 : colors.gray400 }}
              {...focus}
            >
              <option value="">Select a theme</option>
              {(config.themeOptions ?? []).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Title of Your Work" required>
          <input
            required name="title" value={form.title} onChange={handleChange}
            placeholder="Enter the title of your piece"
            style={inputStyle} {...focus}
          />
        </Field>

        <Field label="Your Writing" required>
          <RichTextEditor
            value={form.content}
            onChange={(value) => setForm((f) => ({ ...f, content: value }))}
            placeholder="Paste or write your piece here..."
            minHeight="260px"
          />
          <div className="flex items-center justify-between mt-1.5 flex-wrap gap-2">
            <p style={{ color: colors.gray400, fontSize: "0.75rem" }}>
              Select text and use the buttons above to format it — bold, italic, or underline. Pasting from Word, Google Docs, or a PDF keeps their bold/italic/underline formatting.
            </p>
            <p style={{ color: colors.gray400, fontSize: "0.75rem" }} className="shrink-0">
              {wordCount} {wordCount === 1 ? "word" : "words"} · {charCount} {charCount === 1 ? "character" : "characters"}
            </p>
          </div>
        </Field>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            required type="checkbox" name="agreed" checked={form.agreed} onChange={handleChange}
            style={{ marginTop: "3px", accentColor: colors.green600, flexShrink: 0 }}
          />
          <span style={{ color: colors.gray600, fontSize: "0.8rem", lineHeight: "1.6" }}>
            I confirm this is my own original work, contains no AI-generated content, and I agree
            to the club&apos;s content guidelines and editorial review process.
          </span>
        </label>

        <button
          type="submit"
          disabled={submitting || limitReached}
          className="w-full py-3 rounded-xl text-white hover:opacity-90 transition-opacity disabled:opacity-60"
          style={{ backgroundColor: colors.green900, fontWeight: 500 }}
        >
          {submitting ? "Submitting..." : limitReached ? "Daily Limit Reached" : "Submit Your Work"}
        </button>
      </form>
    </div>
  );
}
