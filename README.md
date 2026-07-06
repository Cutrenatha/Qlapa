# Qlapa — Marketplace Limbah Kelapa Berbasis AI

Full-stack: **React (Vite)** + **Flask API** + **SQLite**, sesuai konsep di proposal Online Store Design (UTU Awards 2026).

```
qlapa/
├── backend/     Flask API + SQLite
└── frontend/    React (Vite) — UI hijau-cokelat sesuai desain proposal
```

## Fitur yang sudah jalan
- Auth (daftar/masuk) dual-role: **Penjual** & **Pembeli**, pakai JWT
- **Qlapa AI — Deskripsi Produk Otomatis**: saat penjual isi nama/kategori/kondisi produk, backend men-generate deskripsi profesional otomatis (bisa diedit)
- **Qlapa AI — Rekomendasi Pemanfaatan**: chatbot mengambang di tiap halaman + di halaman detail produk, menjawab potensi hilir limbah kelapa
- Cari & filter produk (kategori, kata kunci, rentang harga)
- Keranjang belanja + checkout dengan simulasi **pembayaran escrow**
- Dashboard penjual: ringkasan (pesanan baru, produk terjual, pendapatan), kelola produk, kelola status pesanan
- Riwayat pesanan pembeli + konfirmasi barang diterima (mencairkan escrow)
- Obrolan real-time (polling) antara pembeli & penjual
- Ulasan & rating produk

> Catatan: fitur AI saat ini rule-based (tanpa API key) supaya proyek langsung bisa dijalankan gratis. Untuk pakai GPT/Gemini sungguhan sesuai proposal, tinggal edit `backend/ai_engine.py` — sudah disiapkan contoh cara memanggil API-nya di komentar file tersebut.

---

## 1. Menjalankan Backend (Flask)

Butuh **Python 3.10+**.

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt

# Isi data contoh (akun demo + produk) — jalankan sekali saja
python seed.py

# Jalankan server (default port 5000)
python app.py
```

Backend akan aktif di `http://localhost:5000`.

Akun demo hasil `seed.py`:
| Role | Email | Password |
|---|---|---|
| Penjual 1 | seller@qlapa.test | password123 |
| Penjual 2 | seller2@qlapa.test | password123 |
| Pembeli | buyer@qlapa.test | password123 |

## 2. Menjalankan Frontend (React)

Butuh **Node.js 18+**. Buka terminal baru (biarkan backend tetap jalan).

```bash
cd frontend
npm install
npm run dev
```

Buka `http://localhost:5173` di browser. Vite sudah dikonfigurasi proxy `/api` ke `http://localhost:5000`, jadi tidak perlu setting CORS tambahan.

## 3. Build untuk Production

```bash
cd frontend
npm run build
```

Hasil build ada di `frontend/dist` — bisa di-hosting statis (Netlify/Vercel/Nginx). Untuk backend, gunakan WSGI server seperti `gunicorn`:

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

---

## Struktur Database (SQLite, otomatis dibuat: `backend/qlapa.db`)
- **users** — akun penjual/pembeli
- **products** — produk limbah kelapa
- **orders** & **order_items** — pesanan + status escrow
- **chat_messages** — obrolan real-time
- **reviews** — ulasan produk

## Mengganti AI rule-based dengan GPT/Gemini asli
Buka `backend/ai_engine.py`, ganti isi fungsi `generate_ai_description()` dan `get_recommendation()` dengan pemanggilan API (contoh kode OpenAI sudah ada di docstring paling atas file). Simpan API key sebagai environment variable, jangan hardcode di kode.
