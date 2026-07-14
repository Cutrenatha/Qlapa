import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Play } from "lucide-react";

export default function HomeHero() {
  const navigate = useNavigate();

  return (
    <section className="hero-section">
      <div className="container" style={{ width: "100%" }}>
        <div className="hero-content-wrapper">
          <h1 className="hero-headline">
            Kelapa menyimpan<br />
            banyak potensi.<br />
            Kami menghubungkannya.
          </h1>
          <p className="hero-description">
            Dari bahan baku hingga produk hasil olahan, Qlapa menghadirkan satu
            tempat untuk menemukan setiap potensi kelapa.
          </p>
          <div className="hero-ctas">
            <Link to="/produk" className="hero-btn-primary">
              <span>Jelajahi Produk</span>
              <ArrowRight size={16} />
            </Link>
            <button className="hero-btn-secondary" onClick={() => navigate("/produk")}>
              <div className="hero-play-icon">
                <Play size={16} fill="currentColor" style={{ marginLeft: 2 }} />
              </div>
              <span>Lihat Cara Kerja</span>
            </button>
          </div>
        </div>
        {/* Mobile Hero Image */}
        <div className="hero-mobile-img-wrap">
          <img src="/assets/klapa.png" alt="Potensi Kelapa" className="hero-mobile-image" />
        </div>
      </div>
    </section>
  );
}