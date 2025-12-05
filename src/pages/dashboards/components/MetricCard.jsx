// src/pages/dashboards/components/MetricCard.jsx
import React from "react";
import "../dashboard.css";

export default function MetricCard({ title, value, subtitle, icon, color }) {
  return (
    <div 
      className="group"
      style={{ 
        padding: 16, 
        borderRadius: 12,
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${color ? color.replace('rgb', 'rgba').replace(')', ', 0.3)') : 'rgba(37, 99, 235, 0.3)'}`,
        borderLeft: `4px solid ${color || "#2563eb"}`,
        boxShadow: `0 4px 6px -1px ${color ? color.replace('rgb', 'rgba').replace(')', ', 0.1)') : 'rgba(37, 99, 235, 0.1)'}`,
        transition: 'all 0.3s ease',
        cursor: 'default'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = `0 10px 15px -3px ${color ? color.replace('rgb', 'rgba').replace(')', ', 0.2)') : 'rgba(37, 99, 235, 0.2)'}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = `0 4px 6px -1px ${color ? color.replace('rgb', 'rgba').replace(')', ', 0.1)') : 'rgba(37, 99, 235, 0.1)'}`;
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: 24, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>{icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: "rgb(148, 163, 184)", marginBottom: 6, fontWeight: 500 }}>{title}</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "white" }}>{value}</div>
          {subtitle && <div style={{ fontSize: 12, color: "rgb(148, 163, 184)", marginTop: 4 }}>{subtitle}</div>}
        </div>
      </div>
    </div>
  );
}
