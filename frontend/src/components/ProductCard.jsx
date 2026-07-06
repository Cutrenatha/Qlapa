import React from "react";
import { Link } from "react-router-dom";

const CATEGORY_ICON = {
  Tempurung: "🥥",
  Sabut: "🧵",
  Ampas: "🌾",
  Daun: "🌿",
  "Air Kelapa": "🥤",
};

export default function ProductCard({ product }) {
  return (
    <Link to={`/produk/${product.id}`} style={styles.card} className="card">
      <div style={styles.imgWrap}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} style={styles.img} />
        ) : (
          <div style={styles.placeholder}>{CATEGORY_ICON[product.category] || "🥥"}</div>
        )}
        <span className="badge" style={styles.categoryBadge}>
          {CATEGORY_ICON[product.category] || "🥥"} {product.category}
        </span>
      </div>
      <div style={{ padding: 14 }}>
        <h4 style={styles.name}>{product.name}</h4>
        <div style={styles.price}>
          Rp{Number(product.price).toLocaleString("id-ID")}
          <span style={styles.unit}> / {product.unit}</span>
        </div>
        <div className="row between" style={{ marginTop: 8, fontSize: "0.78rem", color: "var(--ink-soft)" }}>
          <span>📍 {product.seller?.store_location || "-"}</span>
          {product.avg_rating && <span>⭐ {product.avg_rating}</span>}
        </div>
      </div>
    </Link>
  );
}

const styles = {
  card: { display: "block", overflow: "hidden", transition: "transform 0.15s ease, box-shadow 0.15s ease" },
  imgWrap: { position: "relative", aspectRatio: "4/3", background: "var(--cream-2)", overflow: "hidden" },
  img: { width: "100%", height: "100%", objectFit: "cover" },
  placeholder: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.4rem" },
  categoryBadge: { position: "absolute", top: 10, left: 10, background: "rgba(255,255,255,0.92)" },
  name: { fontSize: "0.98rem", marginBottom: 6, color: "var(--ink)", fontFamily: "var(--font-body)", fontWeight: 600 },
  price: { fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--green-800)", fontSize: "1.05rem" },
  unit: { fontFamily: "var(--font-body)", fontWeight: 500, fontSize: "0.78rem", color: "var(--ink-soft)" },
};
