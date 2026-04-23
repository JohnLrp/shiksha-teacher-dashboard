/**
 * FILE: TEACHER_UI/src/api/studyGroupService.js
 *
 * Teacher-side client for Study Groups.
 * Teachers are only invitees of study groups — they can:
 *   - view invitations (pending)
 *   - accept / decline
 *   - view upcoming / history
 *   - join the live room (same /join/ endpoint)
 *
 * Backend: /api/sessions/study-groups/...
 */

import api from "./apiClient";

const studyGroupService = {

  async getMyStudyGroups(tab = "upcoming") {
    const res = await api.get(
      `/sessions/study-groups/mine/?tab=${encodeURIComponent(tab)}`
    );
    return (res.data || []).map(transformStudyGroup);
  },

  async getDetail(sessionId) {
    const res = await api.get(`/sessions/study-groups/${sessionId}/`);
    return transformStudyGroup(res.data);
  },

  async acceptInvite(sessionId) {
    const res = await api.post(`/sessions/study-groups/${sessionId}/accept/`);
    return transformStudyGroup(res.data);
  },

  async declineInvite(sessionId) {
    const res = await api.post(`/sessions/study-groups/${sessionId}/decline/`);
    return transformStudyGroup(res.data);
  },

  async joinRoom(sessionId) {
    const res = await api.post(`/sessions/study-groups/${sessionId}/join/`);
    return res.data;
  },
};

function transformStudyGroup(sg) {
  if (!sg) return sg;
  return {
    ...sg,
    id: sg.id,
    subjectName: sg.subject_name,
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

export const {
  getMyStudyGroups,
  getDetail,
  acceptInvite,
  declineInvite,
  joinRoom,
} = studyGroupService;

export default studyGroupService;
