import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IoChevronBack } from "react-icons/io5";
import { FiSearch } from "react-icons/fi";
import { MdDelete } from "react-icons/md";
import "../styles/study-materials.css";

export default function StudyMaterials() {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("studyMaterials") || "[]");
    setMaterials(saved);
  }, []);

  const handleDelete = (index) => {
    const updated = materials.filter((_, i) => i !== index);
    setMaterials(updated);
    localStorage.setItem("studyMaterials", JSON.stringify(updated));
  };

  return (
    <div className="study-materials-page">
      <button className="sm-back-btn" onClick={() => navigate(-1)}>
        <IoChevronBack /> Back
      </button>

      <div className="sm-title-container">
        <h2 className="sm-title">Subject Name</h2>
        <div className="sm-search">
          <input type="text" placeholder="Search" />
          <FiSearch className="sm-search-icon" />
        </div>
      </div>

      <div className="sm-list-container">
        <div className="sm-actions">
          <button className="sm-add-btn" onClick={() => navigate("/teacher/classes/study-materials/upload")}>+ Add Study Material</button>
        </div>

        <div className="sm-table-header">
          <span className="sm-col-name">Name</span>
          <span className="sm-col-date">Date</span>
          <span className="sm-col-files">Files</span>
          <span className="sm-col-actions"></span>
        </div>

        {materials.length === 0 ? (
          <p className="sm-empty">No study materials uploaded yet. Click "+ Add Study Material" to get started.</p>
        ) : (
          <div className="sm-list">
            {materials.map((material, index) => (
              <div className="sm-row" key={index}>
                <span className="sm-col-name">{material.name}</span>
                <span className="sm-col-date">{material.date}</span>
                <span className="sm-col-files">
                  {material.files?.length || 0} file{(material.files?.length || 0) !== 1 ? "s" : ""}
                </span>
                <div className="sm-col-actions">
                  <button
                    className="sm-view-btn"
                    onClick={() =>
                      navigate("/teacher/classes/study-materials/view", {
                        state: material,
                      })
                    }
                  >
                    View
                  </button>
                  <button className="sm-delete-btn" onClick={() => handleDelete(index)}>
                    <MdDelete />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
