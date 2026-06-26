import React, { useState, useEffect } from "react";
import UploadBox from "../components/UploadBox";
import StockTable from "../components/StockTable";
import { getActiveFile, setActiveFile } from "../services/api";

function Upload() {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [activeFile, setLocalActiveFile] = useState(getActiveFile());

  // Load files list from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("uploaded_files");
    if (saved) {
      try {
        setUploadedFiles(JSON.parse(saved));
      } catch (e) {
        console.error("Error reading saved files history", e);
      }
    }
  }, []);

  const handleUploadSuccess = (fileInfo) => {
    const updated = [fileInfo, ...uploadedFiles];
    setUploadedFiles(updated);
    localStorage.setItem("uploaded_files", JSON.stringify(updated));

    // Automatically set the newly uploaded file as active
    handleSelectActive(fileInfo.filePath);
  };

  const handleSelectActive = (filePath) => {
    setActiveFile(filePath);
    setLocalActiveFile(filePath);
    // Dispatch custom event to notify other components (e.g. Dashboard)
    window.dispatchEvent(new Event("activeDatasetChanged"));
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear your upload history?")) {
      setUploadedFiles([]);
      localStorage.removeItem("uploaded_files");
      setActiveFile("");
      setLocalActiveFile("");
      window.dispatchEvent(new Event("activeDatasetChanged"));
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div className="page-header">
          <h1>Dataset Upload</h1>
          <p>Import your sales and inventory records to run analytics and forecasting</p>
        </div>
        {uploadedFiles.length > 0 && (
          <button 
            onClick={handleClearHistory}
            className="btn-secondary"
            style={{ borderColor: "var(--status-crit-border)", color: "var(--status-crit)" }}
          >
            Clear History
          </button>
        )}
      </div>

      <UploadBox onSuccess={handleUploadSuccess} />

      <h3 style={{ marginTop: "2rem", fontSize: "1.35rem", color: "var(--text-primary)", fontWeight: 700 }}>
        Recent Upload History
      </h3>
      <StockTable 
        files={uploadedFiles} 
        activeFile={activeFile}
        onSelectActive={handleSelectActive}
      />
    </div>
  );
}

export default Upload;