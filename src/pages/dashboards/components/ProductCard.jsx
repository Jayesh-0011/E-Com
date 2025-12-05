import React, { useEffect, useState } from "react";
import "../dashboard.css";

export default function ProductCard({ product, onAdd, onRemove, currentQty = 0, showProductId = false, theme = null, onRatingClick = null, showRatings = true }) {
  // Default theme (customer blue) if not provided
  const cardTheme = theme || {
    accent: "rgb(37, 99, 235)",
    accentLight: "rgb(59, 130, 246)",
    accentRgba: "rgba(37, 99, 235, 0.3)",
    accentRgbaLight: "rgba(37, 99, 235, 0.1)"
  };
  // local qty shown on the card (kept in sync with parent-provided currentQty when available)
  const [qty, setQty] = useState(Number(currentQty) || 0);

  // Check if product is out of stock
  const stock = product.stock ?? product.product_stock ?? 0;
  const isOutOfStock = stock <= 0;
  // Check if cart quantity has reached stock limit
  const hasReachedStockLimit = qty >= stock && stock > 0;

  useEffect(() => {
    setQty(Number(currentQty) || 0);
  }, [currentQty]);

  const handleAdd = () => {
    // Prevent adding if out of stock or stock limit reached
    if (isOutOfStock || hasReachedStockLimit) {
      return;
    }
    console.log("➕ ProductCard handleAdd called, product:", product);
    // keep UI responsive
    setQty((q) => q + 1);
    // call the parent's add handler so cart changes globally
    if (typeof onAdd === "function") {
      // Ensure product has all necessary fields
      const productToAdd = {
        ...product,
        id: product.id || product.product_id,
        product_id: product.id || product.product_id,
        title: product.title || product.product_name || product.name,
        price: product.price || product.product_price
      };
      console.log("➕ Calling onAdd with productToAdd:", productToAdd);
      onAdd(productToAdd);
    } else {
      console.error("❌ onAdd is not a function:", typeof onAdd);
    }
  };

  const handleRemove = () => {
    setQty((q) => Math.max(0, q - 1));
    // call parent's remove handler (if provided)
    if (typeof onRemove === "function") {
      onRemove(product);
    }
    // if no onRemove provided, we just update local UI only
  };


  return (
    <div
      style={{
        width: 240,
        height: 320,
        display: "flex",
        flexDirection: "column",
        padding: 16,
        borderRadius: 16,
        background: isOutOfStock ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(10px)",
        border: `1px solid ${isOutOfStock ? "rgba(148, 163, 184, 0.2)" : cardTheme.accentRgba}`,
        boxShadow: `0 4px 6px -1px ${isOutOfStock ? "rgba(0, 0, 0, 0.1)" : cardTheme.accentRgbaLight}`,
        transition: "all 0.3s ease",
        overflow: "hidden",
        position: "relative",
        boxSizing: "border-box",
        opacity: isOutOfStock ? 0.5 : 1,
        filter: isOutOfStock ? "grayscale(0.7)" : "none",
        cursor: isOutOfStock ? "not-allowed" : "default",
      }}
      onMouseEnter={(e) => {
        if (!isOutOfStock) {
          e.currentTarget.style.transform = "translateY(-6px)";
          e.currentTarget.style.boxShadow = `0 12px 28px ${cardTheme.accentRgba}`;
          e.currentTarget.style.borderColor = cardTheme.accent;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0px)";
        e.currentTarget.style.boxShadow = `0 4px 6px -1px ${isOutOfStock ? "rgba(0, 0, 0, 0.1)" : cardTheme.accentRgbaLight}`;
        e.currentTarget.style.borderColor = isOutOfStock ? "rgba(148, 163, 184, 0.2)" : cardTheme.accentRgba;
      }}
    >
      {/* Image */}
      <div
        style={{
          height: 136,
          borderRadius: 12,
          background: "rgba(15, 23, 42, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgb(148, 163, 184)",
          marginBottom: 12,
          overflow: "hidden",
          flexShrink: 0,
          border: `1px solid ${cardTheme.accentRgba}`,
        }}
      >
        {product?.image ? (
          <img
            src={product.image}
            alt={product.title || product.product_name || "product"}
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }}
          />
        ) : (
          "Image"
        )}
      </div>

      {/* Content */}
      <div style={{ paddingBottom: 80, display: "flex", flexDirection: "column", gap: 6, overflow: "hidden" }}>
        <div style={{ fontWeight: 600, fontSize: 15, color: "white", lineHeight: 1.1 }}>
          {product.title || product.product_name || product.name || "Product"}
        </div>

        <div style={{ fontSize: 13, color: "rgb(148, 163, 184)", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span>{product.category || product.product_category || "General"}</span>
          {(showProductId && (product.id || product.product_id)) && (
            <span style={{ fontSize: 11, padding: "2px 6px", background: cardTheme.accentRgbaLight, borderRadius: 4 }}>
              Product ID: {product.id || product.product_id}
            </span>
          )}
          {product.distance !== null && product.distance !== undefined && (
            <span style={{ 
              fontSize: 11, 
              padding: "2px 6px", 
              background: "rgba(16, 185, 129, 0.2)", 
              borderRadius: 4,
              color: "rgb(16, 185, 129)",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 4
            }}>
              <span>📍</span>
              {product.distance} km
            </span>
          )}
        </div>

        {/* Stock information */}
        {(product.stock !== undefined || product.product_stock !== undefined) && (
          <div style={{ fontSize: 12, color: isOutOfStock ? "rgb(239, 68, 68)" : hasReachedStockLimit ? "rgb(251, 191, 36)" : "rgb(148, 163, 184)" }}>
            Stock: <span style={{ color: isOutOfStock ? "rgb(239, 68, 68)" : hasReachedStockLimit ? "rgb(251, 191, 36)" : "white", fontWeight: 600 }}>
              {stock}
            </span>
            {isOutOfStock && <span style={{ marginLeft: 8, fontSize: 11, color: "rgb(239, 68, 68)", fontWeight: 600 }}>• Out of Stock</span>}
            {hasReachedStockLimit && !isOutOfStock && <span style={{ marginLeft: 8, fontSize: 11, color: "rgb(251, 191, 36)", fontWeight: 600 }}>• Limit Reached ({qty}/{stock})</span>}
          </div>
        )}

        {/* Rating display - only show if showRatings is true */}
        {showRatings && (
          <div 
            style={{ 
              fontSize: 12, 
              color: "rgb(148, 163, 184)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: onRatingClick ? "pointer" : "default",
              transition: onRatingClick ? "all 0.2s ease" : "none"
            }}
            onClick={() => onRatingClick && onRatingClick(product)}
            onMouseEnter={(e) => {
              if (onRatingClick) {
                e.currentTarget.style.color = cardTheme.accentLight;
              }
            }}
            onMouseLeave={(e) => {
              if (onRatingClick) {
                e.currentTarget.style.color = "rgb(148, 163, 184)";
              }
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  style={{
                    fontSize: 14,
                    color: star <= Math.round(product.avg_rating || 0) ? "#facc15" : "rgba(148, 163, 184, 0.3)",
                  }}
                >
                  ★
                </span>
              ))}
            </div>
            <span style={{ fontWeight: 600, color: "white" }}>
              {(product.avg_rating || 0).toFixed(1)}
            </span>
            {product.review_count > 0 ? (
              <span style={{ fontSize: 11, color: "rgb(148, 163, 184)" }}>
                ({product.review_count} {product.review_count === 1 ? "review" : "reviews"})
              </span>
            ) : (
              <span style={{ fontSize: 11, color: "rgb(148, 163, 184)" }}>
                (No reviews)
              </span>
            )}
          </div>
        )}

        {/* Description */}
        {(product.description || product.raw?.description) && (
          <div
            style={{
              fontSize: 12,
              marginTop: 4,
              color: "rgb(148, 163, 184)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {product.description || product.raw?.description}
          </div>
        )}
      </div>

      {/* Footer anchored */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          right: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "white" }}>
            ₹{product.price ?? product.product_price ?? "—"}
          </div>
          <div style={{ fontSize: 12, color: "rgb(148, 163, 184)" }}>
            Price
          </div>
        </div>
        {/* Add / counter UI */}
        {qty <= 0 ? (
          <button
            onClick={handleAdd}
            disabled={isOutOfStock || hasReachedStockLimit}
            style={{ 
              padding: "8px 12px", 
              borderRadius: 10, 
              whiteSpace: "nowrap",
              background: (isOutOfStock || hasReachedStockLimit)
                ? "rgba(148, 163, 184, 0.2)" 
                : `linear-gradient(to right, ${cardTheme.accent}, ${cardTheme.accentLight})`,
              color: (isOutOfStock || hasReachedStockLimit) ? "rgb(148, 163, 184)" : "white",
              border: "none",
              fontWeight: 600,
              cursor: (isOutOfStock || hasReachedStockLimit) ? "not-allowed" : "pointer",
              boxShadow: (isOutOfStock || hasReachedStockLimit) ? "none" : `0 4px 6px -1px ${cardTheme.accentRgba}`,
              transition: "all 0.2s ease",
              opacity: (isOutOfStock || hasReachedStockLimit) ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!isOutOfStock && !hasReachedStockLimit) {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = `0 6px 12px -1px ${cardTheme.accentRgba}`;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = (isOutOfStock || hasReachedStockLimit) ? "none" : `0 4px 6px -1px ${cardTheme.accentRgba}`;
            }}
          >
            {isOutOfStock ? "Out of Stock" : hasReachedStockLimit ? "Stock Limit Reached" : "Add"}
          </button>
        ) : (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "transparent",
              padding: "6px 8px",
              borderRadius: 12,
            }}
          >
            <button
              onClick={handleRemove}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: "1px solid rgba(148, 163, 184, 0.3)",
                background: "rgba(148, 163, 184, 0.1)",
                color: "rgb(148, 163, 184)",
                cursor: "pointer",
                fontWeight: 700,
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(148, 163, 184, 0.2)";
                e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(148, 163, 184, 0.1)";
                e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.3)";
              }}
              aria-label="Decrease quantity"
            >
              −
            </button>

            <div style={{ minWidth: 28, textAlign: "center", fontWeight: 700, color: "white" }}>{qty}</div>

            <button
              onClick={handleAdd}
              disabled={isOutOfStock || hasReachedStockLimit}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: "none",
                background: (isOutOfStock || hasReachedStockLimit)
                  ? "rgba(148, 163, 184, 0.2)" 
                  : `linear-gradient(to right, ${cardTheme.accent}, ${cardTheme.accentLight})`,
                color: (isOutOfStock || hasReachedStockLimit) ? "rgb(148, 163, 184)" : "white",
                cursor: (isOutOfStock || hasReachedStockLimit) ? "not-allowed" : "pointer",
                fontWeight: 700,
                boxShadow: (isOutOfStock || hasReachedStockLimit) ? "none" : `0 2px 4px ${cardTheme.accentRgba}`,
                transition: "all 0.2s ease",
                opacity: (isOutOfStock || hasReachedStockLimit) ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!isOutOfStock && !hasReachedStockLimit) {
                  e.currentTarget.style.transform = "scale(1.1)";
                  e.currentTarget.style.boxShadow = `0 4px 8px ${cardTheme.accentRgba}`;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = (isOutOfStock || hasReachedStockLimit) ? "none" : `0 2px 4px ${cardTheme.accentRgba}`;
              }}
              aria-label="Increase quantity"
              title={hasReachedStockLimit ? `Maximum ${stock} items available` : ""}
            >
              +
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
