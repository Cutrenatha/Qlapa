# Qlapa AI Service

Service FastAPI terpisah untuk fitur Qlapa AI:

- Chatbot Qlapa AI
- Rekomendasi pemanfaatan produk kelapa
- Saran deskripsi produk
- Analisis foto produk untuk mengisi form penjual otomatis

Jalankan dari folder `backend`:

```powershell
uvicorn ai_service.main:app --host 0.0.0.0 --port 8001 --reload
```

Backend Flask utama tetap memakai endpoint lama. Jika `AI_SERVICE_URL` tidak bisa dihubungi, backend otomatis fallback ke `ai_engine.py`.

Environment yang relevan:

```env
AI_SERVICE_URL=http://127.0.0.1:8001
AI_SERVICE_TIMEOUT=6
AI_SERVICE_ENABLED=true
GEMINI_API_KEY=your-key
```
