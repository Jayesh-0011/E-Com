import React, { useEffect, useState, useContext } from "react";
import DashboardLayout from "../DashboardLayout";
import OrderCard from "./OrderCard";
import { AuthContext } from "../../../context/AuthProvider";
import { useToast } from "../../../context/ToastContext";
import MetricCard from "../components/MetricCard";

export default function Delivery() {
  const { token, user: authUser } = useContext(AuthContext);
  const { error: showError } = useToast();
  const [orderList, setOrderList] = useState([]);
  const [metrics, setMetrics] = useState([]);

  const fetchData = async () => {
    try {
      // Fetch orders
      const ordersRes = await fetch("http://localhost:5000/api/delivery/orders", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "authorization": `Bearer ${token}`
        },
      });
      const orders = await ordersRes.json();
      console.log("📦 Delivery orders:", orders);
      setOrderList(Array.isArray(orders) ? orders : []);

      // Fetch metrics
      const metricsRes = await fetch("http://localhost:5000/api/delivery/metrics", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "authorization": `Bearer ${token}`
        },
      });
      const metricsData = await metricsRes.json();
      
      // Update metrics
      setMetrics([
        { 
          title: "Active Deliveries", 
          value: metricsData.activeDeliveries || 0, 
          subtitle: "Orders to deliver", 
          icon: "🚚", 
          color: "rgb(249, 115, 22)" 
        },
        { 
          title: "Completed Today", 
          value: metricsData.completedToday || 0, 
          subtitle: "Deliveries completed today", 
          icon: "✅", 
          color: "rgb(16, 185, 129)" 
        },
        { 
          title: "Total Delivered", 
          value: metricsData.totalDelivered || 0, 
          subtitle: "All time deliveries", 
          icon: "📦", 
          color: "rgb(59, 130, 246)" 
        },
      ]);
    } catch (err) {
      console.error("Error fetching delivery data:", err);
      setOrderList([]);
      setMetrics([]);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const updateStatus = async (id, status, orderType) => {
    try {
      const res = await fetch("http://localhost:5000/api/delivery/orders/status", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ id, status, order_type: orderType }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData(); // Refresh orders and metrics
      }
    } catch (err) {
      console.error("Error updating order status:", err);
      showError("Failed to update order status");
    }
  };

  return (
    <DashboardLayout user={{ name: authUser?.name || "Delivery Partner", role: "delivery" }}>
      {/* Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 24 }}>
        {metrics.map((m, i) => (
          <MetricCard key={i} {...m} theme={{
            accentRgba: "rgba(249, 115, 22, 0.3)",
            accentRgbaLight: "rgba(249, 115, 22, 0.1)",
            accent: "rgb(249, 115, 22)",
            accentLight: "rgb(251, 146, 60)"
          }} />
        ))}
      </div>

      {/* Orders Section */}
      <div>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ color: "white", fontSize: "1.875rem", fontWeight: 700, marginBottom: 8 }}>
            📦 Delivery Orders
          </h2>
          <div style={{ color: "rgb(148, 163, 184)", fontSize: "0.95rem" }}>
            Manage and update the status of dispatched orders.
          </div>
        </div>

        {orderList.length === 0 ? (
          <div style={{
            background: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(10px)",
            borderRadius: 16,
            padding: 48,
            textAlign: "center",
            border: "1px solid rgba(249, 115, 22, 0.3)"
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <div style={{ color: "rgb(148, 163, 184)", fontSize: 18 }}>No orders to deliver</div>
            <div style={{ color: "rgb(148, 163, 184)", fontSize: 14, marginTop: 8 }}>
              Orders with "Dispatched" status will appear here
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
            {orderList.map((order) => (
              <OrderCard 
                key={order.s_no || order.id} 
                order={order} 
                onUpdate={(id, status) => updateStatus(id, status, order.order_type)}
                onRefresh={fetchData}
                theme={{
                  accentRgba: "rgba(249, 115, 22, 0.3)",
                  accentRgbaLight: "rgba(249, 115, 22, 0.1)",
                  accent: "rgb(249, 115, 22)",
                  accentLight: "rgb(251, 146, 60)"
                }}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
