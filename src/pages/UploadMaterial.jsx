import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IoChevronBack } from "react-icons/io5";
import { FiSearch } from "react-icons/fi";
import { MdDelete } from "react-icons/md";
import api from "../api/apiClient";
import "../styles/upload-material.css";

export default function UploadMaterial() {

  const navigate = useNavigate();
  const { subjectId } = useParams();

  const [title, setTitle] = useState("");
  const [files, setFiles] = useState([]);
  const [fileItems, setFileItems] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [chapterId, setChapterId] = useState("");
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);
  const controllersRef = useRef({}); // ✅ for cancel

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
      console.error("Failed to load chapters", err);
      alert("Failed to load chapters");
    }
  };

  const handleAddAttachment = () => {
    fileInputRef.current.click();
  };

  // ✅ NO simulateUpload anymore
  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    const allowedTypes = ["pdf", "doc", "docx"];
    const newItems = [];

    selected.forEach((file) => {
      const ext = file.name.split(".").pop().toLowerCase();

      if (!allowedTypes.includes(ext)) {
        alert(`${file.name} not allowed`);
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        alert(`${file.name} exceeds 50MB`);
        return;
      }

      const item = {
        file,
        name: file.name,
        progress: 0,
        uploaded: false,
        size: file.size,
      };

      newItems.push(item);
    });

    setFileItems((prev) => [...prev, ...newItems]);
    setFiles((prev) => [...prev, ...selected]);

    e.target.value = "";
  };

  // ✅ REMOVE FILE
  const handleRemoveFile = (name) => {
    setFileItems((prev) => prev.filter((f) => f.name !== name));
    setFiles((prev) => prev.filter((f) => f.name !== name));
  };

  // ✅ CANCEL REAL UPLOAD
  const handleCancelUpload = (name) => {
    const controller = controllersRef.current[name];
    if (controller) {
      controller.abort();
    }

    setFileItems((prev) => prev.filter((f) => f.name !== name));
    setFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const handleUpload = async () => {

    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }

    if (!chapterId) {
      alert("Please select a chapter");
      return;
    }

    if (files.length === 0) {
      alert("Please attach at least one file");
      return;
    }

    try {
      setUploading(true);

      for (const item of fileItems) {

        const formData = new FormData();
        formData.append("title", title);
        formData.append("files", item.file);

        const controller = new AbortController();
        controllersRef.current[item.name] = controller;

        await api.post(
          `/materials/chapters/${chapterId}/materials/upload/`,
          formData,
          {
            signal: controller.signal,
            onUploadProgress: (progressEvent) => {
              const percent = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );

              setFileItems((prev) =>
                prev.map((f) =>
                  f.name === item.name ? { ...f, progress: percent } : f
                )
              );
            },
          }
        );

        setFileItems((prev) =>
          prev.map((f) =>
            f.name === item.name ? { ...f, uploaded: true } : f
          )
        );
      }

      alert("Upload successful");

      navigate(`/teacher/classes/${subjectId}/study-materials`);

    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (

    <div className="upload-material-page">

      <button
        className="um-back-btn"
        onClick={() => navigate(-1)}
      >
        <IoChevronBack /> Back
      </button>

      <div className="um-title-container">
        <h2 className="um-title">Study Materials</h2>

        <div className="um-search">
          <input type="text" placeholder="Search" />
          <FiSearch className="um-search-icon" />
        </div>
      </div>

      <div className="um-form-container">

        <div className="um-form-card">

          {/* LEFT */}
          <div className="um-form-left">

            <h3 className="um-form-heading">
              Create New Study Material
            </h3>

            <div className="um-field">
              <label className="um-label">Title</label>
              <input
                type="text"
                className="um-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="um-field">
              <label className="um-label">Chapter</label>

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

                    {!item.uploaded ? (
                      <>
                        <div className="um-progress-bar">
                          <div
                            className="um-progress-fill"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span>{item.progress}%</span>

                          <span
                            style={{ cursor: "pointer", color: "#ff6b6b" }}
                            onClick={() => handleCancelUpload(item.name)}
                          >
                            Cancel
                          </span>
                        </div>
                      </>
                    ) : (
                      <span className="um-uploaded">✔ Uploaded</span>
                    )}

                  </div>
                ))}
              </div>
            )}

            <button
              className="um-upload-btn"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}