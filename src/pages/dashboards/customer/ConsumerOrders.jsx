import React, { useEffect, useState, useContext, useRef } from "react";
import { createPortal } from "react-dom";
import { AuthContext } from "../../../context/AuthProvider";
import { useToast } from "../../../context/ToastContext";
import DashboardLayout from "../DashboardLayout";

export default function ConsumerOrders() {
  const { token, user: authUser } = useContext(AuthContext);
  const { success, error: showError } = useToast();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [sortBy, setSortBy] = useState("most_recent");
  const [queryModal, setQueryModal] = useState({ open: false, order: null, queries: [], loading: false });
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  
  const StarRating = ({ orderId, existingRating, existingFeedback, onFeedbackSubmitted }) => {
    const { token } = useContext(AuthContext);
    const { success, error: showError, warning } = useToast();
    const [rating, setRating] = useState(existingRating || 0);
    const [feedback, setFeedback] = useState(existingFeedback || "");
    const [submitted, setSubmitted] = useState(!!existingRating);
    const [submitting, setSubmitting] = useState(false);

    const submitFeedback = async () => {
      if (rating === 0) {
        warning("Please select a rating (1-5 stars)");
        return;
      }

      setSubmitting(true);
      try {
        const res = await fetch(`http://localhost:5000/api/consumer/orders/feedback`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ s_no: orderId, rating, feedback })
        });
        const data = await res.json();
        if (data.success) {
          setSubmitted(true);
          if (onFeedbackSubmitted) {
            onFeedbackSubmitted();
          }
          success("Feedback submitted successfully!");
        } else {
          showError(data.message || "Error submitting feedback.");
        }
      } catch (err) {
        console.error("Error submitting feedback:", err);
        showError("Error submitting feedback.");
      } finally {
        setSubmitting(false);
      }
    };

    if (submitted) {
      return (
        <div style={{ marginTop: 12, padding: 12, background: "rgba(16, 185, 129, 0.1)", borderRadius: 8, border: "1px solid rgba(16, 185, 129, 0.3)" }}>
          <div style={{ color: "rgb(16, 185, 129)", fontWeight: 600, marginBottom: 8 }}>✓ Feedback Submitted</div>
          <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <span
                key={n}
                style={{
                  fontSize: 20,
                  color: n <= rating ? "#facc15" : "rgb(148, 163, 184)"
                }}
              >
                ★
              </span>
            ))}
          </div>
          {feedback && (
            <div style={{ color: "rgb(148, 163, 184)", fontSize: 14, fontStyle: "italic" }}>
              "{feedback}"
            </div>
          )}
        </div>
      );
    }

    return (
      <div style={{ marginTop: 12 }}>
        <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
          {[1, 2, 3, 4, 5].map(n => (
            <span
              key={n}
              onClick={() => !submitted && setRating(n)}
              style={{
                cursor: submitted ? "default" : "pointer",
                fontSize: 24,
                color: n <= rating ? "#facc15" : "rgb(148, 163, 184)",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                if (!submitted && n > rating) e.currentTarget.style.color = "#fbbf24";
              }}
              onMouseLeave={(e) => {
                if (!submitted && n > rating) e.currentTarget.style.color = "rgb(148, 163, 184)";
              }}
            >
              ★
            </span>
          ))}
        </div>

        <textarea
          placeholder="Write feedback (optional)"
          value={feedback}
          onChange={e => !submitted && setFeedback(e.target.value)}
          disabled={submitted}
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: 8,
            background: submitted ? "rgba(15, 23, 42, 0.3)" : "rgba(15, 23, 42, 0.5)",
            border: "1px solid rgba(59, 130, 246, 0.3)",
            color: "white",
            outline: "none",
            minHeight: "80px",
            resize: "vertical",
            marginBottom: 8,
            cursor: submitted ? "not-allowed" : "text"
          }}
        />

        {!submitted && (
          <button
            onClick={submitFeedback}
            disabled={submitting || rating === 0}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              background: (submitting || rating === 0) 
                ? "rgba(148, 163, 184, 0.3)" 
                : "linear-gradient(to right, rgb(37, 99, 235), rgb(59, 130, 246))",
              color: "white",
              border: "none",
              fontWeight: 600,
              cursor: (submitting || rating === 0) ? "not-allowed" : "pointer",
              boxShadow: (submitting || rating === 0) ? "none" : "0 4px 6px -1px rgba(37, 99, 235, 0.3)",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              if (!submitting && rating > 0) {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = "0 6px 12px -1px rgba(37, 99, 235, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              if (!submitting && rating > 0) {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(37, 99, 235, 0.3)";
              }
            }}
          >
            {submitting ? "Submitting..." : "Submit Feedback"}
          </button>
        )}
      </div>
    );
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/consumer/orders`, {
        headers: {
          "Content-Type": "application/json",
          "authorization": `Bearer ${token}`
        },
      });
      const data = await res.json();
      if (data) {
        // Check which orders have queries
        const ordersWithQueryInfo = await Promise.all(
          (Array.isArray(data) ? data : []).map(async (order) => {
            if (order.status === "Delivered") {
              try {
                const queryRes = await fetch(`http://localhost:5000/api/consumer/queries/${order.s_no}`, {
                  headers: { "authorization": `Bearer ${token}` }
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
        setOrders(ordersWithQueryInfo);
        setFilteredOrders(ordersWithQueryInfo);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setOrders([]);
      setFilteredOrders([]);
    }
  };

  // Sorting and filtering logic
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
      case "delivered":
        sorted = sorted.filter(o => o.status === "Delivered");
        sorted.sort((a, b) => {
          const dateA = a.order_date ? new Date(a.order_date) : new Date(0);
          const dateB = b.order_date ? new Date(b.order_date) : new Date(0);
          return dateB - dateA;
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
      case "most_recent":
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
    setNewMessage("");

    try {
      const res = await fetch(`http://localhost:5000/api/consumer/queries/${order.s_no}`, {
        headers: { "authorization": `Bearer ${token}` }
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

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !queryModal.order) return;

    const messageToSend = newMessage.trim();
    setNewMessage(""); // Clear input immediately for better UX

    // Optimistically add the message to the UI
    const tempQuery = {
      query_id: `temp_${Date.now()}`, // Temporary ID with prefix
      order_id: queryModal.order.s_no,
      message: messageToSend,
      sender_role: "customer",
      created_at: new Date().toISOString(),
      is_resolved: false
    };
    
    // Update state using functional update to ensure we have latest state
    setQueryModal(prev => ({
      ...prev,
      queries: [...prev.queries, tempQuery]
    }));

    try {
      const res = await fetch(`http://localhost:5000/api/consumer/queries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          order_id: queryModal.order.s_no,
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
        fetchOrders(); // Refresh orders to update query status
      } else {
        // If failed, remove the temp message and show error
        setQueryModal(prev => ({
          ...prev,
          queries: prev.queries.filter(q => q.query_id !== tempQuery.query_id)
        }));
        setNewMessage(messageToSend); // Restore the message
      }
    } catch (err) {
      console.error("Error sending message:", err);
      // Remove temp message on error
      setQueryModal(prev => ({
        ...prev,
        queries: prev.queries.filter(q => q.query_id !== tempQuery.query_id)
      }));
      setNewMessage(messageToSend); // Restore the message
    }
  };


  const handleResolveQuery = async () => {
    if (!queryModal.order) return;

    try {
      const res = await fetch(`http://localhost:5000/api/consumer/queries/${queryModal.order.s_no}/resolve`, {
        method: "PUT",
        headers: { "authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        setQueryModal({
          ...queryModal,
          queries: queryModal.queries.map(q => ({ ...q, is_resolved: true }))
        });
        fetchOrders(); // Refresh orders
      }
    } catch (err) {
      console.error("Error resolving query:", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  const stages = ["Placed", "Confirmed", "Dispatched", "Delivered"];

  const ProgressBar = ({ status }) => {
    const idx = Math.max(0, Math.min(stages.indexOf(status || "Placed"), stages.length - 1));
    const percent = ((idx + 1) / stages.length) * 100;
    return (
      <div style={{ marginTop: 12 }}>
        <div style={{ height: 8, background: "rgba(15, 23, 42, 0.5)", borderRadius: 8, overflow: "hidden", marginBottom: 8 }}>
          <div
            style={{
              width: `${percent}%`,
              height: "100%",
              background: "linear-gradient(to right, rgb(37, 99, 235), rgb(59, 130, 246))",
              transition: "width 0.4s ease"
            }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgb(148, 163, 184)" }}>
          {stages.map(s => (
            <span key={s} style={{ textAlign: "center", flex: 1 }}>{s}</span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout user={{ name: authUser?.name || "Customer Dashboard", role: "customer" }}>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ color: "white", fontSize: "1.75rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
            📦 Your Orders
          </h2>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              background: "rgba(15, 23, 42, 0.5)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
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
        
        {filteredOrders.length === 0 ? (
          <div style={{
            background: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(10px)",
            borderRadius: 12,
            padding: 48,
            textAlign: "center",
            border: "1px solid rgba(59, 130, 246, 0.3)"
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <div style={{ color: "rgb(148, 163, 184)", fontSize: 18 }}>No orders yet</div>
            <div style={{ color: "rgb(148, 163, 184)", fontSize: 14, marginTop: 8 }}>Start shopping to see your orders here</div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {filteredOrders.map((o, i) => (
              <div
                key={i}
                style={{
                  background: "rgba(0, 0, 0, 0.4)",
                  backdropFilter: "blur(10px)",
                  borderRadius: 12,
                  padding: 20,
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                  boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.1)",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.5)";
                  e.currentTarget.style.boxShadow = "0 8px 12px -1px rgba(37, 99, 235, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.3)";
                  e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(37, 99, 235, 0.1)";
                }}
              >
                <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                  {/* Product Image */}
                  {o.product_image && (
                    <div style={{ flexShrink: 0 }}>
                      <img
                        src={o.product_image}
                        alt={o.product_name || "Product"}
                        style={{
                          width: 100,
                          height: 100,
                          objectFit: "cover",
                          borderRadius: 12,
                          border: "1px solid rgba(59, 130, 246, 0.3)",
                          background: "rgba(15, 23, 42, 0.5)"
                        }}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 18, color: "white", marginBottom: 8 }}>
                        {o.product_name || `Product #${o.product_id}`}
                      </div>
                      <div style={{ color: "rgb(148, 163, 184)", fontSize: 14, display: "flex", flexDirection: "column", gap: 4 }}>
                        <div>Order ID: <span style={{ color: "white" }}>#{o.s_no}</span></div>
                        <div>Retailer: <span style={{ color: "white" }}>{o.retailer_name || o.retailer_uid || "N/A"}</span></div>
                        <div>Category: <span style={{ color: "white" }}>{o.product_category || "General"}</span></div>
                        <div>Quantity: <span style={{ color: "white" }}>{o.product_quantity || 1}</span></div>
                        <div>Price: <span style={{ color: "rgb(59, 130, 246)", fontWeight: 600 }}>₹{o.product_price ? (o.product_price * (o.product_quantity || 1)) : "N/A"}</span></div>
                        {o.order_date && (
                          <div>Order Date: <span style={{ color: "white" }}>{new Date(o.order_date).toLocaleDateString()}</span></div>
                        )}
                        {o.delivered_date && (
                          <div>Delivered Date: <span style={{ color: "rgb(16, 185, 129)" }}>{new Date(o.delivered_date).toLocaleDateString()}</span></div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    background: o.status === "Delivered" 
                      ? "rgba(16, 185, 129, 0.2)" 
                      : o.status === "Dispatched"
                      ? "rgba(59, 130, 246, 0.2)"
                      : "rgba(251, 191, 36, 0.2)",
                    border: `1px solid ${o.status === "Delivered" 
                      ? "rgba(16, 185, 129, 0.3)" 
                      : o.status === "Dispatched"
                      ? "rgba(59, 130, 246, 0.3)"
                      : "rgba(251, 191, 36, 0.3)"}`,
                    color: o.status === "Delivered" 
                      ? "rgb(16, 185, 129)" 
                      : o.status === "Dispatched"
                      ? "rgb(59, 130, 246)"
                      : "rgb(251, 191, 36)",
                    fontWeight: 600,
                    fontSize: 12,
                    alignSelf: "flex-start",
                    whiteSpace: "nowrap"
                  }}>
                    {o.status || "Placed"}
                  </div>
                </div>
                
                <ProgressBar status={o.status} />
                
                {o.status === "Delivered" && (
                  <>
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(59, 130, 246, 0.2)" }}>
                      <div style={{ color: "white", fontWeight: 600, marginBottom: 12, fontSize: 16 }}>
                        {o.rating ? "✓ Your Feedback" : "Add Feedback"}
                      </div>
                      <StarRating 
                        orderId={o.s_no} 
                        existingRating={o.rating}
                        existingFeedback={o.feedback}
                        onFeedbackSubmitted={fetchOrders}
                      />
                    </div>
                    
                    {/* Query Section */}
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(59, 130, 246, 0.2)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <div style={{ color: "white", fontWeight: 600, fontSize: 16 }}>
                          Customer Service
                        </div>
                        {o.query_resolved && (
                          <span style={{ 
                            padding: "4px 8px", 
                            borderRadius: 6, 
                            background: "rgba(16, 185, 129, 0.2)", 
                            color: "rgb(16, 185, 129)", 
                            fontSize: 12, 
                            fontWeight: 600 
                          }}>
                            ✓ Resolved
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleOpenQuery(o)}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 8,
                          background: "rgba(59, 130, 246, 0.2)",
                          border: "1px solid rgba(59, 130, 246, 0.5)",
                          color: "rgb(59, 130, 246)",
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: 14
                        }}
                      >
                        {o.has_query ? "View Query" : "Raise Query"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

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
              border: "1px solid rgba(59, 130, 246, 0.3)",
              boxShadow: "0 20px 60px rgba(37, 99, 235, 0.3)",
              display: "flex",
              flexDirection: "column",
              zIndex: 10000,
              pointerEvents: "auto",
            }}
          >
              {/* Header */}
              <div style={{ marginBottom: 12, borderBottom: "1px solid rgba(59, 130, 246, 0.2)", paddingBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ color: "white", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                      Customer Service
                    </h2>
                    <div style={{ color: "rgb(148, 163, 184)", fontSize: 12 }}>
                      Order #{queryModal.order?.s_no}
                    </div>
                    <div style={{ color: "rgb(148, 163, 184)", fontSize: 11, marginTop: 2 }}>
                      {queryModal.order?.product_name}
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
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {queryModal.queries.map((query) => (
                      <div
                        key={query.query_id}
                        style={{
                          display: "flex",
                          justifyContent: query.sender_role === "customer" ? "flex-end" : "flex-start",
                        }}
                      >
                        <div
                          style={{
                            maxWidth: "80%",
                            padding: "8px 12px",
                            borderRadius: 12,
                            background: query.sender_role === "customer"
                              ? "rgba(59, 130, 246, 0.3)"
                              : "rgba(15, 23, 42, 0.5)",
                            border: `1px solid ${query.sender_role === "customer" ? "rgba(59, 130, 246, 0.5)" : "rgba(148, 163, 184, 0.3)"}`,
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

              {/* Input Area - Show if no queries exist OR if queries exist but none are resolved */}
              {(queryModal.queries.length === 0 || !queryModal.queries.some(q => q.is_resolved)) && (
                <div style={{ borderTop: "1px solid rgba(59, 130, 246, 0.2)", paddingTop: 12 }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder={queryModal.queries.length === 0 ? "Type your query..." : "Type your message..."}
                      style={{
                        flex: 1,
                        padding: "8px 10px",
                        borderRadius: 8,
                        background: "rgba(15, 23, 42, 0.5)",
                        border: "1px solid rgba(59, 130, 246, 0.3)",
                        color: "white",
                        outline: "none",
                        fontSize: 13,
                      }}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 8,
                        background: newMessage.trim() ? "rgba(59, 130, 246, 0.8)" : "rgba(59, 130, 246, 0.3)",
                        border: "none",
                        color: "white",
                        cursor: newMessage.trim() ? "pointer" : "not-allowed",
                        fontWeight: 600,
                        fontSize: 13,
                      }}
                    >
                      Send
                    </button>
                  </div>
                  {queryModal.queries.length > 0 && (
                    <button
                      onClick={handleResolveQuery}
                      style={{
                        width: "100%",
                        padding: "8px",
                        borderRadius: 8,
                        background: "rgba(16, 185, 129, 0.2)",
                        border: "1px solid rgba(16, 185, 129, 0.5)",
                        color: "rgb(16, 185, 129)",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: 12,
                      }}
                    >
                      ✓ Mark as Resolved
                    </button>
                  )}
                </div>
              )}
            </div>,
          document.body
        )}
      </div>
    </DashboardLayout>
  );
}
