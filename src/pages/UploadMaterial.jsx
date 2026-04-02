import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IoChevronBack } from "react-icons/io5";
import { MdDelete } from "react-icons/md";
import api from "../api/apiClient";
import "../styles/upload-material.css";

export default function UploadMaterial() {

  const navigate = useNavigate();
  const { subjectId } = useParams();

  // ✅ renamed visually (still sent as title)
  const [topic, setTopic] = useState("");
  const [note, setNote] = useState("");

  const [files, setFiles] = useState([]);
  const [fileItems, setFileItems] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [chapterId, setChapterId] = useState("");

  const [useCustomChapter, setUseCustomChapter] = useState(false);
  const [customChapter, setCustomChapter] = useState("");

  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (subjectId) {
      loadChapters();
    }
  }, [subjectId]);

  const loadChapters = async () => {
    try {
      const res = await api.get(`/courses/subjects/${subjectId}/chapters/`);
      setChapters(res.data);
    } catch (err) {
      alert("Failed to load chapters");
    }
  };

  const handleAddAttachment = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    const newItems = selected.map(file => ({
      file,
      name: file.name,
      progress: 0,
      size: file.size,
    }));

    setFileItems(prev => [...prev, ...newItems]);
    setFiles(prev => [...prev, ...selected]);
  };

  const handleRemoveFile = (name) => {
    setFileItems(prev => prev.filter(f => f.name !== name));
    setFiles(prev => prev.filter(f => f.name !== name));
  };

  const handleUpload = async () => {

    if (!topic.trim()) return alert("Enter topic");

    if (!useCustomChapter && !chapterId)
      return alert("Select chapter");

    if (useCustomChapter && !customChapter.trim())
      return alert("Enter custom chapter");

    if (files.length === 0)
      return alert("Add files");

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("title", topic); // backend still expects title
      formData.append("description", note);

      if (useCustomChapter) {
        formData.append("custom_chapter", customChapter);
        formData.append("subject_id", subjectId);
      } else {
        formData.append("chapter_id", chapterId);
      }

      files.forEach(file => formData.append("files", file));

      await api.post(`/materials/materials/upload/`, formData);

      alert("Saved successfully");
      navigate(`/teacher/classes/${subjectId}/study-materials`);

    } catch (err) {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (

    <div className="upload-material-page">

      <button className="um-back-btn" onClick={() => navigate(-1)}>
        <IoChevronBack /> Back
      </button>

      {/* ✅ HEADER WITH SAVE BUTTON */}
      <div className="um-header">
        <h2 className="um-title">Mathematics</h2>

        <button
          className="um-save-btn"
          onClick={handleUpload}
          disabled={uploading}
        >
          {uploading ? "Saving..." : "Save"}
        </button>
      </div>

      <div className="um-form-container">

        <div className="um-form-card">

          {/* LEFT */}
          <div className="um-form-left">

            <div className="um-field">
              <label className="um-label">Chapter</label>

              {!useCustomChapter ? (
                <>
                  <select
                    className="um-input"
                    value={chapterId}
                    onChange={(e) => setChapterId(e.target.value)}
                  >
                    <option value="">Select Chapter</option>

                    {chapters.map((chapter) => (
                      <option key={chapter.id} value={chapter.id}>
                        {chapter.title}
                      </option>
                    ))}
                  </select>

                  <button
                    className="um-custom-btn"
                    onClick={() => setUseCustomChapter(true)}
                  >
                    Custom
                  </button>
                </>
              ) : (
                <>
                  <input
                    className="um-input"
                    placeholder="Enter new chapter"
                    value={customChapter}
                    onChange={(e) => setCustomChapter(e.target.value)}
                  />

                  <button
                    className="um-custom-btn"
                    onClick={() => setUseCustomChapter(false)}
                  >
                    Use Existing
                  </button>
                </>
              )}
            </div>

            {/* ✅ TOPIC */}
            <div className="um-field">
              <label className="um-label">Topic</label>
              <input
                className="um-input"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            {/* ✅ NOTE */}
            <div className="um-field">
              <label className="um-label">Note</label>
              <textarea
                className="um-input"
                placeholder='Optional: Add helpful context...'
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

          </div>

          {/* RIGHT */}
          <div className="um-upload-panel">

            <div className="um-upload-title">Upload File</div>

            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              multiple
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
            />

            <button
              className="um-add-attachment-btn"
              onClick={handleAddAttachment}
            >
              Click to upload or drag & drop
            </button>

            <div className="um-upload-info">
              Max 50MB • PDF, DOC, DOCX
            </div>

            {fileItems.length > 0 && (
              <div className="um-file-list">
                {fileItems.map((item, i) => (
                  <div key={i} className="um-file-card">

                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>{item.name}</span>
                      <MdDelete
                        style={{ cursor: "pointer" }}
                        onClick={() => handleRemoveFile(item.name)}
                      />
                    </div>

                    <small>
                      {(item.size / 1024).toFixed(1)} KB
                    </small>

                    <div className="um-progress-bar">
                      <div
                        className="um-progress-fill"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>

                    <span>{item.progress}%</span>

                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}