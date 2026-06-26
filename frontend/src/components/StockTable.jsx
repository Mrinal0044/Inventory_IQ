import React from "react";
import "./StockTable.css";

function StockTable({ files, activeFile, onSelectActive }) {
  if (!files || files.length === 0) {
    return (
      <div className="empty-state">
        <p>No uploaded files in recent history.</p>
        <p className="sub">Upload a CSV or Excel file to get started.</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="stock-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Dataset Name</th>
            <th>Uploaded At</th>
            <th>Dimensions</th>
            <th>Product Column</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file, idx) => {
            const isActive = activeFile === file.filePath;
            return (
              <tr key={idx} className={isActive ? "active-row" : ""}>
                <td>
                  {isActive ? (
                    <span className="badge active-badge">Active</span>
                  ) : (
                    <span className="badge inactive-badge">Inactive</span>
                  )}
                </td>
                <td className="file-name">{file.filename}</td>
                <td>{file.uploadedAt}</td>
                <td className="dim-cell">
                  <span>{file.rows} rows</span>
                  <span className="col-count">{file.columns} cols</span>
                </td>
                <td>
                  <code>{file.detectedSchema?.product || "Not detected"}</code>
                </td>
                <td>
                  {isActive ? (
                    <button className="table-btn active-btn" disabled>Active</button>
                  ) : (
                    <button 
                      className="table-btn select-btn"
                      onClick={() => onSelectActive(file.filePath)}
                    >
                      Use Dataset
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default StockTable;
