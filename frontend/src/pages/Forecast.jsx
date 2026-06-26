import React, { useEffect, useState } from "react";
import { getActiveFile, getForecast } from "../services/api";
import ForecastChart from "../components/ForecastChart";

function Forecast() {
  const [loading, setLoading] = useState(true);
  const [productList, setProductList] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [forecastData, setForecastData] = useState([]);
  const [activePath, setActivePath] = useState(getActiveFile());
  const [error, setError] = useState("");

  // Fetch forecast data
  const loadForecast = async (productVal = "") => {
    try {
      setLoading(true);
      setError("");
      const res = await getForecast(activePath, productVal);
      
      if (res.data.error) {
        setError(res.data.error);
        return;
      }

      setForecastData(res.data.next_7_day_forecast || []);
      setSelectedProduct(res.data.product || "");
      if (res.data.products) {
        setProductList(res.data.products);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to generate XGBoost predictions. Ensure backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForecast("");

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

  const handleProductChange = (e) => {
    const val = e.target.value;
    setSelectedProduct(val);
    loadForecast(val);
  };

  // Compute key forecast summary metrics
  const avgForecast = forecastData.length > 0 
    ? Math.round((forecastData.reduce((a, b) => a + b, 0) / forecastData.length) * 100) / 100 
    : 0;
  
  const peakForecast = forecastData.length > 0 
    ? Math.round(Math.max(...forecastData) * 100) / 100 
    : 0;

  const totalForecast = forecastData.length > 0 
    ? Math.round(forecastData.reduce((a, b) => a + b, 0)) 
    : 0;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Demand Forecasting</h1>
        <p>Generate 7-day predictive sales models using XGBoost regression trained on historical patterns.</p>
      </div>

      {error ? (
        <div className="glass-panel card-container" style={{ borderColor: "var(--status-crit-border)", color: "var(--status-crit)", background: "var(--status-crit-bg)" }}>
          <h3 style={{ color: "var(--status-crit)", fontWeight: 700 }}>Forecasting Error</h3>
          <p style={{ color: "var(--status-crit)", margin: 0 }}>{error}</p>
        </div>
      ) : (
        <>
          {/* Dropdown Selector */}
          <div className="glass-panel" style={{ padding: "1.25rem 2rem", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Select Product</label>
              <select
                value={selectedProduct}
                onChange={handleProductChange}
                disabled={loading}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-glass)",
                  borderRadius: "10px",
                  padding: "0.6rem 2.5rem 0.6rem 1rem",
                  color: "var(--text-primary)",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  outline: "none",
                  boxShadow: "var(--shadow-premium)"
                }}
              >
                {productList.map(prod => (
                  <option key={prod} value={prod}>{prod}</option>
                ))}
              </select>
            </div>
            
            <div style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
              <span>ML Model: </span>
              <span style={{ fontWeight: 700, color: "var(--accent-primary)", background: "var(--accent-bg)", border: "1px solid var(--accent-border)", padding: "0.35rem 0.75rem", borderRadius: "9999px", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                XGBoost Regressor (n_estimators=100)
              </span>
            </div>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p className="loading-text">Fitting model and forecasting sales values...</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {/* Forecast Area Chart */}
              <div className="glass-panel card-container">
                <h3 className="card-title">Predicted Next 7 Days Sales - {selectedProduct}</h3>
                <ForecastChart data={forecastData} />
              </div>

              {/* Forecast Metrics Summary */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
                <div className="glass-panel card-container">
                  <h4 style={{ textTransform: "uppercase", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.05em", margin: 0 }}>Mean Forecast Demand</h4>
                  <p className="card-value">{avgForecast} <span className="value-unit">units</span></p>
                  <span className="card-desc">Expected average daily demand</span>
                </div>
                <div className="glass-panel card-container">
                  <h4 style={{ textTransform: "uppercase", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.05em", margin: 0 }}>Peak Forecast Demand</h4>
                  <p className="card-value">{peakForecast} <span className="value-unit">units</span></p>
                  <span className="card-desc">Maximum predicted single-day sales</span>
                </div>
                <div className="glass-panel card-container">
                  <h4 style={{ textTransform: "uppercase", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.05em", margin: 0 }}>Aggregate Predicted Demand</h4>
                  <p className="card-value" style={{ color: "var(--accent-primary)" }}>{totalForecast} <span className="value-unit" style={{ color: "var(--accent-primary)", opacity: 0.8 }}>units</span></p>
                  <span className="card-desc">Cumulative units required over 7 days</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Forecast;
