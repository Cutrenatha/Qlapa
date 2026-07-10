import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import api from "../api.js";

const CartContext = createContext(null);

function getCartKey(userId) {
  return userId ? `qlapa_cart_${userId}` : null;
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  // Load cart from backend (fallback to localStorage)
  useEffect(() => {
    const key = getCartKey(user?.id);
    if (!key) {
      setItems([]);
      return;
    }
    
    // Attempt backend load
    api.get("/cart")
      .then((res) => {
        const sanitized = res.data.map(item => ({
          ...item,
          selected: item.selected !== undefined ? item.selected : true
        }));
        setItems(sanitized);
        localStorage.setItem(key, JSON.stringify(sanitized));
      })
      .catch((err) => {
        console.error("Failed to load cart from backend, using localStorage fallback:", err);
        try {
          const stored = JSON.parse(localStorage.getItem(key) || "[]");
          const sanitized = stored.map(item => ({
            ...item,
            selected: item.selected !== undefined ? item.selected : true
          }));
          setItems(sanitized);
        } catch {
          setItems([]);
        }
      });
  }, [user?.id]);

  // Save cart to backend and localStorage
  useEffect(() => {
    const key = getCartKey(user?.id);
    if (!key) return;
    
    // Save locally
    localStorage.setItem(key, JSON.stringify(items));
    
    // Sync to backend
    const token = localStorage.getItem("qlapa_token");
    if (token) {
      api.post("/cart/sync", { items })
        .catch((err) => console.error("Failed to sync cart with backend:", err));
    }
  }, [items, user?.id]);

  const addItem = (product, qty = 1) => {
    if (!user) return;
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, qty: i.qty + qty, selected: true } : i
        );
      }
      return [...prev, { product, qty, selected: true }];
    });
  };

  const updateQty = (productId, qty) => {
    if (!user) return;
    setItems((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, qty } : i)).filter((i) => i.qty > 0)
    );
  };

  const removeItem = (productId) => {
    if (!user) return;
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const toggleSelect = (productId) => {
    if (!user) return;
    setItems((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, selected: !i.selected } : i))
    );
  };

  const selectAll = (selected) => {
    if (!user) return;
    setItems((prev) => prev.map((i) => ({ ...i, selected })));
  };

  const clearSelected = () => {
    setItems((prev) => prev.filter((i) => !i.selected));
  };

  const clearCart = () => setItems([]);

  // Calculations
  const selectedItems = items.filter((i) => i.selected);
  const total = selectedItems.reduce((sum, i) => sum + i.product.price * i.qty, 0);
  const count = items.reduce((sum, i) => sum + i.qty, 0); // total badge in nav
  const selectedCount = selectedItems.reduce((sum, i) => sum + i.qty, 0); // total items being checked out

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQty,
        removeItem,
        toggleSelect,
        selectAll,
        clearSelected,
        clearCart,
        total,
        count,
        selectedCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
