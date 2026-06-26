import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

function ForecastChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: "2rem", color: "var(--text)" }}>
        No forecast data to display. Select a product to generate forecasts.
      </div>
    );
  }

  // Format prediction numbers into object list
  const chartData = data.map((val, idx) => {
    // Generate simple future day labels
    const date = new Date();
    date.setDate(date.getDate() + idx + 1);
    const dayLabel = date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric"
    });

    return {
      name: dayLabel,
      "Predicted Sales": Math.round(val * 100) / 100
    };
  });

  return (
    <div style={{ width: "100%", height: 350, marginTop: "1.5rem" }}>
      <ResponsiveContainer>
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
          <XAxis 
            dataKey="name" 
            stroke="var(--text)" 
            fontSize={12}
            tickLine={false}
          />
          <YAxis 
            stroke="var(--text)" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              boxShadow: "var(--shadow)",
              color: "var(--text-h)"
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="Predicted Sales"
            stroke="var(--accent)"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorSales)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ForecastChart;
