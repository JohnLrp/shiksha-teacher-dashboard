import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiLock, FiCalendar } from "react-icons/fi";
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

export default function PrivateDetails() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editState, setEditState] = useState("");
  const [editDistrict, setEditDistrict] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editPinCode, setEditPinCode] = useState("");

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
    };
    try {
      await api.patch("/accounts/teacher/profile/", updates);
      setProfile((prev) => ({ ...prev, ...updates }));
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

      </div>
    </div>
  );
}
