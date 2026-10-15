import type { Notice } from "@/context/SiteConfigContext";

const NEW_BADGE_WINDOW_MS = 48 * 60 * 60 * 1000; // 48 hours

/**
 * A notice is active if:
 * - it's permanent (always active, ignoring both dates), OR
 * - "now" falls within [startDate, expiryDate] — either bound is optional,
 *   so a notice can be scheduled to start in the future, expire in the
 *   future, both, or neither (stays active immediately and indefinitely).
 * A temporary notice is active until 23:59:59 on its expiry date, and
 * becomes active starting 00:00:00 on its start date.
 */
export function isNoticeActive(notice: Notice): boolean {
  if (notice.isPermanent) return true;

  const now = Date.now();

  if (notice.startDate) {
    const start = new Date(notice.startDate + "T00:00:00").getTime();
    if (now < start) return false;
  }

  if (notice.expiryDate) {
    const expiry = new Date(notice.expiryDate + "T23:59:59").getTime();
    if (now > expiry) return false;
  }

  return true;
}

/** True if the notice was created within the last 48 hours — drives the "New" badge. */
export function isNewNotice(notice: Notice): boolean {
  const createdAt = new Date(notice.createdAt).getTime();
  return Date.now() - createdAt < NEW_BADGE_WINDOW_MS;
}

/** Active notices, newest first. */
export function getActiveNotices(notices: Notice[]): Notice[] {
  return notices.filter(isNoticeActive).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export const headingSizeStyles: Record<Notice["headingSize"], { fontSize: string; lineHeight: string }> = {
  sm: { fontSize: "clamp(1.15rem, 3vw, 1.5rem)", lineHeight: "1.3" },
  md: { fontSize: "clamp(1.5rem, 4.5vw, 2.1rem)", lineHeight: "1.2" },
  lg: { fontSize: "clamp(1.9rem, 6vw, 3rem)", lineHeight: "1.12" },
};

export function newNoticeId(): string {
  return `notice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function newButtonId(): string {
  return `btn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function emptyNotice(): Notice {
  return {
    id: newNoticeId(),
    heading: "",
    headingSize: "md",
    body: "",
    imageUrl: "",
    isPermanent: true,
    startDate: "",
    expiryDate: "",
    buttons: [],
    openDetailPage: false,
    detailContent: "",
    createdAt: new Date().toISOString(),
  };
}
