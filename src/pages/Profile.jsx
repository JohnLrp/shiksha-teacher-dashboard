import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/apiClient";
import "../styles/profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/accounts/teacher/profile/");
        setProfile(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="tp-page">
        <p className="tp-loading">Loading profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="tp-page">
        <p className="tp-error">{error || "Profile not found."}</p>
      </div>
    );
  }

  const prefix =
    profile.gender === "female" ? "Miss" :
    profile.gender === "male" ? "Mr." : "";

  const displayName = prefix ? `${prefix} ${profile.name}` : profile.name;

  return (
    <div className="tp-page">

      {/* ===== TOP CARD ===== */}
      <div className="tp-top-card">
        <div className="tp-top-left">
          <div className="tp-avatar">
            {profile.photo ? (
              <img src={profile.photo} alt={profile.name} />
            ) : (
              <span className="tp-avatar-placeholder">
                {profile.name?.charAt(0) || "T"}
              </span>
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
              <p className="tp-experience">
                {profile.experience_range} experience
              </p>
            )}

            <div className="tp-tags">
              {profile.is_approved && (
                <span className="tp-tag approved">Approved</span>
              )}
              {profile.employment_status && (
                <span className="tp-tag employment">{profile.employment_status}</span>
              )}
            </div>
          </div>
        </div>

        <div className="tp-top-right">
          <button
            className="tp-edit-btn"
            onClick={() => window.location.href = (import.meta.env.VITE_HOME_URL || "https://www.shikshacom.com") + "/form-fillup"}
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* ===== RATING SECTION ===== */}
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
          <p className="tp-rating-sub">Based on all student reviews</p>
        </div>

        <div className="tp-rating-card">
          <h3>Private Session Rating</h3>
          <div className="tp-rating-value">
            <span className="tp-star">&#9733;</span>
            <span className="tp-rating-number">N/A</span>
          </div>
          <p className="tp-rating-sub">Coming soon</p>
        </div>
      </div>

      {/* ===== ABOUT ===== */}
      {profile.bio && (
        <div className="tp-section">
          <h2>About</h2>
          <p className="tp-about-text">{profile.bio}</p>
        </div>
      )}

      {/* ===== COURSES & SUBJECTS ===== */}
      <div className="tp-two-col">
        <div className="tp-section">
          <h2>Active Courses</h2>
          {profile.active_courses?.length > 0 ? (
            <div className="tp-list">
              {profile.active_courses.map((course, i) => (
                <div key={i} className="tp-list-item">
                  <span className="tp-list-num">{i + 1})</span>
                  <div>
                    <strong>{course.title}</strong>
                    <ul className="tp-sub-list">
                      {course.subjects.map((s, j) => (
                        <li key={j}>{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="tp-empty">No active courses assigned.</p>
          )}
        </div>

        <div className="tp-section">
          <h2>Subjects</h2>
          {profile.course_applications?.length > 0 ? (
            <div className="tp-list">
              {profile.course_applications.map((ca, i) => (
                <div key={i} className="tp-list-item">
                  <span className="tp-list-num">{i + 1})</span>
                  <div>
                    <strong>{ca.subject} ({ca.boards?.join(", ")})</strong>
                    <ul className="tp-sub-list">
                      {ca.classes?.map((c, j) => (
                        <li key={j}>Class {c}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="tp-empty">No subjects applied for.</p>
          )}
        </div>
      </div>

      {/* ===== SKILL APPLICATIONS ===== */}
      {profile.skill_applications?.length > 0 && (
        <div className="tp-section">
          <h2>Specialized Skills</h2>
          <div className="tp-skills-grid">
            {profile.skill_applications.map((sk, i) => (
              <div key={i} className="tp-skill-card">
                <h4>{sk.skill_name}</h4>
                <p>{sk.skill_description}</p>
                <span className="tp-tag employment">{sk.skill_related_subject}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
