/**
 * Staff roles are derived straight from the login username — each of the
 * four accounts is named after its own role ("admin", "editor",
 * "coordinator", "eic"). No separate roles table: whatever's before
 * "@cwc.staff" in the account's email IS the role.
 */
export type StaffRole = "admin" | "editor" | "coordinator" | "eic";

const ROLE_BY_USERNAME: Record<string, StaffRole> = {
  admin: "admin",
  editor: "editor",
  coordinator: "coordinator",
  eic: "eic",
};

export function roleFromUsername(username: string): StaffRole | null {
  return ROLE_BY_USERNAME[username.trim().toLowerCase()] ?? null;
}

export function roleFromEmail(email: string | null | undefined): StaffRole | null {
  if (!email) return null;
  return roleFromUsername(email.split("@")[0]);
}

export type WritingTab = "unverified" | "pending" | "waiting_confirmation" | "approved" | "rejected";
export type ReviewSection = "writings" | "comments" | "theme" | "choice" | "standings" | "votes";

const ALL_WRITING_TABS: WritingTab[] = ["unverified", "pending", "waiting_confirmation", "approved", "rejected"];
const ALL_SECTIONS: ReviewSection[] = ["writings", "comments", "theme", "choice", "standings", "votes"];

interface ReviewAccess {
  /** Sections visible in the Writings/Comments/Theme/Editor's Choice switcher. */
  sections: ReviewSection[];
  /** Tabs visible in the writing sub-tab bar (Unverified/Pending/etc). Some may be view-only. */
  writingTabs: WritingTab[];
  /** Of the visible writingTabs, which ones this role can actually Accept/Edit/Reject on.
   *  The rest are still visible for context, just without action buttons. */
  controllableStatuses: WritingTab[];
}

/** What each role can see and act on inside the Review Panel. */
export const REVIEW_ACCESS: Record<StaffRole, ReviewAccess> = {
  admin: {
    sections: ALL_SECTIONS,
    writingTabs: ALL_WRITING_TABS,
    controllableStatuses: ALL_WRITING_TABS,
  },
  eic: {
    sections: ALL_SECTIONS,
    writingTabs: ALL_WRITING_TABS,
    controllableStatuses: ALL_WRITING_TABS,
  },
  editor: {
    // Can see Pending, Waiting for Confirmation, Approved, Rejected — but can only
    // Accept/Edit/Reject from Pending. Waiting for Confirmation is view-only for them.
    sections: ["writings", "comments", "choice", "standings", "votes"],
    writingTabs: ["pending", "waiting_confirmation", "approved", "rejected"],
    controllableStatuses: ["pending"],
  },
  coordinator: {
    // Can see Unverified, Pending, Approved, Rejected — but can only Accept/Reject
    // from Unverified. Pending (and the rest) are view-only for them.
    sections: ["writings"],
    writingTabs: ["unverified", "pending", "approved", "rejected"],
    controllableStatuses: ["unverified"],
  },
};

/** Only admins get into the Control Panel. */
export function canAccessControlPanel(role: StaffRole | null): boolean {
  return role === "admin";
}

/** Editor, EIC, and Admin can moderate comments (approve/reject/remove); Coordinator has no comments access at all. */
export function canModerateComments(role: StaffRole | null): boolean {
  return role === "admin" || role === "eic" || role === "editor";
}

/** Admin and EIC can flag voters; editors can view burst reports but not flag. */
export function canFlagVoters(role: StaffRole | null): boolean {
  return role === "admin" || role === "eic";
}

export const ROLE_LABEL: Record<StaffRole, string> = {
  admin: "Admin",
  editor: "Editor",
  coordinator: "Coordinator",
  eic: "Editor in Chief",
};
