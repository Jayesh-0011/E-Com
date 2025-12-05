import React, { useEffect, useState, useContext, useMemo } from "react";
import { createPortal } from "react-dom";
import DashboardLayout from "../DashboardLayout";
import ProductList from "../components/ProductList";
import MetricCard from "../components/MetricCard";
import { CartProvider, useCart } from "../hooks/CartContext";
import { useToast } from "../../../context/ToastContext";
import "../dashboard.css";
import { AuthContext } from "../../../context/AuthProvider";
import { useNavigate } from "react-router-dom";
import { calculateDistance, geocodeAddress } from "../../../utils/distanceUtils";

function FloatingCart() {
  const navigate = useNavigate();
  const { items, total, remove, updateQty, clear } = useCart();
  const [open, setOpen] = useState(false);
  const { token } = useContext(AuthContext);
  const { success, error: showError } = useToast();

  const placeOrder = async (totalAmount) => {
    if (items.length === 0) return;
    
    const orderData = {
      items,
      total: totalAmount,
      role: "customer"
    };
    
    // Store cart items and total in sessionStorage for payment page
    sessionStorage.setItem("pendingOrder", JSON.stringify(orderData));
    
    // Also save to localStorage as backup
    try {
      localStorage.setItem("pendingOrder_backup", JSON.stringify(orderData));
    } catch (storageError) {
      console.warn("⚠️ Could not save to localStorage:", storageError);
    }
    
    console.log("✅ Order data saved to sessionStorage and localStorage:", orderData);
    
    // Navigate to payment page
    navigate("/payment", { state: { amount: totalAmount, role: "customer" } });
  };

  const cartContent = (
    <>
      <button
        onClick={() => setOpen((s) => !s)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 10000,
          borderRadius: "999px",
          padding: "12px 18px",
          background: "linear-gradient(to right, rgb(37, 99, 235), rgb(59, 130, 246))",
          color: "white",
          fontWeight: 700,
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(37, 99, 235, 0.5), 0 0 0 0 rgba(37, 99, 235, 0.4)",
          transition: "all 0.3s ease",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.05) translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 8px 25px rgba(37, 99, 235, 0.6), 0 0 0 0 rgba(37, 99, 235, 0.4)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1) translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(37, 99, 235, 0.5), 0 0 0 0 rgba(37, 99, 235, 0.4)";
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
            border: "1px solid rgba(59, 130, 246, 0.3)",
            boxShadow: "0 20px 25px -5px rgba(37, 99, 235, 0.2)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontWeight: 700, color: "white", fontSize: 18 }}>Cart</div>
              <div style={{ color: "rgb(148, 163, 184)", fontWeight: 600 }}>₹{total}</div>
            </div>

            <div style={{ maxHeight: 220, overflow: "auto", marginBottom: 8 }}>
              {items.length === 0 && <div style={{ color: "rgb(148, 163, 184)", textAlign: "center", padding: 20 }}>Cart is empty</div>}
              {items.map((it) => (
                <div key={it.id} style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  marginBottom: 12,
                  padding: 12,
                  background: "rgba(15, 23, 42, 0.5)",
                  borderRadius: 8,
                  border: "1px solid rgba(59, 130, 246, 0.2)"
                }}>
                  <div>
                    <div style={{ fontWeight: 600, color: "white" }}>{it.title}</div>
                    <div style={{ color: "rgb(148, 163, 184)", fontSize: 13, marginTop: 4 }}>
                      ₹{it.price} × {it.qty}
                    </div>
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
                            border: it.qty >= stock && stock > 0 ? "1px solid rgba(251, 191, 36, 0.5)" : "1px solid rgba(59, 130, 246, 0.3)",
                            color: "white",
                            outline: "none"
                          }}
                          onChange={(e) => {
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
                    >
                      Remove
                    </button>
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
                    : "linear-gradient(to right, rgb(37, 99, 235), rgb(59, 130, 246))",
                  color: "white",
                  fontWeight: 600,
                  border: "none",
                  cursor: items.length === 0 ? "not-allowed" : "pointer",
                  boxShadow: items.length === 0 ? "none" : "0 4px 6px -1px rgba(37, 99, 235, 0.3)",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  if (items.length > 0) {
                    e.currentTarget.style.transform = "scale(1.02)";
                    e.currentTarget.style.boxShadow = "0 6px 12px -1px rgba(37, 99, 235, 0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (items.length > 0) {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(37, 99, 235, 0.3)";
                  }
                }}
              >
                Place Order
              </button>
              <button 
                onClick={clear}
                style={{
                  padding: "10px 16px",
                  borderRadius: 10,
                  background: "transparent",
                  color: "rgb(148, 163, 184)",
                  border: "1px solid rgba(148, 163, 184, 0.3)",
                  cursor: "pointer",
                  fontWeight: 600,
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(148, 163, 184, 0.1)";
                  e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.3)";
                }}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return createPortal(cartContent, document.body);
}

