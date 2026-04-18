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

  return (
    <div className="tp-page">

      {/* ===== TOP CARD ===== */}
      <div className="tp-top-card">
        <div className="tp-top-left">
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
          <div className="tp-info">
            <h1 className="tp-name">{displayName || "Teacher"}</h1>
            <div className="tp-badges">
              {profile.highest_degree && profile.field_of_study && (
                <span className="tp-badge-item">
                  {profile.highest_degree} in {profile.field_of_study}
                </span>
              )}
              {profile.teaching_certifications?.map((cert, i) => (
                <span key={i} className="tp-badge-item">{cert}</span>
              ))}
            </div>
            {profile.experience_range && (
              <p className="tp-experience">{profile.experience_range} experience</p>
            )}
            <div className="tp-tags">
              {profile.is_approved && (
                <span className="tp-tag tp-tag--available">Available</span>
              )}
              {languages && (
                <span className="tp-tag tp-tag--lang">{languages}</span>
              )}
              {!languages && profile.employment_status && (
                <span className="tp-tag tp-tag--lang">{profile.employment_status}</span>
              )}
            </div>
          </div>
        </div>

        <div className="tp-top-right">
          {isEditing ? (
            <>
              <button className="tp-cancel-btn" onClick={handleCancel} disabled={saving}>
                Cancel
              </button>
              <button className="tp-save-btn" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
            </>
          ) : (
            <>
              <button className="tp-edit-btn" onClick={handleEdit}>
                Edit Profile
              </button>
              <button
                className="tp-private-btn"
                onClick={() => navigate("/teacher/private-details")}
              >
                Private Details
              </button>
            </>
          )}
        </div>
      </div>

      {/* ===== RATINGS — view only ===== */}
      {!isEditing && (
        <div className="tp-ratings-row">
          <div className="tp-rating-card">
            <h3>Overall Rating</h3>
            <div className="tp-rating-value">
              <span className="tp-star">&#9733;</span>
              <span className="tp-rating-number">
                {profile.rating ? profile.rating.toFixed(1) : "N/A"}
              </span>
              {profile.rating && <span className="tp-rating-max">/5.0</span>}
            </div>
            {profile.review_count > 0 && (
              <p className="tp-rating-count">{profile.review_count} Reviews</p>
            )}
            <p className="tp-rating-sub">Based on all student reviews</p>
          </div>

          <div className="tp-rating-card">
            <h3>Private Session Rating</h3>
            <div className="tp-rating-value">
              <span className="tp-star">&#9733;</span>
              <span className="tp-rating-number">
                {profile.private_rating ? profile.private_rating.toFixed(1) : "N/A"}
              </span>
              {profile.private_rating && <span className="tp-rating-max">/5.0</span>}
            </div>
            {profile.private_review_count > 0 && (
              <p className="tp-rating-count">{profile.private_review_count} Reviews</p>
            )}
            <p className="tp-rating-sub">Based on private session reviews</p>
          </div>
        </div>
      )}

      {/* ===== ABOUT ===== */}
      <div className="tp-section">
        <h2>About</h2>
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

      {/* ===== ACTIVE COURSES & SUBJECTS — view only ===== */}
      {!isEditing && (
        <div className="tp-two-col">
          <div className="tp-section">
            <h2>Active Courses</h2>
            {(() => {
              // Group assignments by "CourseTitle Board" to form one row per class
              const groups = {};
              classes.forEach(cls => {
                const key = [cls.courseTitle, cls.board].filter(Boolean).join(" ");
                if (!groups[key]) groups[key] = { courseTitle: cls.courseTitle, board: cls.board, subjects: [] };
                if (cls.subjectName) groups[key].subjects.push(cls.subjectName);
              });
              const rows = Object.values(groups);
              return rows.length > 0 ? (
                <div className="tp-list">
                  {rows.map((row, i) => (
                    <div key={i} className="tp-list-item">
                      <span className="tp-list-num">{i + 1})</span>
                      <strong>
                        {[row.courseTitle, row.board].filter(Boolean).join(" ")}
                      </strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="tp-empty">No active courses assigned.</p>
              );
            })()}
          </div>

          <div className="tp-section">
            <h2>Subjects</h2>
            {classes.length > 0 ? (
              <div className="tp-list">
                {classes.map((cls, i) => {
                  const meta = [cls.courseTitle, cls.board, cls.stream]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <div key={cls.subjectId ?? i} className="tp-list-item">
                      <span className="tp-list-num">{i + 1})</span>
                      <div>
                        <strong>{cls.subjectName}</strong>
                        {meta && (
                          <ul className="tp-sub-list">
                            <li>{meta}</li>
                          </ul>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="tp-empty">No subjects assigned.</p>
            )}
          </div>
        </div>
      )}

      {/* ===== PRIVATE SESSIONS ===== */}
      <div className="tp-section">
        <h2>Private Sessions</h2>
        <p className="tp-private-count">
          {sessionCount > 0
            ? `${sessionCount} Private Session${sessionCount !== 1 ? "s" : ""} taken`
            : "No Private Sessions yet"}
        </p>

        <div className="tp-priv-two-col">
          {/* Session Type Preferences */}
          <div className="tp-priv-col">
            <p className="tp-priv-label">Session Type (Preferences)</p>
            {isEditing ? (
              <div className="tp-pref-list">
                <div className="tp-pref-row">
                  <span className="tp-pref-name">One-on-One</span>
                  <button
                    className={`tp-toggle ${sessionOneOnOne ? "tp-toggle--on" : ""}`}
                    onClick={() => setSessionOneOnOne(v => !v)}
                    role="switch"
                    aria-checked={sessionOneOnOne}
                  >
                    <span className="tp-toggle-thumb" />
                  </button>
                </div>
                <div className="tp-pref-row">
                  <span className="tp-pref-name">Small Group (max)</span>
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
                </div>
              </div>
            ) : (
              <div className="tp-pref-list">
                {!hasSessionPrefs ? (
                  <p className="tp-no-prefs">No Preferences set</p>
                ) : (
                  <>
                    {profile.session_one_on_one && (
                      <div className="tp-pref-row-view">
                        <span className="tp-pref-dot" />
                        <span className="tp-pref-name">One-on-One</span>
                      </div>
                    )}
                    {profile.session_group_max && (
                      <div className="tp-pref-row-view">
                        <span className="tp-pref-dot" />
                        <span className="tp-pref-name">Small Group (max)</span>
                        <span className="tp-group-badge">{profile.session_group_max}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Session Availability */}
          <div className="tp-priv-col">
            <p className="tp-priv-label">Session Availability</p>
            {isEditing ? (
              <div className="tp-avail-edit">
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
              <div className="tp-avail-view">
                <div className="tp-avail-row-view">
                  <span className="tp-pref-dot" />
                  <span className="tp-avail-day-label">Weekdays:</span>
                  <span className={hasWeekdayAvail ? "tp-avail-time" : "tp-avail-not-set"}>
                    {hasWeekdayAvail
                      ? `${fmtTime(profile.weekday_availability_start)} – ${fmtTime(profile.weekday_availability_end)}`
                      : "Not yet set"}
                  </span>
                </div>
                <div className="tp-avail-row-view">
                  <span className="tp-pref-dot" />
                  <span className="tp-avail-day-label">Weekends:</span>
                  <span className={hasWeekendAvail ? "tp-avail-time" : "tp-avail-not-set"}>
                    {hasWeekendAvail
                      ? `${fmtTime(profile.weekend_availability_start)} – ${fmtTime(profile.weekend_availability_end)}`
                      : "Not yet set"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== SPECIALIZED SKILLS — view only ===== */}
      {!isEditing && profile.skill_applications?.length > 0 && (
        <div className="tp-section">
          <h2>Specialized Skill</h2>
          <div className="tp-skills-list">
            {profile.skill_applications.map((sk, i) => (
              <div key={i} className="tp-skill-item">
                <h4>{sk.skill_name}</h4>
                <p>{sk.skill_description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
