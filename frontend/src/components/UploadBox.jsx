import React, { useState, useRef } from "react";
import { uploadDataset } from "../services/api";
import "./UploadBox.css";

function UploadBox({ onSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndUpload = async (file) => {
    if (!file) return;

    // Validate type
    const fileType = file.name.split(".").pop().toLowerCase();
    if (fileType !== "csv" && fileType !== "xlsx" && fileType !== "xls") {
      setError("Please upload only CSV or Excel files (.csv, .xlsx, .xls)");
      return;
    }

    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await uploadDataset(file);
      setSuccessMsg(`File "${file.name}" uploaded successfully!`);
      if (onSuccess) {
        onSuccess({
          filename: file.name,
          filePath: res.data.file_path,
          rows: res.data.rows,
          columns: res.data.columns,
          detectedSchema: res.data.detected_schema,
          uploadedAt: new Date().toLocaleString()
        });
      }
    } catch (err) {
      console.error(err);
      setError("Error uploading file. Please ensure the backend is running and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndUpload(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div 
      className={`upload-box ${dragActive ? "drag-active" : ""} ${loading ? "loading" : ""}`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="file-input"
        multiple={false}
        onChange={handleChange}
        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
      />
      
      <div className="upload-content">
        <div className="upload-icon">
          {loading ? (
            <div className="spinner"></div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-upload-cloud">
              <polyline points="16 16 12 12 8 16"></polyline>
              <line x1="12" y1="12" x2="12" y2="21"></line>
              <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path>
              <polyline points="16 16 12 12 8 16"></polyline>
            </svg>
          )}
        </div>
        
        {loading ? (
          <p className="upload-text loading-text">Processing dataset columns and checking schema...</p>
        ) : (
          <>
            <p className="upload-text-main">Drag and drop your dataset here</p>
            <p className="upload-text-sub">Supports CSV or Excel files up to 50MB</p>
            <button className="upload-btn" onClick={onButtonClick}>Select File</button>
          </>
        )}

        {error && <div className="upload-error">{error}</div>}
        {successMsg && <div className="upload-success">{successMsg}</div>}
      </div>
    </div>
  );
}

export default UploadBox;
