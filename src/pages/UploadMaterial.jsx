import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IoChevronBack } from "react-icons/io5";
import { MdDelete, MdUpload, MdInsertDriveFile, MdCheckCircle } from "react-icons/md";
import api from "../api/apiClient";
import "../styles/upload-material.css";

export default function UploadMaterial() {

  const navigate = useNavigate();
  const { subjectId } = useParams();

  const [topic, setTopic] = useState("");
  const [note, setNote] = useState("");

  const [fileItems, setFileItems] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [chapterId, setChapterId] = useState("");

  const [useCustomChapter, setUseCustomChapter] = useState(false);
  const [customChapter, setCustomChapter] = useState("");

  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);

  const formatSize = (bytes) => {
    if (!bytes || bytes <= 0) return "0 KB";
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  useEffect(() => {
    if (subjectId) {
      loadChapters();
    }
  }, [subjectId]);

  const loadChapters = async () => {
    try {
      const res = await api.get(`/courses/subjects/${subjectId}/chapters/`);
      setChapters(res.data);
    } catch {
      alert("Failed to load chapters");
    }
  };

  const handleAddAttachment = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const selected = Array.from(e.target.files || []);

    for (const file of selected) {

      const item = {
        file,
        name: file.name,
        progress: 0,
        size: file.size,
        status: "uploading",
        id: null,
      };

      setFileItems(prev => [...prev, item]);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await api.post(`/materials/files/upload/`, formData, {
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );

            setFileItems(prev =>
              prev.map(f =>
                f.name === file.name
                  ? { ...f, progress: percent }
                  : f
              )
            );
          }
        });

        setFileItems(prev =>
          prev.map(f =>
            f.name === file.name
              ? {
                  ...f,
                  progress: 100,
                  status: "done",
                  id: res.data.id
                }
              : f
          )
        );

      } catch {
        alert("Upload failed");
      }
    }
  };

  const handleRemoveFile = (name) => {
    setFileItems(prev => prev.filter(f => f.name !== name));
  };

  const handleUpload = async () => {

    if (!topic.trim()) return alert("Enter topic");

    if (!useCustomChapter && !chapterId)
      return alert("Select chapter");

    if (useCustomChapter && !customChapter.trim())
      return alert("Enter custom chapter");

    if (fileItems.length === 0)
      return alert("Add files");

    const notUploaded = fileItems.some(item => !item.id);
    if (notUploaded) {
      alert("Wait for all files to finish uploading");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("title", topic);
      formData.append("description", note);

      if (useCustomChapter) {
        formData.append("custom_chapter", customChapter);
        formData.append("subject_id", subjectId);
      } else {
        formData.append("chapter_id", chapterId);
      }

      fileItems.forEach(item => {
        formData.append("file_ids", item.id);
      });

      await api.post(`/materials/materials/upload/`, formData);

      alert("Saved successfully");
      navigate(`/teacher/classes/${subjectId}/study-materials`);

    } catch {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (

    <div className="upload-material-page">

      <button className="um-back-btn" onClick={() => navigate(`/teacher/classes/${subjectId}/study-materials`)}>
        <IoChevronBack /> Back
      </button>

      <div className="um-main-card">

      <div className="um-header">
        <h2 className="um-title">Mathematics</h2>
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

            <div className="um-field">
              <label className="um-label">Topic</label>
              <input
                className="um-input"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div className="um-field">
              <label className="um-label">Note:</label>
              <textarea
                className="um-input"
                placeholder='Optional: Add helpful context (e.g., "Focus on examples 5-8" or "Review derivatives before this")'
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

          </div>

          {/* RIGHT SIDE WRAPPER */}
          <div style={{ display: "flex", flexDirection: "column" }}>

            <div className="um-upload-panel">

              <div className="um-upload-title">
                <span>Upload File</span>
                <span>( {fileItems.length} )</span>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                multiple
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
              />

              <div className="um-dropzone" onClick={handleAddAttachment}>
                <div className="um-dropzone-icon-btn">
                  <MdUpload size={20} />
                  <span>Upload</span>
                </div>
                <p className="um-dropzone-text">Choose a file or drag and drop it here</p>
                <p className="um-dropzone-subtext">Maximum 50 MB/file size</p>
              </div>

              {fileItems.length > 0 && (
                <div className="um-file-list">
                  {fileItems.map((item, i) => (
                    <div key={i} className={`um-file-card ${item.status === "done" ? "um-file-card--done" : ""}`}>
                      <div className="um-file-card-inner">
                        <MdInsertDriveFile className="um-file-doc-icon" />
                        <div className="um-file-meta">
                          <span className="um-file-name">{item.name}</span>
                          <span className="um-file-size-row">
                            <span>{formatSize(Math.round((item.progress / 100) * item.size))} / {formatSize(item.size)}</span>
                            {item.status === "done"
                              ? <span className="um-file-status-done"><MdCheckCircle size={12} /> Completed</span>
                              : <span className="um-file-status-uploading">↑ Uploading...</span>
                            }
                          </span>
                        </div>
                        <span className="um-file-action-btn" onClick={() => handleRemoveFile(item.name)}>
                          {item.status === "done" ? <MdDelete size={18} /> : "✕"}
                        </span>
                      </div>
                      {item.status !== "done" && (
                        <div className="um-progress-bar">
                          <div className="um-progress-fill" style={{ width: `${item.progress}%` }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* ✅ SAVE BUTTON BELOW PANEL */}
            <button
              className="um-save-btn"
              style={{ marginTop: "10px", alignSelf: "flex-end" }}
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? "Saving..." : "Save"}
            </button>

          </div>

        </div>

      </div>

      </div>

    </div>
  );
}