import React, { useEffect, useState } from "react";
import { getActiveFile, getInventoryAnalysis } from "../services/api";

function Inventory() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [activePath, setActivePath] = useState(getActiveFile());

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await getInventoryAnalysis(activePath);
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    const handleDatasetChange = () => {
      setActivePath(getActiveFile());
    };
    window.addEventListener("activeDatasetChanged", handleDatasetChange);
    window.addEventListener("storage", handleDatasetChange);

    return () => {
      window.removeEventListener("activeDatasetChanged", handleDatasetChange);
      window.removeEventListener("storage", handleDatasetChange);
    };
  }, [activePath]);

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "var(--accent)" }}>
        <h2 className="loading-text">Loading catalog stock levels...</h2>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: "2rem", color: "var(--text)" }}>
        <h2>Error Loading Inventory</h2>
        <p>Could not fetch inventory analysis from backend.</p>
      </div>
    );
  }

  const products = data.product_analysis || [];

  // Filter products by search and status
  const filteredProducts = products.filter(item => {
    const matchesSearch = item.product.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || item.stock_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Inventory Status</h1>
        <p>Monitor stock counts, calculate depletion velocity, and review safety stock order quantities.</p>
      </div>

      {/* Grid summarizing core metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", marginBottom: "1rem" }}>
        <div className="glass-panel card-container" style={{ padding: "1.25rem" }}>
          <h4 style={{ textTransform: "uppercase", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.05em", margin: 0 }}>Average Daily Sales</h4>
          <p className="card-value" style={{ fontSize: "1.75rem" }}>{data.average_sales} <span className="value-unit">units</span></p>
        </div>
        <div className="glass-panel card-container" style={{ padding: "1.25rem" }}>
          <h4 style={{ textTransform: "uppercase", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.05em", margin: 0 }}>Catalog Stock Volume</h4>
          <p className="card-value" style={{ fontSize: "1.75rem" }}>{data.current_stock} <span className="value-unit">units</span></p>
        </div>
        <div className="glass-panel card-container" style={{ padding: "1.25rem" }}>
          <h4 style={{ textTransform: "uppercase", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.05em", margin: 0 }}>System Health Score</h4>
          <p className="card-value" style={{ fontSize: "1.75rem", color: data.health_score < 50 ? "var(--status-crit)" : data.health_score < 75 ? "var(--status-warn)" : "var(--status-safe)" }}>{data.health_score}%</p>
        </div>
        <div className="glass-panel card-container" style={{ padding: "1.25rem" }}>
          <h4 style={{ textTransform: "uppercase", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.05em", margin: 0 }}>Recommended Restocks</h4>
          <p className="card-value" style={{ fontSize: "1.75rem", color: "var(--accent-primary)" }}>{data.recommended_order} <span className="value-unit" style={{ color: "var(--accent-primary)", opacity: 0.8 }}>units</span></p>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", marginBottom: "0.5rem" }}>
        <input
          type="text"
          placeholder="Search products or categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            minWidth: "260px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-glass)",
            borderRadius: "12px",
            padding: "0.75rem 1.25rem",
            color: "var(--text-primary)",
            fontSize: "0.95rem",
            outline: "none",
            boxShadow: "var(--shadow-premium)",
            transition: "all 0.2s ease"
          }}
        />
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {["ALL", "SAFE", "WARNING", "CRITICAL"].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                border: "1px solid var(--border-glass)",
                background: statusFilter === status ? "var(--accent-gradient)" : "var(--bg-card)",
                color: statusFilter === status ? "#fff" : "var(--text-primary)",
                padding: "0.6rem 1.25rem",
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer",
                boxShadow: "var(--shadow-premium)",
                transition: "all 0.25s ease"
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div style={{ width: "100%", overflowX: "auto", border: "1px solid var(--border-glass)", borderRadius: "16px", background: "var(--bg-card)", boxShadow: "var(--shadow-premium)", backdropFilter: "blur(16px)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.95rem" }}>
          <thead>
            <tr style={{ background: "rgba(99, 102, 241, 0.02)" }}>
              <th style={{ padding: "1.1rem 1.5rem", fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.05em", borderBottom: "1px solid var(--border-glass)" }}>Product</th>
              <th style={{ padding: "1.1rem 1.5rem", fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.05em", borderBottom: "1px solid var(--border-glass)" }}>Category</th>
              <th style={{ padding: "1.1rem 1.5rem", fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.05em", borderBottom: "1px solid var(--border-glass)" }}>Current Stock</th>
              <th style={{ padding: "1.1rem 1.5rem", fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.05em", borderBottom: "1px solid var(--border-glass)" }}>Daily Sales (Avg)</th>
              <th style={{ padding: "1.1rem 1.5rem", fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.05em", borderBottom: "1px solid var(--border-glass)" }}>Days left</th>
              <th style={{ padding: "1.1rem 1.5rem", fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.05em", borderBottom: "1px solid var(--border-glass)" }}>Status</th>
              <th style={{ padding: "1.1rem 1.5rem", fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.05em", borderBottom: "1px solid var(--border-glass)" }}>Restock Advice</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((item, idx) => {
                let badgeClass = "active-badge";
                let statusColor = "var(--status-safe)";
                let statusBg = "var(--status-safe-bg)";
                let statusBorder = "var(--status-safe-border)";
                
                if (item.stock_status === "CRITICAL") {
                  statusColor = "var(--status-crit)";
                  statusBg = "var(--status-crit-bg)";
                  statusBorder = "var(--status-crit-border)";
                } else if (item.stock_status === "WARNING") {
                  statusColor = "var(--status-warn)";
                  statusBg = "var(--status-warn-bg)";
                  statusBorder = "var(--status-warn-border)";
                }

                return (
                  <tr key={idx} style={{ borderBottom: "1px solid var(--border-glass)", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "var(--accent-bg)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "1.1rem 1.5rem", fontWeight: 600, color: "var(--text-primary)" }}>{item.product}</td>
                    <td style={{ padding: "1.1rem 1.5rem", color: "var(--text-muted)" }}>{item.category}</td>
                    <td style={{ padding: "1.1rem 1.5rem", color: "var(--text-primary)", fontWeight: 500 }}>{item.current_stock}</td>
                    <td style={{ padding: "1.1rem 1.5rem", color: "var(--text-muted)" }}>{item.average_sales} units</td>
                    <td style={{ padding: "1.1rem 1.5rem", color: "var(--text-primary)", fontWeight: 500 }}>
                      {item.days_until_stockout === 999 ? "∞" : `${item.days_until_stockout} days`}
                    </td>
                    <td style={{ padding: "1.1rem 1.5rem" }}>
                      <span className="badge" style={{ color: statusColor, background: statusBg, border: `1px solid ${statusBorder}` }}>
                        {item.stock_status}
                      </span>
                    </td>
                    <td style={{ padding: "1.1rem 1.5rem", fontWeight: 700, color: item.recommended_order > 0 ? "var(--accent-primary)" : "var(--text-muted)" }}>
                      {item.recommended_order > 0 ? `Order +${item.recommended_order}` : "Stock Adequate"}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>
                  No matching products found. Try modifying your search or filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Inventory;
