import { useLocation, useNavigate } from "react-router-dom";
import { IoChevronBack } from "react-icons/io5";
import { FiSearch } from "react-icons/fi";
import { FaRegFolder } from "react-icons/fa";
import "../styles/study-material-view.css";

export default function StudyMaterialView() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const name = state?.name || "Untitled";
  const date = state?.date || "";
  const files = state?.files || [];

  return (
    <div className="smv-page">
      <button className="smv-back-btn" onClick={() => navigate(-1)}>
        <IoChevronBack /> Back
      </button>

      <div className="smv-header">
        <h2 className="smv-title">Subject Name</h2>
        <div className="smv-search">
          <input type="text" placeholder="Search" />
          <FiSearch className="smv-search-icon" />
        </div>
      </div>

      <div className="smv-content-card">
        <div className="smv-details">
          <p className="smv-detail-line">
            <span className="smv-label">Title: </span>
            <span className="smv-value-bold">{name}</span>
          </p>
          <p className="smv-detail-line">
            <span className="smv-label">Uploaded: </span>
            <span className="smv-value-bold">{date}</span>
          </p>

          <div className="smv-files-section">
            <span className="smv-label">
              Attached Files ({files.length})
            </span>

            {files.length === 0 ? (
              <p className="smv-no-files">No files attached.</p>
            ) : (
              <div className="smv-files-list">
                {files.map((fileName, i) => (
                  <div className="smv-file-card" key={i}>
                    <div className="smv-file-icon-box">
                      <FaRegFolder className="smv-file-icon" />
                    </div>
                    <span className="smv-file-name">{fileName}</span>
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
