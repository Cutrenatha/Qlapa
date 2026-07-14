import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { AdminAuthProvider } from "./context/AdminAuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./styles/global.css";

const GOOGLE_CLIENT_ID = "476986015276-805dhprpatpn6o8ij3dejv6efusrcauv.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <ToastProvider>
          <AdminAuthProvider>
            <AuthProvider>
              <CartProvider>
                <App />
              </CartProvider>
            </AuthProvider>
          </AdminAuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
