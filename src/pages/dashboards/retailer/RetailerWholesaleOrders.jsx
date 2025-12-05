// src/pages/dashboards/retailer/RetailerWholesaleOrders.jsx
import React, { useEffect, useState, useContext } from "react";
import DashboardLayout from "../DashboardLayout";
import { AuthContext } from "../../../context/AuthProvider";
import { useToast } from "../../../context/ToastContext";
import "../dashboard.css";

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

export default function RetailerWholesaleOrders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [sortBy, setSortBy] = useState("most_recent");
  const [loading, setLoading] = useState(true);
  const { token } = useContext(AuthContext);
  const { user: authUser } = useContext(AuthContext);
  const { success, error: showError } = useToast();
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [retailPrice, setRetailPrice] = useState("");
  const [addingToInventory, setAddingToInventory] = useState(false);
  const [inventoryItems, setInventoryItems] = useState([]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/retailer/orders", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
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
      console.error("Error fetching orders:", err);
      showError("Failed to fetch orders");
      setOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/retailer/inventory/get", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setInventoryItems(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching inventory:", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
      fetchInventory();
    }
  }, [token]);

  const handleAddToInventory = (order) => {
    setSelectedOrder(order);
    setRetailPrice("");
    setShowPriceModal(true);
  };

  const handleSubmitPrice = async () => {
    if (!retailPrice || Number(retailPrice) <= 0) {
      showError("Please enter a valid retail price");
      return;
    }

    setAddingToInventory(true);
    try {
      const res = await fetch(`http://localhost:5000/api/retailer/orders/${selectedOrder.s_no}/add-to-inventory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ retail_price: Number(retailPrice) }),
      });

      const data = await res.json();

      if (res.ok) {
        success(data.message || "Product added to inventory successfully!");
        setShowPriceModal(false);
        setSelectedOrder(null);
        setRetailPrice("");
        fetchInventory(); // Refresh inventory to check stock status
        fetchOrders(); // Refresh orders to update button state
      } else {
        showError(data.error || "Failed to add product to inventory");
      }
    } catch (err) {
      console.error("Error adding to inventory:", err);
      showError("Failed to add product to inventory");
    } finally {
      setAddingToInventory(false);
    }
  };

  const checkProductInInventory = (productId) => {
    const item = inventoryItems.find(i => i.product_id === productId);
    return item ? { exists: true, stock: item.product_stock || 0 } : { exists: false, stock: 0 };
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


  if (loading) {
    return (
      <DashboardLayout user={{ name: authUser?.name || "Retailer Dashboard", role: "retailer" }}>
        <div style={{ color: "white", textAlign: "center", padding: "40px" }}>
          Loading orders...
        </div>
      </DashboardLayout>
    );
  }

  if (orders.length === 0 && filteredOrders.length === 0) {
    return (
      <DashboardLayout user={{ name: authUser?.name || "Retailer Dashboard", role: "retailer" }}>
        <div style={{ color: "white" }}>
          <h2 style={{ marginBottom: 8, color: "white" }}>Wholesale Orders</h2>
          <div style={{ color: "rgb(148, 163, 184)", marginBottom: 24 }}>
            Track the status of orders placed to wholesalers.
          </div>
          <div style={{
            background: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(10px)",
            borderRadius: 12,
            padding: 48,
            textAlign: "center",
            border: "1px solid rgba(5, 150, 105, 0.3)"
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
            <div style={{ color: "rgb(148, 163, 184)", fontSize: 18 }}>No orders yet</div>
            <div style={{ color: "rgb(148, 163, 184)", fontSize: 14, marginTop: 8 }}>Start ordering from wholesalers to see your orders here</div>
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
            <h2 style={{ marginBottom: 8, color: "white" }}>Wholesale Orders</h2>
            <div style={{ color: "rgb(148, 163, 184)" }}>
              Track the status of orders placed to wholesalers.
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
                        Wholesaler: {o.wholesaler_name || o.wholesaler_uid || "Unknown"}
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

              <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
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

                {o.status === "Delivered" && (() => {
                  const inventoryStatus = checkProductInInventory(o.product_id);
                  const canAdd = !inventoryStatus.exists || inventoryStatus.stock === 0;
                  
                  return (
                    <button
                      onClick={() => handleAddToInventory(o)}
                      disabled={!canAdd}
                      style={{
                        padding: "10px 16px",
                        borderRadius: 8,
                        background: canAdd 
                          ? "linear-gradient(135deg, rgba(5, 150, 105, 0.9), rgba(16, 185, 129, 0.9))"
                          : "rgba(148, 163, 184, 0.3)",
                        color: "white",
                        border: "none",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        cursor: canAdd ? "pointer" : "not-allowed",
                        opacity: canAdd ? 1 : 0.6,
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        if (canAdd) {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = "0 4px 12px rgba(5, 150, 105, 0.4)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      {canAdd ? "📦 Add to Inventory" : "✓ Already in Inventory"}
                    </button>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Price Input Modal */}
      {showPriceModal && selectedOrder && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            backdropFilter: "blur(4px)"
          }}
          onClick={() => !addingToInventory && setShowPriceModal(false)}
        >
          <div 
            style={{
              background: "rgba(15, 23, 42, 0.95)",
              borderRadius: 16,
              padding: 32,
              maxWidth: 500,
              width: "90%",
              border: "1px solid rgba(5, 150, 105, 0.3)",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ color: "white", fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
              Add to Inventory
            </h2>
            <p style={{ color: "rgb(148, 163, 184)", fontSize: 14, marginBottom: 24 }}>
              Set the retail price for this product
            </p>

            <div style={{ marginBottom: 20 }}>
              <div style={{ 
                background: "rgba(5, 150, 105, 0.1)", 
                padding: 16, 
                borderRadius: 12, 
                marginBottom: 16,
                border: "1px solid rgba(5, 150, 105, 0.2)"
              }}>
                <div style={{ color: "rgb(148, 163, 184)", fontSize: 13, marginBottom: 4 }}>Product</div>
                <div style={{ color: "white", fontSize: 16, fontWeight: 600 }}>
                  {selectedOrder.product_name || selectedOrder.product_id}
                </div>
                <div style={{ color: "rgb(148, 163, 184)", fontSize: 13, marginTop: 8 }}>
                  Quantity: <span style={{ color: "white" }}>{selectedOrder.product_quantity}</span>
                </div>
                <div style={{ color: "rgb(148, 163, 184)", fontSize: 13 }}>
                  Wholesale Price: <span style={{ color: "rgb(251, 146, 60)" }}>₹{selectedOrder.product_price}</span>
                </div>
              </div>

              <label style={{ 
                display: "block", 
                color: "white", 
                fontSize: 14, 
                fontWeight: 600, 
                marginBottom: 8 
              }}>
                Retail Price (₹)
              </label>
              <input
                type="number"
                value={retailPrice}
                onChange={(e) => setRetailPrice(e.target.value)}
                placeholder="Enter retail price"
                min="1"
                step="1"
                disabled={addingToInventory}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 8,
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid rgba(5, 150, 105, 0.3)",
                  color: "white",
                  fontSize: 16,
                  outline: "none",
                  transition: "all 0.2s ease"
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(5, 150, 105, 0.5)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(5, 150, 105, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(5, 150, 105, 0.3)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={handleSubmitPrice}
                disabled={addingToInventory || !retailPrice || Number(retailPrice) <= 0}
                style={{
                  flex: 1,
                  padding: "12px 24px",
                  borderRadius: 8,
                  background: addingToInventory || !retailPrice || Number(retailPrice) <= 0
                    ? "rgba(5, 150, 105, 0.3)"
                    : "linear-gradient(135deg, rgba(5, 150, 105, 0.9), rgba(16, 185, 129, 0.9))",
                  color: "white",
                  border: "none",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: addingToInventory || !retailPrice || Number(retailPrice) <= 0 ? "not-allowed" : "pointer",
                  opacity: addingToInventory || !retailPrice || Number(retailPrice) <= 0 ? 0.6 : 1,
                  transition: "all 0.2s ease"
                }}
              >
                {addingToInventory ? "Adding..." : "Add to Inventory"}
              </button>
              <button
                onClick={() => {
                  setShowPriceModal(false);
                  setSelectedOrder(null);
                  setRetailPrice("");
                }}
                disabled={addingToInventory}
                style={{
                  padding: "12px 24px",
                  borderRadius: 8,
                  background: "rgba(148, 163, 184, 0.2)",
                  color: "white",
                  border: "1px solid rgba(148, 163, 184, 0.3)",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: addingToInventory ? "not-allowed" : "pointer",
                  opacity: addingToInventory ? 0.6 : 1
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
