import React, { useEffect, useState, useContext } from "react";
import DashboardLayout from "../DashboardLayout";
import { AuthContext } from "../../../context/AuthProvider";
import { useToast } from "../../../context/ToastContext";
import MetricCard from "../components/MetricCard";

export default function DeliveryPastOrders() {
  const { token, user: authUser } = useContext(AuthContext);
  const { error: showError } = useToast();
  const [pastOrders, setPastOrders] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPastOrders = async () => {
    try {
      setLoading(true);
      
      // Fetch past orders
      const ordersRes = await fetch("http://localhost:5000/api/delivery/past-orders", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "authorization": `Bearer ${token}`
        },
      });
      
      if (!ordersRes.ok) {
        throw new Error("Failed to fetch past orders");
      }
      
      const orders = await ordersRes.json();
      setPastOrders(Array.isArray(orders) ? orders : []);

      // Fetch metrics
      const metricsRes = await fetch("http://localhost:5000/api/delivery/metrics", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "authorization": `Bearer ${token}`
        },
      });
      const metricsData = await metricsRes.json();
      
      // Calculate this week's deliveries
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const thisWeek = orders?.filter(o => {
        const orderDate = o.delivered_date ? new Date(o.delivered_date) : null;
        if (!orderDate) return false;
        return orderDate >= weekAgo;
      })?.length || 0;
      
      // Update metrics
      setMetrics([
        { 
          title: "Total Delivered", 
          value: metricsData.totalDelivered || 0, 
          subtitle: "All time deliveries", 
          icon: "📦", 
          color: "rgb(249, 115, 22)" 
        },
        { 
          title: "Delivered Today", 
          value: metricsData.completedToday || 0, 
          subtitle: "Today's deliveries", 
          icon: "✅", 
          color: "rgb(16, 185, 129)" 
        },
        { 
          title: "This Week", 
          value: thisWeek, 
          subtitle: "Last 7 days", 
          icon: "📊", 
          color: "rgb(59, 130, 246)" 
        },
      ]);
    } catch (err) {
      console.error("Error fetching past orders:", err);
      showError("Failed to load past orders");
      setPastOrders([]);
      setMetrics([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPastOrders();
    }
  }, [token]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
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

      {/* Past Orders Section */}
      <div>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ color: "white", fontSize: "1.875rem", fontWeight: 700, marginBottom: 8 }}>
            📋 Past Deliveries
          </h2>
          <div style={{ color: "rgb(148, 163, 184)", fontSize: "0.95rem" }}>
            View your completed delivery history.
          </div>
        </div>

        {loading ? (
          <div style={{
            background: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(10px)",
            borderRadius: 16,
            padding: 48,
            textAlign: "center",
            border: "1px solid rgba(249, 115, 22, 0.3)"
          }}>
            <div style={{ color: "rgb(148, 163, 184)", fontSize: 18 }}>Loading past orders...</div>
          </div>
        ) : pastOrders.length === 0 ? (
          <div style={{
            background: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(10px)",
            borderRadius: 16,
            padding: 48,
            textAlign: "center",
            border: "1px solid rgba(249, 115, 22, 0.3)"
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <div style={{ color: "rgb(148, 163, 184)", fontSize: 18 }}>No past deliveries</div>
            <div style={{ color: "rgb(148, 163, 184)", fontSize: 14, marginTop: 8 }}>
              Completed deliveries will appear here
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: 20 }}>
            {pastOrders.map((order) => (
              <div
                key={order.s_no || order.id}
                style={{
                  background: "rgba(0, 0, 0, 0.4)",
                  backdropFilter: "blur(10px)",
                  borderRadius: 16,
                  padding: 20,
                  border: "1px solid rgba(249, 115, 22, 0.3)",
                  transition: "all 0.3s ease",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(249, 115, 22, 0.6)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(249, 115, 22, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(249, 115, 22, 0.3)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <div style={{ color: "white", fontSize: "1.125rem", fontWeight: 600 }}>
                        Order #{order.s_no || order.id}
                      </div>
                      {order.order_type === 'retailer_order' ? (
                        <div style={{
                          background: "rgba(147, 51, 234, 0.2)",
                          color: "rgb(168, 85, 247)",
                          padding: "2px 8px",
                          borderRadius: 6,
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          border: "1px solid rgba(147, 51, 234, 0.3)"
                        }}>
                          WHOLESALE
                        </div>
                      ) : (
                        <div style={{
                          background: "rgba(5, 150, 105, 0.2)",
                          color: "rgb(16, 185, 129)",
                          padding: "2px 8px",
                          borderRadius: 6,
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          border: "1px solid rgba(5, 150, 105, 0.3)"
                        }}>
                          RETAIL
                        </div>
                      )}
                    </div>
                    <div style={{ color: "rgb(148, 163, 184)", fontSize: "0.875rem" }}>
                      Product Name: <span style={{ color: "white" }}>{order.product_name || order.product_id || "N/A"}</span>
                    </div>
                  </div>
                  <div style={{
                    background: "rgba(16, 185, 129, 0.2)",
                    color: "rgb(16, 185, 129)",
                    padding: "4px 12px",
                    borderRadius: 8,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    border: "1px solid rgba(16, 185, 129, 0.3)"
                  }}>
                    ✓ Delivered
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: "rgb(148, 163, 184)", fontSize: "0.875rem", marginBottom: 4 }}>
                    {order.order_type === 'retailer_order' ? 'Retailer' : 'Customer'}: 
                    <span style={{ color: "white", marginLeft: 4 }}>
                      {order.customer_name || order.customer_uid || "N/A"}
                    </span>
                  </div>
                  <div style={{ color: "rgb(148, 163, 184)", fontSize: "0.875rem", marginBottom: 4 }}>
                    Quantity: <span style={{ color: "white" }}>{order.product_quantity || "N/A"}</span>
                  </div>
                </div>

                <div style={{
                  paddingTop: 12,
                  borderTop: "1px solid rgba(249, 115, 22, 0.2)",
                  color: "rgb(148, 163, 184)",
                  fontSize: "0.875rem"
                }}>
                  Delivered on: {formatDate(order.delivered_date)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

