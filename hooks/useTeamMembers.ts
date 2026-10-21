import { useMemo, useCallback } from "react";
import { useSiteConfig } from "@/context/SiteConfigContext";
import type { StaffMember } from "@/data/articles";

export function teamMemberKey(m: StaffMember): string {
  return `${m.name}__${m.role}`;
}

export function useTeamMembers() {
  const { config, updateConfig } = useSiteConfig();

  const removed = useMemo(
    () => new Set(config.removedTeamMemberIds ?? []),
    [config.removedTeamMemberIds],
  );

  const members: StaffMember[] = useMemo(
    () => (config.teamMembers ?? []).filter((m) => !removed.has(teamMemberKey(m))),
    [config.teamMembers, removed],
  );

  /** Members who were once on staff but have since left. Their record is never deleted — just moved out of the active roster and preserved here, shown under Archive → Past Members. */
  const pastMembers: StaffMember[] = useMemo(
    () => (config.teamMembers ?? []).filter((m) => removed.has(teamMemberKey(m))),
    [config.teamMembers, removed],
  );

  const executives  = useMemo(() => members.filter((m) => m.type === "teacher"), [members]);
  const editorialTeam = useMemo(() => members.filter((m) => m.type === "student"), [members]);
  const classReps = useMemo(() => members.filter((m) => m.type === "class_rep"), [members]);
  const mediaTeam = useMemo(() => members.filter((m) => m.type === "media"), [members]);

  const addMember = useCallback(
    (member: StaffMember) => {
      updateConfig({ teamMembers: [...(config.teamMembers ?? []), member] });
    },
    [config.teamMembers, updateConfig],
  );

  const removeMember = useCallback(
    (member: StaffMember) => {
      const key = teamMemberKey(member);
      updateConfig({
        removedTeamMemberIds: [...(config.removedTeamMemberIds ?? []), key],
      });
    },
    [config.removedTeamMemberIds, updateConfig],
  );

  /** Moves a past member back onto the active roster (undoes an accidental Remove). */
  const restoreMember = useCallback(
    (member: StaffMember) => {
      const key = teamMemberKey(member);
      updateConfig({
        removedTeamMemberIds: (config.removedTeamMemberIds ?? []).filter((id) => id !== key),
      });
    },
    [config.removedTeamMemberIds, updateConfig],
  );

  /** Permanently erases a member's record — for entries that were added by mistake. Unlike removeMember, this does not preserve anything in Past Members. */
  const deleteMember = useCallback(
    (member: StaffMember) => {
      const key = teamMemberKey(member);
      updateConfig({
        teamMembers: (config.teamMembers ?? []).filter((m) => teamMemberKey(m) !== key),
        removedTeamMemberIds: (config.removedTeamMemberIds ?? []).filter((id) => id !== key),
      });
    },
    [config.teamMembers, config.removedTeamMemberIds, updateConfig],
  );

  return {
    members, pastMembers, executives, editorialTeam, classReps, mediaTeam,
    teamMemberKey, addMember, removeMember, restoreMember, deleteMember,
  };
}
