import React, { useEffect, useState } from "react";
import { getProfile, getInventoryAnalysis, getActiveFile } from "../services/api";
import "./SummaryCards.css";

function SummaryCards() {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const filePath = getActiveFile();
        const profileRes = await getProfile(filePath);
        const inventoryRes = await getInventoryAnalysis(filePath);

        const data = {
          totalProducts: profileRes.data.total_products ?? "-",
          totalCategories: profileRes.data.total_categories ?? "-",
          avgDailySales: profileRes.data.sales_summary ? Math.round(profileRes.data.sales_summary.avg) : "-",
          currentInventory: inventoryRes.data.current_stock ? Math.round(inventoryRes.data.current_stock) : "-",
          healthScore: inventoryRes.data.health_score ?? "-",
          daysUntilStockout: inventoryRes.data.days_until_stockout ?? "-",
          stockStatus: inventoryRes.data.stock_status ?? "SAFE",
          recommendedOrder: inventoryRes.data.recommended_order ?? "-"
        };
        setKpis(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();

    // Listen for dataset changes
    const handleDatasetChange = () => fetchData();
    window.addEventListener("storage", handleDatasetChange);
    window.addEventListener("activeDatasetChanged", handleDatasetChange);
    
    return () => {
      window.removeEventListener("storage", handleDatasetChange);
      window.removeEventListener("activeDatasetChanged", handleDatasetChange);
    };
  }, []);

  if (loading) {
    return (
      <div className="summary-grid">
        <div className="skeleton-card"></div>
        <div className="skeleton-card"></div>
        <div className="skeleton-card"></div>
        <div className="skeleton-card"></div>
        <div className="skeleton-card"></div>
        <div className="skeleton-card"></div>
      </div>
    );
  }

  if (!kpis) return null;

  // Class selection based on health score
  let healthClass = "card-safe";
  if (kpis.stockStatus === "CRITICAL" || kpis.healthScore < 40) {
    healthClass = "card-critical";
  } else if (kpis.stockStatus === "WARNING" || kpis.healthScore < 75) {
    healthClass = "card-warning";
  }

  return (
    <div className="summary-grid">
      <div className="card glass-panel">
        <div className="card-header-row">
          <h3>Total Products</h3>
          <div className="card-icon-wrapper">
            <svg className="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
              <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"></path>
            </svg>
          </div>
        </div>
        <p className="card-value">{kpis.totalProducts}</p>
        <span className="card-desc">Unique products cataloged</span>
      </div>
      
      <div className="card glass-panel">
        <div className="card-header-row">
          <h3>Total Categories</h3>
          <div className="card-icon-wrapper">
            <svg className="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
          </div>
        </div>
        <p className="card-value">{kpis.totalCategories}</p>
        <span className="card-desc">Product categories represented</span>
      </div>
      
      <div className="card glass-panel">
        <div className="card-header-row">
          <h3>Avg Daily Sales</h3>
          <div className="card-icon-wrapper">
            <svg className="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
          </div>
        </div>
        <p className="card-value">{kpis.avgDailySales} <span className="value-unit">units</span></p>
        <span className="card-desc">Mean aggregate daily sales</span>
      </div>
      
      <div className="card glass-panel">
        <div className="card-header-row">
          <h3>Current Stock</h3>
          <div className="card-icon-wrapper">
            <svg className="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          </div>
        </div>
        <p className="card-value">{kpis.currentInventory} <span className="value-unit">units</span></p>
        <span className="card-desc">Mean available inventory count</span>
      </div>
      
      <div className={`card glass-panel ${healthClass}`}>
        <div className="card-header-row">
          <h3>Stock Health</h3>
          <div className="card-icon-wrapper">
            <svg className="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <polyline points="9 11 11 13 15 9"></polyline>
            </svg>
          </div>
        </div>
        <p className="card-value">{kpis.healthScore}%</p>
        <span className="card-desc">Overall warehouse healthy score</span>
      </div>
      
      <div className={`card glass-panel ${kpis.daysUntilStockout < 7 ? "card-critical" : kpis.daysUntilStockout < 15 ? "card-warning" : "card-safe"}`}>
        <div className="card-header-row">
          <h3>Days to Stockout</h3>
          <div className="card-icon-wrapper">
            <svg className="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
        </div>
        <p className="card-value">{kpis.daysUntilStockout === 999 ? "∞" : kpis.daysUntilStockout} <span className="value-unit">{kpis.daysUntilStockout === 999 ? "" : "days"}</span></p>
        <span className="card-desc">Estimated catalog depletion time</span>
      </div>
    </div>
  );
}

export default SummaryCards;
