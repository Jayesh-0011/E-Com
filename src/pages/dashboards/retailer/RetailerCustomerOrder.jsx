// src/pages/dashboards/retailer/RetailerCustomerOrder.jsx
import React, { useEffect, useState, useContext, useRef } from "react";
import { createPortal } from "react-dom";
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
        <div style={{ width: `${percent}%`, height: "100%", background: "linear-gradient(90deg, #10b981, #059669)", transition: "width .4s" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "rgb(148, 163, 184)" }}>
        {stages.map((s) => (
          <div key={s} style={{ textAlign: "center", width: "25%" }}>{s}</div>
        ))}
      </div>
    </div>
  );
}

export default function RetailerCustomerOrders() {
  const { token } = useContext(AuthContext);
  const { error: showError, success } = useToast();
  const { user: authUser } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [sortBy, setSortBy] = useState("most_recent");
  const [deliveryDrivers, setDeliveryDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState({});
  const [showDriverModal, setShowDriverModal] = useState({});
  const [queryModal, setQueryModal] = useState({ open: false, order: null, queries: [], loading: false });
  const [newReply, setNewReply] = useState("");
  const messagesEndRef = useRef(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/retailer/customer-orders", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
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
      console.log("Fetched orders:", data);
      
      // Check which orders have queries
      const ordersWithQueryInfo = await Promise.all(
        (Array.isArray(data) ? data : []).map(async (order) => {
          if (order.status === "Delivered") {
            try {
              const queryRes = await fetch(`http://localhost:5000/api/retailer/queries/${order.s_no}`, {
                headers: { "Authorization": `Bearer ${token}` }
              });
              if (queryRes.ok) {
                const queryData = await queryRes.json();
                return {
                  ...order,
                  has_query: queryData.queries && queryData.queries.length > 0,
                  query_resolved: queryData.queries && queryData.queries.every(q => q.is_resolved)
                };
              }
            } catch (err) {
              console.error("Error checking queries:", err);
            }
          }
          return {
            ...order,
            has_query: false,
            query_resolved: false
          };
        })
      );
      console.log("Orders with query info:", ordersWithQueryInfo);
      setOrders(ordersWithQueryInfo);
      setFilteredOrders(ordersWithQueryInfo);
    } catch (err) {
      console.error("Error fetching orders:", err);
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
      case "query_unresolved":
        sorted = sorted.filter(o => o.status === "Delivered" && o.has_query && !o.query_resolved);
        sorted.sort((a, b) => {
          const dateA = a.order_date ? new Date(a.order_date) : new Date(0);
          const dateB = b.order_date ? new Date(b.order_date) : new Date(0);
          return dateB - dateA;
        });
        break;
      case "query_resolved":
        sorted = sorted.filter(o => o.status === "Delivered" && o.has_query && o.query_resolved);
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

  const handleOpenQuery = async (order) => {
    setQueryModal({ open: true, order, queries: [], loading: true });
    setNewReply("");

    try {
      const res = await fetch(`http://localhost:5000/api/retailer/queries/${order.s_no}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setQueryModal({ open: true, order, queries: data.queries || [], loading: false });
        // Scroll to bottom after loading
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
          }
        }, 100);
      }
    } catch (err) {
      console.error("Error fetching queries:", err);
      setQueryModal({ open: false, order: null, queries: [], loading: false });
    }
  };

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current && queryModal.queries.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [queryModal.queries]);

  const handleSendReply = async () => {
    if (!newReply.trim() || !queryModal.order) return;

    const messageToSend = newReply.trim();
    setNewReply(""); // Clear input immediately for better UX

    // Optimistically add the message to the UI
    const tempQuery = {
      query_id: `temp_${Date.now()}`, // Temporary ID with prefix
      order_id: queryModal.order.s_no,
      message: messageToSend,
      sender_role: "retailer",
      created_at: new Date().toISOString(),
      is_resolved: false
    };
    
    // Update state using functional update to ensure we have latest state
    setQueryModal(prev => ({
      ...prev,
      queries: [...prev.queries, tempQuery]
    }));

    try {
      const res = await fetch(`http://localhost:5000/api/retailer/queries/${queryModal.order.s_no}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          message: messageToSend
        })
      });

      if (res.ok) {
        const data = await res.json();
        console.log("Server response:", data);
        // Replace temp message with real one from server
        if (data.query) {
          setQueryModal(prev => ({
            ...prev,
            queries: [...prev.queries.filter(q => q.query_id !== tempQuery.query_id), data.query]
          }));
        } else {
          // If response structure is different, keep the temp message
          console.warn("Unexpected response structure:", data);
        }
        fetchOrders(); // Refresh orders
      } else {
        // If failed, remove the temp message and show error
        setQueryModal(prev => ({
          ...prev,
          queries: prev.queries.filter(q => q.query_id !== tempQuery.query_id)
        }));
        setNewReply(messageToSend); // Restore the message
        showError("Error sending reply");
      }
    } catch (err) {
      console.error("Error sending reply:", err);
      // Remove temp message on error
      setQueryModal(prev => ({
        ...prev,
        queries: prev.queries.filter(q => q.query_id !== tempQuery.query_id)
      }));
      setNewReply(messageToSend); // Restore the message
      showError("Error sending reply");
    }
  };

  const fetchDeliveryDrivers = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/retailer/delivery-drivers", {
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
      const res = await fetch("http://localhost:5000/api/retailer/put/put/put/update-status", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          order_id: orderId,
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
      setOrders(data.result);
    } catch (err) {
      console.error(err);
      showError("Server error");
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch("http://localhost:5000/api/retailer/put/put/put/update-status", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          order_id: orderId,
          status: newStatus
        })
      });

      const data = await res.json();

      if (!res.ok) {
        showError(data.error || "Status update failed");
        return;
      }

      setOrders(data.result);
    } catch (err) {
      console.error(err);
      showError("Server error");
    }
  };

  // Show empty state only if we've loaded and there are truly no orders
  if (orders.length === 0 && filteredOrders.length === 0) {
    return (
      <DashboardLayout user={{ name: authUser?.name || "Retailer Dashboard", role: "retailer" }}>
        <div style={{ color: "white" }}>
          <h2 style={{ marginBottom: 8, color: "white" }}>Customer Orders</h2>
          <div style={{ color: "rgb(148, 163, 184)", marginBottom: 24 }}>
            Manage orders placed by customers.
          </div>
          <div style={{
            background: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(10px)",
            borderRadius: 12,
            padding: 48,
            textAlign: "center",
            border: "1px solid rgba(5, 150, 105, 0.3)"
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <div style={{ color: "rgb(148, 163, 184)", fontSize: 18 }}>No orders yet</div>
            <div style={{ color: "rgb(148, 163, 184)", fontSize: 14, marginTop: 8 }}>Customer orders will appear here once they place an order</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={{ name: authUser?.name || "Retailer Dashboard", role: "retailer" }}>
      <div style={{ color: "white" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h2 style={{ marginBottom: 8, color: "white" }}>Customer Orders</h2>
            <div style={{ color: "rgb(148, 163, 184)" }}>
              Manage orders placed by customers.
            </div>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              background: "rgba(15, 23, 42, 0.5)",
              border: "1px solid rgba(5, 150, 105, 0.3)",
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
            <option value="query_unresolved">Query (Unresolved)</option>
            <option value="query_resolved">Query (Resolved)</option>
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
                border: "1px solid rgba(5, 150, 105, 0.3)",
                boxShadow: "0 4px 6px -1px rgba(5, 150, 105, 0.2)"
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
                      border: "1px solid rgba(5, 150, 105, 0.3)"
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
                        Customer: {o.customer_name || o.customer_uid || "Unknown"}
                      </div>
                      <div style={{ color: "rgb(148, 163, 184)", fontSize: 14, marginBottom: 2 }}>
                        Quantity: {o.product_quantity || o.quantity || 1} × ₹{o.product_price || 0}
                      </div>
                      <div style={{ color: "rgb(148, 163, 184)", fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                        Total Price: <span style={{ color: "rgb(251, 146, 60)", fontSize: 16 }}>₹{o.total || ((o.product_quantity || o.quantity || 1) * (o.product_price || 0))}</span>
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

              <ProgressBar status={o.status} />

              <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                {o.status === "Placed" && (
                  <button
                    onClick={() => updateStatus(o.s_no, "Confirmed")}
                    style={{
                      padding: "8px 16px",
                      background: "rgba(5, 150, 105, 0.3)",
                      border: "1px solid rgba(5, 150, 105, 0.5)",
                      borderRadius: 8,
                      color: "rgb(16, 185, 129)",
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
                      background: "rgba(5, 150, 105, 0.3)",
                      border: "1px solid rgba(5, 150, 105, 0.5)",
                      borderRadius: 8,
                      color: "rgb(16, 185, 129)",
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
                  <>
                    <div style={{ 
                      padding: "8px 12px", 
                      background: "rgba(16, 185, 129, 0.2)", 
                      borderRadius: 8,
                      color: "rgb(16, 185, 129)",
                      fontSize: "0.875rem",
                      border: "1px solid rgba(16, 185, 129, 0.3)",
                      fontWeight: 600,
                      marginBottom: 8
                    }}>
                      ✓ Delivered
                    </div>
                    {/* Query Section */}
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(5, 150, 105, 0.2)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div style={{ color: "white", fontWeight: 600, fontSize: 14 }}>
                          Customer Query
                        </div>
                        {o.query_resolved && (
                          <span style={{ 
                            padding: "4px 8px", 
                            borderRadius: 6, 
                            background: "rgba(16, 185, 129, 0.2)", 
                            color: "rgb(16, 185, 129)", 
                            fontSize: 11, 
                            fontWeight: 600 
                          }}>
                            ✓ Resolved
                          </span>
                        )}
                      </div>
                      {o.has_query ? (
                        <button
                          onClick={() => handleOpenQuery(o)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 8,
                            background: "rgba(251, 191, 36, 0.2)",
                            border: "1px solid rgba(251, 191, 36, 0.5)",
                            color: "rgb(251, 191, 36)",
                            cursor: "pointer",
                            fontWeight: 600,
                            fontSize: 12
                          }}
                        >
                          📩 View Query
                        </button>
                      ) : (
                        <div
                          style={{
                            padding: "6px 12px",
                            borderRadius: 8,
                            background: "rgba(148, 163, 184, 0.1)",
                            border: "1px solid rgba(148, 163, 184, 0.3)",
                            color: "rgb(148, 163, 184)",
                            fontSize: 12,
                            fontWeight: 600
                          }}
                        >
                          No Query
                        </div>
                      )}
                    </div>
                  </>
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
                      border: "1px solid rgba(5, 150, 105, 0.3)",
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
                          border: "1px solid rgba(5, 150, 105, 0.3)",
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
                            background: selectedDriver[o.s_no] ? "rgba(5, 150, 105, 0.3)" : "rgba(148, 163, 184, 0.1)",
                            border: selectedDriver[o.s_no] ? "1px solid rgba(5, 150, 105, 0.5)" : "1px solid rgba(148, 163, 184, 0.3)",
                            borderRadius: 8,
                            color: selectedDriver[o.s_no] ? "rgb(16, 185, 129)" : "rgb(148, 163, 184)",
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

        {/* Query Chatbox - Fixed Container (rendered via portal) */}
        {queryModal.open && createPortal(
          <div
            style={{
              position: "fixed",
              bottom: 24,
              right: 24,
              width: 400,
              maxHeight: "70vh",
              background: "rgba(0, 0, 0, 0.95)",
              backdropFilter: "blur(20px)",
              borderRadius: 16,
              padding: 20,
              border: "1px solid rgba(5, 150, 105, 0.3)",
              boxShadow: "0 20px 60px rgba(5, 150, 105, 0.3)",
              display: "flex",
              flexDirection: "column",
              zIndex: 10000,
              pointerEvents: "auto",
            }}
          >
              {/* Header */}
              <div style={{ marginBottom: 12, borderBottom: "1px solid rgba(5, 150, 105, 0.2)", paddingBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ color: "white", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                      Customer Query
                    </h2>
                    <div style={{ color: "rgb(148, 163, 184)", fontSize: 12 }}>
                      Order #{queryModal.order?.s_no}
                    </div>
                    <div style={{ color: "rgb(148, 163, 184)", fontSize: 11, marginTop: 2 }}>
                      {queryModal.order?.product_name}
                    </div>
                    <div style={{ color: "rgb(148, 163, 184)", fontSize: 11, marginTop: 2 }}>
                      Customer: {queryModal.order?.customer_name}
                    </div>
                  </div>
                  <button
                    onClick={() => setQueryModal({ open: false, order: null, queries: [], loading: false })}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "rgb(148, 163, 184)",
                      fontSize: 20,
                      cursor: "pointer",
                      padding: 4,
                      lineHeight: 1,
                      marginLeft: 8,
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div 
                style={{ 
                  flex: 1, 
                  overflowY: "auto", 
                  marginBottom: 12, 
                  paddingRight: 4,
                  minHeight: 200,
                  maxHeight: 300,
                }}
              >
                {queryModal.loading ? (
                  <div style={{ textAlign: "center", padding: 20, color: "rgb(148, 163, 184)" }}>
                    Loading...
                  </div>
                ) : queryModal.queries.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 20, color: "rgb(148, 163, 184)", fontSize: 13 }}>
                    No messages yet.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {queryModal.queries.map((query) => (
                      <div
                        key={query.query_id}
                        style={{
                          display: "flex",
                          justifyContent: query.sender_role === "retailer" ? "flex-end" : "flex-start",
                        }}
                      >
                        <div
                          style={{
                            maxWidth: "80%",
                            padding: "8px 12px",
                            borderRadius: 12,
                            background: query.sender_role === "retailer"
                              ? "rgba(5, 150, 105, 0.3)"
                              : "rgba(15, 23, 42, 0.5)",
                            border: `1px solid ${query.sender_role === "retailer" ? "rgba(5, 150, 105, 0.5)" : "rgba(148, 163, 184, 0.3)"}`,
                          }}
                        >
                          <div style={{ color: "white", marginBottom: 2, fontSize: 13, wordBreak: "break-word" }}>
                            {query.message || query.text || "No message content"}
                          </div>
                          <div style={{ color: "rgb(148, 163, 184)", fontSize: 10 }}>
                            {query.created_at ? new Date(query.created_at).toLocaleTimeString() : ""}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input Area - Only show if queries exist and none are resolved */}
              {queryModal.queries.length > 0 && !queryModal.queries.some(q => q.is_resolved) && (
                <div style={{ borderTop: "1px solid rgba(5, 150, 105, 0.2)", paddingTop: 12 }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      type="text"
                      value={newReply}
                      onChange={(e) => setNewReply(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSendReply()}
                      placeholder="Type your reply..."
                      style={{
                        flex: 1,
                        padding: "8px 10px",
                        borderRadius: 8,
                        background: "rgba(15, 23, 42, 0.5)",
                        border: "1px solid rgba(5, 150, 105, 0.3)",
                        color: "white",
                        outline: "none",
                        fontSize: 13,
                      }}
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={!newReply.trim()}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 8,
                        background: newReply.trim() ? "rgba(5, 150, 105, 0.8)" : "rgba(5, 150, 105, 0.3)",
                        border: "none",
                        color: "white",
                        cursor: newReply.trim() ? "pointer" : "not-allowed",
                        fontWeight: 600,
                        fontSize: 13,
                      }}
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}
            </div>,
          document.body
        )}
      </div>
    </DashboardLayout>
  );
}
