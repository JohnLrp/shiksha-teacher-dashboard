import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { IoChevronBack } from "react-icons/io5";
import toast from "react-hot-toast";
import api from "../api/apiClient";
import "../styles/create-assignment.css";

export default function CreateAssignment() {

  const navigate = useNavigate();
  const { subjectId } = useParams();
  const { state: editData } = useLocation();

  const isEditing = Boolean(editData);

  const [chapters, setChapters] = useState([]);
  const [chapterId, setChapterId] = useState(
    editData?.chapter_id || editData?.chapter?.id || ""
  );
  const [title, setTitle] = useState(editData?.title || "");
  const [description, setDescription] = useState(editData?.description || "");
  const [dueDate, setDueDate] = useState(
    editData?.due_date?.slice(0, 10) || ""
  );

  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});

  const fileInputRef = useRef(null);

  useEffect(() => {

    async function fetchChapters() {
      try {
        const res = await api.get(`/courses/subject/${subjectId}/`);
        setChapters(res.data?.chapters || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load chapters.");
      }
    }

    if (subjectId) fetchChapters();

  }, [subjectId]);

  const validate = () => {

    const newErrors = {};

    if (!chapterId) newErrors.chapter = "Chapter required";
    if (!title.trim()) newErrors.title = "Title required";
    if (!description.trim()) newErrors.description = "Description required";
    if (!dueDate) newErrors.dueDate = "Due date required";
    if (!file && !isEditing) newErrors.file = "File required";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {

    if (!validate()) return;

    try {

      const formData = new FormData();

      formData.append("chapter_id", chapterId);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("due_date", `${dueDate}T23:59:00`);

      if (file) {
        formData.append("attachment", file);
      }

      if (isEditing) {

        const res = await api.patch(
          `/assignments/teacher/${editData.id}/edit/`,
          formData
        );

        toast.success(
          res?.data?.message || "Assignment updated successfully"
        );

      } else {

        const res = await api.post(
          "/assignments/teacher/create/",
          formData
        );

        toast.success(
          res?.data?.message || "Assignment created successfully"
        );

      }

      setTimeout(() => {
        navigate(`/teacher/classes/${subjectId}/assignments`);
      }, 600);

    } catch (err) {

      console.error(err);

      toast.error(
        err?.response?.data?.detail ||
        err?.message ||
        "Operation failed."
      );
    }
  };

  return (
    <div className="create-assignment-page">

      <button
        className="ca-back-btn"
        onClick={() => navigate(-1)}
      >
        <IoChevronBack /> Back
      </button>

      <div className="ca-title-container">
        <h2>{isEditing ? "Edit Assignment" : "Create Assignment"}</h2>
      </div>

      <div className="ca-form-container">
        <div className="ca-form">

          {/* Chapter */}
          <div className="ca-field">
            <label>Chapter</label>

            <select
              value={chapterId}
              onChange={(e) => setChapterId(e.target.value)}
              className={`ca-input ${errors.chapter ? "ca-input-error" : ""}`}
            >
              <option value="">Select Chapter</option>

              {chapters.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.title}
                </option>
              ))}
            </select>

            {errors.chapter && (
              <span className="ca-error">{errors.chapter}</span>
            )}
          </div>

          {/* Title */}
          <div className="ca-field">
            <label>Title</label>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`ca-input ${errors.title ? "ca-input-error" : ""}`}
            />

            {errors.title && (
              <span className="ca-error">{errors.title}</span>
            )}
          </div>

          {/* Description */}
          <div className="ca-field">
            <label>Description</label>

            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`ca-textarea ${errors.description ? "ca-input-error" : ""}`}
            />

            {errors.description && (
              <span className="ca-error">{errors.description}</span>
            )}
          </div>

          {/* Due Date */}
          <div className="ca-field">
            <label>Due Date</label>

            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={`ca-input ${errors.dueDate ? "ca-input-error" : ""}`}
            />

            {errors.dueDate && (
              <span className="ca-error">{errors.dueDate}</span>
            )}
          </div>

          {/* File Upload */}
          <div className="ca-field">

            <label>Attach File</label>

            <input
              type="file"
              ref={fileInputRef}
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                const allowedExtensions = [".pdf", ".doc", ".docx"];
                const name = file.name.toLowerCase();

                if (!allowedExtensions.some(ext => name.endsWith(ext))) {
                  toast.error("Only PDF, DOC, DOCX allowed");
                  return;
                }

                setFile(file);
              }}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="ca-add-file-btn"
            >
              + Add File
            </button>

            {file && (
              <div style={{ marginTop: "6px" }}>
                <span>{file.name}</span>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  style={{ marginLeft: "10px" }}
                >
                  Remove
                </button>
              </div>
            )}

            {isEditing && editData?.attachment && !file && (
              <div style={{ marginTop: "6px" }}>
                Existing file:
                <a
                  href={editData.attachment}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ marginLeft: "6px" }}
                >
                  View
                </a>
              </div>
            )}

            {errors.file && (
              <span className="ca-error">{errors.file}</span>
            )}

          </div>

          {/* Submit */}
          <div className="ca-actions">
            <button
              className="ca-create-btn"
              onClick={handleSubmit}
            >
              {isEditing ? "Update" : "Create"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}