function ProductsSection({ products, onRatingClick }) {
  const { add, items, updateQty, remove } = useCart();

  const qtyMap = items.reduce((m, it) => ({ ...m, [it.id]: it.qty }), {});

  const handleRemove = (product) => {
    const id = product.id ?? product.product_id;
    const existing = items.find((i) => i.id === id);
    if (!existing) return;
    if (existing.qty > 1) updateQty(id, existing.qty - 1);
    else remove(id);
  };

  // Customer theme (blue)
  const theme = {
    accent: "rgb(37, 99, 235)",
    accentLight: "rgb(59, 130, 246)",
    accentRgba: "rgba(37, 99, 235, 0.3)",
    accentRgbaLight: "rgba(37, 99, 235, 0.1)"
  };

  return (
    <ProductList 
      products={products} 
      onAdd={add} 
      onRemove={handleRemove} 
      qtyMap={qtyMap}
      showProductId={false}
      theme={theme}
      onRatingClick={onRatingClick}
    />
  );
}

export default function ConsumerDashboard() {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [sortByDistance, setSortByDistance] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [localProductsOnly, setLocalProductsOnly] = useState(false);
  const [reviewsModal, setReviewsModal] = useState({ open: false, product: null, reviews: [], loading: false });

  useEffect(() => {
    const fetchdata = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/consumer/retailer-products`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        const formatted = Array.isArray(data)
          ? data.map((p) => ({
              id: p.product_id,
              product_id: p.product_id, // Keep but don't show
              title: p.product_name,
              name: p.product_name,
              price: Number(p.product_price),
              product_price: Number(p.product_price),
              stock: Number(p.product_stock || 0),
              product_stock: Number(p.product_stock || 0),
              category: p.product_category,
              product_category: p.product_category,
              description: p.product_description || p.description || "",
              image: p.product_image || p.image || "",
              retailer_uid: p.uid, // Store retailer UID for order placement
              avg_rating: Number(p.avg_rating || 0),
              review_count: Number(p.review_count || 0),
              // Store retailer address for distance calculation
              retailerAddress: {
                addressLine1: p.address_line1,
                addressLine2: p.address_line2,
                city: p.city,
                pincode: p.pincode,
                state: p.state
              },
              distance: null, // Will be calculated if location is available
              raw: p,
            }))
          : [];
        setProducts(formatted);
      } catch (err) {
        console.error("Failed fetching retailer-products:", err);
      }
    };
    fetchdata();

    // Fetch metrics
    const fetchMetrics = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/consumer/metrics`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        
        setMetrics([
          { 
            title: "Available Products", 
            value: data.totalProducts || 0, 
            subtitle: "Products in stock from retailers", 
            icon: "📦", 
            color: "#059669" 
          },
          { 
            title: "Active Orders", 
            value: data.activeOrders || 0, 
            subtitle: "Orders in progress", 
            icon: "🧾", 
            color: "#f59e0b" 
          },
          { 
            title: "Total Spent", 
            value: `₹${(data.spent7d || 0).toLocaleString('en-IN')}`, 
            subtitle: "All delivered orders", 
            icon: "💰", 
            color: "#06b6d4" 
          },
        ]);
      } catch (err) {
        console.error("Failed fetching metrics:", err);
        // Fallback to default metrics
        setMetrics([
          { title: "Available Products", value: 0, subtitle: "Products in stock", icon: "📦", color: "#059669" },
          { title: "Active Orders", value: 0, subtitle: "Orders in progress", icon: "🧾", color: "#f59e0b" },
          { title: "Total Spent", value: "₹0", subtitle: "All delivered orders", icon: "💰", color: "#06b6d4" },
        ]);
      }
    };
    fetchMetrics();
  }, [token]);

  const { user: authUser } = useContext(AuthContext);
  const { success, error: showError } = useToast();

  // Get user location from their address
  useEffect(() => {
    const getUserLocation = async () => {
      if (!authUser?.address) {
        return;
      }

      const address = authUser.address;
      if (!address.addressLine1 && !address.city) {
        return;
      }

      setLocationLoading(true);
      try {
        const coords = await geocodeAddress(
          address.addressLine1,
          address.city,
          address.pincode,
          address.state
        );
        
        if (coords) {
          setUserLocation(coords);
        }
      } catch (error) {
        console.error("Error getting user location:", error);
      } finally {
        setLocationLoading(false);
      }
    };

    getUserLocation();
  }, [authUser?.address]);

  // Calculate distances when user location is available
  useEffect(() => {
    if (!userLocation || products.length === 0) {
      return;
    }

    // Check if distances are already calculated
    const hasDistances = products.some(p => p.distance !== null && p.distance !== undefined);
    if (hasDistances) {
      return; // Don't recalculate if distances already exist
    }

    const calculateDistances = async () => {
      const productsWithDistance = await Promise.all(
        products.map(async (product) => {
          // Skip if distance already calculated
          if (product.distance !== null && product.distance !== undefined) {
            return product;
          }

          if (!product.retailerAddress || !product.retailerAddress.city) {
            return { ...product, distance: null };
          }

          const retailerCoords = await geocodeAddress(
            product.retailerAddress.addressLine1,
            product.retailerAddress.city,
            product.retailerAddress.pincode,
            product.retailerAddress.state
          );

          if (retailerCoords) {
            const distance = calculateDistance(
              userLocation.lat,
              userLocation.lon,
              retailerCoords.lat,
              retailerCoords.lon
            );
            return { ...product, distance: Math.round(distance * 10) / 10 }; // Round to 1 decimal
          }

          return { ...product, distance: null };
        })
      );

      setProducts(productsWithDistance);
    };

    calculateDistances();
  }, [userLocation, products.length]); // Only depend on length, not the full array

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
        window.history.replaceState({}, document.title, "/customer/home");
        showError("Payment was cancelled");
      }
    };
    
    const processPaymentSuccess = (authToken) => {
      // Clean up URL first to prevent multiple runs
      window.history.replaceState({}, document.title, "/customer/home");
      
      let pendingOrder = sessionStorage.getItem("pendingOrder");
      
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
        
        if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
          console.error("❌ No items in order data:", orderData);
          showError("No items found in order. Please try again.");
          sessionStorage.removeItem("pendingOrder");
          localStorage.removeItem("pendingOrder_backup");
          return;
        }
      } catch (parseError) {
        console.error("❌ Error parsing pending order:", parseError);
        showError("Invalid order data. Please try again.");
        sessionStorage.removeItem("pendingOrder");
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
          
          const res = await fetch("http://localhost:5000/api/consumer/orders", {
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

  const filtered = useMemo(() => {
    let list = [...products];
    
    // Filter by local products (same state) if enabled
    if (localProductsOnly && authUser?.address?.state) {
      const userState = authUser.address.state;
      list = list.filter((p) => {
        const retailerState = p.retailerAddress?.state;
        return retailerState && retailerState.toLowerCase() === userState.toLowerCase();
      });
    }
    
    if (category !== "all") list = list.filter((p) => p.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.title.toLowerCase().includes(q)
      );
    }
    
    // Sort by distance if enabled, otherwise use regular sort
    if (sortByDistance && userLocation) {
      list.sort((a, b) => {
        // Products with distance come first
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance; // Nearest first
      });
    } else {
      list.sort((a, b) => {
        let A = a[sortField];
        let B = b[sortField];
        if (typeof A === "string") A = A.toLowerCase();
        if (typeof B === "string") B = B.toLowerCase();
        if (A < B) return sortOrder === "asc" ? -1 : 1;
        if (A > B) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [products, search, category, sortField, sortOrder, sortByDistance, userLocation, localProductsOnly, authUser?.address?.state]);

  const categories = ["all", ...new Set(products.map((p) => p.category))];

  const handleRatingClick = async (product) => {
    if (!product.retailer_uid || !product.product_id) {
      showError("Product information not available");
      return;
    }

    setReviewsModal({ open: true, product, reviews: [], loading: true });

    try {
      const res = await fetch(
        `http://localhost:5000/api/consumer/product-reviews/${product.retailer_uid}/${product.product_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setReviewsModal({ open: true, product, reviews: data, loading: false });
      } else {
        showError("Failed to load reviews");
        setReviewsModal({ open: false, product: null, reviews: [], loading: false });
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
      showError("Error loading reviews");
      setReviewsModal({ open: false, product: null, reviews: [], loading: false });
    }
  };

  return (
    <CartProvider>
      <DashboardLayout user={{ name: authUser?.name || "Customer Dashboard", role: "customer" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginBottom: 12 }}>
          {metrics.map((m, i) => (
            <MetricCard key={i} {...m} />
          ))}
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ color: "white", fontSize: "1.5rem", fontWeight: 700, marginBottom: 8 }}>Retailer Catalog</div>
          <div style={{ color: "rgb(148, 163, 184)", marginTop: 6, fontSize: "0.95rem" }}>
            Browse products from retailers and add to your cart.
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 10,
              background: "rgba(15, 23, 42, 0.5)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              color: "white",
              outline: "none",
              transition: "all 0.2s ease"
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.6)";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.3)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              background: "rgba(15, 23, 42, 0.5)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
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
          border: "1px solid rgba(59, 130, 246, 0.3)",
          boxShadow: "0 4px 6px -1px rgba(59, 130, 246, 0.1)"
        }}>
          <div className="flex items-center gap-4 flex-wrap">
            <span style={{ fontWeight: 600, color: "white" }}>Sort By:</span>

            <select
              value={sortField}
              onChange={(e) => {
                setSortField(e.target.value);
                setSortByDistance(false);
              }}
              disabled={sortByDistance}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                background: sortByDistance ? "rgba(15, 23, 42, 0.3)" : "rgba(15, 23, 42, 0.5)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                color: sortByDistance ? "rgba(255, 255, 255, 0.5)" : "white",
                outline: "none",
                cursor: sortByDistance ? "not-allowed" : "pointer",
                opacity: sortByDistance ? 0.6 : 1
              }}
            >
              <option value="name" style={{ background: "rgb(15, 23, 42)", color: "white" }}>Name</option>
              <option value="price" style={{ background: "rgb(15, 23, 42)", color: "white" }}>Price</option>
              <option value="stock" style={{ background: "rgb(15, 23, 42)", color: "white" }}>Stock</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              disabled={sortByDistance}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                background: "transparent",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                color: sortByDistance ? "rgba(148, 163, 184, 0.5)" : "rgb(148, 163, 184)",
                cursor: sortByDistance ? "not-allowed" : "pointer",
                fontWeight: 600,
                transition: "all 0.2s ease",
                opacity: sortByDistance ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!sortByDistance) {
                  e.currentTarget.style.background = "rgba(59, 130, 246, 0.1)";
                  e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.5)";
                  e.currentTarget.style.color = "rgb(59, 130, 246)";
                }
              }}
              onMouseLeave={(e) => {
                if (!sortByDistance) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.3)";
                  e.currentTarget.style.color = "rgb(148, 163, 184)";
                }
              }}
            >
              {sortOrder === "asc" ? "⬆ Ascending" : "⬇ Descending"}
            </button>

            {/* Location-based filters */}
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
              {/* Local Products Only Filter */}
              <button
                onClick={() => {
                  if (!authUser?.address?.state) {
                    showError("Please add your state in profile to use local products filter.");
                    return;
                  }
                  setLocalProductsOnly(!localProductsOnly);
                }}
                disabled={!authUser?.address?.state}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  background: localProductsOnly
                    ? "linear-gradient(135deg, rgba(251, 191, 36, 0.9), rgba(245, 158, 11, 0.9))"
                    : "rgba(15, 23, 42, 0.5)",
                  border: localProductsOnly
                    ? "1px solid rgba(251, 191, 36, 0.5)"
                    : "1px solid rgba(59, 130, 246, 0.3)",
                  color: "white",
                  cursor: !authUser?.address?.state ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  opacity: !authUser?.address?.state ? 0.5 : 1
                }}
                title={!authUser?.address?.state ? "Add state in profile to enable local products filter" : localProductsOnly ? "Show all products" : `Show only products from ${authUser?.address?.state || "your state"}`}
              >
                {localProductsOnly ? "✓" : ""} 🏠 Local Only
              </button>

              {/* Distance Sort Button */}
              <button
                onClick={() => {
                  if (!userLocation && !locationLoading) {
                    showError("Location not available. Please update your address in profile.");
                    return;
                  }
                  setSortByDistance(!sortByDistance);
                  if (!sortByDistance) {
                    setSortField("name");
                  }
                }}
                disabled={locationLoading || !userLocation}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  background: sortByDistance
                    ? "linear-gradient(135deg, rgba(16, 185, 129, 0.9), rgba(5, 150, 105, 0.9))"
                    : "rgba(15, 23, 42, 0.5)",
                  border: sortByDistance
                    ? "1px solid rgba(16, 185, 129, 0.5)"
                    : "1px solid rgba(59, 130, 246, 0.3)",
                  color: "white",
                  cursor: (locationLoading || !userLocation) ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  opacity: (locationLoading || !userLocation) ? 0.5 : 1
                }}
                title={!userLocation ? "Add address in profile to enable location-based sorting" : "Sort by distance from your location"}
              >
                {locationLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </>
                ) : (
                  <>
                    <span>📍</span>
                    {sortByDistance ? "Nearest First" : "Sort by Distance"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="pb-32">
          <ProductsSection products={filtered} onRatingClick={handleRatingClick} />
        </div>

        <FloatingCart/>

        {/* Reviews Modal */}
        {reviewsModal.open && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.8)",
              backdropFilter: "blur(10px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10000,
              padding: 20,
            }}
            onClick={() => setReviewsModal({ open: false, product: null, reviews: [], loading: false })}
          >
            <div
              style={{
                background: "rgba(0, 0, 0, 0.95)",
                backdropFilter: "blur(20px)",
                borderRadius: 16,
                padding: 24,
                border: "1px solid rgba(59, 130, 246, 0.3)",
                boxShadow: "0 20px 60px rgba(37, 99, 235, 0.3)",
                maxWidth: 600,
                width: "100%",
                maxHeight: "80vh",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{ marginBottom: 20, borderBottom: "1px solid rgba(59, 130, 246, 0.2)", paddingBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div>
                    <h2 style={{ color: "white", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
                      {reviewsModal.product?.title || reviewsModal.product?.product_name || "Product"} Reviews
                    </h2>
                    {reviewsModal.product && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              style={{
                                fontSize: 18,
                                color: star <= Math.round(reviewsModal.product.avg_rating) ? "#facc15" : "rgba(148, 163, 184, 0.3)",
                              }}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span style={{ color: "white", fontWeight: 600 }}>
                          {reviewsModal.product.avg_rating.toFixed(1)}
                        </span>
                        <span style={{ color: "rgb(148, 163, 184)", fontSize: 14 }}>
                          ({reviewsModal.product.review_count} {reviewsModal.product.review_count === 1 ? "review" : "reviews"})
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setReviewsModal({ open: false, product: null, reviews: [], loading: false })}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "rgb(148, 163, 184)",
                      fontSize: 24,
                      cursor: "pointer",
                      padding: 4,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Reviews List */}
              <div style={{ flex: 1, overflowY: "auto", paddingRight: 8 }}>
                {reviewsModal.loading ? (
                  <div style={{ textAlign: "center", padding: 40, color: "rgb(148, 163, 184)" }}>
                    Loading reviews...
                  </div>
                ) : reviewsModal.reviews.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 40, color: "rgb(148, 163, 184)" }}>
                    No reviews yet. Be the first to review this product!
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {reviewsModal.reviews.map((review, index) => (
                      <div
                        key={review.order_id || index}
                        style={{
                          padding: 16,
                          background: "rgba(15, 23, 42, 0.5)",
                          borderRadius: 12,
                          border: "1px solid rgba(59, 130, 246, 0.2)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                          <div>
                            <div style={{ color: "white", fontWeight: 600, marginBottom: 4 }}>
                              {review.customer_name || "Anonymous"}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  style={{
                                    fontSize: 14,
                                    color: star <= review.rating ? "#facc15" : "rgba(148, 163, 184, 0.3)",
                                  }}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          </div>
                          <div style={{ color: "rgb(148, 163, 184)", fontSize: 12 }}>
                            Order #{review.order_id}
                          </div>
                        </div>
                        {review.feedback && (
                          <div style={{ color: "rgb(148, 163, 184)", fontSize: 14, lineHeight: 1.6, marginTop: 8 }}>
                            "{review.feedback}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </CartProvider>
  );
}