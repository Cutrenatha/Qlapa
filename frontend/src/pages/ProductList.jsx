import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api.js";
import { MapPin, Package, ChevronRight } from "lucide-react";

const CATEGORIES = ["Ampas", "Tempurung", "Sabut", "Daun", "Air Kelapa"];

export default function ProductList() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(params.get("q") || "");
  const [category, setCategory] = useState(params.get("category") || "");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const fetchProducts = () => {
    setLoading(true);
    const query = {};
    if (q) query.q = q;
    if (category) query.category = category;
    if (minPrice) query.min_price = minPrice;
    if (maxPrice) query.max_price = maxPrice;
    api.get("/products", { params: query })
      .then((res) => setProducts(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const applyFilters = (e) => {
    e?.preventDefault();
    setParams(category ? { category } : {});
    fetchProducts();
  };

  return (
    <div className="fw-section" style={{ minHeight: '70vh' }}>
      <div className="container">
        <div className="fw-header" style={{ marginBottom: 10 }}>
          <div>
            <h2 className="fw-title">Katalog Produk 🥥</h2>
            <p className="fw-subtitle">Cari limbah & produk turunan kelapa</p>
          </div>
        </div>

        <form onSubmit={applyFilters} className="card" style={styles.filterBar}>
          <input
            placeholder="Cari produk… (mis. tempurung, sabut, ampas)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={styles.searchInput}
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={styles.select}>
            <option value="">Semua kategori</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            type="number" placeholder="Harga min"
            value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
            style={{ ...styles.select, width: 110 }}
          />
          <input
            type="number" placeholder="Harga max"
            value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
            style={{ ...styles.select, width: 110 }}
          />
          <button className="btn btn-primary btn-sm" type="submit">Terapkan</button>
        </form>

        <div className="row gap-8 wrap" style={{ margin: "20px 0" }}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(category === c ? "" : c)}
              className={`badge ${category === c ? "badge-brown" : "badge-outline"}`}
              style={{ cursor: "pointer" }}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="empty-state"><div className="spinner" style={{ margin: "0 auto" }} /></div>
        ) : products.length === 0 ? (
          <div className="empty-state">Tidak ada produk yang cocok dengan pencarianmu.</div>
        ) : (
          <div className="fw-grid">
            {products.map((p) => (
              <Link key={p.id} to={`/produk/${p.id}`} className="fw-card" style={{ textDecoration: 'none' }}>
                <div className="fw-card-img-wrapper">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="fw-card-img" />
                  ) : (
                    <div className="fw-card-img fw-card-placeholder">🥥</div>
                  )}
                  <div className="fw-badge">
                    {p.category}
                  </div>
                </div>
                <div className="fw-card-body">
                  <h4 className="fw-card-name">{p.name}</h4>
                  <p className="fw-card-price">Rp{Number(p.price).toLocaleString('id-ID')} / {p.unit}</p>
                  <p className="fw-card-location"><MapPin size={12} /> {p.seller?.store_location || 'Indonesia'}</p>
                  <div className="fw-card-footer">
                    <span className="fw-stock">
                      <Package size={11} /> {p.stock} {p.unit} tersedia
                    </span>
                    <span className="fw-detail-btn">Lihat Detail</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  filterBar: { display: "flex", gap: 10, padding: 14, flexWrap: "wrap", alignItems: "center" },
  searchInput: { flex: 1, minWidth: 220, padding: "10px 14px", borderRadius: 8, border: "1.5px solid var(--line)", outline: "none" },
  select: { padding: "10px 12px", borderRadius: 8, border: "1.5px solid var(--line)", outline: "none" },
};
