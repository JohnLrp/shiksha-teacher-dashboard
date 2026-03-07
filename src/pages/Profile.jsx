import { useState } from "react";
import "../styles/profile.css";

export default function Profile() {
  const [editing, setEditing] = useState(false);
  const avatar = localStorage.getItem("avatar");
const [showAvatarModal, setShowAvatarModal] = useState(false);

  const [form, setForm] = useState({
    name: "Amy Thing",
    subjects: "Maths & Science",
    qualifications: "M.Sc",
    role:"Teacher",
    rating:"TBA Later",
    about:"A hardworking security guard",
avatar: avatar || "https://i.pravatar.cc/40?img=3",
  }); 
    
  const [backup, setBackup] = useState(form);

  const emojis = [
    "😀","😁","😎","🤓","🐮","🐷",
    "😍","😊","🐶","🐱","🐻","🐯",
    "🦊","🐰","🐸","🐨","🐵","🦁",
    "🧛","💻","👩‍🔬","👨‍🏫","👩‍⚕️","👨‍🍳"
  ];

  function handleChange(field, value) {
    setForm({ ...form, [field]: value });
  }

  function handleEdit() {
    setBackup(form);
    setEditing(true);
  }
function handleSave() {
  localStorage.setItem("avatar", form.avatar);
  setEditing(false);
}


  function handleCancel() {
    setForm(backup);
    setEditing(false);
  }

  function handleAvatarSelect(emoji) {
    setForm({ ...form, avatar: emoji });
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setForm({ ...form, avatar: url });
    }
  }

  return (
    <div className="profile-page">

      {/* ===== TOP CARD ===== */}
      <div className="profile-card">
        <div className="profile-left" onClick={() => setShowAvatarModal(true)}>
          {form.avatar ? (
            typeof form.avatar === "string" && form.avatar.startsWith("blob:") ? (
              <img src={form.avatar} alt="avatar" className="avatar-img" />
            ) : (
              <span className="avatar-emoji">{form.avatar}</span>
            )
          ) : (
            <>
              <span className="avatar-plus">+</span>
              <span className="avatar-text">Add Image</span>
            </>
          )}
        </div>

        <div className="profile-info">
          {editing ? (
            <input
              className="profile-name-input"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          ) : (
            <h2 className="profile-name">{form.name}</h2>
          )}

          <div className="profile-detail">
            <div className="profile-col">
              <p><strong>Subjects:</strong> {form.subjects}</p>
              <p><strong>Qualifications:</strong> {form.qualifications}</p>
              <p><strong>Role:</strong> {form.role}</p>
            </div>
            <div className="profile-col">
              <p><strong>Rating:</strong> {form.rating}</p>
              <p><strong>About:</strong> {editing ? (
                <textarea
                  value={form.about}
                  onChange={(e) => handleChange("about", e.target.value)}
                  placeholder="Write about yourself..."
                />
              ) : (
                form.about || ""
              )}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== AVATAR MODAL ===== */}
      {showAvatarModal && (
        <div className="modal-overlay" onClick={() => setShowAvatarModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Choose Avatar</h3>
              <button className="modal-close" onClick={() => setShowAvatarModal(false)}>✕</button>
            </div>

            <div className="modal-preview">
              {form.avatar ? (
                typeof form.avatar === "string" && form.avatar.startsWith("blob:") ? (
                  <img src={form.avatar} alt="preview" className="preview-img" />
                ) : (
                  <span className="preview-emoji">{form.avatar}</span>
                )
              ) : (
                <span className="preview-text">Preview</span>
              )}
            </div>

            <p className="modal-label">Upload Image</p>
            <label className="file-btn">
              Choose File
              <input type="file" accept="image/*" hidden onChange={handleFileUpload} />
            </label>

            <p className="modal-label">Or Select Emoji</p>
            <div className="emoji-grid">
              {emojis.map((emoji, i) => (
                <span
                  key={i}
                  className="emoji-item"
                  onClick={() => handleAvatarSelect(emoji)}
                >
                  {emoji}
                </span>
              ))}
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowAvatarModal(false)}>Cancel</button>
              <button className="btn-save" onClick={() => setShowAvatarModal(false)}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
