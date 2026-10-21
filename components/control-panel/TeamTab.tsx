"use client";

import { useState } from "react";
import { GraduationCap, Plus, Save, Trash2, Users, UserSquare2, Palette, RotateCcw, XOctagon } from "lucide-react";
import type { StaffMember } from "@/data/articles";
import { colors } from "@/lib/theme";
import { inputStyle, labelStyle } from "./shared";

interface TeamTabProps {
  executives: StaffMember[];
  editorialTeam: StaffMember[];
  classReps: StaffMember[];
  mediaTeam: StaffMember[];
  pastMembers: StaffMember[];
  addMember: (member: StaffMember) => void;
  removeMember: (member: StaffMember) => void;
  restoreMember: (member: StaffMember) => void;
  deleteMember: (member: StaffMember) => void;
}

export function TeamTab({ executives, editorialTeam, classReps, mediaTeam, pastMembers, addMember, removeMember, restoreMember, deleteMember }: TeamTabProps) {
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberForm, setMemberForm] = useState({
    name: "",
    role: "",
    period: "",
    section: "executives" as "executives" | "editorial" | "class_rep" | "media",
    isTeacher: true,
    grade: "",
  });

  return (
            <div className="max-w-3xl flex flex-col gap-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p style={{ color: colors.gray500, fontSize: "0.85rem" }}>
                  Manage who appears in Our Team — Executives and the Editorial Team.
                </p>
                <button
                  onClick={() => setShowAddMember((s) => !s)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm hover:opacity-90 transition-opacity shrink-0 w-full sm:w-auto"
                  style={{ backgroundColor: colors.green900 }}
                >
                  <Plus size={14} /> Add New Member
                </button>
              </div>

              {showAddMember && (
                <div className="rounded-xl border p-5 flex flex-col gap-4" style={{ borderColor: colors.badgeBorder, backgroundColor: colors.badgeBg }}>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label style={labelStyle}>Full Name</label>
                      <input
                        style={inputStyle}
                        value={memberForm.name}
                        onChange={(e) => setMemberForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="e.g. Ms. Nadia Karim"
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Role</label>
                      <input
                        style={inputStyle}
                        value={memberForm.role}
                        onChange={(e) => setMemberForm((f) => ({ ...f, role: e.target.value }))}
                        placeholder="e.g. Faculty Advisor / Editor-in-Chief"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label style={labelStyle}>Section</label>
                      <select
                        style={{ ...inputStyle, color: colors.gray900 }}
                        value={memberForm.section}
                        onChange={(e) => {
                          const section = e.target.value as typeof memberForm.section;
                          setMemberForm((f) => ({ ...f, section, isTeacher: section === "executives" }));
                        }}
                      >
                        <option value="executives">Executives</option>
                        <option value="editorial">Editorial Team</option>
                        <option value="class_rep">Class Representative</option>
                        <option value="media">Media Team</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Period</label>
                      <input
                        style={inputStyle}
                        value={memberForm.period}
                        onChange={(e) => setMemberForm((f) => ({ ...f, period: e.target.value }))}
                        placeholder="e.g. 2025–Present"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer w-fit">
                    <input
                      type="checkbox"
                      checked={memberForm.isTeacher}
                      onChange={(e) => setMemberForm((f) => ({ ...f, isTeacher: e.target.checked, grade: e.target.checked ? "" : f.grade }))}
                    />
                    <span style={{ color: colors.gray700, fontSize: "0.85rem" }}>This person is a teacher</span>
                  </label>

                  <div>
                    <label style={labelStyle}>
                      Grade {!memberForm.isTeacher && <span style={{ color: colors.red600 }}>*</span>}
                    </label>
                    <input
                      style={inputStyle}
                      value={memberForm.grade}
                      onChange={(e) => setMemberForm((f) => ({ ...f, grade: e.target.value }))}
                      placeholder={memberForm.isTeacher ? "Not applicable for teachers" : "e.g. Grade 11"}
                      disabled={memberForm.isTeacher}
                    />
                    {!memberForm.isTeacher && (
                      <p style={{ color: colors.gray400, fontSize: "0.72rem", marginTop: "0.25rem" }}>
                        Required for all non-teacher members.
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (!memberForm.name.trim() || !memberForm.role.trim() || !memberForm.period.trim()) return;
                        if (!memberForm.isTeacher && !memberForm.grade.trim()) return;
                        const typeMap = {
                          executives: "teacher",
                          editorial: "student",
                          class_rep: "class_rep",
                          media: "media",
                        } as const;
                        addMember({
                          name: memberForm.name.trim(),
                          role: memberForm.role.trim(),
                          period: memberForm.period.trim(),
                          type: typeMap[memberForm.section],
                          isTeacher: memberForm.isTeacher,
                          grade: memberForm.isTeacher ? undefined : memberForm.grade.trim(),
                        });
                        setMemberForm({ name: "", role: "", period: "", section: "executives", isTeacher: true, grade: "" });
                        setShowAddMember(false);
                      }}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: colors.green900 }}
                    >
                      <Save size={14} /> Save Member
                    </button>
                    <button
                      onClick={() => setShowAddMember(false)}
                      className="px-5 py-2 rounded-xl text-sm border hover:bg-gray-50 dark:hover:bg-[var(--token-gray100)] transition-all active:scale-95"
                      style={{ borderColor: colors.gray200, color: colors.gray700 }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <GraduationCap size={16} style={{ color: colors.green600 }} />
                  <h2 style={{ color: colors.heading, fontWeight: 600, fontSize: "1rem" }}>Executives</h2>
                  <div className="flex-1 h-px" style={{ backgroundColor: colors.gray200 }} />
                </div>
                <div className="flex flex-col gap-3">
                  {executives.map((m) => (
                    <div
                      key={m.id ?? m.name + m.period}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl border"
                      style={{ backgroundColor: colors.badgeBg, borderColor: colors.badgeBorder }}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white"
                          style={{ backgroundColor: colors.green900 }}
                        >
                          <GraduationCap size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p style={{ color: colors.heading, fontWeight: 600, fontSize: "0.9rem" }}>{m.name}</p>
                            {m.isTeacher && (
                              <span className="px-2 py-0.5 rounded-full text-[0.65rem] font-medium" style={{ backgroundColor: colors.green900, color: colors.white }}>
                                Teacher
                              </span>
                            )}
                          </div>
                          <p style={{ color: colors.green600, fontSize: "0.8rem" }}>{m.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <span style={{ color: colors.gray400, fontSize: "0.75rem", whiteSpace: "nowrap" }}>{m.period}</span>
                        <button
                          onClick={() => {
                            if (confirm(`Remove ${m.name} from Our Team? They will move to Past Members in the Archive.`)) removeMember(m);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs hover:opacity-80 transition-opacity shrink-0"
                          style={{ backgroundColor: colors.red50, color: colors.red600, border: `1px solid ${colors.red200}` }}
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  {executives.length === 0 && (
                    <p style={{ color: colors.gray400, fontSize: "0.8rem" }}>No executives added yet.</p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Users size={16} style={{ color: colors.green600 }} />
                  <h2 style={{ color: colors.heading, fontWeight: 600, fontSize: "1rem" }}>Editorial Team</h2>
                  <div className="flex-1 h-px" style={{ backgroundColor: colors.gray200 }} />
                </div>
                <div className="flex flex-col gap-3">
                  {editorialTeam.map((m) => (
                    <div
                      key={m.id ?? m.name + m.period}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl border"
                      style={{ backgroundColor: colors.surface, borderColor: colors.gray200 }}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white"
                          style={{ backgroundColor: colors.gray500 }}
                        >
                          {m.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p style={{ color: colors.heading, fontWeight: 600, fontSize: "0.9rem" }}>{m.name}</p>
                            {m.isTeacher && (
                              <span className="px-2 py-0.5 rounded-full text-[0.65rem] font-medium" style={{ backgroundColor: colors.green900, color: colors.white }}>
                                Teacher
                              </span>
                            )}
                          </div>
                          <p style={{ color: colors.green600, fontSize: "0.8rem" }}>{m.role}</p>
                          {m.grade && <p style={{ color: colors.gray500, fontSize: "0.75rem" }}>{m.grade}</p>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <span style={{ color: colors.gray400, fontSize: "0.75rem", whiteSpace: "nowrap" }}>{m.period}</span>
                        <button
                          onClick={() => {
                            if (confirm(`Remove ${m.name} from Our Team? They will move to Past Members in the Archive.`)) removeMember(m);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs hover:opacity-80 transition-opacity shrink-0"
                          style={{ backgroundColor: colors.red50, color: colors.red600, border: `1px solid ${colors.red200}` }}
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  {editorialTeam.length === 0 && (
                    <p style={{ color: colors.gray400, fontSize: "0.8rem" }}>No editorial team members added yet.</p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <UserSquare2 size={16} style={{ color: colors.green600 }} />
                  <h2 style={{ color: colors.heading, fontWeight: 600, fontSize: "1rem" }}>Class Representatives</h2>
                  <div className="flex-1 h-px" style={{ backgroundColor: colors.gray200 }} />
                </div>
                <div className="flex flex-col gap-3">
                  {classReps.map((m) => (
                    <div
                      key={m.id ?? m.name + m.period}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl border"
                      style={{ backgroundColor: colors.surface, borderColor: colors.gray200 }}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white"
                          style={{ backgroundColor: colors.gray500 }}
                        >
                          {m.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p style={{ color: colors.heading, fontWeight: 600, fontSize: "0.9rem" }}>{m.name}</p>
                            {m.isTeacher && (
                              <span className="px-2 py-0.5 rounded-full text-[0.65rem] font-medium" style={{ backgroundColor: colors.green900, color: colors.white }}>
                                Teacher
                              </span>
                            )}
                          </div>
                          <p style={{ color: colors.green600, fontSize: "0.8rem" }}>{m.role}</p>
                          {m.grade && <p style={{ color: colors.gray500, fontSize: "0.75rem" }}>{m.grade}</p>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <span style={{ color: colors.gray400, fontSize: "0.75rem", whiteSpace: "nowrap" }}>{m.period}</span>
                        <button
                          onClick={() => {
                            if (confirm(`Remove ${m.name} from Our Team? They will move to Past Members in the Archive.`)) removeMember(m);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs hover:opacity-80 transition-opacity shrink-0"
                          style={{ backgroundColor: colors.red50, color: colors.red600, border: `1px solid ${colors.red200}` }}
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  {classReps.length === 0 && (
                    <p style={{ color: colors.gray400, fontSize: "0.8rem" }}>No class representatives added yet.</p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Palette size={16} style={{ color: colors.green600 }} />
                  <h2 style={{ color: colors.heading, fontWeight: 600, fontSize: "1rem" }}>Media Team</h2>
                  <div className="flex-1 h-px" style={{ backgroundColor: colors.gray200 }} />
                </div>
                <div className="flex flex-col gap-3">
                  {mediaTeam.map((m) => (
                    <div
                      key={m.id ?? m.name + m.period}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl border"
                      style={{ backgroundColor: colors.surface, borderColor: colors.gray200 }}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white"
                          style={{ backgroundColor: colors.gray500 }}
                        >
                          {m.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p style={{ color: colors.heading, fontWeight: 600, fontSize: "0.9rem" }}>{m.name}</p>
                            {m.isTeacher && (
                              <span className="px-2 py-0.5 rounded-full text-[0.65rem] font-medium" style={{ backgroundColor: colors.green900, color: colors.white }}>
                                Teacher
                              </span>
                            )}
                          </div>
                          <p style={{ color: colors.green600, fontSize: "0.8rem" }}>{m.role}</p>
                          {m.grade && <p style={{ color: colors.gray500, fontSize: "0.75rem" }}>{m.grade}</p>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <span style={{ color: colors.gray400, fontSize: "0.75rem", whiteSpace: "nowrap" }}>{m.period}</span>
                        <button
                          onClick={() => {
                            if (confirm(`Remove ${m.name} from Our Team? They will move to Past Members in the Archive.`)) removeMember(m);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs hover:opacity-80 transition-opacity shrink-0"
                          style={{ backgroundColor: colors.red50, color: colors.red600, border: `1px solid ${colors.red200}` }}
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  {mediaTeam.length === 0 && (
                    <p style={{ color: colors.gray400, fontSize: "0.8rem" }}>No media team members added yet.</p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <RotateCcw size={16} style={{ color: colors.gray500 }} />
                  <h2 style={{ color: colors.heading, fontWeight: 600, fontSize: "1rem" }}>Past Members</h2>
                  <div className="flex-1 h-px" style={{ backgroundColor: colors.gray200 }} />
                </div>
                <p style={{ color: colors.gray400, fontSize: "0.78rem", marginBottom: "1rem" }}>
                  Members removed from the active roster. They stay listed publicly under Archive → Past Members. Restore
                  them if they were removed by mistake, or delete permanently if the entry itself was a mistake (e.g. a typo
                  or duplicate add).
                </p>
                <div className="flex flex-col gap-3">
                  {pastMembers.map((m) => (
                    <div
                      key={m.id ?? m.name + m.role + m.period}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl border"
                      style={{ backgroundColor: colors.gray50, borderColor: colors.gray200, opacity: 0.9 }}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white"
                          style={{ backgroundColor: colors.gray400 }}
                        >
                          {m.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p style={{ color: colors.heading, fontWeight: 600, fontSize: "0.9rem" }}>{m.name}</p>
                            {m.isTeacher && (
                              <span className="px-2 py-0.5 rounded-full text-[0.65rem] font-medium" style={{ backgroundColor: colors.gray300, color: colors.gray700 }}>
                                Teacher
                              </span>
                            )}
                          </div>
                          <p style={{ color: colors.gray500, fontSize: "0.8rem" }}>{m.role}</p>
                        </div>
                      </div>
                      <span className="sm:hidden" style={{ color: colors.gray400, fontSize: "0.75rem" }}>{m.period}</span>
                      <div className="flex items-center gap-2 sm:shrink-0">
                        <span className="hidden sm:inline-block" style={{ color: colors.gray400, fontSize: "0.75rem", whiteSpace: "nowrap" }}>{m.period}</span>
                        <button
                          onClick={() => restoreMember(m)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs hover:opacity-80 transition-opacity shrink-0"
                          style={{ backgroundColor: colors.badgeBg, color: colors.badgeText, border: `1px solid ${colors.badgeBorder}` }}
                          title="Move back to the active team"
                        >
                          <RotateCcw size={12} /> Restore
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Permanently delete ${m.name}'s record? This cannot be undone and they will no longer appear in Past Members.`)) {
                              deleteMember(m);
                            }
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs hover:opacity-80 transition-opacity shrink-0"
                          style={{ backgroundColor: colors.red50, color: colors.red600, border: `1px solid ${colors.red200}` }}
                          title="Permanently delete — use only if this entry was a mistake"
                        >
                          <XOctagon size={12} /> Delete Permanently
                        </button>
                      </div>
                    </div>
                  ))}
                  {pastMembers.length === 0 && (
                    <p style={{ color: colors.gray400, fontSize: "0.8rem" }}>No past members.</p>
                  )}
                </div>
              </div>
            </div>
      
  );
}
