/**
 * FILE: TEACHER_UI/src/pages/StudyGroups.jsx
 *
 * Teacher-side Study Groups page: invitations + upcoming + history.
 * Teachers are invited as the (optional) subject expert of a student's
 * study group and can accept / decline / join.
 */

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import studyGroupService from "../api/studyGroupService";
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
  const m = {
    scheduled: "📅 Scheduled", live: "🔴 Live",
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

  useEffect(() => { setData(group); }, [group]);

  const myInvite = data.invites.find(
    (i) => currentUserId && String(i.userId) === String(currentUserId)
  );
  const myStatus = myInvite?.status || null;
  const accepted = data.invites.filter((i) => i.status === "accepted");
  const pending = data.invites.filter((i) => i.status === "pending");
  const declined = data.invites.filter((i) => i.status === "declined");

  const canJoin =
    myStatus === "accepted" &&
    (data.status === "live" ||
      (data.status === "scheduled" && accepted.length >= 1));

  const doAccept = async () => {
    setBusy(true); setErr("");
    try {
      const fresh = await studyGroupService.acceptInvite(data.id);
      setData(fresh); onChanged?.();
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to accept invite.");
    } finally { setBusy(false); }
  };

  const doDecline = async () => {
    setBusy(true); setErr("");
    try {
      const fresh = await studyGroupService.declineInvite(data.id);
      setData(fresh); onChanged?.();
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to decline invite.");
    } finally { setBusy(false); }
  };

  const enterRoom = async () => {
    setBusy(true); setErr("");
    try {
      await studyGroupService.joinRoom(data.id);
      navigate(`/teacher/study-group/live/${data.id}`);
    } catch (e) {
      setErr(e?.response?.data?.error || "Unable to join right now.");
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

      {myStatus === "pending" && data.status === "scheduled" && (
        <div className="tsg__inviteeBar">
          <button className="tsg__btnPrimary" disabled={busy} onClick={doAccept}>Accept Invite</button>
          <button className="tsg__btnGhost" disabled={busy} onClick={doDecline}>Decline</button>
        </div>
      )}
      {myStatus === "declined" && (
        <div className="tsg__inviteeNote">
          You declined this study group invite.
        </div>
      )}
    </div>
  );
}

export default function StudyGroups() {
  const [tab, setTab] = useState("invites"); // teachers usually arrive here from a notification
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    import("../api/apiClient").then(({ default: api }) => {
      api.get("/accounts/me/")
        .then((res) => setCurrentUserId(res.data?.id || null))
        .catch(() => setCurrentUserId(null));
    });
  }, []);

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
