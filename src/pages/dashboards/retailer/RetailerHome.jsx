import React, { useContext, useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import DashboardLayout from "../DashboardLayout";
import ProductList from "../components/ProductList";
import MetricCard from "../components/MetricCard";
import { CartProvider, useCart } from "../hooks/CartContext";
import { useToast } from "../../../context/ToastContext";
import "../dashboard.css";
import { AuthContext } from "../../../context/AuthProvider";
import { useNavigate } from "react-router-dom";


function FloatingCart({ retailerId }) {
  const navigate = useNavigate();
  const { items, total, remove, updateQty, clear } = useCart();
  const [open, setOpen] = useState(false);
  const { token } = useContext(AuthContext);
  const { success, error: showError } = useToast();
  
  // Debug: log cart items
  React.useEffect(() => {
    console.log("🛒 FloatingCart - items changed:", items);
    console.log("🛒 FloatingCart - total:", total);
  }, [items, total]);


  const placeOrder = async (total) => {
    if (items.length === 0) return;
    
    // Validate items structure
    const validItems = items.map(item => ({
      id: item.id || item.product_id,
      product_id: item.id || item.product_id,
      qty: item.qty || 1,
      title: item.title || item.name || "Product"
    }));
    
    console.log("🛒 Placing order with items:", validItems);
    
    const orderData = {
      items: validItems,
      total,
      role: "retailer"
    };
    
    // Store cart items and total in sessionStorage for payment page
    sessionStorage.setItem("pendingOrder", JSON.stringify(orderData));
    
    // Also store in a backup key in sessionStorage
    sessionStorage.setItem("pendingOrder_backup", JSON.stringify(orderData));
    
    // Also save to localStorage as backup
    try {
      localStorage.setItem("pendingOrder_backup", JSON.stringify(orderData));
    } catch (storageError) {
      console.warn("⚠️ Could not save to localStorage:", storageError);
    }
    
    console.log("✅ Order data saved to sessionStorage and localStorage:", orderData);
    
    // Navigate to payment page
    navigate("/payment", { state: { amount: total, role: "retailer" } });
  };

  const cartContent = (
    <>
      <button 
        onClick={() => setOpen(s => !s)} 
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 10000,
          borderRadius: "999px", 
          padding: "12px 18px", 
          background: "linear-gradient(to right, rgb(5, 150, 105), rgb(16, 185, 129))",
          color: "white", 
          fontWeight: 700, 
          border: "none", 
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(5, 150, 105, 0.5), 0 0 0 0 rgba(5, 150, 105, 0.4)",
          transition: "all 0.3s ease",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.05) translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 8px 25px rgba(5, 150, 105, 0.6), 0 0 0 0 rgba(5, 150, 105, 0.4)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1) translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(5, 150, 105, 0.5), 0 0 0 0 rgba(5, 150, 105, 0.4)";
        }}
      >
        🛒 Cart ({items.length})
      </button>

      {open && (
        <div style={{ 
          position: "fixed",
          bottom: 88,
          right: 24,
          zIndex: 9999,
          pointerEvents: "auto"
        }}>
          <div style={{ 
            width: 360, 
            background: "rgba(0, 0, 0, 0.9)",
            backdropFilter: "blur(10px)",
            borderRadius: 16,
            padding: 16,
            border: "1px solid rgba(16, 185, 129, 0.3)",
            boxShadow: "0 20px 25px -5px rgba(5, 150, 105, 0.2)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontWeight: 700, color: "white", fontSize: 18 }}>Cart</div>
              <div style={{ color: "rgb(148, 163, 184)", fontWeight: 600 }}>₹{total}</div>
            </div>

            <div style={{ maxHeight: 220, overflow: "auto", marginBottom: 8 }}>
              {items.length === 0 && <div style={{ color: "rgb(148, 163, 184)", textAlign: "center", padding: 20 }}>Cart is empty</div>}
              {items.map(it => (
                <div key={it.id} style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  marginBottom: 12,
                  padding: 12,
                  background: "rgba(15, 23, 42, 0.5)",
                  borderRadius: 8,
                  border: "1px solid rgba(16, 185, 129, 0.2)"
                }}>
                  <div>
                    <div style={{ fontWeight: 600, color: "white" }}>{it.title}</div>
                    <div style={{ color: "rgb(148, 163, 184)", fontSize: 13, marginTop: 4 }}>₹{it.price} × {it.qty}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {(() => {
                      const stock = it.raw?.stock ?? it.raw?.product_stock ?? 0;
                      const maxQty = stock > 0 ? stock : it.qty;
                      return (
                        <input
                          type="number"
                          min="1"
                          max={maxQty}
                          value={it.qty}
                          style={{ 
                            width: 72,
                            padding: "4px 8px",
                            borderRadius: 8,
                            background: "rgba(15, 23, 42, 0.5)",
                            border: it.qty >= stock && stock > 0 ? "1px solid rgba(251, 191, 36, 0.5)" : "1px solid rgba(16, 185, 129, 0.3)",
                            color: "white",
                            outline: "none"
                          }}
                          onChange={e => {
                            const newQty = Number(e.target.value);
                            if (stock > 0 && newQty > stock) {
                              updateQty(it.id, stock);
                            } else if (newQty < 1) {
                              updateQty(it.id, 1);
                            } else {
                              updateQty(it.id, newQty);
                            }
                          }}
                        />
                      );
                    })()}
                    <button
                      style={{ 
                        color: "#ef4444", 
                        border: "none", 
                        background: "transparent", 
                        cursor: "pointer",
                        padding: "4px 8px",
                        borderRadius: 6,
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                      onClick={() => remove(it.id)}
                    >Remove</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, gap: 8 }}>
              <button 
                onClick={() => placeOrder(total)} 
                disabled={items.length === 0}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: 10,
                  background: items.length === 0 
                    ? "rgba(148, 163, 184, 0.3)" 
                    : "linear-gradient(to right, rgb(5, 150, 105), rgb(16, 185, 129))",
                  color: "white",
                  fontWeight: 600,
                  border: "none",
                  cursor: items.length === 0 ? "not-allowed" : "pointer",
                  boxShadow: items.length === 0 ? "none" : "0 4px 6px -1px rgba(5, 150, 105, 0.3)",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  if (items.length > 0) {
                    e.currentTarget.style.transform = "scale(1.02)";
                    e.currentTarget.style.boxShadow = "0 6px 12px -1px rgba(5, 150, 105, 0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (items.length > 0) {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(5, 150, 105, 0.3)";
                  }
                }}
              >
                Place Order
              </button>
              <button 
                className="btn-ghost" 
                onClick={clear}
                style={{
                  border: "1px solid rgba(16, 185, 129, 0.3)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.5)";
                  e.currentTarget.style.color = "rgb(16, 185, 129)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.3)";
                  e.currentTarget.style.color = "rgb(148, 163, 184)";
                }}
              >Clear</button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return createPortal(cartContent, document.body);
}

function ProductsSection({ products }) {
  const { add, items, updateQty, remove } = useCart();

  // Debug: log when ProductsSection renders
  React.useEffect(() => {
    console.log("📦 ProductsSection rendered with products:", products.length);
    console.log("📦 ProductsSection - cart items:", items.length);
  }, [products.length, items.length]);

  // Build qtyMap for ProductCard so it knows how many are already in cart
  const qtyMap = items.reduce((m, it) => ({ ...m, [it.id]: it.qty }), {});

  // onRemove logic: reduce qty or delete if qty hits 0
  const handleRemove = (product) => {
    const id = product.id || product.product_id;
    const existing = items.find(i => i.id === id);

    if (!existing) return;

    if (existing.qty > 1) {
      updateQty(id, existing.qty - 1);
    } else {
      remove(id);     // if qty would become 0, remove item
    }
  };

  // Wrap add function with logging
  const handleAdd = (product) => {
    console.log("📦 ProductsSection.handleAdd called with:", product);
    add(product);
  };

  // Retailer theme (emerald/green)
  const theme = {
    accent: "rgb(5, 150, 105)",
    accentLight: "rgb(16, 185, 129)",
    accentRgba: "rgba(5, 150, 105, 0.3)",
    accentRgbaLight: "rgba(5, 150, 105, 0.1)"
  };

  return (
    <ProductList
      products={products}
      onAdd={handleAdd}
      onRemove={handleRemove}
      qtyMap={qtyMap}
      showProductId={false}
      theme={theme}
      showRatings={false}
    />
  );
}

export default function RetailerHome() {
  const { token, user: authUser } = useContext(AuthContext);
  const { success, error: showError } = useToast();
  const retailerId = "Retailer-Demo"; // Replace with dynamic user
  const [products, setProducts] = useState([]);
  const [metrics, setMetrics] = useState([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => {
    fetch("http://localhost:5000/api/wholesaler/stock", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        // MAP BACKEND → FRONTEND FORMAT
        const formatted = Array.isArray(data)
          ? data.map(p => ({
            id: p.product_id,
            product_id: p.product_id,
            title: p.product_name,
            name: p.product_name,
            price: Number(p.product_price),
            product_price: Number(p.product_price),
            stock: Number(p.product_stock),
            product_stock: Number(p.product_stock),
            category: p.product_category,
            product_category: p.product_category,
            description: p.product_description || p.description || "",
            image: p.product_image || p.image || "",
            raw: p   // keep full record if needed
          }))
          : [];

        setProducts(formatted);
      })
      .catch(console.error);

    // Fetch metrics
    const fetchMetrics = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/retailer/metrics`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        
        setMetrics([
          { 
            title: "Active Products", 
            value: data.totalProducts || 0, 
            subtitle: "Items in inventory", 
            icon: "📦", 
            color: "#059669" 
          },
          { 
            title: "Pending Orders", 
            value: data.pendingWholesaleOrders || 0, 
            subtitle: "Wholesale orders pending", 
            icon: "🧾", 
            color: "#f59e0b" 
          },
          { 
            title: "Total Revenue", 
            value: `₹${(data.revenue7d || 0).toLocaleString('en-IN')}`, 
            subtitle: "From delivered orders", 
            icon: "💰", 
            color: "#06b6d4" 
          },
        ]);
      } catch (err) {
        console.error("Failed fetching metrics:", err);
        // Fallback to default metrics
        setMetrics([
          { title: "Active Products", value: 0, subtitle: "Items in inventory", icon: "📦", color: "#059669" },
          { title: "Pending Orders", value: 0, subtitle: "Wholesale orders pending", icon: "🧾", color: "#f59e0b" },
          { title: "Total Revenue", value: "₹0", subtitle: "From delivered orders", icon: "💰", color: "#06b6d4" },
        ]);
      }
    };
    fetchMetrics();
  }, [token]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (category !== "all") list = list.filter((p) => p.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.title.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let A = a[sortField];
      let B = b[sortField];
      if (typeof A === "string") A = A.toLowerCase();
      if (typeof B === "string") B = B.toLowerCase();
      if (A < B) return sortOrder === "asc" ? -1 : 1;
      if (A > B) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [products, search, category, sortField, sortOrder]);

  const categories = ["all", ...new Set(products.map((p) => p.category))];

  // Handle payment success/cancel from Stripe redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get("payment");
    
    if (paymentStatus !== "success" && paymentStatus !== "cancelled") {
      return; // No payment status, exit early
    }
    
    // Get token from context or localStorage
    const getToken = () => {
      return token || localStorage.getItem("token");
    };
    
    // Wait for token to be available (with retry)
    const checkTokenAndProcess = (retries = 5) => {
      const authToken = getToken();
      
      if (!authToken && retries > 0) {
        console.log(`⏳ Waiting for token... (${retries} retries left)`);
        setTimeout(() => checkTokenAndProcess(retries - 1), 200);
        return;
      }
      
      if (!authToken) {
        console.error("❌ No authentication token available after retries");
        showError("Authentication token not found. Please log in again.");
        return;
      }
      
      // Process payment status
      if (paymentStatus === "success") {
        processPaymentSuccess(authToken);
      } else if (paymentStatus === "cancelled") {
        window.history.replaceState({}, document.title, "/retailer/home");
        showError("Payment was cancelled");
      }
    };
    
    const processPaymentSuccess = (authToken) => {
      console.log("✅ Stripe payment success detected");
      
      // Clean up URL first to prevent multiple runs
      window.history.replaceState({}, document.title, "/retailer/home");
      
      let pendingOrder = sessionStorage.getItem("pendingOrder");
      
      // Try sessionStorage backup if main one is missing
      if (!pendingOrder) {
        pendingOrder = sessionStorage.getItem("pendingOrder_backup");
        if (pendingOrder) {
          console.log("📦 Using sessionStorage backup pending order");
          sessionStorage.setItem("pendingOrder", pendingOrder);
        }
      }
      
      // Try localStorage backup if sessionStorage is empty
      if (!pendingOrder) {
        console.log("⚠️ No pendingOrder in sessionStorage, checking localStorage...");
        pendingOrder = localStorage.getItem("pendingOrder_backup");
        if (pendingOrder) {
          console.log("✅ Found order data in localStorage backup");
          sessionStorage.setItem("pendingOrder", pendingOrder);
        }
      }
      
      if (!pendingOrder) {
        console.error("❌ No pending order found in sessionStorage or localStorage");
        showError("Order data not found. Please contact support.");
        return;
      }

      let orderData;
      try {
        orderData = JSON.parse(pendingOrder);
        console.log("✅ Processing Stripe payment success, order data:", orderData);
        console.log("📦 Items to order:", orderData.items);
      } catch (parseError) {
        console.error("❌ Error parsing pending order:", parseError);
        showError("Invalid order data. Please try again.");
        sessionStorage.removeItem("pendingOrder");
        sessionStorage.removeItem("pendingOrder_backup");
        localStorage.removeItem("pendingOrder_backup");
        return;
      }

      if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
        console.error("❌ No items in order data:", orderData);
        showError("No items found in order. Please try again.");
        sessionStorage.removeItem("pendingOrder");
        sessionStorage.removeItem("pendingOrder_backup");
        localStorage.removeItem("pendingOrder_backup");
        return;
      }
      
      // Complete the order
      const completeOrder = async () => {
        try {
          if (!authToken) {
            console.error("❌ No authentication token available");
            showError("Authentication token not found. Please log in again.");
            return;
          }
          
          console.log("📤 Sending order to backend:", { items: orderData.items });
          console.log("🔑 Using token:", authToken ? "Token exists" : "No token");
          
          const res = await fetch("http://localhost:5000/api/retailer/orders", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${authToken}`,
            },
            body: JSON.stringify({ items: orderData.items }),
          });
          
          const responseData = await res.json();
          console.log("📦 Order creation response:", responseData);
          console.log("📦 Response status:", res.status);
          
          if (res.ok) {
            sessionStorage.removeItem("pendingOrder");
            sessionStorage.removeItem("pendingOrder_backup");
            localStorage.removeItem("pendingOrder_backup");
            success("Order placed successfully! Payment completed.");
            // Refresh the page to show the new order
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          } else {
            console.error("❌ Order creation failed:", responseData);
            if (res.status === 401 || res.status === 403) {
              showError("Authentication failed. Please log in again.");
            } else {
              showError(responseData.message || responseData.error || "Failed to place order. Please try again.");
            }
          }
        } catch (err) {
          console.error("❌ Error completing order:", err);
          showError(`Error completing order: ${err.message}`);
        }
      };
      completeOrder();
    };
    
    // Start processing
    checkTokenAndProcess();
  }, [token, success, showError]);

  return (
    <CartProvider>
      <DashboardLayout user={{ name: authUser?.name || "Retailer Dashboard", role: "retailer" }}>
        
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {metrics.map((m, i) => (
            <MetricCard key={i} {...m} />
          ))}
        </div>

        {/* Header */}
        <h2 style={{ color: "white", fontSize: "1.5rem", fontWeight: 700, marginBottom: 8 }}>Current Stock</h2>
        <p style={{ color: "rgb(148, 163, 184)", marginBottom: 24, fontSize: "0.95rem" }}>Manage your wholesale catalog and pricing.</p>

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <input
            placeholder="Search products..."
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 10,
              background: "rgba(15, 23, 42, 0.5)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              color: "white",
              outline: "none",
              transition: "all 0.2s ease"
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.6)";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(16, 185, 129, 0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.3)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          <select
            onChange={(e) => setCategory(e.target.value)}
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              background: "rgba(15, 23, 42, 0.5)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              color: "white",
              outline: "none",
              cursor: "pointer"
            }}
          >
            {categories.map((c) => (
              <option key={c} value={c} style={{ background: "rgb(15, 23, 42)", color: "white" }}>{c}</option>
            ))}
          </select>
        </div>

        {/* Sorting Panel */}
        <div style={{ 
          background: "rgba(0, 0, 0, 0.4)", 
          backdropFilter: "blur(10px)",
          padding: 16, 
          borderRadius: 12, 
          marginBottom: 24,
          border: "1px solid rgba(16, 185, 129, 0.3)",
          boxShadow: "0 4px 6px -1px rgba(16, 185, 129, 0.1)"
        }}>
          <div className="flex items-center gap-4">
            <span style={{ fontWeight: 600, color: "white" }}>Sort By:</span>

            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                background: "rgba(15, 23, 42, 0.5)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                color: "white",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="name" style={{ background: "rgb(15, 23, 42)", color: "white" }}>Name</option>
              <option value="price" style={{ background: "rgb(15, 23, 42)", color: "white" }}>Price</option>
              <option value="stock" style={{ background: "rgb(15, 23, 42)", color: "white" }}>Stock</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                background: "transparent",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                color: "rgb(148, 163, 184)",
                cursor: "pointer",
                fontWeight: 600,
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(16, 185, 129, 0.1)";
                e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.5)";
                e.currentTarget.style.color = "rgb(16, 185, 129)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.3)";
                e.currentTarget.style.color = "rgb(148, 163, 184)";
              }}
            >
              {sortOrder === "asc" ? "⬆ Ascending" : "⬇ Descending"}
            </button>
          </div>
        </div>

        {/* Product List */}
        <div className="pb-32">
          <ProductsSection products={filtered} />
        </div>

        <FloatingCart />

      </DashboardLayout>
    </CartProvider>
  );
}