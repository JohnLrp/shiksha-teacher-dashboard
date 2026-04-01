import { useLocation, useNavigate } from "react-router-dom";
import { IoChevronBack } from "react-icons/io5";
import { FiSearch } from "react-icons/fi";
import { FaRegFolder } from "react-icons/fa";
import { useState } from "react";
import "../styles/study-material-view.css";

const getFileExt = (name = "") => {
  const ext = name.split(".").pop().toUpperCase();
  return ext.length <= 5 ? ext : "FILE";
};

const extColor = (ext) => {
  const map = {
    PDF: "#e74c3c", DOC: "#2980b9", DOCX: "#2980b9",
    PPT: "#e67e22", PPTX: "#e67e22", XLS: "#27ae60",
    XLSX: "#27ae60", JPG: "#8e44ad", PNG: "#8e44ad",
  };
  return map[ext] || "#4ba7b5";
};

export default function StudyMaterialView() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const material = state || {};
  const files = material.files || [];

  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(null);

  const filtered = files.filter((f) =>
    f.file_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopy = (e, url) => {
    e.preventDefault();
    navigator.clipboard.writeText(url).then(() => {
      setCopied(url);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <div className="smv-page">

      <button className="smv-back-btn" onClick={() => navigate(-1)}>
        <IoChevronBack /> Back
      </button>

      <div className="smv-header">
        <h2 className="smv-title">Study Material</h2>
        <div className="smv-search">
          <input
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <FiSearch className="smv-search-icon" />
        </div>
      </div>

      <div className="smv-content-card">
        <div className="smv-details">

          <div className="smv-meta-card">
            <p className="smv-detail-line">
              <span className="smv-label">Title: </span>
              <span className="smv-value-bold">{material.title}</span>
            </p>
            <p className="smv-detail-line">
              <span className="smv-label">Uploaded: </span>
              <span className="smv-value-bold">
                {new Date(material.created_at).toLocaleDateString()}
              </span>
            </p>
          </div>

          <div className="smv-files-section">
            <div className="smv-files-header">
              <span className="smv-label">Attached Files</span>
              <span className="smv-files-count-badge">{files.length}</span>
            </div>

            {filtered.length === 0 ? (
              <p className="smv-no-files">
                {search ? "No files match your search." : "No files attached."}
              </p>
            ) : (
              <div className="smv-files-list">
                {filtered.map((file) => {
                  const url = `https://api.shikshacom.com${file.file}`;
                  const ext = getFileExt(file.file_name);
                  const color = extColor(ext);
                  return (
                    <div className="smv-file-card" key={file.id}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="smv-file-link"
                      >
                        <div className="smv-file-icon-box" style={{ background: `${color}22` }}>
                          <FaRegFolder className="smv-file-icon" style={{ color }} />
                        </div>
                        <div className="smv-file-info">
                          <span className="smv-file-name">{file.file_name}</span>
                          <span className="smv-file-ext" style={{ color }}>{ext}</span>
                        </div>
                      </a>
                      <button
                        className={`smv-copy-btn ${copied === url ? "copied" : ""}`}
                        title="Copy link"
                        onClick={(e) => handleCopy(e, url)}
                      >
                        {copied === url ? "Copied!" : "Copy link"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}