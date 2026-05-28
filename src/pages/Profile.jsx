import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCamera } from "react-icons/fi";
import api from "../api/apiClient";
import privateSessionService from "../api/privateSessionService";
import "../styles/profile.css";

function fmtTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hr = parseInt(h, 10);
  if (isNaN(hr)) return t;
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? "p.m." : "a.m."}`;
}

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [classes, setClasses] = useState([]);

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const avatarInputRef = useRef(null);

  const [editBio, setEditBio] = useState("");
  const [sessionOneOnOne, setSessionOneOnOne] = useState(false);
  const [sessionGroupMax, setSessionGroupMax] = useState(10);
  const [weekdayStart, setWeekdayStart] = useState("");
  const [weekdayEnd, setWeekdayEnd] = useState("");
  const [weekendStart, setWeekendStart] = useState("");
  const [weekendEnd, setWeekendEnd] = useState("");

  const populateEditFields = (p) => {
    setEditBio(p.bio || "");
    setSessionOneOnOne(p.session_one_on_one ?? false);
    setSessionGroupMax(p.session_group_max ?? 10);
    setWeekdayStart(p.weekday_availability_start || "");
    setWeekdayEnd(p.weekday_availability_end || "");
    setWeekendStart(p.weekend_availability_start || "");
    setWeekendEnd(p.weekend_availability_end || "");
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pickText = (...vals) =>
          vals.find(v => typeof v === "string" && v.trim()) || "";

        const [profileRes, historyRes, classesRes] = await Promise.all([
          api.get("/accounts/teacher/profile/"),
          api.get("/sessions/teacher/history/").catch(() => ({ data: [] })),
          api.get("/courses/teacher/my-classes/").catch(() => ({ data: [] })),
        ]);
        const p = profileRes.data;
        setProfile(p);
        setSessionCount(Array.isArray(historyRes.data) ? historyRes.data.length : 0);
        populateEditFields(p);

        const normalized = (classesRes.data || []).map(c => ({
          subjectId:   c.subject_id || c.id,
          subjectName: pickText(c.subject_name, c.name),
          courseTitle: pickText(c.course_title, c.class_name, c.course),
          board:       pickText(c.board, c.board_name, c.board_title, c.board?.name),
          stream:      pickText(c.stream, c.stream_name, c.stream_title, c.stream?.name),
        }));
        setClasses(normalized);
      } catch (err) {
        console.error(err);
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleEdit = () => {
    if (profile) populateEditFields(profile);
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (profile) populateEditFields(profile);
    setAvatarFile(null);
    setAvatarPreview(null);
    setIsEditing(false);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleSave = async () => {
    setSaving(true);

    const updates = {
      bio: editBio,
      session_one_on_one: sessionOneOnOne,
      session_group_max: sessionGroupMax,
      weekday_availability_start: weekdayStart,
      weekday_availability_end: weekdayEnd,
      weekend_availability_start: weekendStart,
      weekend_availability_end: weekendEnd,
    };

    try {
      if (avatarFile) {
        const formData = new FormData();
        formData.append("photo", avatarFile);
        Object.entries(updates).forEach(([k, v]) => {
          if (v !== null && v !== undefined) formData.append(k, v);
        });
        const res = await api.patch("/accounts/teacher/profile/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (res.data?.photo) updates.photo = res.data.photo;
        else updates.photo = avatarPreview;

        if (updates.photo) {
          localStorage.setItem("avatar", updates.photo);
          window.dispatchEvent(new CustomEvent("avatar-updated", { detail: updates.photo }));
        }
      } else {
        await api.patch("/accounts/teacher/profile/", updates);
      }
    } catch (err) {
      console.error("Failed to save profile:", err);
      if (avatarPreview) updates.photo = avatarPreview;
    }

    setProfile(prev => ({ ...prev, ...updates }));
    populateEditFields({ ...profile, ...updates });
    setAvatarFile(null);
    setAvatarPreview(null);
    setSaving(false);
    setIsEditing(false);
  };

  if (loading) {
    return <div className="tp-page"><p className="tp-loading">Loading profile...</p></div>;
  }

  if (error || !profile) {
    return <div className="tp-page"><p className="tp-error">{error || "Profile not found."}</p></div>;
  }

  const prefix =
    profile.gender === "female" ? "Miss" :
    profile.gender === "male" ? "Mr." : "";
  const displayName = prefix ? `${prefix} ${profile.name}` : profile.name;

  const languages =
    profile.languages?.join(", ") ||
    profile.spoken_languages?.join(", ") ||
    "";

  const hasSessionPrefs = profile.session_one_on_one || profile.session_group_max;
  const hasWeekdayAvail = profile.weekday_availability_start && profile.weekday_availability_end;
  const hasWeekendAvail = profile.weekend_availability_start && profile.weekend_availability_end;

  // Compute a single-line credentials string (Figma style):
  //  "M.Sc. in Physics, B.Ed  ·  CTET, State TET  ·  10+ years experience"
  const credParts = [];
  if (profile.highest_degree && profile.field_of_study) {
    credParts.push(`${profile.highest_degree} in ${profile.field_of_study}`);
  } else if (profile.highest_degree) {
    credParts.push(profile.highest_degree);
  }
  if (profile.teaching_certifications?.length) {
    credParts.push(profile.teaching_certifications.join(", "));
  }
  if (profile.experience_range) {
    credParts.push(`${profile.experience_range} experience`);
  }
  const credLine = credParts.join("  ·  ");

  return (
    <div className="tp-page">

      {/* ═══════════════════════════════════════════════════
          TOP CARD — avatar, name, credentials, pills, actions
      ═══════════════════════════════════════════════════ */}
      <div className="tp-card tp-top-card">
        <div className="tp-top-inner">
          <div className="tp-avatar-wrap">
            <div className="tp-avatar">
              {(avatarPreview || profile.photo)
                ? <img src={avatarPreview || profile.photo} alt={profile.name} />
                : <span className="tp-avatar-placeholder">{profile.name?.charAt(0) || "T"}</span>
              }
            </div>
            {isEditing && (
              <>
                <button
                  type="button"
                  className="tp-avatar-edit-btn"
                  onClick={() => avatarInputRef.current?.click()}
                  title="Change photo"
                >
                  <FiCamera />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleAvatarChange}
                />
              </>
            )}
          </div>

          <div className="tp-top-text">
            <h1 className="tp-name">{displayName || "Teacher"}</h1>
            {credLine && <p className="tp-credentials">{credLine}</p>}
            <div className="tp-pills">
              {profile.is_approved && (
                <span className="tp-pill tp-pill--available">
                  <span className="tp-pill-dot" />
                  available for session
                </span>
              )}
              {languages && (
                <span className="tp-pill tp-pill--lang">{languages}</span>
              )}
              {!languages && profile.employment_status && (
                <span className="tp-pill tp-pill--lang">{profile.employment_status}</span>
              )}
            </div>
          </div>

          <div className="tp-top-actions">
            {isEditing ? (
              <>
                <button className="tp-btn tp-btn--ghost" onClick={handleCancel} disabled={saving}>
                  Cancel
                </button>
                <button className="tp-btn tp-btn--primary" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </button>
              </>
            ) : (
              <>
                <button className="tp-btn tp-btn--ghost" onClick={handleEdit}>
                  Edit Profile
                </button>
                <button
                  className="tp-btn tp-btn--primary"
                  onClick={() => navigate("/teacher/private-details")}
                >
                  Private Details
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          RATINGS ROW — two cards side-by-side
      ═══════════════════════════════════════════════════ */}
      {!isEditing && (
        <div className="tp-ratings-row">
          <div className="tp-card tp-rating-card">
            <h3 className="tp-card-title">OVERALL RATING</h3>
            <div className="tp-rating-value">
              <span className="tp-star">★</span>
              <span className="tp-rating-number">
                {profile.rating ? profile.rating.toFixed(1) : "N/A"}
              </span>
              {profile.rating && <span className="tp-rating-max">/5.0</span>}
            </div>
            <p className="tp-rating-sub">
              {profile.review_count > 0
                ? `${profile.review_count} student reviews combined`
                : "All student reviews combined"}
            </p>
          </div>

          <div className="tp-card tp-rating-card">
            <h3 className="tp-card-title">PRIVATE SESSION RATING</h3>
            <div className="tp-rating-value">
              <span className="tp-star">★</span>
              <span className="tp-rating-number">
                {profile.private_rating ? profile.private_rating.toFixed(1) : "N/A"}
              </span>
              {profile.private_rating && <span className="tp-rating-max">/5.0</span>}
            </div>
            <p className="tp-rating-sub">
              {sessionCount > 0
                ? `${sessionCount}+ private sessions conducted`
                : "Private session reviews"}
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          ABOUT
      ═══════════════════════════════════════════════════ */}
      <div className="tp-card tp-section-card">
        <h2 className="tp-card-title">ABOUT</h2>
        {isEditing ? (
          <textarea
            className="tp-about-textarea"
            placeholder="Add a short bio to introduce yourself"
            value={editBio}
            onChange={(e) => setEditBio(e.target.value)}
            rows={4}
          />
        ) : (
          profile.bio
            ? <p className="tp-about-text">{profile.bio}</p>
            : <p className="tp-about-placeholder">Add a short bio to introduce yourself</p>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════
          SUBJECTS AND CLASSES
      ═══════════════════════════════════════════════════ */}
      {!isEditing && (
        <div className="tp-card tp-section-card">
          <h2 className="tp-card-title">SUBJECTS AND CLASSES</h2>
          {classes.length > 0 ? (
            <div className="tp-subjects-grid">
              {classes.map((cls, i) => {
                const meta = [cls.courseTitle, cls.board, cls.stream]
                  .filter(Boolean).join(" · ");
                return (
                  <div key={cls.subjectId ?? i} className="tp-subject-chip">
                    <div className="tp-subject-name">{cls.subjectName}</div>
                    {meta && <div className="tp-subject-meta">{meta}</div>}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="tp-empty">No subjects assigned.</p>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          PRIVATE SESSIONS + SPECIALIZED SKILLS (combined card)
      ═══════════════════════════════════════════════════ */}
      <div className="tp-card tp-section-card">
        <h2 className="tp-card-title">PRIVATE SESSIONS</h2>

        {/* Table-style key/value rows */}
        <div className="tp-ps-table">
          <div className="tp-ps-row">
            <span className="tp-ps-label">Session Type</span>
            <span className="tp-ps-value">
              {isEditing ? (
                <div className="tp-ps-edit-inline">
                  <label className="tp-ps-check">
                    <input
                      type="checkbox"
                      checked={sessionOneOnOne}
                      onChange={() => setSessionOneOnOne(v => !v)}
                    />
                    <span>One-on-One</span>
                  </label>
                  <label className="tp-ps-check">
                    <span>Small Group (max</span>
                    <input
                      type="number"
                      className="tp-group-input"
                      value={sessionGroupMax}
                      min={1}
                      max={99}
                      onChange={(e) =>
                        setSessionGroupMax(Math.max(1, parseInt(e.target.value) || 1))
                      }
                    />
                    <span>)</span>
                  </label>
                </div>
              ) : (
                !hasSessionPrefs
                  ? <span className="tp-ps-muted">Not set</span>
                  : [
                      profile.session_one_on_one && "One on one",
                      profile.session_group_max && `small groups (max ${profile.session_group_max})`,
                    ].filter(Boolean).join(" & ")
              )}
            </span>
          </div>

          <div className="tp-ps-row">
            <span className="tp-ps-label">Hourly Rate</span>
            <span className="tp-ps-value">
              {profile.hourly_rate
                ? `Rs.${profile.hourly_rate} / hour`
                : <span className="tp-ps-muted">Contact for pricing</span>}
            </span>
          </div>

          <div className="tp-ps-row">
            <span className="tp-ps-label">Availability</span>
            <span className="tp-ps-value">
              {isEditing ? (
                <div className="tp-avail-edit-stack">
                  <div className="tp-avail-row">
                    <span className="tp-avail-day-label">Weekdays</span>
                    <select
                      className="tp-avail-select"
                      value={weekdayStart}
                      onChange={e => setWeekdayStart(e.target.value)}
                    >
                      <option value="">Start</option>
                      {privateSessionService.TIME_SLOTS.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    <span className="tp-avail-dash">–</span>
                    <select
                      className="tp-avail-select"
                      value={weekdayEnd}
                      onChange={e => setWeekdayEnd(e.target.value)}
                    >
                      <option value="">End</option>
                      {privateSessionService.TIME_SLOTS.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="tp-avail-row">
                    <span className="tp-avail-day-label">Weekends</span>
                    <select
                      className="tp-avail-select"
                      value={weekendStart}
                      onChange={e => setWeekendStart(e.target.value)}
                    >
                      <option value="">Start</option>
                      {privateSessionService.TIME_SLOTS.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    <span className="tp-avail-dash">–</span>
                    <select
                      className="tp-avail-select"
                      value={weekendEnd}
                      onChange={e => setWeekendEnd(e.target.value)}
                    >
                      <option value="">End</option>
                      {privateSessionService.TIME_SLOTS.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <span>
                  {hasWeekdayAvail && `Weekday ${fmtTime(profile.weekday_availability_start)}-${fmtTime(profile.weekday_availability_end)}`}
                  {hasWeekdayAvail && hasWeekendAvail && ", "}
                  {hasWeekendAvail && `Weekends ${fmtTime(profile.weekend_availability_start)}-${fmtTime(profile.weekend_availability_end)}`}
                  {!hasWeekdayAvail && !hasWeekendAvail && <span className="tp-ps-muted">Not yet set</span>}
                </span>
              )}
            </span>
          </div>

          <div className="tp-ps-row tp-ps-row--last">
            <span className="tp-ps-label">Total Sessions</span>
            <span className="tp-ps-value">
              {sessionCount > 0 ? `${sessionCount}+` : "0"}
            </span>
          </div>
        </div>

        {/* Specialized Skills sub-section */}
        {!isEditing && profile.skill_applications?.length > 0 && (
          <>
            <h2 className="tp-card-title tp-card-title--spaced">SPECIALIZED SKILLS</h2>
            <div className="tp-skills-list">
              {profile.skill_applications.map((sk, i) => (
                <div
                  key={i}
                  className={`tp-skill-item ${i < profile.skill_applications.length - 1 ? "tp-skill-item--divider" : ""}`}
                >
                  <h4 className="tp-skill-title">{sk.skill_name}</h4>
                  <p className="tp-skill-desc">{sk.skill_description}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════
          RECENT REVIEWS (view only)
      ═══════════════════════════════════════════════════ */}
      {!isEditing && profile.recent_reviews?.length > 0 && (
        <div className="tp-card tp-section-card">
          <h2 className="tp-card-title">RECENT REVIEWS</h2>
          <div className="tp-reviews-list">
            {profile.recent_reviews.map((rv, i) => (
              <div key={i} className="tp-review-box">
                <p className="tp-review-quote">&ldquo;{rv.comment || rv.text}&rdquo;</p>
                <p className="tp-review-meta">
                  <span className="tp-review-stars">
                    {"★".repeat(Math.round(rv.rating || 5))}
                    {"☆".repeat(5 - Math.round(rv.rating || 5))}
                  </span>
                  {"  "}
                  {rv.student_name || rv.reviewer}
                  {rv.session_type && ` · ${rv.session_type}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          ACTIVE COURSES (view only)
      ═══════════════════════════════════════════════════ */}
      {!isEditing && (
        <div className="tp-card tp-section-card">
          <h2 className="tp-card-title">ACTIVE COURSES</h2>
          {(() => {
            const groups = {};
            classes.forEach(cls => {
              const key = [cls.courseTitle, cls.board].filter(Boolean).join(" ");
              if (!groups[key]) groups[key] = {
                courseTitle: cls.courseTitle,
                board: cls.board,
                subjects: [],
                status: cls.status || "Enrolled",
              };
              if (cls.subjectName) groups[key].subjects.push(cls.subjectName);
            });
            const rows = Object.values(groups);
            return rows.length > 0 ? (
              <div className="tp-courses-list">
                {rows.map((row, i) => {
                  const title = row.subjects.length
                    ? `${row.subjects.join(", ")} - ${[row.courseTitle, row.board && `(${row.board})`].filter(Boolean).join(" ")}`
                    : [row.courseTitle, row.board && `(${row.board})`].filter(Boolean).join(" ");
                  const isUpcoming = (row.status || "").toLowerCase() === "upcoming";
                  return (
                    <div
                      key={i}
                      className={`tp-course-row ${i < rows.length - 1 ? "tp-course-row--divider" : ""}`}
                    >
                      <span className="tp-course-name">{title}</span>
                      <span className={`tp-course-status ${isUpcoming ? "tp-course-status--upcoming" : "tp-course-status--enrolled"}`}>
                        {row.status || "Enrolled"}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="tp-empty">No active courses assigned.</p>
            );
          })()}
        </div>
      )}
    </div>
  );
}
