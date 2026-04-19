import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiLock, FiCalendar, FiFileText, FiChevronDown, FiX } from "react-icons/fi";
import api from "../api/apiClient";
import "../styles/profile.css";
import "../styles/private-details.css";

function formatDob(dob) {
  if (!dob) return "";
  const d = new Date(dob);
  if (isNaN(d.getTime())) return dob;
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

function getFileName(url) {
  if (!url || typeof url !== "string") return null;
  return decodeURIComponent(url.split("/").pop());
}

function FileDisplay({ file, size }) {
  const name = getFileName(file);
  if (!name) return <div className="pd-value pd-value--muted">—</div>;
  return (
    <div className="pd-file-item">
      <FiFileText className="pd-file-svg" />
      <span className="pd-file-name">{name}</span>
      {size && <span className="pd-file-size">({size})</span>}
    </div>
  );
}

function CheckList({ items }) {
  if (!items || items.length === 0)
    return <div className="pd-value pd-value--muted">—</div>;
  return (
    <div className="pd-checks-row">
      {items.map((item) => (
        <label key={item} className="pd-check-item">
          <input type="checkbox" checked readOnly className="pd-checkbox" />
          <span>{item}</span>
        </label>
      ))}
    </div>
  );
}

const DEGREE_OPTIONS = [
  "High School / Secondary",
  "Diploma",
  "Bachelor's Degree",
  "Master's Degree",
  "PhD / Doctorate",
  "Other",
];

const CERT_OPTIONS = ["B.Ed", "M.Ed", "CTET", "State TET", "Other"];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from(
  { length: currentYear - 1950 + 1 },
  (_, i) => currentYear - i
);

export default function PrivateDetails() {
  const navigate = useNavigate();
  const qualFileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Basic Details
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editGender, setEditGender] = useState("");

  // Address
  const [editState, setEditState] = useState("");
  const [editDistrict, setEditDistrict] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editPinCode, setEditPinCode] = useState("");

  // Educational Qualifications
  const [editHighestDegree, setEditHighestDegree] = useState("");
  const [editFieldOfStudy, setEditFieldOfStudy] = useState("");
  const [editYearOfCompletion, setEditYearOfCompletion] = useState("");
  const [editTeachingCerts, setEditTeachingCerts] = useState([]);
  const [editQualFile, setEditQualFile] = useState(null);
  const [editQualFileRemoved, setEditQualFileRemoved] = useState(false);

  const populateEditFields = (p) => {
    setEditFirstName(p.first_name || "");
    setEditLastName(p.last_name || "");
    setEditPhone(p.phone || p.phone_number || "");
    setEditDob(p.date_of_birth || p.dob || "");
    setEditGender(p.gender || "");
    setEditState(p.state || "");
    setEditDistrict(p.district || "");
    setEditCity(p.city || "");
    setEditPinCode(p.pin_code || "");
    setEditHighestDegree(p.highest_degree || "");
    setEditFieldOfStudy(p.field_of_study || "");
    setEditYearOfCompletion(p.year_of_completion || "");
    setEditTeachingCerts(p.teaching_certifications || []);
    setEditQualFile(null);
    setEditQualFileRemoved(false);
  };

  useEffect(() => {
    api.get("/accounts/teacher/profile/")
      .then((res) => {
        setProfile(res.data);
        populateEditFields(res.data);
      })
      .catch(() => setError("Failed to load private details."))
      .finally(() => setLoading(false));
  }, []);

  const handleEdit = () => {
    if (profile) populateEditFields(profile);
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (profile) populateEditFields(profile);
    setIsEditing(false);
  };

  const toggleCert = (cert) => {
    setEditTeachingCerts((prev) =>
      prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert]
    );
  };

  const handleQualFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setEditQualFile(file);
    e.target.value = "";
  };

  const handleSave = async () => {
    setSaving(true);
    const updates = {
      first_name: editFirstName,
      last_name: editLastName,
      phone: editPhone,
      date_of_birth: editDob,
      gender: editGender,
      state: editState,
      district: editDistrict,
      city: editCity,
      pin_code: editPinCode,
      highest_degree: editHighestDegree,
      field_of_study: editFieldOfStudy,
      year_of_completion: editYearOfCompletion,
      teaching_certifications: editTeachingCerts,
    };
    try {
      await api.patch("/accounts/teacher/profile/", updates);
      setProfile((prev) => ({ ...prev, ...updates }));

      if (editQualFile) {
        const formData = new FormData();
        formData.append("qualification_certificate", editQualFile);
        const res = await api.patch("/accounts/teacher/profile/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setProfile(res.data);
      } else if (editQualFileRemoved) {
        const res = await api.patch("/accounts/teacher/profile/", {
          qualification_certificate: null,
        });
        setProfile(res.data);
      }
    } catch (err) {
      console.error("Failed to save private details:", err);
    }
    setSaving(false);
    setIsEditing(false);
  };

  if (loading) {
    return <div className="tp-page"><p className="tp-loading">Loading...</p></div>;
  }

  if (error || !profile) {
    return <div className="tp-page"><p className="tp-error">{error || "Profile not found."}</p></div>;
  }

  const prefix =
    profile.gender === "female" ? "Miss" :
    profile.gender === "male" ? "Mr." : "";
  const displayName = prefix ? `${prefix} ${profile.name}` : (profile.name || "Teacher");

  const languages =
    profile.languages?.join(", ") ||
    profile.spoken_languages?.join(", ") ||
    "";

  const phone = profile.phone || profile.phone_number || "";
  const dob = profile.date_of_birth || profile.dob || "";
  const gender = profile.gender
    ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)
    : "";

  const skills = profile.skill_applications || [];

  const existingQualFile = !editQualFileRemoved
    ? (profile.qualification_certificate || null)
    : null;

  return (
    <div className="tp-page">

      {/* TOP CARD */}
      <div className="tp-top-card">
        <div className="tp-top-left">
          <div className="tp-avatar-wrap">
            <div className="tp-avatar">
              {profile.photo
                ? <img src={profile.photo} alt={profile.name} />
                : <span className="tp-avatar-placeholder">{profile.name?.charAt(0) || "T"}</span>
              }
            </div>
          </div>
          <div className="tp-info">
            <h1 className="tp-name">{displayName}</h1>
            <div className="tp-tags">
              {profile.is_approved && (
                <span className="tp-tag tp-tag--available">Available</span>
              )}
              {languages && (
                <span className="tp-tag tp-tag--lang">{languages}</span>
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
              <button className="tp-cancel-btn" onClick={() => navigate("/teacher/profile")}>
                Back
              </button>
              <button className="tp-edit-btn" onClick={handleEdit}>
                Edit Profile
              </button>
            </>
          )}
        </div>
      </div>

      {/* DETAILS CONTENT */}
      <div className="pd-content">

        {/* Basic Details */}
        <div className="pd-section">
          <h2 className="pd-section-title">Basic Details</h2>
          <div className="pd-grid">

            <div className="pd-field pd-full-width">
              <label className="pd-label">Username</label>
              <div className="pd-value pd-value--muted">{profile.username || "—"}</div>
            </div>

            <div className="pd-field">
              <label className="pd-label">First Name</label>
              {isEditing ? (
                <input
                  className="pd-input"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  placeholder="First name"
                />
              ) : (
                <div className="pd-value">{profile.first_name || "—"}</div>
              )}
            </div>

            <div className="pd-field">
              <label className="pd-label">Last Name</label>
              {isEditing ? (
                <input
                  className="pd-input"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  placeholder="Last name"
                />
              ) : (
                <div className="pd-value">{profile.last_name || "—"}</div>
              )}
            </div>

            <div className="pd-field">
              <label className="pd-label">Email</label>
              <div className="pd-value-row">
                <span className="pd-value-text">{profile.email || "—"}</span>
                <FiLock className="pd-field-icon" />
              </div>
            </div>

            <div className="pd-field">
              <label className="pd-label">Phone Number</label>
              {isEditing ? (
                <input
                  className="pd-input"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="Phone number"
                />
              ) : (
                <div className="pd-value">{phone || "—"}</div>
              )}
            </div>

            <div className="pd-field">
              <label className="pd-label">Date of Birth</label>
              {isEditing ? (
                <input
                  className="pd-input"
                  type="date"
                  value={editDob}
                  onChange={(e) => setEditDob(e.target.value)}
                />
              ) : (
                <div className="pd-value-row">
                  <span className="pd-value-text">{formatDob(dob) || "—"}</span>
                  <FiCalendar className="pd-field-icon" />
                </div>
              )}
            </div>

            <div className="pd-field">
              <label className="pd-label">Gender</label>
              {isEditing ? (
                <select
                  className="pd-input"
                  value={editGender}
                  onChange={(e) => setEditGender(e.target.value)}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              ) : (
                <div className="pd-value">{gender || "—"}</div>
              )}
            </div>

          </div>
        </div>

        {/* Address */}
        <div className="pd-section">
          <h2 className="pd-section-title">Address</h2>
          <div className="pd-grid">

            <div className="pd-field">
              <label className="pd-label">State</label>
              {isEditing ? (
                <input
                  className="pd-input"
                  value={editState}
                  onChange={(e) => setEditState(e.target.value)}
                  placeholder="State"
                />
              ) : (
                <div className="pd-value">{profile.state || "—"}</div>
              )}
            </div>

            <div className="pd-field">
              <label className="pd-label">District</label>
              {isEditing ? (
                <input
                  className="pd-input"
                  value={editDistrict}
                  onChange={(e) => setEditDistrict(e.target.value)}
                  placeholder="District"
                />
              ) : (
                <div className="pd-value">{profile.district || "—"}</div>
              )}
            </div>

            <div className="pd-field">
              <label className="pd-label">City</label>
              {isEditing ? (
                <input
                  className="pd-input"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  placeholder="City"
                />
              ) : (
                <div className="pd-value">{profile.city || "—"}</div>
              )}
            </div>

            <div className="pd-field">
              <label className="pd-label">Pin Code</label>
              {isEditing ? (
                <input
                  className="pd-input"
                  value={editPinCode}
                  onChange={(e) => setEditPinCode(e.target.value)}
                  placeholder="Pin code"
                />
              ) : (
                <div className="pd-value">{profile.pin_code || "—"}</div>
              )}
            </div>

          </div>
        </div>

        {/* Educational Qualifications */}
        <div className="pd-section">
          <h2 className="pd-section-title">Educational Qualifications</h2>
          <div className="pd-grid">

            {/* Highest Degree */}
            <div className="pd-field">
              <label className="pd-label">Highest Degree</label>
              {isEditing ? (
                <div className="pd-select-wrap">
                  <select
                    className="pd-input pd-select"
                    value={editHighestDegree}
                    onChange={(e) => setEditHighestDegree(e.target.value)}
                  >
                    <option value="">Select degree</option>
                    {DEGREE_OPTIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <FiChevronDown className="pd-select-icon" />
                </div>
              ) : (
                <div className="pd-value">{profile.highest_degree || "—"}</div>
              )}
            </div>

            <div className="pd-field" />

            {/* Field of Study + Year of Completion */}
            <div className="pd-field">
              <label className="pd-label">Field of Study</label>
              {isEditing ? (
                <div className="pd-input-wrap">
                  <input
                    className="pd-input pd-input-clearable"
                    value={editFieldOfStudy}
                    onChange={(e) => setEditFieldOfStudy(e.target.value)}
                    placeholder="e.g. Civil Engineering"
                  />
                  {editFieldOfStudy && (
                    <button
                      className="pd-input-clear-btn"
                      onClick={() => setEditFieldOfStudy("")}
                      type="button"
                    >
                      <FiX />
                    </button>
                  )}
                </div>
              ) : (
                <div className="pd-value">{profile.field_of_study || "—"}</div>
              )}
            </div>

            <div className="pd-field">
              <label className="pd-label">Year of Completion</label>
              {isEditing ? (
                <div className="pd-select-wrap">
                  <select
                    className="pd-input pd-select"
                    value={editYearOfCompletion}
                    onChange={(e) => setEditYearOfCompletion(e.target.value)}
                  >
                    <option value="">Select year</option>
                    {YEAR_OPTIONS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <FiChevronDown className="pd-select-icon" />
                </div>
              ) : (
                <div className="pd-value">{profile.year_of_completion || "—"}</div>
              )}
            </div>

            {/* Teaching Certificate */}
            <div className="pd-field pd-full-width">
              <label className="pd-label">Teaching Certificate</label>
              {isEditing ? (
                <div className="pd-cert-options">
                  {CERT_OPTIONS.map((cert) => (
                    <label key={cert} className="pd-cert-option">
                      <input
                        type="checkbox"
                        className="pd-cert-checkbox"
                        checked={editTeachingCerts.includes(cert)}
                        onChange={() => toggleCert(cert)}
                      />
                      <span>{cert}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <CheckList items={profile.teaching_certifications} />
              )}
            </div>

            {/* Upload Qualification Certificate */}
            <div className="pd-field pd-full-width">
              <label className="pd-label">Upload Qualification Certificate</label>
              {isEditing ? (
                <div className="pd-file-edit-list">
                  {/* Existing file */}
                  {existingQualFile && !editQualFile && (
                    <div className="pd-file-edit-item">
                      <FiFileText className="pd-file-svg" />
                      <span className="pd-file-name">{getFileName(existingQualFile)}</span>
                      <button
                        className="pd-file-remove-btn"
                        type="button"
                        onClick={() => setEditQualFileRemoved(true)}
                      >
                        <FiX />
                      </button>
                    </div>
                  )}
                  {/* Newly selected file */}
                  {editQualFile && (
                    <div className="pd-file-edit-item">
                      <FiFileText className="pd-file-svg" />
                      <span className="pd-file-name">{editQualFile.name}</span>
                      <span className="pd-file-size">
                        ({(editQualFile.size / (1024 * 1024)).toFixed(1)} MB)
                      </span>
                      <button
                        className="pd-file-remove-btn"
                        type="button"
                        onClick={() => setEditQualFile(null)}
                      >
                        <FiX />
                      </button>
                    </div>
                  )}
                  {/* Add file button */}
                  {!editQualFile && (
                    <div
                      className="pd-file-add-btn"
                      onClick={() => qualFileInputRef.current?.click()}
                    >
                      <FiFileText className="pd-file-svg" />
                      <span>[ + Add file ]</span>
                      <span className="pd-file-add-note">(Max 50 MB)</span>
                    </div>
                  )}
                  <input
                    ref={qualFileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    style={{ display: "none" }}
                    onChange={handleQualFileChange}
                  />
                </div>
              ) : (
                <FileDisplay file={profile.qualification_certificate} />
              )}
            </div>

          </div>
        </div>

        {/* Teaching Experience */}
        <div className="pd-section">
          <h2 className="pd-section-title">Teaching Experience</h2>
          <div className="pd-grid">

            <div className="pd-field">
              <label className="pd-label">Years of Teaching Experience</label>
              <div className="pd-value">{profile.experience_range || "—"}</div>
            </div>

            <div className="pd-field">
              <label className="pd-label">Current Employment Status</label>
              <div className="pd-value">{profile.employment_status || "—"}</div>
            </div>

            <div className="pd-field pd-full-width">
              <label className="pd-label">Currently Employed?</label>
              <div className="pd-yn-row">
                <span className={`pd-yn-btn ${profile.is_currently_employed ? "pd-yn-btn--active" : ""}`}>
                  Yes
                </span>
                <span className={`pd-yn-btn ${!profile.is_currently_employed ? "pd-yn-btn--active" : ""}`}>
                  No
                </span>
              </div>
            </div>

            <div className="pd-field">
              <label className="pd-label">School/Institution Name</label>
              <div className="pd-value">{profile.institution_name || "—"}</div>
            </div>

            <div className="pd-field">
              <label className="pd-label">Position/Role</label>
              <div className="pd-value">{profile.position || "—"}</div>
            </div>

          </div>
        </div>

        {/* Course Application */}
        <div className="pd-section">
          <h2 className="pd-section-title">Course Application</h2>
          <div className="pd-grid">

            <div className="pd-field pd-full-width">
              <label className="pd-label">Subject</label>
              <div className="pd-value">{profile.subject || "—"}</div>
            </div>

            <div className="pd-field pd-full-width">
              <label className="pd-label">Boards</label>
              <CheckList items={profile.boards} />
            </div>

            <div className="pd-field pd-full-width">
              <label className="pd-label">Classes</label>
              <CheckList items={profile.classes} />
            </div>

          </div>
        </div>

        {/* Specialized Skill */}
        {skills.length > 0 && skills.map((skill, idx) => (
          <div className="pd-section" key={idx}>
            <h2 className="pd-section-title">Specialized Skill</h2>
            <div className="pd-grid">

              <div className="pd-field">
                <label className="pd-label">Skill Name</label>
                <div className="pd-value">{skill.skill_name || skill.name || "—"}</div>
              </div>

              <div className="pd-field" />

              <div className="pd-field pd-full-width">
                <label className="pd-label">Skill Description</label>
                <div className="pd-value">{skill.skill_description || skill.description || "—"}</div>
              </div>

              <div className="pd-field">
                <label className="pd-label">Related Subject</label>
                <div className="pd-value">{skill.related_subject || "—"}</div>
              </div>

              <div className="pd-field" />

              <div className="pd-field pd-full-width">
                <label className="pd-label">File Related to Skill</label>
                <FileDisplay file={skill.skill_file || skill.file} />
              </div>

            </div>
          </div>
        ))}

        {/* Documents Verification */}
        <div className="pd-section">
          <h2 className="pd-section-title">Documents Verification</h2>
          <div className="pd-grid">

            <div className="pd-field">
              <label className="pd-label">Government ID Type</label>
              <div className="pd-value">{profile.government_id_type || "—"}</div>
            </div>

            <div className="pd-field" />

            <div className="pd-field pd-full-width">
              <label className="pd-label">Id Number</label>
              <div className="pd-value">{profile.id_number || "—"}</div>
            </div>

            <div className="pd-field pd-full-width">
              <label className="pd-label">Label</label>
              <FileDisplay file={profile.id_document} />
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
