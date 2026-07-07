import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children, requireSeller }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="empty-state">
        <div className="spinner" style={{ margin: "0 auto" }} />
      </div>
    );
  }
  if (!user) return <Navigate to="/masuk" replace />;
  // requireSeller routes (tambah/edit produk) need an opened store.
  // If not seller, redirect to the Buka Toko page.
  if (requireSeller && !user.is_seller) return <Navigate to="/toko/buka" replace />;
  return children;
}
