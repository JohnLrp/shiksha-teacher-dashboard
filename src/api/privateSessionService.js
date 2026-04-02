/**
 * FILE: TEACHER_UI/src/api/privateSessionService.js
 *
 * Connects to sessions_app endpoints for teacher actions.
 * Endpoints: /api/sessions/... (NOT /api/private-sessions/)
 * Added transformSession() for consistent field names.
 * Fixed cancel to use /teacher-cancel/ endpoint.
 */

import api from "./apiClient";

const privateSessionService = {

  // ── Fetch lists ──
  async getSessions() {
    const res = await api.get("/sessions/teacher/sessions/");
    return (res.data || []).map(transformSession);
  },

  async getRequests() {
    const res = await api.get("/sessions/teacher/requests/");
    return (res.data || []).map(transformSession);
  },

  async getHistory() {
    const res = await api.get("/sessions/teacher/history/");
    return (res.data || []).map(transformSession);
  },

  // ── Detail ──
  async getSessionDetail(id) {
    const res = await api.get(`/sessions/${id}/`);
    return transformSession(res.data);
  },

  // ── Teacher actions ──
  async acceptRequest(id, data = {}) {
    const res = await api.post(`/sessions/${id}/accept/`, data);
    return transformSession(res.data);
  },

  async declineRequest(id, reason = "") {
    const res = await api.post(`/sessions/${id}/decline/`, { reason });
    return transformSession(res.data);
  },

  async rescheduleRequest(id, { new_date, new_time, duration, note = "" }) {
    const res = await api.post(`/sessions/${id}/reschedule/`, {
      scheduled_date: new_date,
      scheduled_time: new_time,
      reason: note,
    });
    return transformSession(res.data);
  },

  async startSession(id) {
    const res = await api.post(`/sessions/${id}/start/`);
    return transformSession(res.data);
  },

  async endSession(id) {
    const res = await api.post(`/sessions/${id}/end/`);
    return transformSession(res.data);
  },

  // Uses the teacher-cancel endpoint (not the student cancel)
  async cancelSession(id, reason = "") {
    const res = await api.post(`/sessions/${id}/teacher-cancel/`, { reason });
    return transformSession(res.data);
  },

  // ── Aliases (PrivateRequestDetail.jsx uses these names) ──
  async acceptSession(id, data = {}) {
    return privateSessionService.acceptRequest(id, data);
  },

  async declineSession(id, reason = "") {
    return privateSessionService.declineRequest(id, reason);
  },

  async rescheduleSession(id, payload) {
    return privateSessionService.rescheduleRequest(id, payload);
  },

  // ── LiveKit — join session ──
  async joinSession(sessionId) {
    const res = await api.post(`/sessions/${sessionId}/join/`);
    return res.data; // { livekit_url, token, room, role }
  },

  // Keep old name as alias for backward compat
  async getLiveKitToken(sessionId) {
    return privateSessionService.joinSession(sessionId);
  },

  // ── Availability (backend TBD — silently falls back) ──
  async getAvailability() {
    try {
      const res = await api.get("/sessions/teacher/availability/");
      return res.data;
    } catch {
      const defaults = {};
      ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach(d => { defaults[d] = []; });
      return defaults;
    }
  },

  async saveAvailability(data) {
    try {
      const res = await api.post("/sessions/teacher/availability/", data);
      return res.data;
    } catch {
      return { success: false };
    }
  },

  // ── Constants ──
  DAYS: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  SHORT_DAYS: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  TIME_SLOTS: [
    "9:00 AM – 11:00 AM",
    "11:00 AM – 1:00 PM",
    "2:00 PM – 4:00 PM",
    "4:00 PM – 6:00 PM",
    "6:00 PM – 8:00 PM",
  ],
};

/**
 * Transform backend response → consistent shape.
 * Keeps original fields AND adds normalized aliases.
 */
function transformSession(s) {
  if (!s) return s;
  return {
    ...s,
    _date: s.scheduled_date || s.date || "",
    _time: s.scheduled_time || s.time || "",
    _student: s.student_name || "",
    _teacher: s.teacher_name || "",
    _groupSize: s.group_strength || 0,
    _duration: s.duration_minutes || s.duration || "",
    _durationLabel: s.duration_minutes ? `${s.duration_minutes} minutes` : (s.duration || ""),
    _studentId: s.student_id || "",
    _participants: s.participants || [],
    teacher_name: s.teacher_name,
    student_name: s.student_name,
    scheduled_date: s.scheduled_date,
    scheduled_time: s.scheduled_time,
    duration_minutes: s.duration_minutes,
    group_strength: s.group_strength,
    reschedule_reason: s.reschedule_reason,
    rescheduled_date: s.rescheduled_date,
    rescheduled_time: s.rescheduled_time,
  };
}

// Named exports for files that use: import * as privateSessionService
export const {
  getSessions,
  getRequests,
  getHistory,
  getSessionDetail,
  acceptRequest,
  declineRequest,
  rescheduleRequest,
  startSession,
  endSession,
  cancelSession,
  acceptSession,
  declineSession,
  rescheduleSession,
  joinSession,
  getLiveKitToken,
  getAvailability,
  saveAvailability,
} = privateSessionService;

export const DAYS = privateSessionService.DAYS;
export const SHORT_DAYS = privateSessionService.SHORT_DAYS;
export const TIME_SLOTS = privateSessionService.TIME_SLOTS;

export default privateSessionService;