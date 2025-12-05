import React, { useContext, useEffect, useState } from "react";
import DashboardLayout from "../DashboardLayout";
import MetricCard from "../components/MetricCard";
import { useToast } from "../../../context/ToastContext";
import "../dashboard.css";
import { AuthContext } from "../../../context/AuthProvider";

// Predefined categories (same as retailer)
const CATEGORIES = [
  "Food & Beverages",
  "Clothing & Apparel",
  "Electronics",
  "Home & Kitchen",
  "Beauty & Personal Care",
  "Sports & Outdoors",
  "Books & Media",
  "Toys & Games",
  "Health & Wellness",
  "Automotive",
  "Pet Supplies",
  "Office Supplies",
  "General"
];

// Wholesaler Product Card Component
function WholesalerInventoryCard({ product, onEdit, onDelete, theme }) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 280,
        display: "flex",
        flexDirection: "column",
        padding: 16,
        borderRadius: 16,
        background: "rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(10px)",
        border: `1px solid ${theme.accentRgba}`,
        boxShadow: `0 4px 6px -1px ${theme.accentRgbaLight}`,
        transition: "all 0.3s ease",
        overflow: "hidden",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-6px)";
        e.currentTarget.style.boxShadow = `0 12px 28px ${theme.accentRgba}`;
        e.currentTarget.style.borderColor = theme.accent;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0px)";
        e.currentTarget.style.boxShadow = `0 4px 6px -1px ${theme.accentRgbaLight}`;
        e.currentTarget.style.borderColor = theme.accentRgba;
      }}
    >
      {/* Image */}
      <div
        style={{
          height: 160,
          borderRadius: 12,
          background: "rgba(15, 23, 42, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgb(148, 163, 184)",
          marginBottom: 12,
          overflow: "hidden",
          flexShrink: 0,
          border: `1px solid ${theme.accentRgba}`,
        }}
      >
        {product?.image || product?.product_image ? (
          <img
            src={product.image || product.product_image}
            alt={product.product_name || "product"}
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }}
            onError={(e) => {
              e.target.style.display = "none";
              e.target.parentElement.textContent = "No Image";
            }}
          />
        ) : (
          <div style={{ textAlign: "center", fontSize: 14 }}>
            <div style={{ fontSize: 32, marginBottom: 4 }}>📦</div>
            <div>No Image</div>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 16, color: "white", marginBottom: 4 }}>
            {product.product_name || "Unnamed Product"}
          </div>
          <div style={{ fontSize: 12, color: "rgb(148, 163, 184)" }}>
            Product ID: {product.product_id}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ 
            fontSize: 11, 
            padding: "4px 8px", 
            background: theme.accentRgbaLight, 
            borderRadius: 6,
            color: theme.accentLight,
            fontWeight: 500
          }}>
            {product.product_category || "General"}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: "white" }}>
              ₹{product.product_price || "0"}
            </div>
            <div style={{ fontSize: 12, color: theme.accentLight, fontWeight: 500 }}>
              Wholesale Price
            </div>
            <div style={{ fontSize: 12, color: "rgb(148, 163, 184)", marginTop: 4 }}>
              Stock: <span style={{ color: product.product_stock > 0 ? "rgb(16, 185, 129)" : "rgb(239, 68, 68)", fontWeight: 600 }}>
                {product.product_stock || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: 8, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${theme.accentRgba}` }}>
        <button
          onClick={() => onEdit(product)}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: 8,
            background: theme.accentRgbaLight,
            border: `1px solid ${theme.accentRgba}`,
            color: theme.accentLight,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = theme.accentRgba;
            e.currentTarget.style.transform = "scale(1.02)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = theme.accentRgbaLight;
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(product.product_id)}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: 8,
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "rgb(239, 68, 68)",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
            e.currentTarget.style.transform = "scale(1.02)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default function WholesalerHome() {
  const { token, user: authUser } = useContext(AuthContext);
  const { error: showError, warning, success } = useToast();
  const [stock, setStock] = useState([]);
  const [editing, setEditing] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Get theme from DashboardLayout context (purple for wholesaler)
  const theme = {
    accentRgba: "rgba(147, 51, 234, 0.3)",
    accentRgbaLight: "rgba(147, 51, 234, 0.1)",
    accent: "rgb(147, 51, 234)",
    accentLight: "rgb(168, 85, 247)"
  };

  const [metrics, setMetrics] = useState([
    { title: "Total Products", value: 0, subtitle: "Active product listings", icon: "📦", color: "#7c3aed" },
    { title: "Pending Orders", value: 0, subtitle: "Retailer orders pending", icon: "🧾", color: "#f59e0b" },
    { title: "Revenue (7d)", value: "₹0", subtitle: "From retailer orders", icon: "💰", color: "#06b6d4" },
  ]);

  const fetchStock = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/wholesaler/stock", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to load inventory");
      }

      const data = await res.json();
      setStock(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      showError("Failed to load inventory");
      setStock([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchStock();
      
      // Fetch metrics
      const fetchMetrics = async () => {
        try {
          const res = await fetch(`http://localhost:5000/api/wholesaler/metrics`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          const data = await res.json();
          
          setMetrics([
            { 
              title: "Total Products", 
              value: data.totalProducts || 0, 
              subtitle: "Active product listings", 
              icon: "📦", 
              color: "#7c3aed" 
            },
            { 
              title: "Pending Orders", 
              value: data.pendingOrders || 0, 
              subtitle: "Retailer orders pending", 
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
            { title: "Total Products", value: stock.length, subtitle: "Active product listings", icon: "📦", color: "#7c3aed" },
            { title: "Pending Orders", value: 0, subtitle: "Retailer orders pending", icon: "🧾", color: "#f59e0b" },
            { title: "Total Revenue", value: "₹0", subtitle: "From delivered orders", icon: "💰", color: "#06b6d4" },
          ]);
        }
      };
      fetchMetrics();
    }
  }, [token, stock.length]);

  const addNew = () => {
    setEditing({
      product_id: "",
      product_name: "",
      product_price: "",
      product_stock: "",
      product_category: "General",
      image: "",
    });
    setIsEditMode(false);
    setShowModal(true);
  };

  const handleEdit = (product) => {
    setEditing({ 
      ...product,
      image: product.image || product.product_image || ""
    });
    setIsEditMode(true);
    setShowModal(true);
  };

  const saveProduct = async (obj) => {
    if (!obj.product_id) return warning("Product ID is required");
    if (!obj.product_name) return warning("Product name is required");
    if (!obj.product_price || Number(obj.product_price) <= 0) return warning("Valid wholesale price is required");
    if (obj.product_stock === "" || Number(obj.product_stock) < 0) return warning("Valid stock quantity is required");

    try {
      const body = {
        product_id: obj.product_id,
        product_name: obj.product_name,
        product_price: Number(obj.product_price),
        product_stock: Number(obj.product_stock),
        product_category: obj.product_category || "General",
        product_image: obj.image || "",
      };

      const existing = stock.find((x) => x.product_id === obj.product_id);
      
      const res = await fetch(
        existing 
          ? `http://localhost:5000/api/wholesaler/stock/${obj.product_id}`
          : "http://localhost:5000/api/wholesaler/stock",
        {
          method: existing ? "PUT" : "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Save failed");
      }

      success(`Product ${existing ? "updated" : "added"} successfully!`);
      fetchStock();
      setEditing(null);
      setIsEditMode(false);
      setShowModal(false);
    } catch (err) {
      console.error(err);
      showError(err.message || "Could not save product");
    }
  };

  const delProduct = async (product_id) => {
    if (!window.confirm(`Are you sure you want to delete product "${product_id}"?`)) return;

    try {
      const res = await fetch(`http://localhost:5000/api/wholesaler/stock/${product_id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Delete failed");

      success("Product deleted successfully!");
      fetchStock();
    } catch (err) {
      console.error(err);
      showError("Could not delete product");
    }
  };

  // Filter products
  const filteredStock = stock.filter((item) => {
    const matchesSearch = item.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.product_id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.product_category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const uniqueCategories = ["All", ...new Set(stock.map(item => item.product_category).filter(Boolean))];

  return (
    <DashboardLayout user={{ name: authUser?.name || "Wholesaler Dashboard", role: "wholesaler" }}>
      {/* Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 24 }}>
        {metrics.map((m, i) => (
          <MetricCard key={i} {...m} theme={theme} />
        ))}
      </div>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h2 style={{ color: "white", fontSize: "1.875rem", fontWeight: 700, marginBottom: 8 }}>
              📦 Wholesale Inventory
            </h2>
            <div style={{ color: "rgb(148, 163, 184)", fontSize: "0.95rem" }}>
              Manage your wholesale catalog, pricing, and stock levels.
            </div>
          </div>
          <button
            onClick={addNew}
            style={{
              padding: "12px 24px",
              borderRadius: 12,
              background: `linear-gradient(to right, ${theme.accent}, ${theme.accentLight})`,
              color: "white",
              border: "none",
              fontWeight: 600,
              fontSize: 16,
              cursor: "pointer",
              boxShadow: `0 4px 12px ${theme.accentRgba}`,
              transition: "all 0.3s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = `0 6px 16px ${theme.accentRgba}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = `0 4px 12px ${theme.accentRgba}`;
            }}
          >
            + Add Product
          </button>
        </div>

        {/* Search and Filter */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <input
            type="text"
            placeholder="Search products by name or Product ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 12,
              background: "rgba(0, 0, 0, 0.4)",
              border: `1px solid ${theme.accentRgba}`,
              color: "white",
              fontSize: 14,
              outline: "none",
              transition: "all 0.3s ease"
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = theme.accent;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.accentRgbaLight}`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = theme.accentRgba;
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              background: "rgba(0, 0, 0, 0.4)",
              border: `1px solid ${theme.accentRgba}`,
              color: "white",
              fontSize: 14,
              outline: "none",
              cursor: "pointer",
              minWidth: 180
            }}
          >
            {uniqueCategories.map((cat) => (
              <option key={cat} value={cat} style={{ background: "rgb(15, 23, 42)", color: "white" }}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div style={{
          background: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(10px)",
          borderRadius: 16,
          padding: 48,
          textAlign: "center",
          border: `1px solid ${theme.accentRgba}`
        }}>
          <div style={{ color: "rgb(148, 163, 184)", fontSize: 18 }}>Loading inventory...</div>
        </div>
      ) : filteredStock.length === 0 ? (
        <div style={{
          background: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(10px)",
          borderRadius: 16,
          padding: 48,
          textAlign: "center",
          border: `1px solid ${theme.accentRgba}`
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
          <div style={{ color: "rgb(148, 163, 184)", fontSize: 18, marginBottom: 8 }}>
            {stock.length === 0 ? "No products yet" : "No products found"}
          </div>
          <div style={{ color: "rgb(148, 163, 184)", fontSize: 14 }}>
            {stock.length === 0 ? "Click 'Add Product' to get started" : "Try adjusting your search or filter"}
          </div>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 20
        }}>
          {filteredStock.map((item) => (
            <WholesalerInventoryCard
              key={item.product_id}
              product={item}
              onEdit={handleEdit}
              onDelete={delProduct}
              theme={theme}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && editing && (
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
            padding: 20
          }}
          onClick={() => {
            setShowModal(false);
            setEditing(null);
            setIsEditMode(false);
          }}
        >
          <div
            style={{
              background: "rgba(0, 0, 0, 0.95)",
              backdropFilter: "blur(20px)",
              borderRadius: 20,
              padding: 32,
              border: `1px solid ${theme.accentRgba}`,
              maxWidth: 600,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: "white", fontSize: "1.5rem", fontWeight: 700, marginBottom: 24 }}>
              {isEditMode ? "Edit Product" : "Add New Product"}
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", color: "rgb(148, 163, 184)", fontSize: 14, marginBottom: 8, fontWeight: 500 }}>
                  Product ID *
                </label>
                <input
                  type="text"
                  placeholder="e.g., SKU001"
                  value={editing.product_id}
                  onChange={(e) => setEditing({ ...editing, product_id: e.target.value })}
                  disabled={isEditMode}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 12,
                    background: isEditMode ? "rgba(148, 163, 184, 0.1)" : "rgba(0, 0, 0, 0.5)",
                    border: `1px solid ${theme.accentRgba}`,
                    color: isEditMode ? "rgb(148, 163, 184)" : "white",
                    fontSize: 14,
                    outline: "none"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", color: "rgb(148, 163, 184)", fontSize: 14, marginBottom: 8, fontWeight: 500 }}>
                  Product Name *
                </label>
                <input
                  type="text"
                  placeholder="Enter product name"
                  value={editing.product_name}
                  onChange={(e) => setEditing({ ...editing, product_name: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 12,
                    background: "rgba(0, 0, 0, 0.5)",
                    border: `1px solid ${theme.accentRgba}`,
                    color: "white",
                    fontSize: 14,
                    outline: "none"
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", color: "rgb(148, 163, 184)", fontSize: 14, marginBottom: 8, fontWeight: 500 }}>
                    Wholesale Price (₹) *
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={editing.product_price}
                    onChange={(e) => setEditing({ ...editing, product_price: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 12,
                      background: "rgba(0, 0, 0, 0.5)",
                      border: `1px solid ${theme.accentRgba}`,
                      color: "white",
                      fontSize: 14,
                      outline: "none"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", color: "rgb(148, 163, 184)", fontSize: 14, marginBottom: 8, fontWeight: 500 }}>
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    min="0"
                    value={editing.product_stock}
                    onChange={(e) => setEditing({ ...editing, product_stock: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 12,
                      background: "rgba(0, 0, 0, 0.5)",
                      border: `1px solid ${theme.accentRgba}`,
                      color: "white",
                      fontSize: 14,
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", color: "rgb(148, 163, 184)", fontSize: 14, marginBottom: 8, fontWeight: 500 }}>
                  Category *
                </label>
                <select
                  value={editing.product_category || "General"}
                  onChange={(e) => setEditing({ ...editing, product_category: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 12,
                    background: "rgba(0, 0, 0, 0.5)",
                    border: `1px solid ${theme.accentRgba}`,
                    color: "white",
                    fontSize: 14,
                    outline: "none",
                    cursor: "pointer"
                  }}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} style={{ background: "rgb(15, 23, 42)", color: "white" }}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", color: "rgb(148, 163, 184)", fontSize: 14, marginBottom: 8, fontWeight: 500 }}>
                  Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={editing.image || ""}
                  onChange={(e) => setEditing({ ...editing, image: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 12,
                    background: "rgba(0, 0, 0, 0.5)",
                    border: `1px solid ${theme.accentRgba}`,
                    color: "white",
                    fontSize: 14,
                    outline: "none"
                  }}
                />
                {editing.image && (
                  <div style={{ marginTop: 12, borderRadius: 12, overflow: "hidden", border: `1px solid ${theme.accentRgba}` }}>
                    <img
                      src={editing.image}
                      alt="Preview"
                      style={{ width: "100%", maxHeight: 200, objectFit: "cover" }}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditing(null);
                  setIsEditMode(false);
                }}
                style={{
                  padding: "12px 24px",
                  borderRadius: 12,
                  background: "rgba(148, 163, 184, 0.1)",
                  border: "1px solid rgba(148, 163, 184, 0.3)",
                  color: "rgb(148, 163, 184)",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => saveProduct(editing)}
                style={{
                  padding: "12px 24px",
                  borderRadius: 12,
                  background: `linear-gradient(to right, ${theme.accent}, ${theme.accentLight})`,
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  boxShadow: `0 4px 12px ${theme.accentRgba}`
                }}
              >
                {editing.product_id ? "Update Product" : "Add Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
