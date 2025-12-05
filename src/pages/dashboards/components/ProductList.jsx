// /mnt/data/ProductList.jsx
import React from "react";
import ProductCard from "./ProductCard";
import "../dashboard.css";

export default function ProductList({ products = [], onAdd, onRemove, qtyMap = {}, showProductId = false, theme = null, onRatingClick = null, showRatings = true }) {


  return (
    <div>
      {/* FULL-WIDTH, 3-column grid */}
      <div
        style={{
          marginLeft: -24,
          marginRight: -24,
          paddingLeft: 24,
          paddingRight: 24,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            columnGap: 16,
            rowGap: 22,
            alignItems: "start",
            width: "100%",
          }}
        >
          {products.map((p) => {
            // Determine product ID consistently
            const id = p.id ?? p.product_id;

            return (
              <div
                key={id}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <ProductCard
                  product={p}
                  onAdd={onAdd}
                  onRemove={onRemove}       // optional
                  currentQty={qtyMap[id] || 0} // parent can pass quantities here
                  showProductId={showProductId}
                  theme={theme}
                  onRatingClick={onRatingClick}
                  showRatings={showRatings}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
