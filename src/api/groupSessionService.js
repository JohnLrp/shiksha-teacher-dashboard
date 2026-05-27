/**
 * FILE: TEACHER_UI/src/api/groupSessionService.js
 *
 * Teacher-side client for Group Sessions.
 * Teachers are only invitees of group sessions — they can:
 *   - view invitations (pending)
 *   - accept / decline
 *   - view upcoming / history
 *   - join the live room (same /join/ endpoint)
 *
 * Backend: /api/sessions/group-sessions/...
 */

import api from "./apiClient";

const groupSessionService = {

  async getMyGroupSessions(tab = "upcoming") {
    const res = await api.get(
      `/sessions/group-sessions/mine/?tab=${encodeURIComponent(tab)}`
    );
    return (res.data || []).map(transformGroupSession);
  },

  async getDetail(sessionId) {
    const res = await api.get(`/sessions/group-sessions/${sessionId}/`);
    return transformGroupSession(res.data);
  },

  async acceptInvite(sessionId) {
    const res = await api.post(`/sessions/group-sessions/${sessionId}/accept/`);
    return transformGroupSession(res.data);
  },

  async declineInvite(sessionId) {
    const res = await api.post(`/sessions/group-sessions/${sessionId}/decline/`);
    return transformGroupSession(res.data);
  },

  // Teacher (or student) who previously accepted flips back to pending.
  // Allowed any time before the room actually opens.
  async unacceptInvite(sessionId) {
    const res = await api.post(`/sessions/group-sessions/${sessionId}/unaccept/`);
    return transformGroupSession(res.data);
  },

  async joinRoom(sessionId) {
    const res = await api.post(`/sessions/group-sessions/${sessionId}/join/`);
    return res.data;
  },


  // ─────────────────────────────────────────────
  // Instant Meeting + host controls (teachers can host instant meetings too)
  // ─────────────────────────────────────────────
  async createInstant({ duration_minutes = 180, topic = "" } = {}) {
    const res = await api.post("/sessions/group-sessions/instant/", {
      duration_minutes,
      topic,
    });
    return transformGroupSession(res.data);
  },

  // Resolve a room code (or UUID) to a session id so the teacher can
  // navigate into the live room. Auth + paywall are enforced by the
  // backend; this wrapper just normalises the response shape.
  async joinByCode(code) {
    const res = await api.post("/sessions/group-sessions/join-by-code/", {
      code: (code || "").trim(),
    });
    return res.data; // { session_id, short_code, status, session_type, host_id }
  },

  async endSession(sessionId) {
    const res = await api.post(`/sessions/group-sessions/${sessionId}/end/`);
    return res.data;
  },

  async setAdmitMode(sessionId, mode) {
    const res = await api.post(
      `/sessions/group-sessions/${sessionId}/admit-mode/`,
      { admit_mode: mode }
    );
    return res.data;
  },

  // ─────────────────────────────────────────────
  // History cleanup (per-user soft delete)
  // ─────────────────────────────────────────────

  // Hide a single past session from MY history view. Doesn't touch the
  // session itself — the host and other participants still see it.
  async hideFromHistory(sessionId) {
    const res = await api.post(`/sessions/group-sessions/${sessionId}/hide/`);
    return res.data;
  },

  // Bulk-hide history entries. Call shapes:
  //   clearHistory({ all: true })            → hide all my history
  //   clearHistory({ sessionIds: ["uuid"] }) → hide only the listed set
  async clearHistory({ all = false, sessionIds = null } = {}) {
    const body = all ? { all: true } : { session_ids: sessionIds || [] };
    const res = await api.post(
      "/sessions/group-sessions/history/clear/",
      body,
    );
    return res.data;
  },
};

function transformGroupSession(sg) {
  if (!sg) return sg;
  return {
    ...sg,
    id: sg.id,
    shortCode: sg.short_code || "",
    sessionType: sg.session_type || "scheduled",
    admitMode: sg.admit_mode || "open",
    subjectId: sg.subject_id || null,
    subjectName: sg.subject_name,
    courseId: sg.course_id || null,
    courseTitle: sg.course_title,
    topic: sg.topic,
    hostName: sg.host_name || "",
    hostId: sg.host_id,
    invitedTeacher: sg.invited_teacher_name || null,
    invitedTeacherId: sg.invited_teacher_id || null,
    date: sg.scheduled_date,
    time: sg.scheduled_time,
    durationMinutes: sg.duration_minutes,
    maxInvitees: sg.max_invitees,
    status: sg.status,
    cancelReason: sg.cancel_reason || "",
    roomStartedAt: sg.room_started_at,
    endedAt: sg.ended_at,
    invites: (sg.invites || []).map((inv) => ({
      id: inv.id,
      userId: inv.user_id,
      name: inv.name,
      studentId: inv.student_id,
      role: inv.invite_role,
      status: inv.status,
      declineCount: inv.decline_count || 0,
      reinvitedAt: inv.reinvited_at || null,
      joinedAt: inv.joined_at || null,
      respondedAt: inv.responded_at || null,
    })),
    acceptedCount: sg.accepted_count || 0,
    pendingCount: sg.pending_count || 0,
    declinedCount: sg.declined_count || 0,
  };
}

// Extract the user-friendly message out of an axios error response.
// Handles DRF field errors, {"error": "..."}, {"detail": "..."}, and
// simple string responses.
export function extractApiError(err, fallback = "Something went wrong.") {
  const data = err?.response?.data;
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (data.error) return data.error;
  if (data.detail) return data.detail;
  if (typeof data === "object") {
    const parts = [];
    for (const [k, v] of Object.entries(data)) {
      const text = Array.isArray(v) ? v.join(" ") : String(v);
      parts.push(k === "non_field_errors" ? text : `${k}: ${text}`);
    }
    if (parts.length) return parts.join(" • ");
  }
  return fallback;
}

export const {
  getMyGroupSessions,
  getDetail,
  acceptInvite,
  declineInvite,
  unacceptInvite,
  joinRoom,
  createInstant,
  joinByCode,
  endSession,
  setAdmitMode,
  hideFromHistory,
  clearHistory,
} = groupSessionService;

export default groupSessionService;
