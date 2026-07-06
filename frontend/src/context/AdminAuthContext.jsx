import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

// Instance API terpisah dari user biasa, supaya sesi admin tidak bentrok
// dengan sesi pembeli/penjual yang mungkin login di tab/browser yang sama.
export const adminApi = axios.create({ baseURL: "/api" });

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("qlapa_admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("qlapa_admin_token");
    if (!token) {
      setLoading(false);
      return;
    }
    adminApi
      .get("/auth/me")
      .then((res) => {
        if (res.data.is_admin) {
          setAdmin(res.data);
        } else {
          localStorage.removeItem("qlapa_admin_token");
        }
      })
      .catch(() => localStorage.removeItem("qlapa_admin_token"))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await adminApi.post("/auth/login", { email, password });
    if (!res.data.user.is_admin) {
      throw new Error("Akun ini bukan akun admin");
    }
    localStorage.setItem("qlapa_admin_token", res.data.token);
    setAdmin(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem("qlapa_admin_token");
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AdminAuthContext);
