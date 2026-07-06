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
  // requireSeller routes (tambah/edit produk) need an opened store; the main
  // /dashboard route itself stays open to any logged-in user so it can show
  // the "Buka Toko" onboarding prompt on the same account.
  if (requireSeller && !user.is_seller) return <Navigate to="/dashboard" replace />;
  return children;
}
