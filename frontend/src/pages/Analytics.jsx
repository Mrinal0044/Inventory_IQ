import React, { useEffect, useState } from "react";
import { getActiveFile, getCategoryDemand } from "../services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from "recharts";

function Analytics() {
  const [loading, setLoading] = useState(true);
  const [demandData, setDemandData] = useState([]);
  const [activePath, setActivePath] = useState(getActiveFile());

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await getCategoryDemand(activePath);
        
        // Convert demand dict {"Groceries": 45000, "Fashion": 25000} into Recharts array [{ name: "Groceries", "Total Sales": 45000 }]
        const formatted = Object.entries(res.data).map(([cat, val]) => ({
          name: cat,
          "Total Sales": val
        })).sort((a, b) => b["Total Sales"] - a["Total Sales"]);

        setDemandData(formatted);
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

  // Premium colors matching theme
  const colors = ["#c084fc", "#aa3bff", "#8b5cf6", "#6366f1", "#3b82f6"];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Category Demand</h1>
        <p>Compare volume demands across all product categories to guide procurement priorities.</p>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Analyzing department levels...</p>
        </div>
      ) : demandData.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Bar Chart Card */}
          <div className="glass-panel card-container">
            <h3 className="card-title">Aggregate Unit Sales by Category</h3>
            
            <div style={{ width: "100%", height: 400 }}>
              <ResponsiveContainer>
                <BarChart
                  data={demandData}
                  margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent-secondary)" />
                      <stop offset="100%" stopColor="var(--accent-primary)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" opacity={0.6} />
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--text-muted)" 
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="var(--text-muted)" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
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
                  <Bar 
                    dataKey="Total Sales" 
                    fill="url(#barGradient)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={60}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Breakdown List */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
            {demandData.map((item, idx) => (
              <div key={idx} className="glass-panel card-container" style={{ padding: "1.25rem 1.25rem 1.25rem 1.75rem", gap: "0.25rem", position: "relative" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: colors[idx % colors.length], borderRadius: "16px 0 0 16px" }} />
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>{item.name}</span>
                <p style={{ fontSize: "1.65rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                  {item["Total Sales"].toLocaleString()} <span style={{ fontSize: "0.95rem", fontWeight: 500, color: "var(--text-muted)" }}>units</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass-panel card-container" style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>
          <p style={{ margin: 0 }}>No category demand metrics available.</p>
        </div>
      )}
    </div>
  );
}

export default Analytics;

