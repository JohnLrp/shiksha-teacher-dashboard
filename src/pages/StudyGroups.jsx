/**
 * FILE: TEACHER_UI/src/pages/StudyGroups.jsx
 *
 * Teacher-side Study Groups page: invitations + upcoming + history.
 * Teachers are invited as the (optional) subject expert of a student's
 * study group and can accept / decline / join.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import studyGroupService, { extractApiError } from "../api/studyGroupService";
import ConfirmDialog from "../components/ConfirmDialog";
import { useAuth } from "../contexts/AuthContext";
import "../styles/teacherStudyGroups.css";

function formatDate(d) {
  if (!d) return "TBD";
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
      weekday: "short", year: "numeric", month: "short", day: "numeric",
    });
  } catch { return d; }
}

function formatTime(t) {
  if (!t) return "TBD";
  try {
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  } catch { return t; }
}

function statusLabel(st) {
  // For the "live" state, the leading red dot is rendered by CSS (::before
  // on .tsg__statusPill--live) so the pill stays the same shape across
  // browsers/OS. Mirror of the student dashboard's statusLabel.
  const m = {
    scheduled: "📅 Scheduled", live: "Live",
    completed: "✔ Completed", cancelled: "✗ Cancelled", expired: "⏰ Expired",
  };
  return m[st] || st;
}

function Card({ group, onOpen }) {
  return (
    <div className={`tsg__card tsg__card--${group.status}`} onClick={() => onOpen(group)}>
      <div className="tsg__cardTop">
        <span className="tsg__cardSubject">{group.subjectName}</span>
        <span className={`tsg__statusPill tsg__statusPill--${group.status}`}>
          {statusLabel(group.status)}
        </span>
      </div>
      {group.courseTitle && <div className="tsg__cardCourse">{group.courseTitle}</div>}
      {group.topic && <div className="tsg__cardTopic">“{group.topic}”</div>}
      <div className="tsg__cardMetaRow">
        <span className="tsg__metaChip">👤 Host: {group.hostName}</span>
      </div>
      <div className="tsg__cardMetaRow">
        <span className="tsg__metaChip">📆 {formatDate(group.date)}</span>
        <span className="tsg__metaChip">🕑 {formatTime(group.time)}</span>
        <span className="tsg__metaChip">⏱ {group.durationMinutes} min</span>
      </div>
      <div className="tsg__cardCounts">
        <span className="tsg__countChip tsg__countChip--accepted">
          ✅ {group.acceptedCount} accepted
        </span>
        {group.pendingCount > 0 && (
          <span className="tsg__countChip tsg__countChip--pending">
            ⏳ {group.pendingCount} pending
          </span>
        )}
      </div>
    </div>
  );
}

function Detail({ group, currentUserId, onBack, onChanged }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [data, setData] = useState(group);
  const [dlg, setDlg] = useState(null);

  useEffect(() => { setData(group); }, [group]);

  const invitesList = Array.isArray(data.invites) ? data.invites : [];
  const myInvite = invitesList.find(
    (i) => currentUserId && String(i.userId) === String(currentUserId)
  );
  const myStatus = myInvite?.status || null;
  const accepted = invitesList.filter((i) => i.status === "accepted");
  const pending = invitesList.filter((i) => i.status === "pending");
  const declined = invitesList.filter((i) => i.status === "declined");

  // Response-window: can the teacher still Accept/Decline? Must be BEFORE
  // scheduled start time (mirrors backend gating in study_group_views.py).
  const scheduledAt = useMemo(() => {
    if (!data.date || !data.time) return null;
    // Assume the server-provided ISO-ish date + "HH:MM" time is in the
    // user's local browser tz — same approach used across the app.
    const iso = `${data.date}T${data.time}`;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  }, [data.date, data.time]);

  const isPast = scheduledAt ? scheduledAt.getTime() <= Date.now() : false;
  const roomOpened = Boolean(data.roomStartedAt);

  // Teachers can never start the room — only the host can. So Join is
  // gated on the host having actually opened the room (roomOpened) AND
  // the teacher having accepted their own invite (per-invitee accept).
  const canJoin = myStatus === "accepted" && data.status === "live" && roomOpened;

  const doAccept = async () => {
    setBusy(true); setErr("");
    try {
      const fresh = await studyGroupService.acceptInvite(data.id);
      setData(fresh); onChanged?.();
    } catch (e) {
      setErr(extractApiError(e, "Failed to accept invite."));
    } finally { setBusy(false); }
  };

  const doDecline = async () => {
    setBusy(true); setErr("");
    try {
      const fresh = await studyGroupService.declineInvite(data.id);
      setData(fresh); onChanged?.();
    } catch (e) {
      setErr(extractApiError(e, "Failed to decline invite."));
    } finally { setBusy(false); }
  };

  // Teacher flips their 'accepted' response back to 'pending'. Allowed any
  // time before the LiveKit room actually opens.
  const doUnaccept = async () => {
    setBusy(true); setErr("");
    try {
      const fresh = await studyGroupService.unacceptInvite(data.id);
      setData(fresh); onChanged?.();
      setDlg(null);
    } catch (e) {
      setErr(extractApiError(e, "Could not cancel your attendance."));
    } finally { setBusy(false); }
  };

  const confirmUnaccept = () => {
    setDlg({
      title: "Cancel your attendance?",
      message:
        "The host and other invitees will see you're no longer coming. " +
        "You can re-accept any time before the room opens.",
      confirmLabel: "Yes, cancel attendance",
      cancelLabel: "Keep attending",
      danger: true,
      busy: false,
      onConfirm: doUnaccept,
    });
  };

  const confirmDecline = () => {
    setDlg({
      title: "Decline this invite?",
      message:
        "You won't be able to join this study group unless the host sends a new invite.",
      confirmLabel: "Decline invite",
      cancelLabel: "Keep it",
      danger: true,
      busy: false,
      onConfirm: async () => {
        await doDecline();
        setDlg(null);
      },
    });
  };

  const enterRoom = async () => {
    setBusy(true); setErr("");
    try {
      await studyGroupService.joinRoom(data.id);
      navigate(`/teacher/study-group/live/${data.id}`);
    } catch (e) {
      setErr(extractApiError(e, "Unable to join right now."));
      setBusy(false);
    }
  };

  return (
    <div className="tsg__detail">
      <div className="tsg__detailBack">
        <button className="tsg__backBtn" onClick={onBack}>‹ Back to Study Groups</button>
      </div>

      <div className={`tsg__statusBar tsg__statusBar--${data.status}`}>
        <span>STATUS: {statusLabel(data.status)}</span>
        {canJoin && (
          <button className="tsg__joinBtn" disabled={busy} onClick={enterRoom}>
            JOIN ROOM
          </button>
        )}
      </div>

      {data.status === "cancelled" && (
        <div className="tsg__cancelBanner">
          <strong>This study group was cancelled by the host.</strong>
          {data.cancelReason && (
            <span className="tsg__cancelBannerReason">
              Reason: {data.cancelReason}
            </span>
          )}
        </div>
      )}

      {((data.status === "expired" && !roomOpened) ||
        (data.status === "scheduled" && isPast && !roomOpened)) && (
        <div className="tsg__cancelBanner tsg__cancelBanner--muted">
          <strong>Not attended.</strong>
          <span className="tsg__cancelBannerReason">
            The scheduled time has passed and nobody opened the room, so this
            study group has been moved to History.
          </span>
        </div>
      )}

      {err && <div className="tsg__errorBox">{err}</div>}

      <div className="tsg__detailBody">
        <div className="tsg__detailLeft">
          {[
            ["Subject", data.subjectName],
            ["Course", data.courseTitle || "—"],
            ["Topic", data.topic || "—"],
            ["Host (student)", data.hostName],
            ["Date", formatDate(data.date)],
            ["Time", formatTime(data.time)],
            ["Duration", `${data.durationMinutes} minutes`],
            ["Your role", "Invited Teacher"],
          ].map(([k, v]) => (
            <div key={k} className="tsg__detailRow">
              <span className="tsg__detailKey">{k}:</span>
              <span className="tsg__detailVal">{v}</span>
            </div>
          ))}
          {data.cancelReason && (
            <div className="tsg__detailRow">
              <span className="tsg__detailKey">Cancel reason:</span>
              <span className="tsg__detailVal">{data.cancelReason}</span>
            </div>
          )}
        </div>

        <div className="tsg__detailRight">
          <div className="tsg__sectionHead">Participants</div>
          <div className="tsg__participantList">
            <div className="tsg__participant tsg__participant--host">
              <span className="tsg__pAv">{(data.hostName || "?").charAt(0).toUpperCase()}</span>
              <div className="tsg__pInfo">
                <span className="tsg__pName">{data.hostName}</span>
                <span className="tsg__pRole">Host</span>
              </div>
            </div>
            {accepted.map((inv) => (
              <div key={inv.id} className="tsg__participant tsg__participant--accepted">
                <span className="tsg__pAv">{(inv.name || "?").charAt(0).toUpperCase()}</span>
                <div className="tsg__pInfo">
                  <span className="tsg__pName">{inv.name}</span>
                  <span className="tsg__pRole">
                    {inv.role === "teacher" ? "Teacher (accepted)" : "Accepted"}
                  </span>
                </div>
              </div>
            ))}
            {pending.map((inv) => (
              <div key={inv.id} className="tsg__participant tsg__participant--pending">
                <span className="tsg__pAv">{(inv.name || "?").charAt(0).toUpperCase()}</span>
                <div className="tsg__pInfo">
                  <span className="tsg__pName">{inv.name}</span>
                  <span className="tsg__pRole">
                    {inv.role === "teacher" ? "Teacher (pending)" : "Pending"}
                  </span>
                </div>
              </div>
            ))}
            {declined.map((inv) => (
              <div key={inv.id} className="tsg__participant tsg__participant--declined">
                <span className="tsg__pAv">{(inv.name || "?").charAt(0).toUpperCase()}</span>
                <div className="tsg__pInfo">
                  <span className="tsg__pName">{inv.name}</span>
                  <span className="tsg__pRole">Declined</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {myStatus === "pending" && data.status === "scheduled" && !isPast && (
        <div className="tsg__inviteeBar">
          <button className="tsg__btnPrimary" disabled={busy} onClick={doAccept}>
            Accept Invite
          </button>
          <button className="tsg__btnGhost" disabled={busy} onClick={confirmDecline}>
            Decline
          </button>
        </div>
      )}

      {myStatus === "pending" && data.status === "scheduled" && isPast && (
        <div className="tsg__inviteeNote tsg__inviteeNote--past">
          The scheduled start time has passed, so you can no longer respond to
          this invite. It will move to History automatically.
        </div>
      )}

      {myStatus === "accepted" &&
        data.status === "scheduled" &&
        !roomOpened && (
          <div className="tsg__inviteeBar">
            <span className="tsg__inviteeNote tsg__inviteeNote--inline">
              You're in. Waiting for the host to start the room — only the
              host can open it. You'll be able to join once they do.
            </span>
            <button
              className="tsg__btnGhost"
              disabled={busy}
              onClick={confirmUnaccept}
            >
              Cancel attendance
            </button>
          </div>
      )}

      {myStatus === "declined" && (
        <div className="tsg__inviteeNote">
          You declined this study group invite.
        </div>
      )}

      <ConfirmDialog
        dialog={dlg ? { ...dlg, busy } : null}
        onClose={() => (busy ? null : setDlg(null))}
      />
    </div>
  );
}

export default function StudyGroups() {
  const [tab, setTab] = useState("invites"); // teachers usually arrive here from a notification
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  // Use the shared AuthContext so currentUserId is the same identity the
  // backend used when issuing the invite. The previous ad-hoc /accounts/me/
  // fetch could lose to the initial render and leave myInvite unmatched,
  // hiding the Accept/Decline buttons on the teacher dashboard.
  const { user } = useAuth();
  const currentUserId = user?.id ? String(user.id) : null;

  const loadGroups = useCallback(async (target = tab) => {
    setLoading(true);
    try {
      const data = await studyGroupService.getMyStudyGroups(target);
      setGroups(data);
    } catch {
      setGroups([]);
    } finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { loadGroups(tab); }, [tab, loadGroups]);

  if (selected) {
    return (
      <div className="tsg__page">
        <Detail
          group={selected}
          currentUserId={currentUserId}
          onBack={() => { setSelected(null); loadGroups(tab); }}
          onChanged={() => loadGroups(tab)}
        />
      </div>
    );
  }

  return (
    <div className="tsg__page">
      <div className="tsg__header">
        <h2 className="tsg__title">Study Groups</h2>
        <div className="tsg__tabs">
          <button
            className={`tsg__tab ${tab === "invites" ? "active" : ""}`}
            onClick={() => setTab("invites")}
          >Invitations</button>
          <button
            className={`tsg__tab ${tab === "upcoming" ? "active" : ""}`}
            onClick={() => setTab("upcoming")}
          >Upcoming</button>
          <button
            className={`tsg__tab ${tab === "history" ? "active" : ""}`}
            onClick={() => setTab("history")}
          >History</button>
        </div>
      </div>

      {loading ? (
        <div className="tsg__loading">Loading study groups…</div>
      ) : groups.length === 0 ? (
        <div className="tsg__empty">
          {tab === "invites" && "No pending study group invitations."}
          {tab === "upcoming" && "No upcoming study groups."}
          {tab === "history" && "No past study groups yet."}
        </div>
      ) : (
        <div className="tsg__grid">
          {groups.map((g) => (
            <Card key={g.id} group={g} onOpen={setSelected} />
          ))}
        </div>
      )}
    </div>
  );
}
