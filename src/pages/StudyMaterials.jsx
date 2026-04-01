import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IoChevronBack } from "react-icons/io5";
import { FiSearch } from "react-icons/fi";
import { MdDelete } from "react-icons/md";
import api from "../api/apiClient";
import "../styles/study-materials.css";

export default function StudyMaterials() {
  const navigate = useNavigate();
  const { subjectId } = useParams();

  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null); // inline confirm

  useEffect(() => {
    if (!subjectId) return;
    loadMaterials();
  }, [subjectId]);

  const loadMaterials = async () => {
    try {
      const res = await api.get(`/materials/subjects/${subjectId}/materials/`);
      setMaterials(res.data);
    } catch (err) {
      console.error("Failed to load materials:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await api.delete(`/materials/materials/${id}/`);
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  };

  const filtered = materials.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="sm-loading">Loading study materials...</div>;

  return (
    <div className="study-materials-page">

      <button className="sm-back-btn" onClick={() => navigate(-1)}>
        <IoChevronBack /> Back
      </button>

      <div className="sm-title-container">
        <div className="sm-title-left">
          <h2 className="sm-title">Study Materials</h2>
          <span className="sm-count-badge">{materials.length}</span>
        </div>

        <div className="sm-search">
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <FiSearch className="sm-search-icon" />
        </div>
      </div>

      <div className="sm-list-container">

        <div className="sm-actions">
          <button className="sm-add-btn" onClick={() => navigate(`/teacher/classes/${subjectId}/study-materials/upload`)}>
            + Add Study Material
          </button>
        </div>

        <div className="sm-table-header">
          <span className="sm-col-name">Name</span>
          <span className="sm-col-date">Date</span>
          <span className="sm-col-files">Files</span>
          <span className="sm-col-actions"></span>
        </div>

        {filtered.length === 0 ? (
          <p className="sm-empty">
            {search ? "No materials match your search." : "No study materials uploaded yet."}
          </p>
        ) : (
          <div className="sm-list">
            {filtered.map((material) => (
              <div className="sm-row" key={material.id}>

                <span className="sm-col-name">{material.title}</span>

                <span className="sm-col-date">
                  {new Date(material.created_at).toLocaleDateString()}
                </span>

                <span className="sm-col-files">
                  <span className="sm-files-badge">
                    {material.files?.length || 0} files
                  </span>
                </span>

                <div className="sm-col-actions">
                  <button
                    className="sm-view-btn"
                    onClick={() =>
                      navigate(`/teacher/classes/${subjectId}/study-materials/${material.id}`, {
                        state: material,
                      })
                    }
                  >
                    View
                  </button>

                  {confirmId === material.id ? (
                    <div className="sm-confirm-row">
                      <span className="sm-confirm-label">Delete?</span>
                      <button
                        className="sm-confirm-yes"
                        disabled={deletingId === material.id}
                        onClick={() => handleDelete(material.id)}
                      >
                        {deletingId === material.id ? "..." : "Yes"}
                      </button>
                      <button
                        className="sm-confirm-no"
                        onClick={() => setConfirmId(null)}
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      className="sm-delete-btn"
                      onClick={() => setConfirmId(material.id)}
                    >
                      <MdDelete />
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}