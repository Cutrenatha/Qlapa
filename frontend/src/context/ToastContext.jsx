import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && <div className={`toast ${toast.type === "error" ? "error" : ""}`}>{toast.text}</div>}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
