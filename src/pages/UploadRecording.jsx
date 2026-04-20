import { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IoChevronBack } from "react-icons/io5";
import api from "../api/apiClient";
import "../styles/upload-recording.css";

// Upload goes through your backend — never expose Bunny keys on the client.
// Backend endpoint: POST /courses/subjects/:subjectId/recordings/upload/
// which proxies the file to Bunny server-side.

const STEPS = ["Details", "Video", "Upload"];

export default function UploadRecording() {
  const navigate = useNavigate();
  const { subjectId } = useParams();

  // Step state
  const [step, setStep] = useState(0); // 0: Details, 1: Video, 2: Upload

  // Form fields
  const [topic, setTopic] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [videoFile, setVideoFile] = useState(null);

  // Upload state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);
  const xhrRef = useRef(null);

  // ─── Step 1: validate details ────────────────────────────────────────────
  const handleNextFromDetails = () => {
    if (!topic.trim()) { setError("Please enter a topic/title."); return; }
    if (!sessionDate)  { setError("Please select a session date."); return; }
    setError("");
    setStep(1);
  };

  // ─── Step 2: file pick ───────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ["video/mp4", "video/webm", "video/quicktime"];
    if (!allowed.includes(file.type)) {
      setError("Only MP4, WebM, or MOV files are allowed.");
      return;
    }
    if (file.size > 4 * 1024 * 1024 * 1024) { // 4 GB guard
      setError("File is too large (max 4 GB).");
      return;
    }
    setError("");
    setVideoFile(file);
  };

  const handleNextFromVideo = () => {
    if (!videoFile) { setError("Please attach a video file."); return; }
    setError("");
    setStep(2);
  };

  // ─── Step 3: upload ──────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!subjectId) { setError("Invalid subject."); return; }

    try {
      setUploading(true);
      setUploadProgress(0);
      setError("");

      // STEP 1: Create Bunny video slot via backend (key stays server-side)
      const res = await api.post("/courses/recordings/create-video/", {
        title: topic,
      });
      const videoId = res.data.video_id;

      // STEP 2: Upload file — route through your backend proxy OR use a
      // short-lived signed URL returned from the backend (recommended).
      // Here we use the signed-URL pattern: backend returns a one-time
      // upload URL so the Bunny AccessKey is never in the browser.
      const signedRes = await api.post("/courses/recordings/signed-upload-url/", {
        video_id: videoId,
      });
      const uploadUrl = signedRes.data.upload_url;

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;
        xhr.open("PUT", uploadUrl, true);
        xhr.setRequestHeader("Content-Type", videoFile.type);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 201) resolve();
          else reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText}`));
        };
        xhr.onerror = () => reject(new Error("Network error during upload."));
        xhr.send(videoFile);
      });

      // STEP 3: Save metadata
      await api.post(`/courses/subjects/${subjectId}/recordings/save/`, {
        title: topic,
        session_date: sessionDate,
        video_id: videoId,
      });

      setUploadDone(true);
      setUploadProgress(100);

    } catch (err) {
      console.error(err);
      setError(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    if (xhrRef.current) xhrRef.current.abort();
    navigate(-1);
  };

  // ─── helpers ─────────────────────────────────────────────────────────────
  const formatBytes = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  // ─── render ──────────────────────────────────────────────────────────────
  return (
    <div className="ur-page">

      {/* Back */}
      <button className="ur-back-btn" onClick={handleCancel}>
        <IoChevronBack /> Back
      </button>

      {/* Header */}
      <div className="ur-header">
        <h2 className="ur-title">Add Session Recording</h2>

        {/* Step indicator */}
        <div className="ur-steps">
          {STEPS.map((label, i) => (
            <div key={label} className={`ur-step ${i === step ? "active" : ""} ${i < step ? "done" : ""}`}>
              <div className="ur-step-circle">{i < step ? "✓" : i + 1}</div>
              <span className="ur-step-label">{label}</span>
              {i < STEPS.length - 1 && <div className="ur-step-line" />}
            </div>
          ))}
        </div>
      </div>

      <div className="ur-form-container">
        <div className="ur-form-card">

          {/* ── STEP 0: Details ── */}
          {step === 0 && (
            <>
              <h3 className="ur-form-heading">Recording Details</h3>

              <div className="ur-field">
                <label className="ur-label">Topic / Title <span className="ur-required">*</span></label>
                <input
                  type="text"
                  className="ur-input"
                  placeholder="e.g. Trigonometry – Introduction"
                  value={topic}
                  onChange={(e) => { setTopic(e.target.value); setError(""); }}
                  maxLength={255}
                />
                <span className="ur-char-count">{topic.length}/255</span>
              </div>

              <div className="ur-field">
                <label className="ur-label">Session Date <span className="ur-required">*</span></label>
                <input
                  type="date"
                  className="ur-input"
                  value={sessionDate}
                  max={new Date().toISOString().split("T")[0]} // can't record future sessions
                  onChange={(e) => { setSessionDate(e.target.value); setError(""); }}
                />
              </div>

              {error && <p className="ur-error">{error}</p>}

              <button className="ur-btn-primary" onClick={handleNextFromDetails}>
                Next →
              </button>
            </>
          )}

          {/* ── STEP 1: Video File ── */}
          {step === 1 && (
            <>
              <h3 className="ur-form-heading">Attach Video</h3>

              <div
                className={`ur-drop-zone ${videoFile ? "ur-drop-zone--has-file" : ""}`}
                onClick={() => fileInputRef.current.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) handleFileChange({ target: { files: [file] } });
                }}
              >
                {videoFile ? (
                  <>
                    <div className="ur-file-icon">🎬</div>
                    <p className="ur-file-name">{videoFile.name}</p>
                    <p className="ur-file-size">{formatBytes(videoFile.size)}</p>
                    <button
                      className="ur-btn-ghost"
                      onClick={(e) => { e.stopPropagation(); setVideoFile(null); }}
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <>
                    <div className="ur-drop-icon">📁</div>
                    <p className="ur-drop-hint">Drag & drop or <strong>click to browse</strong></p>
                    <p className="ur-drop-sub">MP4, WebM, MOV — max 4 GB</p>
                  </>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                style={{ display: "none" }}
                accept="video/mp4,video/webm,video/quicktime"
                onChange={handleFileChange}
              />

              {error && <p className="ur-error">{error}</p>}

              <div className="ur-btn-row">
                <button className="ur-btn-ghost" onClick={() => { setError(""); setStep(0); }}>
                  ← Back
                </button>
                <button className="ur-btn-primary" onClick={handleNextFromVideo}>
                  Review →
                </button>
              </div>
            </>
          )}

          {/* ── STEP 2: Review & Upload ── */}
          {step === 2 && !uploadDone && (
            <>
              <h3 className="ur-form-heading">Review & Upload</h3>

              <div className="ur-review-grid">
                <div className="ur-review-row">
                  <span className="ur-review-label">Title</span>
                  <span className="ur-review-value">{topic}</span>
                </div>
                <div className="ur-review-row">
                  <span className="ur-review-label">Date</span>
                  <span className="ur-review-value">{sessionDate}</span>
                </div>
                <div className="ur-review-row">
                  <span className="ur-review-label">File</span>
                  <span className="ur-review-value">{videoFile?.name} ({formatBytes(videoFile?.size)})</span>
                </div>
              </div>

              {/* Progress bar */}
              {uploading && (
                <div className="ur-progress-wrap">
                  <div className="ur-progress-header">
                    <span>Uploading…</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="ur-progress-bar">
                    <div
                      className="ur-progress-fill"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="ur-progress-note">
                    Do not close this tab. Video will process automatically after upload.
                  </p>
                </div>
              )}

              {error && <p className="ur-error">{error}</p>}

              <div className="ur-btn-row">
                {!uploading && (
                  <button className="ur-btn-ghost" onClick={() => { setError(""); setStep(1); }}>
                    ← Back
                  </button>
                )}
                <button
                  className="ur-btn-primary"
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? `Uploading ${uploadProgress}%…` : "Upload Recording"}
                </button>
              </div>
            </>
          )}

          {/* ── DONE ── */}
          {uploadDone && (
            <div className="ur-success">
              <div className="ur-success-icon">✅</div>
              <h3>Upload Complete!</h3>
              <p>
                <strong>{topic}</strong> has been uploaded. It will be available to
                students once Bunny finishes processing (usually 1–5 minutes). You'll
                see the status badge update on the recordings list.
              </p>
              <button className="ur-btn-primary" onClick={() => navigate(-1)}>
                Back to Recordings
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
