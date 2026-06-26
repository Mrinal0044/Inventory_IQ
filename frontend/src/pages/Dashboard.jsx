import React, { useEffect, useState } from "react";
import SummaryCards from "../components/SummaryCards";
import { getActiveFile, getInventoryAnalysis } from "../services/api";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

function Dashboard() {
  const [activePath, setActivePath] = useState(getActiveFile());
  const [stockBreakdown, setStockBreakdown] = useState([]);
  const [loading, setLoading] = useState(false);

  const activeName = activePath ? activePath.split("/").pop() : "Default Synthetic Dataset";

  useEffect(() => {
    async function loadBreakdown() {
      try {
        setLoading(true);
        const res = await getInventoryAnalysis(activePath);
        if (res.data.product_analysis) {
          const counts = { SAFE: 0, WARNING: 0, CRITICAL: 0 };
          res.data.product_analysis.forEach(item => {
            const status = item.stock_status || "SAFE";
            counts[status] = (counts[status] || 0) + 1;
          });

          const chartData = [
            { name: "Safe", value: counts.SAFE, color: "#10b981" },
            { name: "Warning", value: counts.WARNING, color: "#f59e0b" },
            { name: "Critical", value: counts.CRITICAL, color: "#ef4444" }
          ].filter(item => item.value > 0);

          setStockBreakdown(chartData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadBreakdown();

    const handleDatasetChange = () => {
      const current = getActiveFile();
      setActivePath(current);
    };
    window.addEventListener("activeDatasetChanged", handleDatasetChange);
    window.addEventListener("storage", handleDatasetChange);

    return () => {
      window.removeEventListener("activeDatasetChanged", handleDatasetChange);
      window.removeEventListener("storage", handleDatasetChange);
    };
  }, [activePath]);

  return (
    <div className="page-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div className="page-header">
          <h1>InventoryIQ Dashboard</h1>
          <p>Real-time inventory optimization and predictive demand forecasting</p>
        </div>
        <div className="dataset-banner">
          <span className="dataset-banner-label">Active Dataset</span>
          <span className="dataset-banner-value">{activeName}</span>
        </div>
      </div>

      <SummaryCards />

      <div className="dashboard-grid">
        {/* Inventory Distribution */}
        <div className="glass-panel card-container">
          <h2 className="card-title">Inventory Health Distribution</h2>
          
          {loading ? (
            <div className="loading-container" style={{ height: 250, padding: 0 }}>
              <div className="spinner"></div>
              <p className="loading-text">Analyzing health states...</p>
            </div>
          ) : stockBreakdown.length > 0 ? (
            <div style={{ width: "100%", height: 250 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={stockBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stockBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-glass)",
                      borderRadius: "12px",
                      boxShadow: "var(--shadow-premium)",
                      color: "var(--text-primary)"
                    }}
                  />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: 250, display: "flex", justifyContent: "center", alignItems: "center", color: "var(--text-muted)" }}>
              No inventory health details found.
            </div>
          )}
        </div>

        {/* Quick Access Actions */}
        <div className="glass-panel card-container" style={{ justifyContent: "space-between" }}>
          <div>
            <h2 className="card-title">Decision Intelligence Hub</h2>
            <p style={{ fontSize: "0.95rem", lineHeight: "1.6", margin: "0.5rem 0 1.5rem 0" }}>
              Welcome to InventoryIQ. This platform combines ML-driven demand forecasting with dynamic safety stock recommendations to prevent stockouts and reduce carrying costs.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", fontSize: "0.9rem" }}>
                <svg style={{ width: 18, height: 18, color: "var(--status-safe)", flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Keep stockouts under control with Health Alerting.</span>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", fontSize: "0.9rem" }}>
                <svg style={{ width: 18, height: 18, color: "var(--status-safe)", flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Predict next-7-day sales using gradient-boosted regression.</span>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", fontSize: "0.9rem" }}>
                <svg style={{ width: 18, height: 18, color: "var(--status-safe)", flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Run catalog-wide analytics instantly by category.</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
            <a href="/upload" className="btn-primary" style={{ flex: 1, textDecoration: "none" }}>
              Manage Datasets
            </a>
            <a href="/forecast" className="btn-secondary" style={{ flex: 1, textDecoration: "none" }}>
              Run Forecasts
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

