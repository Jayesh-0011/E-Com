// src/pages/dashboards/wholesaler/WholesalerTransactions.jsx
import React, { useContext, useEffect, useState } from "react";
import DashboardLayout from "../DashboardLayout";
import { useToast } from "../../../context/ToastContext";
import "../dashboard.css";
import { AuthContext } from "../../../context/AuthProvider";

function ProgressBar({ status }) {
  const stages = ["Placed", "Confirmed", "Dispatched", "Delivered"];
  const idx = Math.max(0, Math.min(stages.indexOf(status), stages.length - 1));
  const percent = ((idx + 1) / stages.length) * 100;
  return (
    <div>
      <div style={{ height: 10, background: "rgba(148, 163, 184, 0.2)", borderRadius: 8, overflow: "hidden", marginBottom: 8 }}>
        <div style={{ width: `${percent}%`, height: "100%", background: "linear-gradient(90deg, #7c3aed, #a855f7)", transition: "width .4s" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "rgb(148, 163, 184)" }}>
        {stages.map((s) => (
          <div key={s} style={{ textAlign: "center", width: "25%" }}>{s}</div>
        ))}
      </div>
    </div>
  );
}

export default function WholesalerTransactions() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [sortBy, setSortBy] = useState("most_recent");
  const [deliveryDrivers, setDeliveryDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState({});
  const [showDriverModal, setShowDriverModal] = useState({});
  const { token } = useContext(AuthContext);
  const { error: showError, success } = useToast();
  const { user: authUser } = useContext(AuthContext);

  const fetchOrders = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/wholesaler/orders", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        }
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Failed to fetch orders:", res.status, errorData);
        showError(errorData.message || "Failed to fetch orders");
        setOrders([]);
        setFilteredOrders([]);
        return;
      }

      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
      setFilteredOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      showError("Failed to fetch orders");
      setOrders([]);
      setFilteredOrders([]);
    }
  };

  // Sorting logic
  useEffect(() => {
    let sorted = [...orders];
    
    switch (sortBy) {
      case "pending":
        sorted = sorted.filter(o => o.status !== "Delivered");
        sorted.sort((a, b) => {
          const statusOrder = { "Placed": 1, "Confirmed": 2, "Dispatched": 3 };
          return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
        });
        break;
      case "dispatched":
        sorted = sorted.filter(o => o.status === "Dispatched");
        sorted.sort((a, b) => {
          const dateA = a.order_date ? new Date(a.order_date) : new Date(0);
          const dateB = b.order_date ? new Date(b.order_date) : new Date(0);
          return dateB - dateA;
        });
        break;
      case "delivered":
        sorted = sorted.filter(o => o.status === "Delivered");
        sorted.sort((a, b) => {
          const dateA = a.order_date ? new Date(a.order_date) : new Date(0);
          const dateB = b.order_date ? new Date(b.order_date) : new Date(0);
          return dateB - dateA;
        });
        break;
      case "most_recent":
        sorted.sort((a, b) => {
          const dateA = a.order_date ? new Date(a.order_date) : new Date(0);
          const dateB = b.order_date ? new Date(b.order_date) : new Date(0);
          return dateB - dateA;
        });
        break;
      default:
        sorted.sort((a, b) => {
          const dateA = a.order_date ? new Date(a.order_date) : new Date(0);
          const dateB = b.order_date ? new Date(b.order_date) : new Date(0);
          return dateB - dateA;
        });
    }
    
    setFilteredOrders(sorted);
  }, [orders, sortBy]);

  const fetchDeliveryDrivers = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/wholesaler/delivery-drivers", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setDeliveryDrivers(data);
      }
    } catch (err) {
      console.error("Error fetching delivery drivers:", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
      fetchDeliveryDrivers();
    }
  }, [token]);

  const handleDispatch = (orderId) => {
    setShowDriverModal({ ...showDriverModal, [orderId]: true });
  };

  const confirmDispatch = async (orderId) => {
    if (!selectedDriver[orderId]) {
      showError("Please select a delivery driver");
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/wholesaler/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          status: "Dispatched",
          delivery_driver_uid: selectedDriver[orderId]
        })
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.error || "Status update failed");
        return;
      }

      success("Order dispatched successfully!");
      setShowDriverModal({ ...showDriverModal, [orderId]: false });
      setSelectedDriver({ ...selectedDriver, [orderId]: "" });
      fetchOrders(); // Refresh orders
    } catch (err) {
      console.error(err);
      showError("Server error");
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/wholesaler/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus
        })
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.error || "Status update failed");
        return;
      }

      fetchOrders(); // Refresh orders
    } catch (err) {
      console.error(err);
      showError("Server error");
    }
  };

  if (orders.length === 0 && filteredOrders.length === 0) {
    return (
      <DashboardLayout user={{ name: authUser?.name || "Wholesaler Dashboard", role: "wholesaler" }}>
        <div style={{ color: "white" }}>
          <h2 style={{ marginBottom: 8, color: "white" }}>Retailer Orders</h2>
          <div style={{ color: "rgb(148, 163, 184)", marginBottom: 24 }}>
            Manage incoming retailer orders and update their status.
          </div>
          <div style={{
            background: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(10px)",
            borderRadius: 12,
            padding: 48,
            textAlign: "center",
            border: "1px solid rgba(147, 51, 234, 0.3)"
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
            <div style={{ color: "rgb(148, 163, 184)", fontSize: 18 }}>No orders yet</div>
            <div style={{ color: "rgb(148, 163, 184)", fontSize: 14, marginTop: 8 }}>Retailer orders will appear here once they place an order</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={{ name: authUser?.name || "Wholesaler Dashboard", role: "wholesaler" }}>
      <div style={{ color: "white" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h2 style={{ marginBottom: 8, color: "white" }}>Retailer Orders</h2>
            <div style={{ color: "rgb(148, 163, 184)" }}>
              Manage incoming retailer orders and update their status.
            </div>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              background: "rgba(15, 23, 42, 0.5)",
              border: "1px solid rgba(147, 51, 234, 0.3)",
              color: "white",
              fontSize: 14,
              cursor: "pointer",
              outline: "none"
            }}
          >
            <option value="most_recent">Most Recent</option>
            <option value="pending">Pending Orders</option>
            <option value="dispatched">Dispatched</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          {filteredOrders.map((o) => (
            <div 
              key={o.s_no} 
              style={{
                background: "rgba(0, 0, 0, 0.6)",
                backdropFilter: "blur(10px)",
                borderRadius: 16,
                padding: 20,
                border: "1px solid rgba(147, 51, 234, 0.3)",
                boxShadow: "0 4px 6px -1px rgba(147, 51, 234, 0.2)"
              }}
            >
              <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                {o.product_image && (
                  <img
                    src={o.product_image}
                    alt={o.product_name || "Product"}
                    style={{
                      width: 120,
                      height: 120,
                      objectFit: "cover",
                      borderRadius: 8,
                      border: "1px solid rgba(147, 51, 234, 0.3)"
                    }}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4, color: "white" }}>
                        Order #{o.s_no}
                      </div>
                      <div style={{ color: "rgb(148, 163, 184)", fontSize: 14, marginBottom: 2 }}>
                        Product Name: {o.product_name || o.product_id || "Unknown Product"}
                      </div>
                      <div style={{ color: "rgb(148, 163, 184)", fontSize: 14, marginBottom: 2 }}>
                        Retailer: {o.retailer_name || o.retailer_uid || "Unknown"}
                      </div>
                      <div style={{ color: "rgb(148, 163, 184)", fontSize: 14, marginBottom: 2 }}>
                        Quantity: {o.product_quantity || 1} × ₹{o.product_price || 0}
                      </div>
                      <div style={{ color: "rgb(148, 163, 184)", fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                        Total Price: <span style={{ color: "rgb(251, 146, 60)", fontSize: 16 }}>₹{o.total || ((o.product_quantity || 1) * (o.product_price || 0))}</span>
                      </div>
                      {o.order_date && (
                        <div style={{ color: "rgb(148, 163, 184)", fontSize: 13, marginBottom: 2 }}>
                          Order Date: <span style={{ color: "white" }}>{new Date(o.order_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      {o.delivered_date && (
                        <div style={{ color: "rgb(148, 163, 184)", fontSize: 13, marginBottom: 2 }}>
                          Delivered Date: <span style={{ color: "rgb(16, 185, 129)" }}>{new Date(o.delivered_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    <div style={{
                      padding: "6px 12px",
                      borderRadius: 8,
                      background: o.status === "Delivered" ? "rgba(16, 185, 129, 0.2)" : 
                                   o.status === "Dispatched" ? "rgba(59, 130, 246, 0.2)" :
                                   o.status === "Confirmed" ? "rgba(251, 191, 36, 0.2)" :
                                   "rgba(148, 163, 184, 0.2)",
                      color: o.status === "Delivered" ? "#10b981" : 
                             o.status === "Dispatched" ? "#3b82f6" :
                             o.status === "Confirmed" ? "#fbbf24" :
                             "#94a3b8",
                      fontWeight: 600,
                      fontSize: 12
                    }}>
                      {o.status || "Placed"}
                    </div>
                  </div>
                </div>
              </div>

              <ProgressBar status={o.status || "Placed"} />

              <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                {o.status === "Placed" && (
                  <button
                    onClick={() => updateStatus(o.s_no, "Confirmed")}
                    style={{
                      padding: "8px 16px",
                      background: "rgba(147, 51, 234, 0.3)",
                      border: "1px solid rgba(147, 51, 234, 0.5)",
                      borderRadius: 8,
                      color: "rgb(168, 85, 247)",
                      cursor: "pointer",
                      fontWeight: 600
                    }}
                  >
                    Confirm
                  </button>
                )}

                {o.status === "Confirmed" && (
                  <button
                    onClick={() => handleDispatch(o.s_no)}
                    style={{
                      padding: "8px 16px",
                      background: "rgba(147, 51, 234, 0.3)",
                      border: "1px solid rgba(147, 51, 234, 0.5)",
                      borderRadius: 8,
                      color: "rgb(168, 85, 247)",
                      cursor: "pointer",
                      fontWeight: 600
                    }}
                  >
                    Dispatch
                  </button>
                )}

                {o.status === "Dispatched" && (
                  <div style={{ 
                    padding: "8px 12px", 
                    background: "rgba(59, 130, 246, 0.2)", 
                    borderRadius: 8,
                    color: "rgb(59, 130, 246)",
                    fontSize: "0.875rem",
                    border: "1px solid rgba(59, 130, 246, 0.3)",
                    fontWeight: 600
                  }}>
                    ✓ Dispatched - Awaiting delivery
                  </div>
                )}

                {o.status === "Delivered" && (
                  <div style={{ 
                    padding: "8px 12px", 
                    background: "rgba(16, 185, 129, 0.2)", 
                    borderRadius: 8,
                    color: "rgb(16, 185, 129)",
                    fontSize: "0.875rem",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    fontWeight: 600
                  }}>
                    ✓ Delivered
                  </div>
                )}

                {/* Delivery Driver Selection Modal */}
                {showDriverModal[o.s_no] && (
                  <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(0, 0, 0, 0.7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 10000
                  }} onClick={() => setShowDriverModal({ ...showDriverModal, [o.s_no]: false })}>
                    <div style={{
                      background: "rgba(0, 0, 0, 0.9)",
                      backdropFilter: "blur(20px)",
                      borderRadius: 16,
                      padding: 24,
                      border: "1px solid rgba(147, 51, 234, 0.3)",
                      minWidth: 400,
                      maxWidth: 500
                    }} onClick={(e) => e.stopPropagation()}>
                      <h3 style={{ color: "white", marginBottom: 16, fontSize: "1.25rem" }}>
                        Select Delivery Driver
                      </h3>
                      <p style={{ color: "rgb(148, 163, 184)", marginBottom: 16, fontSize: "0.875rem" }}>
                        Choose a delivery driver to assign this order to:
                      </p>
                      
                      <select
                        value={selectedDriver[o.s_no] || ""}
                        onChange={(e) => setSelectedDriver({ ...selectedDriver, [o.s_no]: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          background: "rgba(0, 0, 0, 0.5)",
                          border: "1px solid rgba(147, 51, 234, 0.3)",
                          borderRadius: 8,
                          color: "white",
                          fontSize: "0.95rem",
                          marginBottom: 16
                        }}
                      >
                        <option value="">-- Select Driver --</option>
                        {deliveryDrivers.map((driver) => (
                          <option key={driver.uid} value={driver.uid}>
                            {driver.username} ({driver.phone_no || driver.email})
                          </option>
                        ))}
                      </select>

                      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                        <button
                          onClick={() => {
                            setShowDriverModal({ ...showDriverModal, [o.s_no]: false });
                            setSelectedDriver({ ...selectedDriver, [o.s_no]: "" });
                          }}
                          style={{
                            padding: "8px 16px",
                            background: "rgba(148, 163, 184, 0.2)",
                            border: "1px solid rgba(148, 163, 184, 0.3)",
                            borderRadius: 8,
                            color: "rgb(148, 163, 184)",
                            cursor: "pointer"
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => confirmDispatch(o.s_no)}
                          disabled={!selectedDriver[o.s_no]}
                          style={{
                            padding: "8px 16px",
                            background: selectedDriver[o.s_no] ? "rgba(147, 51, 234, 0.3)" : "rgba(148, 163, 184, 0.1)",
                            border: selectedDriver[o.s_no] ? "1px solid rgba(147, 51, 234, 0.5)" : "1px solid rgba(148, 163, 184, 0.3)",
                            borderRadius: 8,
                            color: selectedDriver[o.s_no] ? "rgb(168, 85, 247)" : "rgb(148, 163, 184)",
                            cursor: selectedDriver[o.s_no] ? "pointer" : "not-allowed",
                            fontWeight: 600
                          }}
                        >
                          Confirm Dispatch
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
