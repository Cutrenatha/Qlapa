import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Icon = {
  home: (a) => (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth={a ? 2.2 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M9.5 20v-6h5v6" />
    </svg>
  ),
  store: (a) => (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth={a ? 2.2 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 10 5 4h14l1 6" />
      <path d="M4 10a2.2 2.2 0 0 0 4.2 1.1A2.2 2.2 0 0 0 12 10a2.2 2.2 0 0 0 3.8 1.1A2.2 2.2 0 0 0 20 10" />
      <path d="M5.5 10.8V20h13v-9.2" />
      <path d="M10 20v-5h4v5" />
    </svg>
  ),
  box: (a) => (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth={a ? 2.2 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 8 12 3 3 8l9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  ),
  receipt: (a) => (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth={a ? 2.2 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 3h12v18l-2.5-1.5L13 21l-2.5-1.5L8 21l-2-1.5V3Z" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  ),
  chat: (a) => (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth={a ? 2.2 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 5h16v11H8l-4 4V5Z" />
    </svg>
  ),
};

const BUYER_TABS = [
  { label: "Beranda", to: "/", icon: "home", match: (p) => p === "/" },
  {
    label: "Produk",
    to: "/produk",
    icon: "box",
    match: (p) => p.startsWith("/produk"),
  },
  {
    label: "Pesanan",
    to: "/pesanan",
    icon: "receipt",
    match: (p) => p.startsWith("/pesanan"),
  },
  {
    label: "Obrolan",
    to: "/chat",
    icon: "chat",
    match: (p) => p.startsWith("/chat"),
  },
  {
    label: "Toko",
    to: "/toko/buka",
    icon: "store",
    match: (p) => p.startsWith("/toko/buka"),
  },
];

const SELLER_TABS = [
  {
    label: "Toko",
    to: "/dashboard?tab=toko",
    icon: "store",
    match: (p, s) =>
      p.startsWith("/dashboard") && (!s.get("tab") || s.get("tab") === "toko"),
  },
  {
    label: "Produk",
    to: "/dashboard?tab=produk",
    icon: "box",
    match: (p, s) => p.startsWith("/dashboard") && s.get("tab") === "produk",
  },
  {
    label: "Pesanan",
    to: "/dashboard?tab=pesanan",
    icon: "receipt",
    match: (p, s) => p.startsWith("/dashboard") && s.get("tab") === "pesanan",
  },
  {
    label: "Obrolan",
    to: "/chat",
    icon: "chat",
    match: (p) => p.startsWith("/chat"),
  },
  {
    label: "Beranda",
    to: "/",
    icon: "home",
    match: (p) => p === "/",
  },
];

const HIDDEN_PREFIXES = ["/masuk", "/daftar", "/toko/buka", "/checkout"];

export default function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  const path = location.pathname;

  if (HIDDEN_PREFIXES.some((p) => path.startsWith(p))) return null;

  const tabs = user?.is_seller ? SELLER_TABS : BUYER_TABS;
  const search = new URLSearchParams(location.search);

  return (
    <nav style={styles.nav}>
      {tabs.map((t) => {
        const active = t.match(path, search);
        return (
          <Link key={t.label} to={t.to} style={styles.item}>
            <span
              style={{
                ...styles.iconWrap,
                ...(active ? styles.iconWrapActive : null),
              }}
            >
              {Icon[t.icon](active)}
            </span>
            <span
              style={{
                ...styles.label,
                ...(active ? styles.labelActive : null),
              }}
            >
              {t.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

const styles = {
  nav: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 60,
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    background: "rgba(255, 255, 255, 0.15)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "999px 999px 0 0",
    margin: "0 6px 6px 6px",
    padding: "8px 6px calc(8px + env(safe-area-inset-bottom))",
    boxShadow: "0 -4px 16px rgba(38,36,29,0.06)",
  },
  item: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 3,
    flex: 1,
    padding: "4px 0",
    color: "var(--ink-soft)",
  },
  iconWrap: {
    width: 34,
    height: 30,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    color: "var(--ink-soft)",
  },
  iconWrapActive: {
    background: "var(--brown-100)",
    color: "var(--brown-800)",
  },
  label: {
    fontSize: "0.68rem",
    fontWeight: 600,
    color: "var(--ink-soft)",
  },
  labelActive: {
    color: "var(--brown-800)",
  },
};
