import React, { createContext, useContext, useState } from "react";

const CartCtx = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState([]); // {id,title,price,qty}

  const add = (product) => {
    console.log("🛒 CartContext.add called with product:", product);
    setItems((prev) => {
      // Use product.id or product.product_id as the identifier
      const productId = product.id || product.product_id;
      console.log("🛒 Product ID:", productId, "Current items:", prev);
      
      if (!productId) {
        console.error("❌ No product ID found in product:", product);
        return prev;
      }
      
      // Get stock from product
      const stock = product.stock ?? product.product_stock ?? 0;
      
      const idx = prev.findIndex((x) => x.id === productId);
      if (idx > -1) {
        // update existing entry's qty, but check stock limit
        const next = prev.slice();
        const currentQty = Number(next[idx].qty || 0);
        // Only increment if stock allows (stock > 0 and currentQty < stock)
        if (stock > 0 && currentQty >= stock) {
          console.log("🛒 Stock limit reached, cannot add more");
          return prev; // Don't update if stock limit reached
        }
        next[idx] = { ...next[idx], qty: currentQty + 1 };
        console.log("🛒 Updated existing item, new items:", next);
        return next;
      }
      
      // For new entry, check if stock allows adding
      if (stock <= 0) {
        console.log("🛒 Out of stock, cannot add");
        return prev; // Don't add if out of stock
      }
      
      // new entry - ensure we have the right id and retailer_uid
      const newItem = { 
        id: productId,
        product_id: productId, // Also store as product_id for backend
        title: product.title || product.product_name || product.name, 
        price: Number(product.price || product.product_price || 0), 
        qty: 1,
        retailer_uid: product.retailer_uid || product.raw?.uid, // Store retailer_uid if available
        raw: product 
      };
      const newItems = [newItem, ...prev];
      console.log("🛒 Added new item, new items:", newItems);
      return newItems;
    });
  };

  const remove = (id) => setItems((s) => s.filter((x) => x.id !== id));
  const updateQty = (id, qty) => {
    setItems((s) => s.map((x) => {
      if (x.id === id) {
        // Get stock from raw product data
        const stock = x.raw?.stock ?? x.raw?.product_stock ?? 0;
        const requestedQty = Number(qty);
        // Enforce stock limit if stock is available
        if (stock > 0 && requestedQty > stock) {
          return { ...x, qty: stock }; // Cap at stock limit
        }
        // Ensure minimum quantity of 1
        if (requestedQty < 1) {
          return { ...x, qty: 1 };
        }
        return { ...x, qty: requestedQty };
      }
      return x;
    }));
  };
  const clear = () => setItems([]);

  const total = items.reduce((acc, it) => acc + it.qty * (Number(it.price) || 0), 0);

  return <CartCtx.Provider value={{ items, add, remove, updateQty, clear, total }}>{children}</CartCtx.Provider>;
}

export function useCart() {
  return useContext(CartCtx);
}
